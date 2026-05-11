$ErrorActionPreference='SilentlyContinue'
Write-Host "Your current IP:"
try {
    $ip = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 5).Content
    Write-Host "  Public IP: $ip"
} catch {
    Write-Host "  Could not detect public IP"
}

Write-Host "`nTesting test.dazistar.com:"
try {
    $resp = Invoke-WebRequest -Uri "http://test.dazistar.com/" -TimeoutSec 10 -UseBasicParsing
    Write-Host "  Status: HTTP $($resp.StatusCode)"
} catch {
    Write-Host "  Failed: $($_.Exception.Message)"
}

Write-Host "`nTesting via HTTPS:"
try {
    $resp2 = Invoke-WebRequest -Uri "https://test.dazistar.com/" -TimeoutSec 10 -UseBasicParsing
    Write-Host "  HTTPS Status: HTTP $($resp2.StatusCode)"
} catch {
    Write-Host "  HTTPS Failed: $($_.Exception.Message)"
}