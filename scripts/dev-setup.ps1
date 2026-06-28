# Website Builder SaaS - Development Setup
Write-Host "=== Development Setup ===" -ForegroundColor Cyan

Write-Host "[1/4] Installing root dependencies..." -ForegroundColor Yellow
npm install

Write-Host "[2/4] Installing Admin SPA dependencies..." -ForegroundColor Yellow
Push-Location admin
npm install
Pop-Location

Write-Host "[3/4] Installing Client SPA dependencies..." -ForegroundColor Yellow
Push-Location client-site
npm install
Pop-Location

Write-Host "[4/4] Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To run locally:" -ForegroundColor Cyan
Write-Host "  wrangler dev  (API + routing)"
Write-Host "  cd admin && npm run dev  (Admin SPA)"
Write-Host "  cd client-site && npm run dev  (Client SPA)"
