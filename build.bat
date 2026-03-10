@echo off
setlocal

echo [Build] Media Manager packaging started...
cd /d "%~dp0"

if not exist node_modules (
  echo [Build] node_modules not found, running npm install...
  call npm install
  if errorlevel 1 goto :error
)

echo [Build] Running production build...
call npm run build
if errorlevel 1 goto :error

echo [Build] Success. Output folder: release
echo.
pause
exit /b 0

:error
echo [Build] Failed. Check logs above.
echo.
pause
exit /b 1
