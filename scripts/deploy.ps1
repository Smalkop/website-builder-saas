# Website Builder SaaS - Deploy Script
param(
  [string]$Env = "production"
)

Write-Host "=== Website Builder SaaS Deploy ===" -ForegroundColor Cyan
Write-Host ""

# 1. Install root dependencies
Write-Host "[1/7] Installing root dependencies..." -ForegroundColor Yellow
npm install

# 2. Build Admin SPA
Write-Host "[2/7] Building Admin SPA..." -ForegroundColor Yellow
Push-Location admin
npm install
npm run build
Pop-Location

# 3. Build Client SPA
Write-Host "[3/7] Building Client SPA..." -ForegroundColor Yellow
Push-Location client-site
npm install
npm run build
Pop-Location

# 4. Upload assets to R2
Write-Host "[4/7] Uploading assets to R2..." -ForegroundColor Yellow
wrangler r2 object put panel-assets/admin/assets/index.js --file=admin/dist/assets/index.js
wrangler r2 object put panel-assets/admin/assets/index.css --file=admin/dist/assets/index.css
wrangler r2 object put panel-assets/site/assets/index.js --file=client-site/dist/assets/index.js
wrangler r2 object put panel-assets/site/assets/index.css --file=client-site/dist/assets/index.css

# 5. Initialize D1 database
Write-Host "[5/7] Initializing D1 database..." -ForegroundColor Yellow
wrangler d1 execute panel-db --file=schema/001_init.sql
wrangler d1 execute panel-db --file=schema/002_seed_admin.sql

# 6. Deploy Worker
Write-Host "[6/7] Deploying Worker..." -ForegroundColor Yellow
wrangler deploy

# 7. Done
Write-Host ""
Write-Host "=== Deploy Complete ===" -ForegroundColor Green
Write-Host "Admin: https://dash.brahian.dev"
Write-Host "API:   https://brahian.dev/api/health"
Write-Host ""
Write-Host "Default admin login:" -ForegroundColor Cyan
Write-Host "  Email:    admin@brahian.dev"
Write-Host "  Password: admin" -ForegroundColor Yellow
