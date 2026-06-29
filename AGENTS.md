## Goal
Build and deploy a multi-tenant Website Builder SaaS on Cloudflare Workers, with admin panel at dash.brahian.dev, client subdomain sites at {slug}.brahian.dev, and automated DNS management via Cloudflare API.

## Constraints & Preferences
- Domain: brahian.dev; admin at dash.brahian.dev; client subdomains {slug}.brahian.dev
- Stack: Cloudflare Workers (Hono) + D1 + KV + R2; React SPAs for admin, client, and client-admin
- Single infra, multi-tenant by domain resolution; all config-driven, no per-client instances
- User has existing site at brahian.dev — must not interfere
- User granted Cloudflare access (wrangler deployed); CF API token provided for DNS automation
- Cloudflare API token and zone ID: stored as secret and env var respectively
- No `wrangler deploy` unless critical for Worker code changes; push to GitHub always
- Login for client panel: email auto-generated on tenant create + random password visible to admin

## Progress
### Done
- Full project scaffold: `wrangler.toml`, `package.json`, `tsconfig.json`, schema migrations (001–005), seed
- Worker backend: Hono router, tenant resolver middleware, admin JWT auth, client JWT auth (tenantId from role claim), admin CRUD (tenants, products, domains, settings, storage, categories, menus, client-users, attributes), client API (auth, products, categories, settings, menus, attributes read + value create), public site API (config, products, menu tree, categories, attributes)
- Admin SPA (React): full panel — Login, Dashboard, TenantCreate, TenantEdit (5 tabs: Info/Branding/Variantes/Cliente/Límites), Products, Domains, Categories, Menus; API client extended with all endpoints
- Client Admin SPA (`client-admin/`): Vite + React — Login, Layout with sidebar navigation (Products, Categories, Variantes, Menus, Settings), product CRUD with image upload, category CRUD, menu CRUD, variant value management (add values to existing attributes), settings management
- Client SPA (`client-site/`): Vite + React — Navbar, Hero, ProductGrid, ProductDetail with variant selectors (Color, Talle, Material, etc.) and WhatsApp consult button that builds message from selected variants, AboutSection, Footer, WhatsAppButton
- Schema migration `005_variants.sql`: added `product_attributes` and `attribute_values` tables + `variants_enabled` column to tenant_settings
- Variant system: admin CRUD for attributes + values per tenant, reorder via up/down buttons, required/optional toggle, active/inactive toggle
- WhatsApp button in ProductDetail builds message with selected variant values; if required attribute not selected, shows error and prevents opening WhatsApp
- Responsive admin: sidebar collapses on mobile, tabs scrollable, form rows stack vertically
- All 3 SPAs built, uploaded to R2 (`panel-assets` bucket) with correct Content-Type
- Worker deployed (current version: 936e9687) — routes: `dash.brahian.dev/*`, `*.brahian.dev/*`
- DNS records auto-created/deleted on tenant create/update/delete with slug normalization (lowercase)
- Git pushed to origin/main (latest: 57ff7cd)

### In Progress
- (none — all features implemented)

### Blocked
- (none)

## Key Decisions
- Serve built SPA HTML from R2 instead of hardcoding in Worker, so Vite's exact output (hashed assets, crossorigin tags) is used
- Force Content-Type based on file extension in asset responses, because writeHttpMetadata may set it to empty string
- Routes: `dash.brahian.dev/*` for admin, `*.brahian.dev/*` for client sites — main domain brahian.dev untouched
- DNS: auto-create A records via Cloudflare API instead of relying on wildcard CNAME (which had propagation issues)
- Product images: client-side crop to 1:1 square via `<canvas>` at 400×400px before uploading to R2
- Client users: one per tenant, email + random 12-char password (auto-generated, shown once to admin), JWT scoped to tenant via `role` field in token payload
- Client auth middleware reads `tenantId` from JWT `role` claim; this avoids extra DB queries on every request
- Menu items use `anchor` field for in-page scroll sections (inicio, productos, nosotros, contacto) with parent_id for submenu nesting
- Product offers stored as separate column values (`offer_price`, `offer_active`) for simple price display logic in client site
- `products.images` remains JSON TEXT field (not separate table) — pragmatic choice to avoid N+1 queries for a small app
- `products.category` normalized to FK `category_id` referencing `categories.id` — migration nullifies on category delete via code

## Next Steps
- (none — all features implemented, ready for user testing)

## Critical Context
- Admin panel fully working at `https://dash.brahian.dev/admin/` with login admin@brahian.dev / admin
- Client subdomains work: e.g., `https://dyc.brahian.dev/` serves client SPA with navbar, offers, about section, footer credit
- Client admin panel at `/{slug}.brahian.dev/admin/` — login with client credentials (generated in admin TenantEdit → Cliente tab)
- DNS records auto-created on tenant create with slug normalization (lowercase)
- JWT secret still default ("change-this-to-a-secure-random-string") in wrangler.toml — should be changed for production
- Cloudflare Bot Fight Mode or Browser Integrity Check may cause "sandboxed" script errors on client sites — recommend disabling in CF Dashboard
- PowerShell quoting issues when passing JSON to curl.exe — use file-based payload (`-d @file.json`) instead of inline strings
- Wrangler v4.86+ defaults to LOCAL R2 emulator — must pass `--remote` flag for all `r2 object` commands to upload to production bucket
- Existing tenant "dyc" (Relojes D&C) has no products, categories, or menu items yet — fully functional for testing

## Relevant Files
- `worker/src/router.ts`: main routing, all API routes, admin/client/client-admin SPA serving from R2, catch-all with tenant resolution
- `worker/src/middleware/tenant.ts`: tenant resolution by domain/subdomain
- `worker/src/middleware/auth.ts`: admin JWT auth middleware
- `worker/src/middleware/client-auth.ts`: client JWT auth middleware (tenantId from role claim)
- `worker/src/handlers/admin/auth.ts`: admin JWT login
- `worker/src/handlers/admin/tenants.ts`: CRUD with DNS auto-create/delete, max_products, slug normalization
- `worker/src/handlers/admin/products.ts`: CRUD with offer fields, product limit check, category_id JOIN
- `worker/src/handlers/admin/categories.ts`: CRUD + nullifies products.category_id on delete
- `worker/src/handlers/admin/menus.ts`: CRUD with parent_id nesting
- `worker/src/handlers/admin/client-users.ts`: get/createOrUpdate client user with random password generation
- `worker/src/handlers/admin/settings.ts`: update tenant settings including footer_credit_enabled, variants_enabled
- `worker/src/handlers/admin/attributes.ts`: admin CRUD for product attributes + values per tenant; reorder, required/optional, active/inactive toggles; also used by client API (read-only list + value create)
- `worker/src/handlers/client/auth.ts`: client login (email+password, JWT with tenantId in role)
- `worker/src/handlers/client/products.ts`: client CRUD products with uploadImage
- `worker/src/handlers/client/categories.ts`: client CRUD categories
- `worker/src/handlers/client/menus.ts`: client CRUD menu items with parent_id nesting
- `worker/src/handlers/client/settings.ts`: client get/update settings + uploadImage for logo
- `worker/src/handlers/public/site.ts`: public API (config with footer_credit_enabled, products with category_name JOIN, menu tree, categories, attributes)
- `worker/src/utils/dns.ts`: Cloudflare API helpers for A record create/delete
- `worker/src/types/index.ts`: all interfaces (Tenant, Product with category_id/category_name, Category, MenuItem, ClientUser, etc.)
- `schema/001_init.sql`: initial schema (tenants, domains, tenant_settings, products, admin_users)
- `schema/002_seed_admin.sql`: admin seed with base64url hash
- `schema/003_features.sql`: migration with client_users, categories, menu_items tables and alters
- `schema/004_normalize.sql`: migration adding products.category_id FK + data migration
- `schema/005_variants.sql`: migration adding product_attributes + attribute_values tables + variants_enabled column
- `wrangler.toml`: Worker config, binds, routes, env vars incl. CLOUDFLARE_ZONE_ID
- `admin/src/`: admin SPA — all pages (Dashboard, TenantCreate, TenantEdit, Products, Domains, Categories, Menus); App.tsx routes; api/client.ts
- `client-admin/src/`: client-admin SPA — Components (Layout with sidebar), pages (Products, Categories, Menus, Settings, Login); App.tsx with page-state routing
- `client-site/src/`: client SPA — components (ThemeProvider, Navbar, Hero, ProductGrid with offers, ProductDetail with offers, AboutSection, WhatsAppButton, Footer with credit toggle); api.ts with all public endpoints
