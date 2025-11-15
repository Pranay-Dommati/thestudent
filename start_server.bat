@echo off
cd /d "c:\Users\banny\OneDrive\Documents\Desktop\STUDENTSHUB\SHPRO\thestudent\backend"

echo Creating migrations for Pro Learning models...
python manage.py makemigrations courses

echo Applying migrations...
python manage.py migrate

echo Starting Django server...
python manage.py runserver 0.0.0.0:8000
