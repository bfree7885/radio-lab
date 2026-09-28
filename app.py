#!/usr/bin/env python3
"""Waypoint Radio Lab — local learning server.

This process is the local adapter. It reads the shared curriculum in
content/ and serves the browser core from web/. It binds to loopback only.
Start it with ./run.sh.
"""

from __future__ import annotations

from pathlib import Path

from flask import Flask, abort, render_template, send_from_directory, url_for

from hardware.capabilities import capability_snapshot, lab_mode, live_lab_available
from labs.catalog import (
    FOUNDATIONS_ID,
    curriculum_meta,
    get_lab,
    get_labs,
    lab_ids,
    load_roadmap,
    stages_for_lab,
)
from progress.store import (
    concept_count,
    exam_readiness,
    init_db,
    progress_summary,
    status_label,
    weak_topics,
)

ROOT = Path(__file__).resolve().parent
CONTENT = ROOT / "content"
WEB = ROOT / "web"

HOST = "127.0.0.1"
PORT = 5070

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
    summary = progress_summary(lab_ids())
    rows = []
    for lab in get_labs():
        status = summary["statuses"][lab["id"]]
        rows.append(
            {
                **lab,
                "status": status,
                "status_label": status_label(status),
            }
        )
    return rows, summary


def _continue_lab(labs: list[dict]) -> dict | None:
    for lab in labs:
        if lab["available"] and lab["status"] != "complete":
            return lab
    return None


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
    return render_template(
        "dashboard.html",
        labs=labs,
        summary=summary,
        continue_lab=_continue_lab(labs),
        roadmap=load_roadmap(),
    )


@app.route("/labs")
def labs_index():
    labs, summary = _labs_view()
    return render_template("labs.html", labs=labs, summary=summary)


@app.route("/labs/<lab_id>")
def lab_workspace(lab_id: str):
    lab = get_lab(lab_id)
    if lab is None:
        abort(404)
    summary = progress_summary([lab["id"]])
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
    return render_template(
        "progress.html",
        labs=labs,
        summary=summary,
        topics=weak_topics(curriculum_id=FOUNDATIONS_ID),
        exam=exam_readiness(curriculum_id=FOUNDATIONS_ID),
        concepts=concept_count(FOUNDATIONS_ID),
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
