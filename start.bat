@echo off
setlocal enabledelayedexpansion
title 🐟 OpenClaw Harbor
color 1F

REM Always run from the directory this script lives in
cd /d "%~dp0"

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

REM Determine whether we need to install / reinstall dependencies.
REM Case 1: node_modules does not exist (fresh clone).
REM Case 2: package.json was modified after node_modules (pulled changes).
set "NEED_INSTALL=0"
if not exist "node_modules" (
    set "NEED_INSTALL=1"
) else (
    REM Compare timestamps: if package.json is newer than node_modules dir
    for %%A in (package.json) do set "PKG_DATE=%%~tA"
    for %%A in (node_modules) do set "NM_DATE=%%~tA"
    REM Simple string compare — works for same-format timestamps
    if "!PKG_DATE!" gtr "!NM_DATE!" set "NEED_INSTALL=1"
)

if "!NEED_INSTALL!"=="1" (
    if not exist "node_modules" (
        echo   📦  First time? Installing dependencies...
        echo   ^(This only happens once. Grab a coffee.^)
    ) else (
        echo   📦  Dependencies may have changed — updating...
    )
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

    echo   🔧  Rebuilding native modules for Electron...
    echo   ^(This makes sure node-pty works correctly.^)
    echo.
    call npm run rebuild 2>nul
    if %ERRORLEVEL% neq 0 (
        echo   ⚠️  Native module build skipped — Visual Studio not found.
        echo      The terminal will use a basic shell instead.
        echo      Install Visual Studio Build Tools to enable full PTY support.
        echo      See: https://aka.ms/vs/buildtools
    ) else (
        echo   ✅  Native modules built successfully!
    )
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
