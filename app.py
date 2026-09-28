#!/usr/bin/env python3
"""Waypoint Radio Lab — local learning application.

Binds to loopback only. Start it with ./run.sh.
"""

from __future__ import annotations

from flask import Flask, abort, render_template

from hardware.capabilities import lab_mode, live_lab_available
from labs.catalog import CURRICULUM, LABS, STAGES, get_lab, lab_ids
from progress.store import (
    exam_readiness,
    init_db,
    progress_summary,
    status_label,
    weak_topics,
)

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
    return {
        "curriculum": CURRICULUM,
        "lab_mode": lab_mode(),
        "live_lab": live_lab_available(),
    }


def _labs_view() -> tuple[list[dict], dict]:
    summary = progress_summary(lab_ids())
    rows = []
    for lab in LABS:
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


@app.route("/")
def dashboard():
    labs, summary = _labs_view()
    return render_template(
        "dashboard.html",
        labs=labs,
        summary=summary,
        continue_lab=_continue_lab(labs),
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
        stages=STAGES,
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
        topics=weak_topics(),
        exam=exam_readiness(),
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
