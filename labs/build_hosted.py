"""Build the static learner site.

Official NCVEC diagram JPEGs are copied because the labs and Exam Readiness
questions display them. The NCVEC PDF is not copied. Flask, SQLite, hardware
code, and the development database are not copied.

Serve the result from its own directory:

    python3 -m http.server 8088 --directory dist/learner
"""

from __future__ import annotations

import os
import shutil
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUT = ROOT / "dist" / "learner"
CONTENT = ROOT / "content"
WEB = ROOT / "web"
STATIC = ROOT / "static"

FORBIDDEN_SUFFIXES = {".pdf", ".sqlite", ".sqlite3", ".db", ".pem", ".env"}
FORBIDDEN_NAMES = {
    "app.py",
    "store.py",
    "capabilities.py",
    "progress.sqlite",
    "credentials.json",
}


def build(out_dir: Path | None = None) -> Path:
    destination = Path(out_dir) if out_dir else DEFAULT_OUT
    if destination.exists():
        shutil.rmtree(destination)
    destination.mkdir(parents=True)
    previous_db = os.environ.get("RADIO_LAB_DB")
    previous_delivery = os.environ.get("RADIO_LAB_DELIVERY")
    temporary = tempfile.TemporaryDirectory()
    os.environ["RADIO_LAB_DB"] = str(Path(temporary.name) / "progress.sqlite")
    os.environ["RADIO_LAB_DELIVERY"] = "hosted"
    try:
        import app as app_module

        app_module._db_ready = False
        client = app_module.app.test_client()
        _write_pages(client, destination)
        _copy_runtime(destination)
    finally:
        temporary.cleanup()
        if previous_db is None:
            os.environ.pop("RADIO_LAB_DB", None)
        else:
            os.environ["RADIO_LAB_DB"] = previous_db
        if previous_delivery is None:
            os.environ.pop("RADIO_LAB_DELIVERY", None)
        else:
            os.environ["RADIO_LAB_DELIVERY"] = previous_delivery
        import app as app_module

        app_module._db_ready = False
    audit_publication(destination)
    return destination


def _write_pages(client, destination: Path) -> None:
    from labs.catalog import get_core_labs, get_labs, get_remediation_labs, get_rf_labs

    pages = {
        "/": destination / "index.html",
        "/labs": destination / "labs" / "index.html",
        "/progress": destination / "progress" / "index.html",
        "/readiness": destination / "readiness" / "index.html",
        "/about": destination / "about" / "index.html",
    }
    for lab in get_labs() + get_core_labs() + get_remediation_labs() + get_rf_labs():
        pages["/labs/" + lab["id"]] = destination / "labs" / lab["id"] / "index.html"
    for path, target in pages.items():
        response = client.get(path)
        if response.status_code != 200:
            raise RuntimeError(f"{path} returned {response.status_code}")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(response.data)
        response.close()


def _copy_runtime(destination: Path) -> None:
    web_out = destination / "web"
    web_out.mkdir()
    for path in sorted(WEB.glob("*.js")):
        shutil.copy2(path, web_out / path.name)
    static_out = destination / "static"
    shutil.copytree(STATIC / "css", static_out / "css")
    shutil.copy2(STATIC / "favicon.svg", static_out / "favicon.svg")
    for path in CONTENT.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() in FORBIDDEN_SUFFIXES or path.suffix.lower() == ".py":
            continue
        if path.name in FORBIDDEN_NAMES:
            continue
        if "__pycache__" in path.parts:
            continue
        relative = path.relative_to(CONTENT)
        target = destination / "content" / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)


def audit_publication(destination: Path) -> list[str]:
    """Return problems. Raise if the tree is not publishable."""
    problems: list[str] = []
    for path in destination.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() in FORBIDDEN_SUFFIXES or path.name in FORBIDDEN_NAMES:
            problems.append(str(path.relative_to(destination)))
        if path.suffix == ".py":
            problems.append(str(path.relative_to(destination)))
    required = [
        destination / "index.html",
        destination / "readiness" / "index.html",
        destination / "content" / "labs" / "01" / "lesson.json",
        destination / "content" / "exam" / "technician-readiness-v1.json",
        destination
        / "content"
        / "exam"
        / "sources"
        / "technician-2026-2030"
        / "diagrams"
        / "technician-diagram-t1.jpg",
        destination / "web" / "readiness-engine.js",
        destination / "web" / "learner-data.js",
    ]
    for path in required:
        if not path.is_file():
            problems.append("missing " + str(path.relative_to(destination)))
    index = (destination / "index.html").read_text(encoding="utf-8")
    if 'data-delivery="hosted"' not in index:
        problems.append("index is not hosted")
    if "progress-local.js" in index:
        problems.append("index loads the local progress adapter")
    lab = (destination / "labs" / "01" / "index.html").read_text(encoding="utf-8")
    if "progress-local.js" in lab:
        problems.append("lab 01 loads the local progress adapter")
    if problems:
        raise RuntimeError("Hosted publication audit failed: " + "; ".join(problems))
    return problems


def main() -> None:
    destination = build()
    print(f"Wrote {destination}")


if __name__ == "__main__":
    main()
