export interface FinanciadorInfo {
  tasa_mensual?: number;
  dias_cobranza_teorico?: number;
  dias_cobranza_real?: number;
  acuerdo_nombre?: string | null;
  Financiador?: string;
  id?: string;
  porcentaje_insumos?: number;
  porcentaje_horas_nocturnas?: number;
  porcentaje_dificil_acceso?: number;
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
  // Nuevos campos para sistema dual
  id_servicio_tarifario?: number;
  valor_seleccionado?: 1 | 2 | 3 | 4 | 5;
  precio_costo?: number;
  utilidad?: number;
}

// Nuevos tipos para sistema dual de zonas
export interface ServicioFinanciador {
  id_prestador_servicio?: number;
  id_financiador_servicio: number;
  servicio_id: number;
  nombre: string;
  precio_facturar: number;
  unidades_base?: number;
  admite_horas_nocturnas?: boolean;
  activo?: number;
}

export interface ServicioTarifario {
  id: number;
  nombre: string;
  tipo_unidad?: string;
  valores: number[];
}

export interface ZonaFinanciador {
  id: number;
  nombre: string;
  descripcion?: string;
  activo?: number;
}

export interface FinanciadorZona {
  id: string;
  nombre: string;
  descripcion?: string;
  activo?: number;
}

export interface ServicioConvenio {
  id_servicio_financiador: number;
  servicio_id?: number;
  nombre: string;
  precio_facturar: number;
  id_servicio_tarifario?: number;
  valores_disponibles?: number[];
  valor_seleccionado?: 1 | 2 | 3 | 4 | 5;
  precio_costo?: number;
  utilidad?: number;
  cantidad?: number;
  aplicar_horas_nocturnas?: boolean;
  porcentaje_horas_nocturnas?: number;
  precio_base?: number;
  clave_unica?: string;
}

export type EstadoPresupuesto = 
  | 'borrador'
  | 'pendiente_prestacional'
  | 'en_revision_prestacional'
  | 'pendiente_comercial'
  | 'en_revision_comercial'
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
  financiador_id?: string;
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
  | 'gerencia_prestacional'
  | 'gerencia_comercial'
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
  suc_porcentaje_insumos?: number;
}
