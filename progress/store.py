"""SQLite progress store.

Tracks lab status now. The same database is ready for stage completion,
exam-question results, derived weak topics, and field tasks. Those tables
stay empty until later labs write to them.

The database path is inside this project. Override it with RADIO_LAB_DB
when a test needs an isolated file. No home directory or machine name is used.
"""

from __future__ import annotations

import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

NOT_STARTED = "not_started"
IN_PROGRESS = "in_progress"
COMPLETE = "complete"
STATUSES = (NOT_STARTED, IN_PROGRESS, COMPLETE)

STATUS_LABELS = {
    NOT_STARTED: "NOT STARTED",
    IN_PROGRESS: "IN PROGRESS",
    COMPLETE: "COMPLETE",
}

SCHEMA = """
CREATE TABLE IF NOT EXISTS schema_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lab_progress (
    lab_id TEXT PRIMARY KEY,
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'complete')),
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stage_progress (
    lab_id TEXT NOT NULL,
    stage_id TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
    updated_at TEXT NOT NULL,
    PRIMARY KEY (lab_id, stage_id)
);

CREATE TABLE IF NOT EXISTS exam_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lab_id TEXT,
    question_id TEXT NOT NULL,
    topic_id TEXT,
    correct INTEGER NOT NULL CHECK (correct IN (0, 1)),
    recorded_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS field_tasks (
    task_id TEXT PRIMARY KEY,
    lab_id TEXT,
    status TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
"""


def db_path() -> Path:
    override = os.environ.get("RADIO_LAB_DB")
    if override:
        return Path(override)
    return ROOT / "data" / "progress.sqlite"


def _now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def connect() -> sqlite3.Connection:
    path = db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with connect() as conn:
        conn.executescript(SCHEMA)
        conn.execute(
            "INSERT OR IGNORE INTO schema_meta (key, value) VALUES (?, ?)",
            ("schema_version", "1"),
        )


def status_label(status: str) -> str:
    return STATUS_LABELS.get(status, STATUS_LABELS[NOT_STARTED])


def get_lab_status(lab_id: str) -> str:
    with connect() as conn:
        row = conn.execute(
            "SELECT status FROM lab_progress WHERE lab_id = ?",
            (lab_id,),
        ).fetchone()
    if row is None:
        return NOT_STARTED
    return row["status"]


def set_lab_status(lab_id: str, status: str) -> None:
    if status not in STATUSES:
        raise ValueError(f"Unknown lab status: {status}")
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO lab_progress (lab_id, status, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(lab_id) DO UPDATE SET
                status = excluded.status,
                updated_at = excluded.updated_at
            """,
            (lab_id, status, _now()),
        )


def progress_summary(lab_ids: list[str]) -> dict:
    statuses = {lab_id: get_lab_status(lab_id) for lab_id in lab_ids}
    completed = sum(1 for status in statuses.values() if status == COMPLETE)
    in_progress = sum(1 for status in statuses.values() if status == IN_PROGRESS)
    total = len(lab_ids)
    remaining = total - completed
    percent = round((100 * completed) / total) if total else 0
    return {
        "statuses": statuses,
        "completed": completed,
        "in_progress": in_progress,
        "remaining": remaining,
        "total": total,
        "percent": percent,
    }


def weak_topics(limit: int = 8) -> list[dict]:
    """Topics missed more often than answered correctly.

    Empty until exam results exist. Nothing here is invented.
    """
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT
                topic_id,
                SUM(CASE WHEN correct = 0 THEN 1 ELSE 0 END) AS misses,
                SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) AS hits
            FROM exam_results
            WHERE topic_id IS NOT NULL AND topic_id != ''
            GROUP BY topic_id
            HAVING misses > hits
            ORDER BY misses DESC, topic_id ASC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    return [
        {"topic_id": row["topic_id"], "misses": row["misses"], "hits": row["hits"]}
        for row in rows
    ]


def exam_readiness() -> dict:
    """Readiness from recorded exam items only. No score is implied when empty."""
    with connect() as conn:
        row = conn.execute(
            "SELECT COUNT(*) AS recorded, COALESCE(SUM(correct), 0) AS correct FROM exam_results"
        ).fetchone()
    recorded = int(row["recorded"])
    correct = int(row["correct"])
    return {
        "recorded": recorded,
        "correct": correct,
        "has_evidence": recorded > 0,
    }
