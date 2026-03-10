-- Migration 024: Remove UNIQUE constraint from producto
-- Date: 2025-02-09
-- Description: Allow duplicate product names, enforce uniqueness only on codigo_producto

-- Drop UNIQUE constraint from producto column
ALTER TABLE insumos DROP INDEX unique_producto;
