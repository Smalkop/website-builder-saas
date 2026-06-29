param([switch]$WhatIf)

$bucket = "panel-assets"

$uploads = @()

# Admin SPA
$uploads += @{ Local = "admin/dist/index.html"; Remote = "admin/index.html"; Type = "text/html" }
Get-ChildItem "admin/dist/assets/*" | ForEach-Object {
    $ext = $_.Extension.TrimStart('.')
    $type = if ($ext -eq 'js') { 'application/javascript' } elseif ($ext -eq 'css') { 'text/css' } else { 'application/octet-stream' }
    $uploads += @{ Local = $_.FullName; Remote = "admin/assets/$($_.Name)"; Type = $type }
}

# Client Admin SPA
$uploads += @{ Local = "client-admin/dist/index.html"; Remote = "client-admin/index.html"; Type = "text/html" }
Get-ChildItem "client-admin/dist/assets/*" | ForEach-Object {
    $ext = $_.Extension.TrimStart('.')
    $type = if ($ext -eq 'js') { 'application/javascript' } elseif ($ext -eq 'css') { 'text/css' } else { 'application/octet-stream' }
    $uploads += @{ Local = $_.FullName; Remote = "client-admin/assets/$($_.Name)"; Type = $type }
}

# Client Site SPA
$uploads += @{ Local = "client-site/dist/index.html"; Remote = "site/index.html"; Type = "text/html" }
Get-ChildItem "client-site/dist/assets/*" | ForEach-Object {
    $ext = $_.Extension.TrimStart('.')
    $type = if ($ext -eq 'js') { 'application/javascript' } elseif ($ext -eq 'css') { 'text/css' } else { 'application/octet-stream' }
    $uploads += @{ Local = $_.FullName; Remote = "site/assets/$($_.Name)"; Type = $type }
}

Write-Host "=== Uploading $($uploads.Count) files to R2 bucket '$bucket' ==="

foreach ($item in $uploads) {
    $remotePath = "$bucket/$($item.Remote)"
    if ($WhatIf) {
        Write-Host "[WhatIf] Would upload: $($item.Local) -> $remotePath ($($item.Type))"
    } else {
        Write-Host "Uploading: $($item.Remote) ..."
        npx wrangler r2 object put $remotePath --file $item.Local --content-type $item.Type 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "FAILED: $($item.Remote)" -ForegroundColor Red
        } else {
            Write-Host "OK: $($item.Remote)" -ForegroundColor Green
        }
    }
}

Write-Host "=== Done ==="
