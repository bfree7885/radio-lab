#!/usr/bin/env bash
# Start Waypoint Radio Lab on loopback only.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if [[ ! -x .venv/bin/python ]]; then
  echo "Virtual environment missing. Run ./setup.sh first." >&2
  exit 1
fi

# shellcheck disable=SC1091
source .venv/bin/activate

echo "Waypoint Radio Lab at http://127.0.0.1:5070/"
exec python app.py
