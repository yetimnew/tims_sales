@echo off
echo ========================================
echo Flutter Mobile App Project Creator
echo ========================================
echo.

REM Check if Flutter is installed
flutter --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Flutter is not installed or not in PATH
    echo.
    echo Please install Flutter first:
    echo 1. Download from https://flutter.dev/docs/get-started/install
    echo 2. Extract to a folder (e.g., C:\src\flutter)
    echo 3. Add to PATH: C:\src\flutter\bin
    echo 4. Restart this terminal
    echo.
    pause
    exit /b 1
)

echo Flutter is installed!
echo.

REM Get project name
set /p PROJECT_NAME="Enter project name (default: driver_mobile_app): "
if "%PROJECT_NAME%"=="" set PROJECT_NAME=driver_mobile_app

echo.
echo Creating Flutter project: %PROJECT_NAME%
echo.

REM Create Flutter project
flutter create %PROJECT_NAME%

if %errorlevel% neq 0 (
    echo ERROR: Failed to create Flutter project
    pause
    exit /b 1
)

echo.
echo ========================================
echo Project created successfully!
echo ========================================
echo.
echo Next steps:
echo 1. cd %PROJECT_NAME%
echo 2. Copy files from mobile-app-flutter/lib/ to %PROJECT_NAME%/lib/
echo 3. Update pubspec.yaml with dependencies
echo 4. Run: flutter pub get
echo 5. Configure API URL in lib/config/app_config.dart
echo 6. Run: flutter run
echo.
pause

