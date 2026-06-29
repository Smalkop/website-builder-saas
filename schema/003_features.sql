CREATE TABLE IF NOT EXISTS client_users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_categories_tenant_id ON categories(tenant_id);

CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  label TEXT NOT NULL,
  anchor TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  parent_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES menu_items(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_menu_items_tenant_id ON menu_items(tenant_id);

ALTER TABLE tenants ADD COLUMN max_products INTEGER NOT NULL DEFAULT 50;

ALTER TABLE products ADD COLUMN offer_price REAL;
ALTER TABLE products ADD COLUMN offer_active INTEGER NOT NULL DEFAULT 0;

ALTER TABLE tenant_settings ADD COLUMN footer_credit_enabled INTEGER NOT NULL DEFAULT 1;
