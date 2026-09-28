"""SQLite progress store — the local progress adapter.

Hosted mode uses browser localStorage instead (web/progress-browser.js).
The two stores are not synchronized. Accounts and cloud sync are out of scope.

Tracks lab status now. Records are keyed by curriculum so Technician and
General can both be stored. Concept mastery is a separate table from
question-pool results. Weak topics are calculated from pool misses.
They are not stored as a second list.

Existing rows are kept. A schema version 1 database is migrated in place
and those rows are labeled technician-foundations.

The database path is inside this project. Override it with RADIO_LAB_DB
when a test needs an isolated file. No home directory or machine name is used.
"""

from __future__ import annotations

import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FOUNDATIONS_ID = "technician-foundations"
POOL_KINDS = ("pool", "concept")

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
    curriculum_id TEXT NOT NULL,
    lab_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'complete')),
    updated_at TEXT NOT NULL,
    PRIMARY KEY (curriculum_id, lab_id)
);

CREATE TABLE IF NOT EXISTS stage_progress (
    curriculum_id TEXT NOT NULL,
    lab_id TEXT NOT NULL,
    stage_id TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
    updated_at TEXT NOT NULL,
    PRIMARY KEY (curriculum_id, lab_id, stage_id)
);

CREATE TABLE IF NOT EXISTS exam_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    curriculum_id TEXT NOT NULL DEFAULT 'technician-foundations',
    license_level TEXT,
    pool_id TEXT,
    kind TEXT NOT NULL DEFAULT 'pool' CHECK (kind IN ('concept', 'pool')),
    lab_id TEXT,
    question_id TEXT NOT NULL,
    topic_id TEXT,
    correct INTEGER NOT NULL CHECK (correct IN (0, 1)),
    recorded_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS field_tasks (
    curriculum_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    lab_id TEXT,
    status TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (curriculum_id, task_id)
);

CREATE TABLE IF NOT EXISTS concept_progress (
    curriculum_id TEXT NOT NULL,
    concept_id TEXT NOT NULL,
    license_level TEXT,
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'complete')),
    updated_at TEXT NOT NULL,
    PRIMARY KEY (curriculum_id, concept_id)
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


def _table_exists(conn: sqlite3.Connection, table: str) -> bool:
    row = conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?",
        (table,),
    ).fetchone()
    return row is not None


def _columns(conn: sqlite3.Connection, table: str) -> set[str]:
    if not _table_exists(conn, table):
        return set()
    return {row["name"] for row in conn.execute(f"PRAGMA table_info({table})")}


def _migrate_legacy(conn: sqlite3.Connection) -> None:
    """Copy schema version 1 rows forward. Does not delete progress."""
    conn.execute("PRAGMA foreign_keys = OFF")
    if _table_exists(conn, "lab_progress") and "curriculum_id" not in _columns(conn, "lab_progress"):
        conn.execute(
            """
            CREATE TABLE lab_progress_v2 (
                curriculum_id TEXT NOT NULL,
                lab_id TEXT NOT NULL,
                status TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                PRIMARY KEY (curriculum_id, lab_id)
            )
            """
        )
        conn.execute(
            """
            INSERT INTO lab_progress_v2 (curriculum_id, lab_id, status, updated_at)
            SELECT ?, lab_id, status, updated_at FROM lab_progress
            """,
            (FOUNDATIONS_ID,),
        )
        conn.execute("DROP TABLE lab_progress")
        conn.execute("ALTER TABLE lab_progress_v2 RENAME TO lab_progress")

    if _table_exists(conn, "stage_progress") and "curriculum_id" not in _columns(conn, "stage_progress"):
        conn.execute(
            """
            CREATE TABLE stage_progress_v2 (
                curriculum_id TEXT NOT NULL,
                lab_id TEXT NOT NULL,
                stage_id TEXT NOT NULL,
                completed INTEGER NOT NULL DEFAULT 0,
                updated_at TEXT NOT NULL,
                PRIMARY KEY (curriculum_id, lab_id, stage_id)
            )
            """
        )
        conn.execute(
            """
            INSERT INTO stage_progress_v2
                (curriculum_id, lab_id, stage_id, completed, updated_at)
            SELECT ?, lab_id, stage_id, completed, updated_at FROM stage_progress
            """,
            (FOUNDATIONS_ID,),
        )
        conn.execute("DROP TABLE stage_progress")
        conn.execute("ALTER TABLE stage_progress_v2 RENAME TO stage_progress")

    if _table_exists(conn, "field_tasks") and "curriculum_id" not in _columns(conn, "field_tasks"):
        conn.execute(
            """
            CREATE TABLE field_tasks_v2 (
                curriculum_id TEXT NOT NULL,
                task_id TEXT NOT NULL,
                lab_id TEXT,
                status TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                PRIMARY KEY (curriculum_id, task_id)
            )
            """
        )
        conn.execute(
            """
            INSERT INTO field_tasks_v2 (curriculum_id, task_id, lab_id, status, updated_at)
            SELECT ?, task_id, lab_id, status, updated_at FROM field_tasks
            """,
            (FOUNDATIONS_ID,),
        )
        conn.execute("DROP TABLE field_tasks")
        conn.execute("ALTER TABLE field_tasks_v2 RENAME TO field_tasks")

    if _table_exists(conn, "exam_results") and "curriculum_id" not in _columns(conn, "exam_results"):
        conn.execute(
            "ALTER TABLE exam_results ADD COLUMN curriculum_id TEXT NOT NULL DEFAULT 'technician-foundations'"
        )
        conn.execute("ALTER TABLE exam_results ADD COLUMN license_level TEXT")
        conn.execute("ALTER TABLE exam_results ADD COLUMN pool_id TEXT")
        conn.execute("ALTER TABLE exam_results ADD COLUMN kind TEXT NOT NULL DEFAULT 'pool'")
    conn.execute("PRAGMA foreign_keys = ON")


def init_db() -> None:
    with connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS schema_meta (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
            """
        )
        _migrate_legacy(conn)
        conn.executescript(SCHEMA)
        conn.execute(
            """
            INSERT INTO schema_meta (key, value) VALUES ('schema_version', '2')
            ON CONFLICT(key) DO UPDATE SET value = '2'
            """
        )


def status_label(status: str) -> str:
    return STATUS_LABELS.get(status, STATUS_LABELS[NOT_STARTED])


def get_lab_status(lab_id: str, curriculum_id: str = FOUNDATIONS_ID) -> str:
    with connect() as conn:
        row = conn.execute(
            "SELECT status FROM lab_progress WHERE curriculum_id = ? AND lab_id = ?",
            (curriculum_id, lab_id),
        ).fetchone()
    if row is None:
        return NOT_STARTED
    return row["status"]


def set_lab_status(lab_id: str, status: str, curriculum_id: str = FOUNDATIONS_ID) -> None:
    if status not in STATUSES:
        raise ValueError(f"Unknown lab status: {status}")
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO lab_progress (curriculum_id, lab_id, status, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(curriculum_id, lab_id) DO UPDATE SET
                status = excluded.status,
                updated_at = excluded.updated_at
            """,
            (curriculum_id, lab_id, status, _now()),
        )


def progress_summary(lab_ids: list[str], curriculum_id: str = FOUNDATIONS_ID) -> dict:
    statuses = {lab_id: get_lab_status(lab_id, curriculum_id) for lab_id in lab_ids}
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


def weak_topics(limit: int = 8, curriculum_id: str | None = FOUNDATIONS_ID) -> list[dict]:
    """Pool topics missed more often than answered correctly.

    Concept checks are excluded. Empty until pool results exist.
    Pass curriculum_id=None to include every curriculum.
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
              AND (kind IS NULL OR kind = 'pool')
              AND (? IS NULL OR curriculum_id = ?)
            GROUP BY topic_id
            HAVING misses > hits
            ORDER BY misses DESC, topic_id ASC
            LIMIT ?
            """,
            (curriculum_id, curriculum_id, limit),
        ).fetchall()
    return [
        {"topic_id": row["topic_id"], "misses": row["misses"], "hits": row["hits"]}
        for row in rows
    ]


def exam_readiness(curriculum_id: str | None = FOUNDATIONS_ID) -> dict:
    """Question-pool performance only. This is not a concept-mastery score."""
    with connect() as conn:
        row = conn.execute(
            """
            SELECT COUNT(*) AS recorded, COALESCE(SUM(correct), 0) AS correct
            FROM exam_results
            WHERE (kind IS NULL OR kind = 'pool')
              AND (? IS NULL OR curriculum_id = ?)
            """,
            (curriculum_id, curriculum_id),
        ).fetchone()
    recorded = int(row["recorded"])
    correct = int(row["correct"])
    return {
        "recorded": recorded,
        "correct": correct,
        "has_evidence": recorded > 0,
    }


def stage_completed(lab_id: str, stage_id: str, curriculum_id: str = FOUNDATIONS_ID) -> bool:
    with connect() as conn:
        row = conn.execute(
            """
            SELECT completed FROM stage_progress
            WHERE curriculum_id = ? AND lab_id = ? AND stage_id = ?
            """,
            (curriculum_id, lab_id, stage_id),
        ).fetchone()
    if row is None:
        return False
    return bool(row["completed"])


def set_stage_completed(
    lab_id: str,
    stage_id: str,
    completed: bool,
    curriculum_id: str = FOUNDATIONS_ID,
) -> None:
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO stage_progress
                (curriculum_id, lab_id, stage_id, completed, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(curriculum_id, lab_id, stage_id) DO UPDATE SET
                completed = excluded.completed,
                updated_at = excluded.updated_at
            """,
            (curriculum_id, lab_id, stage_id, 1 if completed else 0, _now()),
        )


def record_exam(
    question_id: str,
    correct: bool,
    lab_id: str | None = None,
    topic_id: str | None = None,
    curriculum_id: str = FOUNDATIONS_ID,
    license_level: str | None = None,
    pool_id: str | None = None,
    kind: str = "pool",
) -> None:
    if kind not in POOL_KINDS:
        raise ValueError(f"Unknown exam result kind: {kind}")
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO exam_results (
                curriculum_id, license_level, pool_id, kind,
                lab_id, question_id, topic_id, correct, recorded_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                curriculum_id,
                license_level,
                pool_id,
                kind,
                lab_id,
                question_id,
                topic_id,
                1 if correct else 0,
                _now(),
            ),
        )


def get_field_task(task_id: str, curriculum_id: str = FOUNDATIONS_ID) -> dict | None:
    with connect() as conn:
        row = conn.execute(
            """
            SELECT curriculum_id, task_id, lab_id, status, updated_at
            FROM field_tasks
            WHERE curriculum_id = ? AND task_id = ?
            """,
            (curriculum_id, task_id),
        ).fetchone()
    if row is None:
        return None
    return {
        "curriculum_id": row["curriculum_id"],
        "task_id": row["task_id"],
        "lab_id": row["lab_id"],
        "status": row["status"],
        "updated_at": row["updated_at"],
    }


def set_field_task(
    task_id: str,
    status: str,
    lab_id: str | None = None,
    curriculum_id: str = FOUNDATIONS_ID,
) -> None:
    if status not in STATUSES:
        raise ValueError(f"Unknown field-task status: {status}")
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO field_tasks (curriculum_id, task_id, lab_id, status, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(curriculum_id, task_id) DO UPDATE SET
                lab_id = excluded.lab_id,
                status = excluded.status,
                updated_at = excluded.updated_at
            """,
            (curriculum_id, task_id, lab_id, status, _now()),
        )


def get_concept_status(concept_id: str, curriculum_id: str = FOUNDATIONS_ID) -> str:
    with connect() as conn:
        row = conn.execute(
            """
            SELECT status FROM concept_progress
            WHERE curriculum_id = ? AND concept_id = ?
            """,
            (curriculum_id, concept_id),
        ).fetchone()
    if row is None:
        return NOT_STARTED
    return row["status"]


def set_concept_status(
    concept_id: str,
    status: str,
    curriculum_id: str = FOUNDATIONS_ID,
    license_level: str | None = None,
) -> None:
    if status not in STATUSES:
        raise ValueError(f"Unknown concept status: {status}")
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO concept_progress
                (curriculum_id, concept_id, license_level, status, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(curriculum_id, concept_id) DO UPDATE SET
                license_level = excluded.license_level,
                status = excluded.status,
                updated_at = excluded.updated_at
            """,
            (curriculum_id, concept_id, license_level, status, _now()),
        )


def concept_count(curriculum_id: str = FOUNDATIONS_ID) -> int:
    with connect() as conn:
        row = conn.execute(
            "SELECT COUNT(*) AS n FROM concept_progress WHERE curriculum_id = ?",
            (curriculum_id,),
        ).fetchone()
    return int(row["n"])
