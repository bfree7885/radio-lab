"""Hardware capability gate.

Lesson and lab code must ask here before offering a live lab. A missing
radio, SDR, scanner, audio interface, GNSS receiver, or Waypoint Deck is
the normal case. Simulation continues.

V0.1 does not detect hardware. Every capability reports unavailable.
Future detectors belong in this package and must stay optional imports.
"""

from __future__ import annotations

# Reserved names for later optional modules. Presence in this tuple is not
# detection and does not mean a device is attached.
KNOWN_CAPABILITIES = (
    "rtl_sdr",
    "scanner",
    "amateur_radio",
    "digirig",
    "audio_interface",
    "gnss",
    "waypoint_deck",
)


def capability_available(name: str) -> bool:
    """Return whether an optional hardware capability can be used."""
    if name not in KNOWN_CAPABILITIES:
        return False
    return False


def live_lab_available() -> bool:
    """True only when a radio-side device can drive a live lab."""
    return any(capability_available(name) for name in KNOWN_CAPABILITIES)


def lab_mode() -> str:
    """`live` when hardware can drive a lab, otherwise `simulation`."""
    if live_lab_available():
        return "live"
    return "simulation"
