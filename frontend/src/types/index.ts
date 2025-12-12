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

export type EstadoPresupuesto = 
  | 'borrador'
  | 'pendiente_administrativa'
  | 'en_revision_administrativa'
  | 'pendiente_prestacional'
  | 'en_revision_prestacional'
  | 'pendiente_general'
  | 'en_revision_general'
  | 'aprobado'
  | 'aprobado_condicional'
  | 'rechazado';

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
  estado?: EstadoPresupuesto;
  version?: number;
  revisor_id?: number;
  revisor_nombre?: string;
  revisor_asignado_at?: string;
  minutos_asignado?: number;
  dias_pendiente?: number;
}

export type RolUsuario = 
  | 'admin'
  | 'user'
  | 'gerencia_administrativa'
  | 'gerencia_prestacional'
  | 'gerencia_financiera'
  | 'gerencia_general';

export interface Usuario {
  id: number;
  username: string;
  rol: RolUsuario;
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
