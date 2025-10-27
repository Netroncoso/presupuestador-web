ALTER TABLE presupuestos 
ADD COLUMN IF NOT EXISTS idobra_social VARCHAR(50) NULL,
ADD INDEX idx_idobra_social (idobra_social);