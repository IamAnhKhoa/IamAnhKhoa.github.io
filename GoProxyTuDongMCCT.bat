@echo off
cd /d "%~dp0"
echo Dang go proxy MCCT tu dong...
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0GoProxyTuDongMCCT.ps1"
echo.
pause
