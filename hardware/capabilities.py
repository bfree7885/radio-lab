"""Local capability adapter.

Lesson code asks whether a capability is available. It does not look for
devices itself. Names live in content/capabilities.json so the browser
adapter can use the same ids.

Simulation capabilities are available. Hardware capabilities stay unavailable
until a detector is added here. Detection is not implemented.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = ROOT / "content" / "capabilities.json"

_manifest: dict | None = None


def manifest() -> dict:
    global _manifest
    if _manifest is None:
        with MANIFEST_PATH.open(encoding="utf-8") as handle:
            _manifest = json.load(handle)
    return _manifest


def _canonical(name: str) -> str:
    if name.startswith("simulation.") or name.startswith("hardware."):
        return name
    return f"hardware.{name}"


def capability_available(name: str) -> bool:
    """Return whether a simulation or hardware capability can be used."""
    data = manifest()
    canonical = _canonical(name)
    if canonical in data.get("simulation", []):
        return True
    if canonical in data.get("hardware", []):
        return False
    return False


def live_lab_available() -> bool:
    """True only when a hardware capability can drive a live lab."""
    return any(capability_available(name) for name in manifest().get("hardware", []))


def lab_mode() -> str:
    """`live` when hardware can drive a lab, otherwise `simulation`."""
    if live_lab_available():
        return "live"
    return "simulation"


def capability_snapshot() -> dict[str, bool]:
    """Flat map the local page gives to the browser core."""
    data = manifest()
    names = list(data.get("simulation", [])) + list(data.get("hardware", []))
    return {name: capability_available(name) for name in names}
