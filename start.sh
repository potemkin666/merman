#!/usr/bin/env bash
# ═══════════════════════════════════════════════
#   🔱  OpenClaw Harbor — One-Click Launcher
#   Your merman emissary awaits...
# ═══════════════════════════════════════════════

set -e

# Always run from the directory this script lives in
cd "$(dirname "$0")"

echo ""
echo "  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
echo "  ~                                          ~"
echo "  ~     🔱  OpenClaw Harbor                  ~"
echo "  ~     Your merman emissary awaits...       ~"
echo "  ~                                          ~"
echo "  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "  ❌  Node.js was not found on your system."
    echo ""
    echo "  You need Node.js to run OpenClaw Harbor."
    echo "  Download it free from: https://nodejs.org"
    echo "  (Choose the \"LTS\" version — it is the safe one.)"
    echo ""
    echo "  On macOS you can also run:  brew install node"
    echo "  On Ubuntu/Debian:           sudo apt install nodejs npm"
    echo ""
    echo "  After installing, run this script again."
    exit 1
fi

echo "  ✅  Node.js found! ($(node --version))"
echo ""

# Determine whether we need to install / reinstall dependencies.
# Case 1: node_modules does not exist (fresh clone).
# Case 2: package.json is newer than node_modules (pulled changes).
NEED_INSTALL=0
if [ ! -d "node_modules" ]; then
    NEED_INSTALL=1
elif [ "package.json" -nt "node_modules" ]; then
    NEED_INSTALL=1
fi

if [ "$NEED_INSTALL" -eq 1 ]; then
    if [ ! -d "node_modules" ]; then
        echo "  📦  First time? Installing dependencies..."
        echo "  (This only happens once. Grab a coffee.)"
    else
        echo "  📦  Dependencies may have changed — updating..."
    fi
    echo ""
    npm install
    echo ""
    echo "  ✅  Dependencies installed!"
    echo ""

    echo "  🔧  Rebuilding native modules for Electron..."
    echo "  (This makes sure node-pty works correctly.)"
    echo ""
    if npm run rebuild 2>/dev/null; then
        echo "  ✅  Native modules built successfully!"
    else
        echo "  ⚠️  Native module build skipped — compiler toolchain not found."
        echo "     The terminal will use a basic shell instead."
        echo "     Install build-essential (Linux) or Xcode CLT (macOS) for full PTY support."
    fi
    echo ""
fi

echo "  🌊  Launching OpenClaw Harbor..."
echo "  (A window should appear shortly.)"
echo ""
npm run dev
