@echo off
echo ========================================
echo Copy Flutter App Files
echo ========================================
echo.

REM Check if source directory exists
if not exist "mobile-app-flutter\lib" (
    echo ERROR: Source directory mobile-app-flutter\lib not found!
    echo Please make sure you're in the project root directory.
    pause
    exit /b 1
)

REM Get destination project name
set /p DEST_PROJECT="Enter Flutter project name (default: driver_mobile_app): "
if "%DEST_PROJECT%"=="" set DEST_PROJECT=driver_mobile_app

REM Check if destination exists
if not exist "%DEST_PROJECT%" (
    echo ERROR: Project folder "%DEST_PROJECT%" not found!
    echo Please create the Flutter project first using: flutter create %DEST_PROJECT%
    pause
    exit /b 1
)

echo.
echo Copying files from mobile-app-flutter to %DEST_PROJECT%...
echo.

REM Copy lib folder contents
echo Copying lib files...
xcopy /E /Y /I mobile-app-flutter\lib %DEST_PROJECT%\lib

REM Copy pubspec.yaml
echo Copying pubspec.yaml...
copy /Y mobile-app-flutter\pubspec.yaml %DEST_PROJECT%\pubspec.yaml

echo.
echo ========================================
echo Files copied successfully!
echo ========================================
echo.
echo Next steps:
echo 1. cd %DEST_PROJECT%
echo 2. flutter pub get
echo 3. Edit lib/config/app_config.dart to set API URL
echo 4. flutter run
echo.
pause

