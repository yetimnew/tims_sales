@echo off
REM TIMS Frontend Build Script for Windows
REM This script builds the frontend assets for the TIMS application

echo 🚀 Building TIMS Frontend Assets...

REM Check Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo 📦 Node.js version: %NODE_VERSION%

REM Install dependencies
echo 📥 Installing dependencies...
call npm install

REM Build assets
echo 🔨 Building assets...
call npm run build

REM Check if build was successful
if %errorlevel% equ 0 (
    echo ✅ Frontend build completed successfully!
    echo 🎉 TIMS application is ready to use
) else (
    echo ❌ Frontend build failed
    exit /b 1
)



