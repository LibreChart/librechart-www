#!/usr/bin/env bash
# Layout-fidelity check for the homepage port (B3).
#
# Builds the site, serves it next to the original hand-written
# branding/marketing-homepage.html at the SAME origin, and loads both into
# iframes so their geometry can be diffed at every breakpoint.
#
# Serving the built site at the server ROOT is not optional: its stylesheet is
# referenced as /_astro/*.css, so hosting it in a subdirectory 404s the CSS and
# you end up "comparing" an unstyled page.
#
# Usage:  ./scripts/compare.sh   then open http://127.0.0.1:8790/harness.html
# and run in the console:  await sweep([1440,920,780,560,480])
set -euo pipefail

ORIGINAL="${ORIGINAL:-$HOME/Sites/librechart/branding/marketing-homepage.html}"
PORT="${PORT:-8790}"
CMP="${TMPDIR:-/tmp}/lc-compare"

[ -f "$ORIGINAL" ] || { echo "Original not found: $ORIGINAL" >&2; exit 1; }

npx astro build

pkill -f "http.server $PORT" 2>/dev/null || true
rm -rf "$CMP"; mkdir -p "$CMP"
cp -R dist/client/. "$CMP/"
cp "$ORIGINAL" "$CMP/orig.html"
cp scripts/compare-harness.html "$CMP/harness.html"

cd "$CMP"
echo "Serving comparison on http://127.0.0.1:$PORT/harness.html"
exec python3 -m http.server "$PORT" --bind 127.0.0.1
