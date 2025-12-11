export interface FinanciadorInfo {
  tasa_mensual?: number;
  dias_cobranza_teorico?: number;
  dias_cobranza_real?: number;
  acuerdo_nombre?: string | null;
  Financiador?: string;
  idobra_social?: string;
}

export interface Insumo {
  producto: string;
  costo: number;
  precio_facturar: number;
  cantidad: number;
}

export interface Prestacion {
  id_servicio: number;
  prestacion: string;
  cantidad: number;
  valor_asignado: number;
  valor_facturar: number;
  tipo_unidad?: string;
  cant_total?: number;
}

export interface Presupuesto {
  idPresupuestos: number;
  Nombre_Apellido: string;
  DNI: string;
  Sucursal: string;
  idobra_social?: string;
  porcentaje_insumos?: number;
  total_insumos?: number;
  total_prestaciones?: number;
  costo_total?: number;
  total_facturar?: number;
  rentabilidad?: number;
  rentabilidad_con_plazo?: number;
  created_at?: string;
  estado?: 'borrador' | 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado';
  version?: number;
}

export interface Usuario {
  id: number;
  username: string;
  rol: 'admin' | 'user';
  activo: boolean;
  sucursal_id?: number;
  sucursal_nombre?: string;
  created_at?: string;
}

export interface Sucursal {
  ID: number;
  Sucursales_mh: string;
  suc_porcentaje_dificil_acceso?: number;
  suc_porcentaje_insumos?: number;
}
