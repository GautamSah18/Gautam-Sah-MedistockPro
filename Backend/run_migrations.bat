@echo off
cd /d "c:\Users\Acer\Desktop\Medistock Pro\Backend"
call venv\Scripts\activate.bat
python manage.py makemigrations loyalty > migrations.log 2>&1
python manage.py migrate >> migrations.log 2>&1
echo Done. >> migrations.log
