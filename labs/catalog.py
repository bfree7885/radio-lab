"""Technician Foundations catalog.

V0.1 defines lab identity only. Lesson content and simulations are later work.
"""

from __future__ import annotations

CURRICULUM = {
    "id": "technician-foundations",
    "name": "Technician Foundations",
    "version_label": "V0.1",
    "license_target": "FCC Technician",
    "later_target": "FCC General",
}

# Shared learning model. Every lab uses these stages when it opens.
STAGES = (
    {
        "id": "learn",
        "label": "LEARN",
        "placeholder": "A short orientation for this lab will be added here.",
    },
    {
        "id": "see",
        "label": "SEE IT",
        "placeholder": "A diagram or signal view will be added here.",
    },
    {
        "id": "do",
        "label": "DO IT",
        "placeholder": "Hands-on controls will be added here.",
    },
    {
        "id": "explain",
        "label": "EXPLAIN IT",
        "placeholder": "A prompt to explain the idea in your own words will be added here.",
    },
    {
        "id": "exam",
        "label": "EXAM CONNECTION",
        "placeholder": "The license-exam link for this lab will be added here.",
    },
    {
        "id": "field",
        "label": "FIELD TASK",
        "placeholder": "A field task for this lab will be added here.",
    },
)

LABS = (
    {
        "id": "01",
        "number": "01",
        "title": "What Is Radio?",
        "summary": (
            "Explore frequency, wavelength, signals, noise, Hz/kHz/MHz, "
            "and basic receiver behavior."
        ),
        "available": True,
    },
    {
        "id": "02",
        "number": "02",
        "title": "Your First Radio",
        "summary": (
            "Frequency selection, volume, squelch, simplex operation, "
            "memories, and basic radio controls."
        ),
        "available": False,
    },
    {
        "id": "03",
        "number": "03",
        "title": "Repeaters",
        "summary": (
            "Repeater input/output frequencies, offsets, tones, range, "
            "and basic repeater operation."
        ),
        "available": False,
    },
    {
        "id": "04",
        "number": "04",
        "title": "Bands & Privileges",
        "summary": (
            "Amateur bands, Technician privileges, operating scenarios, "
            "and choosing an appropriate frequency."
        ),
        "available": False,
    },
    {
        "id": "05",
        "number": "05",
        "title": "Electricity Without the Textbook",
        "summary": (
            "Voltage, current, resistance, power, and an interactive "
            "introduction to Ohm's law."
        ),
        "available": False,
    },
    {
        "id": "06",
        "number": "06",
        "title": "Antennas & SWR",
        "summary": (
            "Frequency, wavelength, antenna length, resonance, SWR, "
            "and troubleshooting."
        ),
        "available": False,
    },
    {
        "id": "07",
        "number": "07",
        "title": "Propagation & Range",
        "summary": (
            "Line of sight, terrain, antenna height, VHF/UHF behavior, "
            "introductory HF propagation, and repeaters."
        ),
        "available": False,
    },
    {
        "id": "08",
        "number": "08",
        "title": "First Field Operation",
        "summary": (
            "An integrated scenario: choose equipment, frequency and band, "
            "antenna, operating method, and proper procedure."
        ),
        "available": False,
    },
)


def get_lab(lab_id: str) -> dict | None:
    for lab in LABS:
        if lab["id"] == lab_id:
            return lab
    return None


def lab_ids() -> list[str]:
    return [lab["id"] for lab in LABS]
