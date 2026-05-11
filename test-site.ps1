$ErrorActionPreference='SilentlyContinue'
$resp = Invoke-WebRequest -Uri "http://test.dazistar.com/" -TimeoutSec 10 -UseBasicParsing
Write-Host "HTTP:$($resp.StatusCode)"
$resp2 = Invoke-WebRequest -Uri "http://test.dazistar.com/discover" -TimeoutSec 10 -UseBasicParsing
Write-Host "discover: HTTP:$($resp2.StatusCode)"