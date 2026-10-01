"""Technician Exam Readiness V1.

The instructional labs and the three coverage audits stay untouched.
"""

from __future__ import annotations

import hashlib
import json
import os
import tempfile
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


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class ReadinessTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        os.environ["RADIO_LAB_DB"] = str(Path(self._tmp.name) / "progress.sqlite")
        import app as app_module

        app_module._db_ready = False
        self.client = app_module.app.test_client()

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def test_page_keeps_official_and_original_apart(self) -> None:
        page = self.client.get("/readiness")
        self.assertEqual(page.status_code, 200)
        self.assertIn(b"RADIO LAB PRACTICE", page.data)
        self.assertIn(b"RADIO LAB MOCK EXAM", page.data)
        self.assertIn(b"47 CFR", page.data)
        self.assertIn(b"readiness-engine.js", page.data)
        self.assertIn(b"readiness-store.js", page.data)
        self.assertIn(b"readiness-ui.js", page.data)
        self.assertNotIn(b"YOU ARE", page.data)
        self.assertIn(b"does not show an official answer key", page.data)
        page.close()

        home = self.client.get("/")
        self.assertIn(b"Open Exam Readiness", home.data)
        self.assertIn(b"not Technician exam readiness", home.data)
        home.close()

    def test_history_persists_apart_from_lesson_progress(self) -> None:
        from labs.catalog import get_core_labs, get_labs, get_remediation_labs, get_rf_labs, load_roadmap
        from progress.store import list_readiness_events

        empty = self.client.get("/api/readiness")
        self.assertEqual(empty.get_json()["events"], [])
        empty.close()

        saved = self.client.post(
            "/api/readiness",
            json={
                "kind": "mock",
                "payload": {
                    "seed": "persist-seed",
                    "correct": 27,
                    "total": 35,
                    "passed": True,
                    "byGroup": {"T1A": {"correct": 1, "total": 1}},
                    "bySubelement": {"T1": {"correct": 1, "total": 1}},
                    "misses": [{"conceptId": "t1a-purpose", "groupId": "T1A"}],
                    "questionIds": ["rl-t1a-purpose-01"],
                    "responses": [
                        {
                            "conceptId": "t1a-purpose",
                            "conceptLabel": "Purpose",
                            "groupId": "T1A",
                            "questionId": "rl-t1a-purpose-01",
                            "correct": True,
                        }
                    ],
                },
            },
        )
        self.assertEqual(saved.status_code, 200)
        body = saved.get_json()
        self.assertEqual(body["kind"], "mock")
        self.assertEqual(body["seed"], "persist-seed")
        self.assertTrue(body["recordedAt"])
        saved.close()

        again = self.client.get("/api/readiness")
        events = again.get_json()["events"]
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["correct"], 27)
        self.assertEqual(events[0]["passed"], True)
        self.assertEqual(events[0]["questionIds"], ["rl-t1a-purpose-01"])
        self.assertIn("T1A", events[0]["byGroup"])
        again.close()
        self.assertEqual(len(list_readiness_events()), 1)

        rejected = self.client.post("/api/readiness", json={"kind": "quick", "payload": {}})
        self.assertEqual(rejected.status_code, 400)
        rejected.close()

        labs = get_labs() + get_core_labs() + get_remediation_labs()
        self.assertEqual(len(labs), 25)
        self.assertTrue(all(lab["available"] for lab in labs))
        self.assertEqual([lab["id"] for lab in get_rf_labs()], ["rf-01"])
        roadmap = load_roadmap()
        general = next(track for track in roadmap["tracks"] if track["id"] == "general")
        self.assertTrue(all(phase["status"] == "planned" for phase in general["phases"]))

    def test_audits_and_passing_standard_stay_sourced(self) -> None:
        for path, digest in HISTORICAL.items():
            self.assertEqual(sha256(path), digest, path.name)
        final_coverage = json.loads((EXAM / "technician-2026-2030-coverage-final.json").read_text(encoding="utf-8"))
        final_stems = json.loads((EXAM / "technician-2026-2030-stem-support-final.json").read_text(encoding="utf-8"))
        self.assertEqual(final_coverage["audit"], "third")
        self.assertEqual(final_stems["audit"], "third")
        standard = json.loads((EXAM / "technician-element-2-standard.json").read_text(encoding="utf-8"))
        self.assertEqual(standard["questionCount"], 35)
        self.assertEqual(standard["minimumCorrect"], 26)
        self.assertIn("97.503", standard["citation"])
        self.assertIn("law.cornell.edu", standard["sourceUrl"])
        model = json.loads((EXAM / "model.json").read_text(encoding="utf-8"))
        self.assertFalse(model["activeTechnician"]["questionsImported"])
