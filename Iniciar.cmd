@echo off
setlocal
cd /d "%~dp0"
set "ELECTRON_RUN_AS_NODE="
if not exist "node_modules\electron\dist\electron.exe" (
  echo Instale as dependencias com npm ci e execute npm start.
  pause
  exit /b 1
)
if not exist "dist-renderer\index.html" (
  echo Execute npm run build antes de iniciar.
  pause
  exit /b 1
)
"node_modules\electron\dist\electron.exe" .
