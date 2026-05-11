$ErrorActionPreference='SilentlyContinue'
$resp = Invoke-WebRequest -Uri "https://www.dazistar.com/" -TimeoutSec 10 -UseBasicParsing
Write-Host "prod: HTTP:$($resp.StatusCode)"
$resp2 = Invoke-WebRequest -Uri "https://www.dazistar.com/discover" -TimeoutSec 10 -UseBasicParsing
Write-Host "prod/discover: HTTP:$($resp2.StatusCode)"