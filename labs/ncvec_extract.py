"""Derive syllabus and question-index JSON from an NCVEC pool PDF.

The PDF stays the authoritative document. This module reads its text with
pdftotext and writes structured files. It does not store answer letters or
choice lists. A later license level can use the same functions with its own
source directory.
"""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "content" / "exam" / "sources" / "technician-2026-2030"
PDF_NAME = "2026-2030-technician-ncvec-feb-19-2026.pdf"
SYLLABUS_PATH = ROOT / "content" / "exam" / "technician-2026-2030.json"
QUESTION_INDEX_PATH = ROOT / "content" / "exam" / "technician-2026-2030-questions.json"
PROVENANCE_RELATIVE = "exam/sources/technician-2026-2030/provenance.json"

SUBELEMENT_RE = re.compile(
    r"SUBELEMENT (T\d) - (.+?) \[(\d+) Exam Questions - (\d+) Groups\](?: (\d+) Questions)?"
)
GROUP_RE = re.compile(r"^(T\d[A-F])\s+(.+)$")
QUESTION_RE = re.compile(r"^(T\d[A-F]\d\d) \([A-D]\)(.*)$", re.M)
CHOICE_RE = re.compile(r"^[A-D]\.\s")

ERRATA_STEMS = {
    "T1C01": "For which classes of amateur radio licenses does the FCC currently issue new licenses?",
    "T5A05": "A difference in which of the following causes electron flow?",
    "T7A09": "What is the function of the switch which selects either SSB or CW-FM on some VHF power amplifiers?",
    "T0A10": "What hazard exists when rapidly charging or discharging an unprotected battery?",
}


def pdf_text(pdf_path: Path) -> str:
    result = subprocess.run(
        ["pdftotext", "-layout", str(pdf_path), "-"],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.replace("\f", "\n")


def _pool_start(text: str) -> int:
    """The question pool follows the syllabus. Both headers share a prefix."""
    found = []
    start = 0
    needle = "FCC Element 2 Question Pool"
    while True:
        index = text.find(needle, start)
        if index < 0:
            break
        found.append(index)
        start = index + len(needle)
    if len(found) < 2:
        raise ValueError("The NCVEC text is missing the syllabus or question-pool header")
    return found[1]


def parse_syllabus(text: str) -> list[dict]:
    syllabus = text[text.find("SUBELEMENT T1") : _pool_start(text)]
    subelements: list[dict] = []
    current: dict | None = None
    group: dict | None = None

    def close_group() -> None:
        nonlocal group
        if group and current is not None:
            group["officialTopicText"] = re.sub(r"\s+", " ", group["officialTopicText"]).strip()
            current["groups"].append(group)
            group = None

    for raw in syllabus.splitlines():
        line = raw.strip()
        if not line:
            close_group()
            continue
        sub = SUBELEMENT_RE.match(line)
        if sub:
            close_group()
            current = {
                "id": sub.group(1),
                "title": re.sub(r"\s+", " ", sub.group(2)).strip(),
                "examQuestions": int(sub.group(3)),
                "groupCount": int(sub.group(4)),
                "poolQuestionCount": int(sub.group(5) or 0),
                "groups": [],
            }
            subelements.append(current)
            continue
        match = GROUP_RE.match(line)
        if match and len(match.group(1)) == 3 and current is not None:
            close_group()
            group = {"id": match.group(1), "officialTopicText": match.group(2)}
            continue
        if group is not None:
            group["officialTopicText"] += " " + line
    close_group()
    return subelements


def parse_questions(text: str) -> list[dict]:
    body = text[_pool_start(text) :]
    matches = list(QUESTION_RE.finditer(body))
    questions = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(body)
        stem_lines = []
        for raw in body[match.end() : end].splitlines():
            line = raw.strip()
            if not line:
                continue
            if CHOICE_RE.match(line):
                break
            stem_lines.append(line)
        question_id = match.group(1)
        questions.append(
            {
                "id": question_id,
                "groupId": question_id[:3],
                "stem": re.sub(r"\s+", " ", " ".join(stem_lines)).strip(),
            }
        )
    return questions


def syllabus_document(subelements: list[dict]) -> dict:
    return {
        "schemaVersion": 1,
        "id": "technician-2026-2030-syllabus",
        "role": "official-syllabus",
        "licenseLevel": "technician",
        "element": "2",
        "pool": "2026-2030",
        "versionLabel": "2026-2030 Technician Class",
        "effectiveFrom": "2026-07-01",
        "effectiveThrough": "2030-06-30",
        "errataRelease": "2026-02-19",
        "questionsIncluded": False,
        "answersIncluded": False,
        "derivedFrom": PROVENANCE_RELATIVE,
        "questionIndex": "exam/technician-2026-2030-questions.json",
        "note": "Official syllabus topic text extracted from the NCVEC February 19, 2026 document. This is reference and alignment data, not Radio Lab teaching, and it does not include question answers.",
        "subelements": subelements,
    }


def question_document(questions: list[dict]) -> dict:
    return {
        "schemaVersion": 1,
        "id": "technician-2026-2030-question-index",
        "role": "official-question-metadata",
        "licenseLevel": "technician",
        "element": "2",
        "pool": "2026-2030",
        "effectiveFrom": "2026-07-01",
        "effectiveThrough": "2030-06-30",
        "errataRelease": "2026-02-19",
        "answersIncluded": False,
        "derivedFrom": PROVENANCE_RELATIVE,
        "syllabus": "exam/technician-2026-2030.json",
        "note": "Official question identifiers and stems for traceability. Correct answers are not stored. This is not a practice exam and not Radio Lab teaching.",
        "questions": questions,
    }


def write_derived(pdf_path: Path | None = None) -> tuple[dict, dict]:
    text = pdf_text(pdf_path or (SOURCE_DIR / PDF_NAME))
    if "Issued February 19, 2026" not in text:
        raise ValueError("This PDF is not the February 19, 2026 NCVEC release")
    syllabus = syllabus_document(parse_syllabus(text))
    questions = question_document(parse_questions(text))
    for question_id, stem in ERRATA_STEMS.items():
        found = next(item["stem"] for item in questions["questions"] if item["id"] == question_id)
        if found != stem:
            raise ValueError(f"{question_id} does not match the February 19, 2026 errata")
    SYLLABUS_PATH.write_text(json.dumps(syllabus, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    QUESTION_INDEX_PATH.write_text(json.dumps(questions, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return syllabus, questions


if __name__ == "__main__":
    syllabus, questions = write_derived()
    print(f"subelements {len(syllabus['subelements'])}")
    print(f"groups {sum(len(item['groups']) for item in syllabus['subelements'])}")
    print(f"questions {len(questions['questions'])}")
