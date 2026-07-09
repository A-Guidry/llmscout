#!/bin/bash
# LLMScout one-click launcher (macOS: double-click this file)
# Installs dependencies and builds if needed, starts the local web UI,
# waits until it's healthy, then opens your browser.
set -e
cd "$(dirname "$0")/.."

PORT="${LLMSCOUT_PORT:-3000}"
URL="http://127.0.0.1:$PORT"

echo "── LLMScout launcher ──────────────────────────"

if ! command -v node >/dev/null 2>&1; then
  echo "✗ Node.js is required (v18+). Install from https://nodejs.org"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "→ Installing dependencies (first run only)…"
  npm install --no-audit --no-fund
fi

if [ ! -f dist/cli/index.js ] || [ -n "$(find src -newer dist -name '*.ts' 2>/dev/null | head -1)" ]; then
  echo "→ Building…"
  npm run build
fi

# free the port if a previous instance is still running
lsof -ti tcp:"$PORT" | xargs kill 2>/dev/null || true

echo "→ Starting server on $URL …"
node dist/cli/index.js serve --port "$PORT" &
SERVER_PID=$!
trap "kill $SERVER_PID 2>/dev/null" EXIT

# wait until healthy (max ~15s)
for i in $(seq 1 30); do
  if curl -sf "$URL/healthz" >/dev/null 2>&1; then
    echo "✓ Server is up — opening browser"
    open "$URL" 2>/dev/null || xdg-open "$URL" 2>/dev/null || true
    break
  fi
  sleep 0.5
done

echo "── LLMScout running. Press Ctrl+C to stop. ────"
wait $SERVER_PID
