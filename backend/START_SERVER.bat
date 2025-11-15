@echo off
echo ======================================================
echo Starting Django Backend Server
echo ======================================================
echo.
echo Database: Hostinger MySQL (srv1990.hstgr.io)
echo Server URL: http://127.0.0.1:8000
echo.
echo Press CTRL+C to stop the server
echo ======================================================
echo.

cd /d "%~dp0"
python manage.py runserver 0.0.0.0:8000

pause
