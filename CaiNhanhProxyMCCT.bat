@echo off
setlocal

set "APP_DIR=%LOCALAPPDATA%\DoiChieuMCCTProxy"
set "BASE_URL=https://tak.id.vn"

echo Dang cai bo ho tro tra cuu MCCT...
echo.

if not exist "%APP_DIR%" mkdir "%APP_DIR%"

where node.exe >nul 2>nul
if errorlevel 1 (
  echo May nay chua co Node.js. Dang thu cai Node.js LTS bang winget...
  echo.
  winget --version >nul 2>nul
  if not errorlevel 1 (
    winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
  )
)

set "PATH=%PATH%;C:\Program Files\nodejs"
where node.exe >nul 2>nul
if errorlevel 1 (
  echo Chua cai duoc Node.js tu dong.
  echo Trinh duyet se mo trang tai Node.js. Cai Node.js LTS xong, chay lai file nay.
  start https://nodejs.org/en/download
  echo.
  pause
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "$base='%BASE_URL%';" ^
  "$dir='%APP_DIR%';" ^
  "$files=@('mcct-proxy-server.js','StartProxyTraCuuMCCT.ps1','CaiDatProxyTuDongMCCT.ps1','GoProxyTuDongMCCT.ps1','GoProxyTuDongMCCT.bat');" ^
  "foreach($file in $files){ Invoke-WebRequest -UseBasicParsing -Uri ($base + '/' + $file) -OutFile (Join-Path $dir $file) }"

if errorlevel 1 (
  echo Khong tai duoc bo ho tro. Kiem tra mang roi chay lai file nay.
  echo.
  pause
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%APP_DIR%\CaiDatProxyTuDongMCCT.ps1"
if errorlevel 1 (
  echo Cai proxy tu dong chua thanh cong. Hay chay lai file nay hoac lien he nguoi ho tro.
  echo.
  pause
  exit /b 1
)

echo.
echo Hoan tat. Hay quay lai trang https://tak.id.vn/DoiChieu va bam "Kiem tra lai".
echo.
pause
