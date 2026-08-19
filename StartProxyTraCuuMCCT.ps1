$ErrorActionPreference = 'SilentlyContinue'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$healthUrl = 'http://127.0.0.1:7979/health'

try {
    $health = Invoke-WebRequest -UseBasicParsing -Uri $healthUrl -TimeoutSec 2
    if ($health.Content -match '"ok"\s*:\s*true') {
        exit 0
    }
} catch {
}

$node = Get-Command node.exe -ErrorAction Stop
$server = Join-Path $root 'mcct-proxy-server.js'

Start-Process `
    -FilePath $node.Source `
    -ArgumentList "`"$server`"" `
    -WorkingDirectory $root `
    -WindowStyle Hidden
