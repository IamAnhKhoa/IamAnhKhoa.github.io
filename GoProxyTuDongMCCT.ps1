$ErrorActionPreference = 'SilentlyContinue'

$taskName = 'DoiChieu_MCCT_Proxy'
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false

$proxyProcesses = Get-CimInstance Win32_Process |
    Where-Object { $_.CommandLine -match 'mcct-proxy-server\.js' }

foreach ($process in $proxyProcesses) {
    Stop-Process -Id $process.ProcessId -Force
}

Write-Host 'Da go proxy MCCT tu dong va dung proxy dang chay neu co.'
