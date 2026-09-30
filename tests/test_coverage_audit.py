"""Coverage audit of the current Technician curriculum against the official syllabus."""

from __future__ import annotations

import json
import os
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VALID_CLASSIFICATIONS = {"complete", "partial", "missing"}
VALID_CONCEPT_STATUSES = {
    "complete",
    "taught-not-practiced",
    "taught-practiced-not-assessed",
    "reference-only",
    "mentioned-only",
    "missing",
}


class CoverageAuditTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        os.environ["RADIO_LAB_DB"] = str(Path(self._tmp.name) / "progress.sqlite")
        import app as app_module

        app_module._db_ready = False
        self.client = app_module.app.test_client()

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def test_coverage_matches_official_groups_without_changing_the_source(self) -> None:
        syllabus = json.loads(
            (ROOT / "content" / "exam" / "technician-2026-2030.json").read_text(encoding="utf-8")
        )
        questions = json.loads(
            (ROOT / "content" / "exam" / "technician-2026-2030-questions.json").read_text(encoding="utf-8")
        )
        coverage = json.loads(
            (ROOT / "content" / "exam" / "technician-2026-2030-coverage.json").read_text(encoding="utf-8")
        )

        self.assertEqual(syllabus["role"], "official-syllabus")
        self.assertFalse(syllabus["questionsIncluded"])
        self.assertFalse(syllabus["answersIncluded"])
        self.assertFalse(questions["answersIncluded"])
        self.assertEqual(len(questions["questions"]), 409)
        for group in (group for item in syllabus["subelements"] for group in item["groups"]):
            self.assertEqual(set(group), {"id", "officialTopicText"})

        official = [
            (group["id"], group["officialTopicText"])
            for item in syllabus["subelements"]
            for group in item["groups"]
        ]
        self.assertEqual(len(official), 35)
        audited = [(group["officialId"], group["officialTopicText"]) for group in coverage["groups"]]
        self.assertEqual(len(audited), 35)
        self.assertEqual(len({group_id for group_id, _text in audited}), 35)
        self.assertEqual(dict(audited), dict(official))

        from labs.catalog import get_core_labs, get_labs, load_roadmap

        lab_ids = {lab["id"] for lab in get_labs()} | {lab["id"] for lab in get_core_labs()}
        counts = {name: 0 for name in VALID_CLASSIFICATIONS}
        for group in coverage["groups"]:
            self.assertIn(group["classification"], VALID_CLASSIFICATIONS)
            counts[group["classification"]] += 1
            for lab_id in group["supportingLabs"]:
                self.assertIn(lab_id, lab_ids)
            for concept in group["concepts"]:
                self.assertIn(concept["status"], VALID_CONCEPT_STATUSES)
                self.assertTrue(concept["name"].strip())
                self.assertTrue(concept["evidence"].strip())
            if group["classification"] == "complete":
                self.assertTrue(group["taught"])
                self.assertTrue(group["practiced"])
                self.assertTrue(group["assessed"])
                self.assertTrue(group["evidence"])
                self.assertTrue(any(concept["status"] == "complete" for concept in group["concepts"]))
            if group["classification"] == "missing":
                self.assertFalse(group["taught"])
                self.assertFalse(group["practiced"])
                self.assertFalse(group["assessed"])
            if group["classification"] == "partial":
                self.assertTrue(group["taught"])

        self.assertEqual(coverage["metric"]["name"], "group-level coverage")
        self.assertEqual(coverage["metric"]["denominator"], 35)
        self.assertEqual(coverage["metric"]["complete"], counts["complete"])
        self.assertEqual(coverage["metric"]["partial"], counts["partial"])
        self.assertEqual(coverage["metric"]["missing"], counts["missing"])
        self.assertEqual(counts["complete"] + counts["partial"] + counts["missing"], 35)
        self.assertIn("not a percentage of exam readiness", coverage["metric"]["weighting"].lower())

        roadmap = load_roadmap()
        general = next(track for track in roadmap["tracks"] if track["id"] == "general")
        self.assertTrue(all(phase["status"] == "planned" for phase in general["phases"]))
        self.assertEqual(len(get_labs()), 8)
        self.assertEqual([lab["id"] for lab in get_core_labs()], [f"tc-0{number}" for number in range(1, 9)])
        self.assertEqual(self.client.get("/").status_code, 200)

        audit = (ROOT / "docs" / "TECHNICIAN_COVERAGE_AUDIT.md").read_text(encoding="utf-8")
        for heading in (
            "Authoritative target",
            "Methodology",
            "Definitions",
            "Overall results",
            "Results by T0",
            "Detailed group analysis",
            "Missing concepts",
            "Partial concepts",
            "Reference-only concepts",
            "Mentioned-only concepts",
            "Taught but not practiced",
            "Taught and practiced but not assessed",
            "Calculation gaps",
            "Regulatory gaps",
            "Safety gaps",
            "Recommended remediation modules",
            "Group-level coverage",
        ):
            self.assertIn(heading, audit)


if __name__ == "__main__":
    unittest.main()
