@echo off
title OpenClaw Harbor - Starting...
color 1F
echo.
echo   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
echo   ~                                          ~
echo   ~     🔱  OpenClaw Harbor                  ~
echo   ~     Your merman emissary awaits...       ~
echo   ~                                          ~
echo   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
echo.
echo   Checking if Node.js is installed...
echo.

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo   ❌  Node.js was not found on your system.
    echo.
    echo   You need Node.js to run OpenClaw Harbor.
    echo   Download it free from: https://nodejs.org
    echo   ^(Choose the "LTS" version — it is the safe one.^)
    echo.
    echo   After installing Node.js, close this window
    echo   and double-click start.bat again.
    echo.
    pause
    exit /b 1
)

echo   ✅  Node.js found!
echo.

if not exist "node_modules" (
    echo   📦  First time? Installing dependencies...
    echo   ^(This only happens once. Grab a coffee.^)
    echo.
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo.
        echo   ❌  Something went wrong installing dependencies.
        echo   Try running this command manually:
        echo       npm install
        echo   Then double-click start.bat again.
        echo.
        pause
        exit /b 1
    )
    echo.
    echo   ✅  Dependencies installed!
    echo.
)

echo   🌊  Launching OpenClaw Harbor...
echo   ^(A window should appear shortly.^)
echo.
call npm run dev
if %ERRORLEVEL% neq 0 (
    echo.
    echo   ❌  The app failed to start.
    echo   Try these steps:
    echo     1. Delete the "node_modules" folder
    echo     2. Double-click start.bat again
    echo.
    pause
)
