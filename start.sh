#!/usr/bin/env bash
# ═══════════════════════════════════════════════
#   🔱  OpenClaw Harbor — One-Click Launcher
#   Your merman emissary awaits...
# ═══════════════════════════════════════════════

set -e

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

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "  📦  First time? Installing dependencies..."
    echo "  (This only happens once. Grab a coffee.)"
    echo ""
    npm install
    echo ""
    echo "  ✅  Dependencies installed!"
    echo ""
fi

echo "  🌊  Launching OpenClaw Harbor..."
echo "  (A window should appear shortly.)"
echo ""
npm run dev
