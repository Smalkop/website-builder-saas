-- Normalize products.category → category_id FK
ALTER TABLE products ADD COLUMN category_id TEXT REFERENCES categories(id);

-- Migrate existing data: match category names to category IDs per tenant
UPDATE products
SET category_id = (
  SELECT id FROM categories
  WHERE categories.tenant_id = products.tenant_id
  AND categories.name = products.category
)
WHERE category != '';
