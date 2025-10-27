const getBackendUrl = () => {
  try {
    return (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
  } catch (error) {
    console.warn('Failed to access environment variables, using default backend URL');
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

  private async handleResponse(response: Response) {
    if (!response.ok) {
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

export async function getPrestacionesPorPrestador(id: string) {
  const res = await api.get(`/prestaciones/prestador/${id}`);
  return res.data;
}

export async function actualizarTotales(id: number, payload: { total_insumos: number; total_prestaciones: number }) {
  try {
    const res = await api.put(`/presupuestos/${id}/totales`, payload);
    return res.data;
  } catch (error) {
    throw new Error(`Error updating totals: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}