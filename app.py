#!/usr/bin/env python3
"""Waypoint Radio Lab — local learning server.

This process is the local adapter. It reads the shared curriculum in
content/ and serves the browser core from web/. It binds to loopback only.
Start it with ./run.sh.
"""

from __future__ import annotations

from pathlib import Path

import re

from flask import Flask, abort, jsonify, render_template, request, send_from_directory, url_for

from hardware.capabilities import capability_snapshot, lab_mode, live_lab_available
from labs.catalog import (
    CORE_ID,
    FOUNDATIONS_ID,
    curriculum_meta,
    get_core_labs,
    get_lab,
    get_labs,
    get_stages,
    load_roadmap,
    stages_for_lab,
    syllabus_coverage,
)
from progress.store import (
    concept_count,
    exam_readiness,
    init_db,
    note_activity,
    progress_snapshot,
    progress_summary,
    record_exam,
    set_concept_status,
    set_field_task,
    set_stage_completed,
    status_label,
    sync_lab_status,
    weak_topics,
)

ROOT = Path(__file__).resolve().parent
CONTENT = ROOT / "content"
WEB = ROOT / "web"

HOST = "127.0.0.1"
PORT = 5070
_CURRICULUM_ID = re.compile(r"^[a-z0-9-]{1,80}$")

app = Flask(__name__)
_db_ready = False


@app.before_request
def _ensure_db() -> None:
    global _db_ready
    if not _db_ready:
        init_db()
        _db_ready = True


@app.context_processor
def _inject_globals() -> dict:
    content_url = url_for("content_file", filename="curriculum.json")
    return {
        "curriculum": curriculum_meta(),
        "lab_mode": lab_mode(),
        "live_lab": live_lab_available(),
        "content_base": content_url[: -len("curriculum.json")],
        "capability_snapshot": capability_snapshot(),
    }


def _labs_view() -> tuple[list[dict], dict]:
    return _labs_for(get_labs(), FOUNDATIONS_ID)


def _core_view() -> tuple[list[dict], dict]:
    return _labs_for(get_core_labs(), CORE_ID)


def _continue_lab(labs: list[dict]) -> dict | None:
    for lab in labs:
        if lab["available"] and lab["status"] != "complete":
            return lab
    return None


def _labs_for(labs: list[dict], curriculum_id: str) -> tuple[list[dict], dict]:
    summary = progress_summary([lab["id"] for lab in labs], curriculum_id)
    rows = []
    for lab in labs:
        status = summary["statuses"][lab["id"]]
        rows.append(
            {
                **lab,
                "status": status,
                "status_label": status_label(status),
            }
        )
    return rows, summary


@app.route("/favicon.ico")
def favicon():
    return ("", 204)


@app.route("/content/<path:filename>")
def content_file(filename: str):
    if not filename.endswith(".json"):
        abort(404)
    return send_from_directory(CONTENT, filename)


@app.route("/web/<path:filename>")
def web_file(filename: str):
    if not filename.endswith(".js"):
        abort(404)
    return send_from_directory(WEB, filename)


@app.route("/")
def dashboard():
    labs, summary = _labs_view()
    core_labs, core_summary = _core_view()
    return render_template(
        "dashboard.html",
        labs=labs,
        summary=summary,
        continue_lab=_continue_lab(labs),
        core_labs=core_labs,
        core_summary=core_summary,
        core_continue=_continue_lab(core_labs),
        roadmap=load_roadmap(),
    )


@app.route("/labs")
def labs_index():
    labs, summary = _labs_view()
    core_labs, core_summary = _core_view()
    return render_template(
        "labs.html",
        labs=labs,
        summary=summary,
        core_labs=core_labs,
        core_summary=core_summary,
    )


def _curriculum_id(value: str | None) -> str:
    if value and _CURRICULUM_ID.fullmatch(value):
        return value
    return FOUNDATIONS_ID


def _apply_progress(lab_id: str, curriculum_id: str, stage_ids: list[str], payload: dict) -> None:
    op = payload.get("op")
    if op == "stage":
        stage_id = payload.get("stageId")
        if stage_id not in stage_ids or not isinstance(payload.get("completed"), bool):
            raise ValueError("stage")
        set_stage_completed(lab_id, stage_id, payload["completed"], curriculum_id)
        sync_lab_status(lab_id, stage_ids, curriculum_id)
        return
    if op == "activity":
        note_activity(lab_id, curriculum_id)
        return
    if op == "exam":
        question_id = payload.get("questionId")
        if not isinstance(question_id, str) or not question_id or len(question_id) > 80:
            raise ValueError("exam")
        topic_id = payload.get("topicId")
        if topic_id is not None and (not isinstance(topic_id, str) or len(topic_id) > 80):
            raise ValueError("topic")
        kind = payload.get("kind") or "pool"
        pool_id = payload.get("poolId")
        license_level = payload.get("licenseLevel")
        record_exam(
            question_id,
            bool(payload.get("correct")),
            lab_id=lab_id,
            topic_id=topic_id,
            curriculum_id=curriculum_id,
            license_level=license_level if isinstance(license_level, str) else None,
            pool_id=pool_id if isinstance(pool_id, str) else None,
            kind=kind,
        )
        note_activity(lab_id, curriculum_id)
        return
    if op == "concept":
        concept_id = payload.get("conceptId")
        status = payload.get("status")
        if not isinstance(concept_id, str) or not concept_id or len(concept_id) > 80:
            raise ValueError("concept")
        license_level = payload.get("licenseLevel")
        set_concept_status(
            concept_id,
            status,
            curriculum_id,
            license_level if isinstance(license_level, str) else None,
        )
        note_activity(lab_id, curriculum_id)
        return
    if op == "field":
        task_id = payload.get("taskId")
        if not isinstance(task_id, str) or not task_id or len(task_id) > 80:
            raise ValueError("field")
        set_field_task(task_id, payload.get("status"), lab_id, curriculum_id)
        note_activity(lab_id, curriculum_id)
        return
    raise ValueError("op")


@app.route("/api/progress/<lab_id>", methods=["GET", "POST"])
def progress_api(lab_id: str):
    if get_lab(lab_id) is None:
        abort(404)
    stage_ids = [stage["id"] for stage in get_stages()]
    if request.method == "GET":
        curriculum_id = _curriculum_id(request.args.get("curriculumId"))
        return jsonify(progress_snapshot(lab_id, stage_ids, curriculum_id))
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        abort(400)
    curriculum_id = _curriculum_id(payload.get("curriculumId") or request.args.get("curriculumId"))
    try:
        _apply_progress(lab_id, curriculum_id, stage_ids, payload)
    except ValueError:
        abort(400)
    return jsonify(progress_snapshot(lab_id, stage_ids, curriculum_id))


@app.route("/labs/<lab_id>")
def lab_workspace(lab_id: str):
    lab = get_lab(lab_id)
    if lab is None:
        abort(404)
    curriculum_id = lab.get("curriculumId") or FOUNDATIONS_ID
    summary = progress_summary([lab["id"]], curriculum_id)
    status = summary["statuses"][lab["id"]]
    return render_template(
        "lab.html",
        lab=lab,
        stages=stages_for_lab(lab["id"]),
        status=status,
        status_label=status_label(status),
    )


@app.route("/progress")
def progress_page():
    labs, summary = _labs_view()
    core_labs, core_summary = _core_view()
    return render_template(
        "progress.html",
        labs=labs,
        summary=summary,
        topics=weak_topics(curriculum_id=FOUNDATIONS_ID),
        exam=exam_readiness(curriculum_id=FOUNDATIONS_ID),
        concepts=concept_count(FOUNDATIONS_ID),
        core_labs=core_labs,
        core_summary=core_summary,
        core_topics=weak_topics(curriculum_id=CORE_ID),
        core_concepts=concept_count(CORE_ID),
        coverage=syllabus_coverage(),
    )


@app.route("/about")
def about():
    return render_template("about.html")


@app.errorhandler(404)
def not_found(_error):
    return render_template("404.html"), 404


def main() -> None:
    init_db()
    app.run(host=HOST, port=PORT, debug=False)


if __name__ == "__main__":
    main()
