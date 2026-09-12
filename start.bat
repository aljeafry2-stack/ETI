@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist ".env" (
  echo DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db> .env
  echo ADMIN_PASSWORD=eti2026>> .env
)

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js غير مثبت. حمّله من https://nodejs.org ثم أعد المحاولة.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo جارٍ تثبيت المكتبات...
  call npm install
  if errorlevel 1 (
    echo فشل npm install
    pause
    exit /b 1
  )
)

echo جارٍ تجهيز قاعدة البيانات...
call npx drizzle-kit push --force
if errorlevel 1 (
  echo تعذر الاتصال بقاعدة PostgreSQL.
  echo تأكد أن PostgreSQL يعمل، وأن قاعدة app_db موجودة.
  pause
  exit /b 1
)

echo.
echo الموقع:     http://localhost:3000
echo الإدارة:    http://localhost:3000/admin
echo كلمة المرور: eti2026
echo.
call npm run build
if errorlevel 1 (
  echo فشل البناء
  pause
  exit /b 1
)
call npm start
pause
