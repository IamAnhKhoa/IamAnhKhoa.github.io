@echo off
cd /d "%~dp0"
echo Dang cai proxy MCCT tu dong khi dang nhap Windows...
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0CaiDatProxyTuDongMCCT.ps1"
echo.
pause
