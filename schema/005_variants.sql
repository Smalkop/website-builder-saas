CREATE TABLE IF NOT EXISTS product_attributes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  required INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attribute_values (
  id TEXT PRIMARY KEY,
  attribute_id TEXT NOT NULL,
  value TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (attribute_id) REFERENCES product_attributes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_attributes_tenant ON product_attributes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attribute_values_attribute ON attribute_values(attribute_id);

ALTER TABLE tenant_settings ADD COLUMN variants_enabled INTEGER NOT NULL DEFAULT 1;
