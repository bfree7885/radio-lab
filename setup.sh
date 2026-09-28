#!/usr/bin/env bash
# Idempotent local setup for Waypoint Radio Lab. Does not use sudo.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required and was not found on PATH." >&2
  exit 1
fi

python3 - <<'PY'
import sys
if sys.version_info < (3, 9):
    raise SystemExit(
        f"Python 3.9+ is required, found {sys.version.split()[0]}"
    )
PY

if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi

# shellcheck disable=SC1091
source .venv/bin/activate
python -m pip install --upgrade --no-cache-dir pip
python -m pip install --no-cache-dir -r requirements.txt
mkdir -p data logs
echo "Radio Lab is ready. Start it with ./run.sh"
