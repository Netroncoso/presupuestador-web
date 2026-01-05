const getBackendUrl = () => {
  const url = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
  
  // Validate URL to prevent SSRF
  const allowedHosts = ['localhost', '127.0.0.1', '192.168.1.197'];
  try {
    const parsed = new URL(url);
    if (!allowedHosts.includes(parsed.hostname)) {
      console.error('Invalid backend URL, using default');
      return 'http://localhost:4000';
    }
    return url;
  } catch {
    return 'http://localhost:4000';
  }
};

const BACKEND = getBackendUrl();

class ApiClient {
  public defaults = {
    headers: {
      common: {} as Record<string, string>
    }
  };

  private unauthorizedCallbacks: Set<() => void> = new Set();

  subscribeToUnauthorized(callback: () => void) {
    this.unauthorizedCallbacks.add(callback);
    return () => this.unauthorizedCallbacks.delete(callback);
  }

  private handleUnauthorized() {
    this.unauthorizedCallbacks.forEach(cb => cb());
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      if (response.status === 401) {
        this.handleUnauthorized();
        throw new Error('Sesión expirada');
      }
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    return response.json();
  }

  private async fetchWithRetry(url: string, options: RequestInit = {}, retries = 2): Promise<Response> {
    const headers = {
      'Content-Type': 'application/json',
      ...this.defaults.headers.common,
      ...options.headers
    };

    for (let i = 0; i <= retries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: AbortSignal.timeout(10000) // 10s timeout
        });
        return response;
      } catch (error) {
        if (i === retries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    throw new Error('Max retries exceeded');
  }

  async get(url: string) {
    const res = await this.fetchWithRetry(`${BACKEND}/api${url}`);
    const data = await this.handleResponse(res);
    return { data };
  }

  async post(url: string, data: any) {
    const res = await this.fetchWithRetry(`${BACKEND}/api${url}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    const responseData = await this.handleResponse(res);
    return { data: responseData };
  }

  async put(url: string, data: any) {
    const res = await this.fetchWithRetry(`${BACKEND}/api${url}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    const responseData = await this.handleResponse(res);
    return { data: responseData };
  }

  async delete(url: string, options?: { data?: any }) {
    const res = await this.fetchWithRetry(`${BACKEND}/api${url}`, {
      method: 'DELETE',
      body: options?.data ? JSON.stringify(options.data) : undefined
    });
    const responseData = await this.handleResponse(res);
    return { data: responseData };
  }
}

export const api = new ApiClient();

// Convenience helpers used across the frontend
export async function getSucursales() {
  const res = await api.get('/sucursales');
  return res.data;
}

export async function crearPresupuesto(payload: { nombre: string; dni: string; sucursal: string; dificil_acceso?: string }) {
  const res = await api.post('/presupuestos', payload);
  return res.data;
}

export async function getInsumos() {
  const res = await api.get('/insumos');
  return res.data;
}

export async function getPrestadores() {
  const res = await api.get('/prestaciones/prestadores');
  return res.data;
}

export async function getFinanciadorAcuerdos() {
  const res = await api.get('/admin/prestadores/acuerdos');
  return res.data;
}

export async function getPrestacionesPorPrestador(id: string, fecha?: string, sucursalId?: number) {
  const params = new URLSearchParams();
  if (fecha) params.append('fecha', fecha);
  if (sucursalId) params.append('sucursal_id', sucursalId.toString());
  
  const url = params.toString() 
    ? `/prestaciones/prestador/${id}?${params.toString()}`
    : `/prestaciones/prestador/${id}`;
  const res = await api.get(url);
  // Backend retorna { data: [], pagination: {} }, extraer solo data
  return res.data.data || res.data;
}

export async function actualizarTotales(id: number, payload: { total_insumos: number; total_prestaciones: number }) {
  try {
    const res = await api.put(`/presupuestos/${id}/totales`, payload);
    return res.data;
  } catch (error) {
    throw new Error(`Error updating totals: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}