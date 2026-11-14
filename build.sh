#!/usr/bin/env bash
# Rebuild src/nba-2026.js from the NBA docs (claude/nba in the project).
# Usage: bash build.sh [nba_docs_dir] [game_dir] [--check]
#   nba_docs_dir  default ./claude/nba  (needs nba-compact.json, hist.txt, pros.txt, conv.js, careers/stars-*.md, careers/legends.md)
#   game_dir      default .             (folder with src/nba-2026.js)
#   --check       compare only, write nothing
# NBA_CAR2 / NBA_CARPO (role-player + playoff rows) are kept from the current src/nba-2026.js
# unless careers/car2.json / careers/carpo.json exist.
# Needs python3 (3.8+, no packages). build.py sits next to this file.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
nba="${1:-./claude/nba}"; game="${2:-.}"; shift $(( $# < 2 ? $# : 2 )) || true
python3 -I "$here/build.py" "$nba" "$game" "$@"
node --check "$game/src/nba-2026.js" 2>/dev/null && echo "node --check OK" || echo "node --check skipped or failed"
