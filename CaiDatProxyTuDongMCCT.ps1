$ErrorActionPreference = 'Stop'

$taskName = 'DoiChieu_MCCT_Proxy'
$scriptPath = Join-Path $PSScriptRoot 'StartProxyTraCuuMCCT.ps1'

if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
    throw 'Khong tim thay Node.js. Cai Node.js truoc, roi chay lai file cai dat proxy.'
}

$action = New-ScheduledTaskAction `
    -Execute 'powershell.exe' `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""

$trigger = New-ScheduledTaskTrigger -AtLogOn
$userId = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType Interactive -RunLevel LeastPrivilege

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Description 'Tu dong chay proxy tra cuu MCCT cho DoiChieu.' `
    -Force | Out-Null

& $scriptPath

Write-Host 'Da cai proxy MCCT tu dong.'
Write-Host 'Tu lan sau, proxy se tu chay khi dang nhap Windows.'
Write-Host 'Trang dung: https://tak.id.vn/DoiChieu'
