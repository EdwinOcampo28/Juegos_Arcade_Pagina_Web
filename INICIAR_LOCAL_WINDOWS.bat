@echo off
setlocal
cd /d "%~dp0frontend"
echo ==========================================
echo       NEON ARCADE PRO - INICIO LOCAL
echo ==========================================
where py >nul 2>nul
if %errorlevel%==0 goto use_py
where python >nul 2>nul
if %errorlevel%==0 goto use_python
echo.
echo No se encontro Python 3 en este equipo.
echo Instala Python desde https://www.python.org/downloads/
echo Durante la instalacion activa "Add Python to PATH".
pause
exit /b 1
:use_py
start "NEON ARCADE PRO - servidor local" cmd /k py -m http.server 5500
 goto open_browser
:use_python
start "NEON ARCADE PRO - servidor local" cmd /k python -m http.server 5500
:open_browser
timeout /t 2 /nobreak >nul
start "" http://localhost:5500
 echo.
echo Puedes dejar abierta la ventana negra del servidor mientras juegas.
echo Para cerrar la aplicacion, cierra esa ventana.
endlocal
