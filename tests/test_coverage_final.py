"""Final Technician coverage audit.

Both earlier audit generations stay immutable. RF-01 is not Technician coverage.
"""

from __future__ import annotations

import hashlib
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXAM = ROOT / "content" / "exam"
DOCS = ROOT / "docs"
HISTORICAL = {
    EXAM / "technician-2026-2030-coverage.json": "d8a7e8e0cbdc6a481c3da955e60e8ba42b33119d2758340744da6234fffc5f1e",
    DOCS / "TECHNICIAN_COVERAGE_AUDIT.md": "26e2a97cc9c2b85a2c48cccee3daab98e871a7899c87d0b1186e1379779bcd75",
    EXAM / "technician-2026-2030-coverage-post-remediation.json": "ad75e3cd03cfaf888dd17c285ecad05ef5ee63db4eded9a56e224ca0dda28e3d",
    EXAM / "technician-2026-2030-stem-support.json": "d7a98009b8870f652eb142780905d6d921691aca9b4283e931185c15f53b6053",
    DOCS / "TECHNICIAN_COVERAGE_REAUDIT.md": "98e208a8a3c9058bb49a58e55ba68bb67d9e693bcb4db138540e37d9e013f744",
}
GROUP_STATUS = {"complete", "partial", "missing"}
CONCEPT_STATUS = {
    "complete",
    "taught-not-practiced",
    "taught-practiced-not-assessed",
    "reference-only",
    "mentioned-only",
    "missing",
}
STEM_SUPPORT = {"SUPPORTED", "PARTIALLY SUPPORTED", "UNSUPPORTED"}
TECHNICIAN_LABS = {
    "01", "02", "03", "04", "05", "06", "07", "08",
    "tc-01", "tc-02", "tc-03", "tc-04", "tc-05", "tc-06", "tc-07", "tc-08",
    "tr-01", "tr-02", "tr-03", "tr-04", "tr-05", "tr-06", "tr-07", "tr-08", "tr-09",
}
CLOSED = {
    "T0B06", "T1B07", "T2C08", "T3A03", "T3A08", "T3A09",
    "T4A01", "T4A02", "T4A04", "T4A05", "T4A06", "T4A07", "T4A08", "T4A09",
    "T4B04", "T7A09", "T7B07", "T7B09", "T7C03", "T7D06",
    "T8B04", "T8B09", "T8B12",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class FinalCoverageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.syllabus = json.loads((EXAM / "technician-2026-2030.json").read_text(encoding="utf-8"))
        cls.questions = json.loads((EXAM / "technician-2026-2030-questions.json").read_text(encoding="utf-8"))
        cls.coverage = json.loads((EXAM / "technician-2026-2030-coverage-final.json").read_text(encoding="utf-8"))
        cls.stems = json.loads((EXAM / "technician-2026-2030-stem-support-final.json").read_text(encoding="utf-8"))
        cls.official_groups = [
            group["id"]
            for item in cls.syllabus["subelements"]
            for group in item["groups"]
        ]
        cls.official_ids = [item["id"] for item in cls.questions["questions"]]

    def test_earlier_audits_are_unchanged_and_distinct(self) -> None:
        for path, digest in HISTORICAL.items():
            self.assertEqual(sha256(path), digest)
        self.assertNotEqual(
            sha256(EXAM / "technician-2026-2030-coverage-final.json"),
            HISTORICAL[EXAM / "technician-2026-2030-coverage-post-remediation.json"],
        )
        self.assertNotEqual(
            sha256(EXAM / "technician-2026-2030-stem-support-final.json"),
            HISTORICAL[EXAM / "technician-2026-2030-stem-support.json"],
        )
        self.assertEqual(self.coverage["audit"], "third")
        self.assertEqual(self.stems["audit"], "third")
        self.assertEqual(self.coverage["role"], "final-coverage-audit")
        self.assertEqual(self.stems["role"], "final-stem-support")

    def test_every_official_group_appears_once(self) -> None:
        audited = [group["officialId"] for group in self.coverage["groups"]]
        self.assertEqual(len(audited), 35)
        self.assertEqual(len(set(audited)), 35)
        self.assertEqual(set(audited), set(self.official_groups))
        topics = {
            group["id"]: group["officialTopicText"]
            for item in self.syllabus["subelements"]
            for group in item["groups"]
        }
        for group in self.coverage["groups"]:
            self.assertEqual(group["officialTopicText"], topics[group["officialId"]])

    def test_group_status_rules(self) -> None:
        counts = {"complete": 0, "partial": 0, "missing": 0}
        for group in self.coverage["groups"]:
            self.assertIn(group["classification"], GROUP_STATUS)
            counts[group["classification"]] += 1
            self.assertTrue(group["evidence"].strip())
            for lab_id in group["supportingLabs"]:
                self.assertIn(lab_id, TECHNICIAN_LABS)
                self.assertNotEqual(lab_id, "rf-01")
            if group["classification"] == "complete":
                self.assertFalse(group["remainingGap"].strip())
                self.assertTrue(any(concept["status"] == "complete" for concept in group["concepts"]))
            else:
                self.assertTrue(group["remainingGap"].strip())
        self.assertEqual(counts, self.coverage["counts"])
        self.assertEqual(counts, {"complete": 35, "partial": 0, "missing": 0})
        self.assertEqual(sum(counts.values()), 35)

    def test_concepts_map_to_official_groups(self) -> None:
        keys = {
            "complete": "taughtPracticedAssessed",
            "taught-practiced-not-assessed": "taughtPracticedNotAssessed",
            "taught-not-practiced": "taughtNotPracticed",
            "reference-only": "referenceOnly",
            "mentioned-only": "mentionedOnly",
            "missing": "missing",
        }
        tallies = {key: 0 for key in keys.values()}
        self.assertEqual(len(self.coverage["concepts"]), self.coverage["conceptTotal"])
        self.assertEqual(self.coverage["conceptTotal"], 133)
        for concept in self.coverage["concepts"]:
            self.assertIn(concept["officialGroup"], self.official_groups)
            self.assertIn(concept["status"], CONCEPT_STATUS)
            self.assertTrue(concept["name"].strip())
            self.assertTrue(concept["evidence"].strip())
            tallies[keys[concept["status"]]] += 1
            if concept["status"] == "complete":
                self.assertTrue(concept["taught"] and concept["practiced"] and concept["assessed"])
            if concept["status"] == "missing":
                self.assertFalse(concept["taught"] or concept["practiced"] or concept["assessed"])
        self.assertEqual(tallies, self.coverage["conceptCounts"])
        self.assertEqual(sum(tallies.values()), self.coverage["conceptTotal"])

    def test_every_stem_appears_once_and_counts_reconcile(self) -> None:
        rows = self.stems["stems"]
        ids = [row["questionId"] for row in rows]
        self.assertEqual(len(ids), 409)
        self.assertEqual(ids, self.official_ids)
        self.assertFalse(self.stems["answersIncluded"])
        by_group = {group_id: 0 for group_id in self.official_groups}
        by_sub = {
            sub: {"SUPPORTED": 0, "PARTIALLY SUPPORTED": 0, "UNSUPPORTED": 0}
            for sub in ["T0", "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9"]
        }
        totals = {"SUPPORTED": 0, "PARTIALLY SUPPORTED": 0, "UNSUPPORTED": 0}
        for row in rows:
            self.assertIn(row["groupId"], self.official_groups)
            self.assertTrue(row["questionId"].startswith(row["groupId"]))
            self.assertIn(row["support"], STEM_SUPPORT)
            self.assertTrue(row["concept"].strip())
            self.assertTrue(row["lessonEvidence"].strip())
            self.assertNotIn("answer", row)
            self.assertNotIn("rf-01", row["lessonEvidence"])
            by_group[row["groupId"]] += 1
            by_sub[row["groupId"][:2]][row["support"]] += 1
            totals[row["support"]] += 1
        official_by_group = {group_id: 0 for group_id in self.official_groups}
        for item in self.questions["questions"]:
            official_by_group[item["groupId"]] += 1
        self.assertEqual(by_group, official_by_group)
        self.assertEqual(totals, self.stems["counts"])
        self.assertEqual(totals, self.coverage["stemSupportCounts"])
        self.assertEqual(totals, {"SUPPORTED": 409, "PARTIALLY SUPPORTED": 0, "UNSUPPORTED": 0})
        self.assertEqual(by_sub, self.stems["bySubelement"])
        self.assertEqual(by_sub, self.coverage["stemSupportBySubelement"])
        self.assertEqual(sum(totals.values()), 409)
        for item in self.coverage["subelements"]:
            self.assertEqual(item["stemSupport"], by_sub[item["id"]])
            group_ids = [
                group["id"]
                for sub in self.syllabus["subelements"]
                if sub["id"] == item["id"]
                for group in sub["groups"]
            ]
            classifications = [
                group["classification"]
                for group in self.coverage["groups"]
                if group["officialId"] in group_ids
            ]
            self.assertEqual(item["complete"], classifications.count("complete"))
            self.assertEqual(item["partial"], classifications.count("partial"))
            self.assertEqual(item["missing"], classifications.count("missing"))
            self.assertEqual(item["complete"] + item["partial"] + item["missing"], len(group_ids))

    def test_previously_open_stems_are_now_supported_from_the_labs(self) -> None:
        by_id = {row["questionId"]: row for row in self.stems["stems"]}
        self.assertEqual(set(CLOSED), set(by_id) & set(CLOSED))
        for question_id in CLOSED:
            row = by_id[question_id]
            self.assertEqual(row["support"], "SUPPORTED")
            self.assertTrue(row["lessonEvidence"].strip())
        fading = by_id["T3A08"]
        elliptical = by_id["T3A09"]
        self.assertNotEqual(fading["concept"], elliptical["concept"])
        self.assertIn("path", fading["concept"].lower())
        self.assertIn("ellipt", elliptical["concept"].lower())

    def test_rf01_is_excluded_and_readiness_is_recorded(self) -> None:
        self.assertEqual(self.coverage["excludedFromScoring"], ["rf-01"])
        self.assertEqual(self.stems["excludedFromScoring"], ["rf-01"])
        self.assertNotIn("rf-01", self.coverage["curriculumAudited"])
        self.assertEqual(set(self.coverage["curriculumAudited"]), TECHNICIAN_LABS)
        for group in self.coverage["groups"]:
            self.assertNotIn("rf-01", group["supportingLabs"])
            self.assertNotIn("rf-01", group["evidence"])
        self.assertEqual(self.coverage["readiness"], "READY TO BEGIN TECHNICIAN EXAM READINESS")
        report = (DOCS / "TECHNICIAN_COVERAGE_FINAL_AUDIT.md").read_text(encoding="utf-8")
        self.assertIn("READY TO BEGIN TECHNICIAN EXAM READINESS", report)
        self.assertIn("RF-01", report)
