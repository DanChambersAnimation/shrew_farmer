#!/usr/bin/env bash
# Start the local dev server (with hot reload). Extra args go to `vp dev`,
# e.g. `scripts/dev.sh --host` to reach it from other devices on your network.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -x node_modules/.bin/vp ]]; then
  echo "Installing dependencies..."
  if command -v vp >/dev/null; then
    vp install
  else
    # Run npx from outside the repo so npm doesn't trip over the pnpm devEngines pin.
    (cd "$HOME" && npx --yes pnpm@12.18.0 install --dir "$ROOT")
  fi
fi

PORT="${PORT:-5173}"
cat <<MSG

  Game (dev0):    http://localhost:$PORT/
  Other rooms:    http://localhost:$PORT/?room=<name>
  Contact sheet:  http://localhost:$PORT/contact-sheet.html

MSG

exec node_modules/.bin/vp dev --port "$PORT" "$@"
