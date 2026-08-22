$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8765
try {
  $status = Invoke-RestMethod "http://127.0.0.1:$port/api/status" -TimeoutSec 2
} catch {
  Start-Process -FilePath "python" -ArgumentList @("$root\server.py") -WorkingDirectory $root -WindowStyle Hidden
  Start-Sleep -Seconds 2
}
Start-Process "http://127.0.0.1:$port/?v=55"
