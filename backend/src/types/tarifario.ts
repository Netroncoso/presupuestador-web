// ============================================================================
// TIPOS: MÓDULO TARIFARIO
// ============================================================================

import { RowDataPacket } from 'mysql2';

// Zona Geográfica
export interface TarifarioZona extends RowDataPacket {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: number;
  created_at: Date;
  updated_at: Date;
}

// Relación Sucursal-Zona
export interface SucursalTarifarioZona extends RowDataPacket {
  id: number;
  sucursal_id: number;
  zona_id: number;
  es_zona_principal: number;
  created_at: Date;
}

// Servicio del Tarifario
export interface TarifarioServicio extends RowDataPacket {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo_unidad?: string;
  activo: number;
  created_at: Date;
  updated_at: Date;
}

// Valores Históricos del Servicio
export interface TarifarioServicioValor extends RowDataPacket {
  id: number;
  tarifario_servicio_id: number;
  zona_id: number;
  costo_1: number;
  costo_2: number;
  costo_3: number;
  costo_4: number;
  costo_5: number;
  fecha_inicio: Date;
  fecha_fin?: Date;
  created_at: Date;
}

// Prestación del Tarifario en Presupuesto
export interface PresupuestoPrestacionTarifario extends RowDataPacket {
  id: number;
  idPresupuestos: number;
  tarifario_servicio_id: number;
  prestacion: string;
  cantidad: number;
  zona_id: number;
  orden_costo: number;
  valor_asignado: number;
  valor_facturar: number;
  fuera_tarifario: number;
  created_at: Date;
  updated_at: Date;
}

// DTOs para API

export interface CrearPrestacionTarifarioDTO {
  tarifario_servicio_id: number;
  cantidad: number;
  zona_id: number;
  orden_costo: number;
  valor_asignado?: number; // Opcional si edita manualmente
  fuera_tarifario?: number; // 1 si editó manualmente
}

export interface ActualizarPrestacionTarifarioDTO {
  cantidad?: number;
  orden_costo?: number;
  valor_asignado?: number;
}

export interface CrearValorTarifarioDTO {
  tarifario_servicio_id: number;
  zona_id: number;
  costo_1: number;
  costo_2: number;
  costo_3: number;
  costo_4: number;
  costo_5: number;
  fecha_inicio: string; // YYYY-MM-DD
}

export interface ValorVigenteDTO {
  orden: number;
  costo: number;
  dias_desactualizacion: number;
  alerta_desactualizado: boolean;
}
