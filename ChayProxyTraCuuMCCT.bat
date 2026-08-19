@echo off
cd /d "%~dp0"
title Proxy tra cuu ho so MCCT
echo Dang chay proxy tra cuu ho so MCCT tai http://127.0.0.1:7979
echo Giu cua so nay mo trong luc dang tra cuu.
echo.
node mcct-proxy-server.js
pause
