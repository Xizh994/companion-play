$ErrorActionPreference='SilentlyContinue'
$ip = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 5).Content
Write-Host $ip