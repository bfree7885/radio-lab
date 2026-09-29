"""Load the shared curriculum.

content/curriculum.json is the only lab and stage list. This module does not
keep a second copy. Flask and the browser both read that file.

Empty lesson blocks fall back to short shell lines so the local workspace
can stay readable before a lesson is written. Those lines are not a second
curriculum.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
CURRICULUM_PATH = CONTENT / "curriculum.json"
CORE_CURRICULUM_PATH = CONTENT / "technician-core.json"
ROADMAP_PATH = CONTENT / "roadmap.json"
EXAM_MODEL_PATH = CONTENT / "exam" / "model.json"
SYLLABUS_PATH = CONTENT / "exam" / "technician-2026-2030.json"
FOUNDATIONS_ID = "technician-foundations"
CORE_ID = "technician-core"

SHELL_TEXT = {
    "learn": "A short orientation for this lab will be added here.",
    "see": "A diagram or signal view will be added here.",
    "do": "Hands-on controls will be added here.",
    "explain": "A prompt to explain the idea in your own words will be added here.",
    "exam": "The license-exam link for this lab will be added here.",
    "field": "A field task for this lab will be added here.",
}

_curriculum: dict | None = None
_core_curriculum: dict | None = None
_roadmap: dict | None = None


def _read_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ValueError(f"Expected an object in {path.name}")
    return data


def load_curriculum() -> dict:
    global _curriculum
    if _curriculum is None:
        _curriculum = _read_json(CURRICULUM_PATH)
    return _curriculum


def load_core_curriculum() -> dict:
    global _core_curriculum
    if _core_curriculum is None:
        _core_curriculum = _read_json(CORE_CURRICULUM_PATH)
    return _core_curriculum


def curriculum_meta() -> dict:
    data = load_curriculum()
    return {
        "id": data["id"],
        "title": data["title"],
        "version": data["version"],
        "license_level": data.get("licenseLevel", ""),
        "phase_id": data.get("phaseId", ""),
        "license_target": data.get("licenseTarget", ""),
        "audience": data.get("audience", ""),
    }


def load_roadmap() -> dict:
    global _roadmap
    if _roadmap is None:
        _roadmap = _read_json(ROADMAP_PATH)
    return _roadmap


def roadmap_tracks() -> list[dict]:
    return list(load_roadmap()["tracks"])


def load_exam_model() -> dict:
    return _read_json(EXAM_MODEL_PATH)


def load_technician_syllabus() -> dict:
    return _read_json(SYLLABUS_PATH)


def phase_by_id(phase_id: str) -> dict | None:
    for track in roadmap_tracks():
        for phase in track.get("phases", []):
            if phase.get("id") == phase_id:
                return {**phase, "trackId": track["id"], "licenseLevel": track.get("licenseLevel")}
    return None


def get_labs() -> list[dict]:
    return list(load_curriculum()["labs"])


def get_core_labs() -> list[dict]:
    return list(load_core_curriculum()["labs"])


def get_lab(lab_id: str) -> dict | None:
    for lab in list(get_labs()) + list(get_core_labs()):
        if lab["id"] == lab_id:
            return lab
    return None


def lab_ids() -> list[str]:
    return [lab["id"] for lab in get_labs()]


def get_stages() -> list[dict]:
    return list(load_curriculum()["stages"])


def load_lesson(lab_id: str) -> dict | None:
    lab = get_lab(lab_id)
    if lab is None:
        return None
    relative = lab.get("lesson")
    if not relative:
        return None
    path = CONTENT / relative
    if not path.is_file():
        return None
    return _read_json(path)


def display_text(stage_id: str, lesson: dict | None) -> str:
    """Lesson text when a block has some, otherwise the empty-stage shell line."""
    if lesson:
        for stage in lesson.get("stages", []):
            if stage.get("id") != stage_id:
                continue
            for block in stage.get("blocks", []):
                body = block.get("body") or block.get("prompt") or ""
                if isinstance(body, str) and body.strip():
                    return body.strip()
    return SHELL_TEXT.get(stage_id, "This stage will be added here.")


def syllabus_coverage() -> dict:
    """Map current syllabus groups from lesson metadata.

    Taught, practiced, and assessed stay separate. A group listed in a
    lesson's alignment.partial stays partial even when all three are present.
    This is not a coverage audit and it is not exam readiness.
    """
    groups = []
    for subelement in load_technician_syllabus().get("subelements", []):
        for group in subelement.get("groups", []):
            groups.append(
                {
                    "id": group["id"],
                    "title": group.get("title", ""),
                    "subelement": subelement["id"],
                }
            )

    taught: set[str] = set()
    practiced: set[str] = set()
    assessed: set[str] = set()
    partial_ids: set[str] = set()
    for lab in list(get_labs()) + list(get_core_labs()):
        lesson = load_lesson(lab["id"])
        if not lesson:
            continue
        alignment = lesson.get("alignment") or {}
        topics = [topic for topic in alignment.get("topics") or [] if isinstance(topic, str)]
        partial_ids.update(topic for topic in alignment.get("partial") or [] if isinstance(topic, str))
        has_interaction = False
        for stage in lesson.get("stages", []):
            if stage.get("id") not in ("learn", "see", "do", "field"):
                continue
            for block in stage.get("blocks") or []:
                if block.get("type") in ("interaction", "fieldTask") or block.get("component"):
                    has_interaction = True
        for topic in topics:
            taught.add(topic)
            if has_interaction:
                practiced.add(topic)
        for stage in lesson.get("stages", []):
            if stage.get("id") != "exam":
                continue
            for block in stage.get("blocks") or []:
                for question in block.get("questions") or []:
                    topic_id = question.get("topicId")
                    if isinstance(topic_id, str) and topic_id:
                        assessed.add(topic_id)

    rows = []
    for group in groups:
        group_id = group["id"]
        flags = []
        if group_id in taught:
            flags.append("taught")
        if group_id in practiced:
            flags.append("practiced")
        if group_id in assessed:
            flags.append("assessed")
        if not flags:
            status = "not-covered"
        elif group_id in partial_ids or len(flags) < 3:
            status = "partial"
        else:
            status = "recorded"
        rows.append(
            {
                **group,
                "status": status,
                "taught": "taught" in flags,
                "practiced": "practiced" in flags,
                "assessed": "assessed" in flags,
            }
        )
    counts = {
        "groups": len(rows),
        "recorded": sum(1 for row in rows if row["status"] == "recorded"),
        "partial": sum(1 for row in rows if row["status"] == "partial"),
        "notCovered": sum(1 for row in rows if row["status"] == "not-covered"),
    }
    return {
        "rows": rows,
        "counts": counts,
        "partial": [row for row in rows if row["status"] == "partial"],
        "notCovered": [row for row in rows if row["status"] == "not-covered"],
        "note": "Derived from lesson alignment and practice questions. This is not a coverage audit and not exam readiness.",
    }


def stages_for_lab(lab_id: str) -> list[dict]:
    lesson = load_lesson(lab_id)
    labels = {}
    if lesson:
        for stage in lesson.get("stages", []):
            if stage.get("label"):
                labels[stage["id"]] = stage["label"]
    rows = []
    for stage in get_stages():
        rows.append(
            {
                "id": stage["id"],
                "label": labels.get(stage["id"], stage["label"]),
                "placeholder": display_text(stage["id"], lesson),
            }
        )
    return rows
