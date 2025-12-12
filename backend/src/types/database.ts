import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * Tipos de base de datos generados desde Tablas-full2.csv
 * Elimina redundancia de any[] en toda la aplicación
 */

// ============================================
// TABLAS PRINCIPALES
// ============================================

export interface AlertasServicios extends RowDataPacket {
  id: number;
  tipo_unidad: string;
  cantidad_maxima: number;
  mensaje_alerta?: string;
  color_alerta?: string;
  activo?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface AuditoriasPresupuestos extends RowDataPacket {
  id: number;
  presupuesto_id: number;
  version_presupuesto: number;
  auditor_id: number;
  estado_anterior?: string;
  estado_nuevo?: string;
  comentario?: string;
  fecha?: Date;
}

export interface ConfiguracionSistema extends RowDataPacket {
  id: number;
  clave: string;
  valor: number;
  descripcion?: string;
  categoria?: string;
  unidad?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Financiador extends RowDataPacket {
  idobra_social: number;
  Financiador?: string;
  activo: boolean;
  tasa_mensual?: number;
  dias_cobranza_teorico?: number;
  dias_cobranza_real?: number;
  id_acuerdo?: number;
}

export interface FinanciadorAcuerdo extends RowDataPacket {
  id_acuerdo: number;
  nombre: string;
}

export interface Insumos extends RowDataPacket {
  idInsumos: number;
  producto: string;
  costo?: number;
}

export interface Notificaciones extends RowDataPacket {
  id: number;
  usuario_id: number;
  presupuesto_id: number;
  version_presupuesto?: number;
  tipo?: 'pendiente' | 'aprobado' | 'rechazado' | 'nueva_version';
  mensaje?: string;
  estado?: 'nuevo' | 'leido';
  creado_en?: Date;
}

export interface PrestadorServicio extends RowDataPacket {
  id_prestador_servicio: number;
  idobra_social: number;
  id_servicio: number;
  valor_facturar: number;
  total_mes?: number;
  condicion?: string;
  activo?: boolean;
  cant_total?: number;
  valor_sugerido?: number;
}

export interface PrestadorServicioValores extends RowDataPacket {
  id: number;
  id_prestador_servicio: number;
  valor_asignado: number;
  valor_facturar: number;
  fecha_inicio: Date;
  fecha_fin?: Date;
  created_at?: Date;
}

export interface PresupuestoInsumos extends RowDataPacket {
  id: number;
  idPresupuestos: number;
  producto: string;
  costo: number;
  precio_facturar: number;
  cantidad: number;
  created_at?: Date;
  updated_at?: Date;
  id_insumo?: number;
}

export interface PresupuestoPrestaciones extends RowDataPacket {
  id: number;
  idPresupuestos: number;
  id_servicio: string;
  prestacion: string;
  cantidad: number;
  valor_asignado: number;
  valor_facturar: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Presupuestos extends RowDataPacket {
  idPresupuestos: number;
  Nombre_Apellido?: string;
  DNI: string;
  sucursal_id?: number;
  total_insumos?: number;
  dificil_acceso: string;
  total_prestaciones?: number;
  idobra_social?: number;
  costo_total?: number;
  created_at?: Date;
  updated_at?: Date;
  total_facturar?: number;
  rentabilidad?: number;
  rentabilidad_con_plazo?: number;
  usuario_id?: number;
  presupuesto_padre?: number;
  es_ultima_version?: boolean;
  estado?: 'borrador' | 'pendiente_administrativa' | 'en_revision_administrativa' | 'pendiente_prestacional' | 'en_revision_prestacional' | 'pendiente_general' | 'en_revision_general' | 'aprobado' | 'aprobado_condicional' | 'rechazado';
  version?: number;
  porcentaje_insumos?: number;
  revisor_id?: number;
  revisor_asignado_at?: Date;
}

export interface Servicios extends RowDataPacket {
  id_servicio: number;
  nombre: string;
  tipo_unidad?: string;
  max_unidades_sugerido?: number;
}

export interface SucursalesMh extends RowDataPacket {
  ID: number;
  Sucursales_mh: string;
  suc_porcentaje_dificil_acceso?: number;
  suc_porcentaje_insumos?: number;
}

export interface TiposUnidad extends RowDataPacket {
  id: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface Usuarios extends RowDataPacket {
  id: number;
  username: string;
  password: string;
  rol?: 'admin' | 'user' | 'gerencia_administrativa' | 'gerencia_prestacional' | 'gerencia_financiera' | 'gerencia_general';
  activo?: boolean;
  created_at?: Date;
  sucursal_id?: number;
}

// ============================================
// TIPOS AUXILIARES
// ============================================

// Para resultados de INSERT/UPDATE/DELETE
export type MutationResult = ResultSetHeader;

// Para queries con JOIN que combinan múltiples tablas
export interface PrestacionConValores extends RowDataPacket {
  id_servicio: number;
  nombre: string;
  tipo_unidad?: string;
  cant_total?: number;
  valor_sugerido?: number;
  valor_facturar?: number;
  valor_asignado?: number;
  id_prestador_servicio?: number;
}

export interface PresupuestoCompleto extends Presupuestos {
  Sucursal?: string;
  Financiador?: string;
  tasa_mensual?: number;
  dias_cobranza_teorico?: number;
  dias_cobranza_real?: number;
  acuerdo_nombre?: string;
  usuario_creador?: string;
  financiador_nombre?: string;
  sucursal_nombre?: string;
  creador?: string;
  dias_pendiente?: number;
  calc_total_insumos?: number;
  calc_total_insumos_facturar?: number;
  calc_total_prestaciones?: number;
  calc_total_prestaciones_facturar?: number;
}

export interface PresupuestoPrestacionCompleto extends PresupuestoPrestaciones {
  servicio_nombre?: string;
  tipo_unidad?: string;
}

export interface FinanciadorCompleto extends Financiador {
  acuerdo_nombre?: string;
}
