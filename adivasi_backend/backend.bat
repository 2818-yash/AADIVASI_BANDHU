@echo off
cd /d C:\Users\divya\OneDrive\Desktop\ADIVASI-DJANGO-APP\adivasi_backend
call ..\env\Scripts\activate
daphne -b 127.0.0.1 -p 8000 adivasibandhu.asgi:application
