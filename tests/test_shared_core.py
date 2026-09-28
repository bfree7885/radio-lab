"""Shared curriculum, adapters, and local routes."""

from __future__ import annotations

import html
import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class SharedCoreTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        os.environ["RADIO_LAB_DB"] = str(Path(self._tmp.name) / "progress.sqlite")
        import app as app_module

        app_module._db_ready = False
        self.client = app_module.app.test_client()

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def test_curriculum_file_is_authoritative(self) -> None:
        data = json.loads((ROOT / "content" / "curriculum.json").read_text(encoding="utf-8"))
        from labs.catalog import get_lab, get_labs, get_stages

        self.assertEqual(data["id"], "technician-foundations")
        self.assertEqual(data["title"], "Technician Foundations")
        self.assertEqual(data["version"], "V0.1")
        self.assertEqual(len(data["labs"]), 8)
        self.assertEqual(len(data["stages"]), 6)
        self.assertEqual(
            [stage["id"] for stage in data["stages"]],
            ["learn", "see", "do", "explain", "exam", "field"],
        )
        self.assertEqual([lab["id"] for lab in get_labs()], [lab["id"] for lab in data["labs"]])
        self.assertEqual(get_lab("01")["title"], data["labs"][0]["title"])
        self.assertEqual(get_lab("01")["description"], data["labs"][0]["description"])
        self.assertEqual([stage["id"] for stage in get_stages()], [stage["id"] for stage in data["stages"]])
        for lab in data["labs"]:
            self.assertTrue(lab["topics"])

    def test_lab_one_lesson_teaches_tuning(self) -> None:
        from labs.catalog import display_text, load_lesson

        lesson = load_lesson("01")
        self.assertIsNotNone(lesson)
        assert lesson is not None
        self.assertEqual(lesson["curriculumId"], "technician-foundations")
        self.assertEqual(lesson["hardware"], [])
        self.assertEqual(
            [stage["id"] for stage in lesson["stages"]],
            ["learn", "see", "do", "explain", "exam", "field"],
        )
        self.assertEqual(lesson["stages"][1]["blocks"][0]["type"], "simulation")
        self.assertEqual(lesson["stages"][1]["blocks"][0]["component"], "spectrum-receiver")
        self.assertIn("simulation", display_text("see", lesson).lower())
        self.assertIn("tuning control", display_text("explain", lesson).lower())
        self.assertEqual(
            display_text("learn", {"stages": [{"id": "learn", "blocks": [{"body": "A wave repeats."}]}]}),
            "A wave repeats.",
        )
        self.assertIsNone(load_lesson("02"))
        exam = lesson["stages"][4]["blocks"][0]
        self.assertEqual(exam["label"], "RADIO LAB PRACTICE")
        self.assertEqual(len(exam["questions"]), 5)
        self.assertEqual(exam["questionIds"], [question["id"] for question in exam["questions"]])
        self.assertEqual(exam["licenseLevel"], "technician")
        self.assertIsNone(exam["poolId"])
        self.assertEqual(exam["practicePoolId"], "radio-lab-practice")
        for question in exam["questions"]:
            self.assertNotIn("FCC", question["stem"])
            self.assertGreaterEqual(len(question["choices"]), 2)
        ids = [signal["id"] for signal in lesson["signals"]]
        self.assertEqual(ids, ["fm-broadcast", "two-meter", "weather", "seventy-cm"])

    def test_flask_serves_the_shared_files(self) -> None:
        curriculum = self.client.get("/content/curriculum.json")
        self.assertEqual(curriculum.status_code, 200)
        payload = curriculum.get_json()
        self.assertEqual(payload["id"], "technician-foundations")
        self.assertEqual(len(payload["labs"]), 8)

        lesson = self.client.get("/content/labs/01/lesson.json")
        self.assertEqual(lesson.status_code, 200)
        self.assertEqual(lesson.get_json()["labId"], "01")

        script = self.client.get("/web/radiollab.js")
        self.assertEqual(script.status_code, 200)
        self.assertIn(b"RadioLab", script.data)
        script.close()
        for path in (
            "/web/progress-browser.js",
            "/web/capabilities-public.js",
        ):
            extra = self.client.get(path)
            self.assertEqual(extra.status_code, 200, path)
            extra.close()
        missing = self.client.get("/content/notes.txt")
        self.assertEqual(missing.status_code, 404)
        missing.close()
        curriculum.close()
        lesson.close()

        home = self.client.get("/")
        self.assertIn(b'data-delivery="local"', home.data)
        self.assertNotIn(b"boot-hosted.js", home.data)
        self.assertNotIn(b"localStorage", home.data)
        home.close()

    def test_local_page_embeds_capability_snapshot(self) -> None:
        from hardware.capabilities import capability_snapshot, live_lab_available

        page = self.client.get("/labs/01")
        start = page.data.index(b'id="radio-lab-capabilities">') + len(b'id="radio-lab-capabilities">')
        end = page.data.index(b"</script>", start)
        embedded = json.loads(page.data[start:end])
        self.assertEqual(embedded, capability_snapshot())
        self.assertTrue(embedded["simulation.frequency"])
        self.assertTrue(embedded["simulation.swr"])
        self.assertFalse(embedded["hardware.rtl_sdr"])
        self.assertFalse(embedded["hardware.gnss"])
        self.assertFalse(live_lab_available())
        page.close()

    def test_browser_adapters(self) -> None:
        for script in ("tests/browser-core.test.js", "tests/lab01.test.js"):
            result = subprocess.run(
                ["node", script],
                cwd=ROOT,
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(result.returncode, 0, script + "\n" + result.stdout + result.stderr)
        boot = (ROOT / "web" / "boot-hosted.js").read_text(encoding="utf-8")
        local_boot = (ROOT / "static" / "js" / "lab.js").read_text(encoding="utf-8")
        self.assertIn("RadioLabBrowserProgress.create", boot)
        self.assertIn('data-delivery") !== "hosted"', boot)
        self.assertNotIn("useProgress", local_boot)
        self.assertNotIn("localStorage", local_boot)

    def test_sqlite_adapter_records_stages_exams_and_field_tasks(self) -> None:
        from progress.store import (
            get_field_task,
            init_db,
            record_exam,
            set_field_task,
            set_stage_completed,
            stage_completed,
            weak_topics,
        )

        init_db()
        self.assertFalse(stage_completed("01", "learn"))
        set_stage_completed("01", "learn", True)
        self.assertTrue(stage_completed("01", "learn"))
        record_exam("Q1", False, lab_id="01", topic_id="frequency")
        record_exam("Q2", False, lab_id="01", topic_id="frequency")
        topics = weak_topics()
        self.assertEqual(topics[0]["topic_id"], "frequency")
        self.assertEqual(topics[0]["misses"], 2)
        set_field_task("field-01", "complete", "01")
        saved = get_field_task("field-01")
        self.assertIsNotNone(saved)
        assert saved is not None
        self.assertEqual(saved["status"], "complete")

    def test_roadmap_covers_technician_and_general(self) -> None:
        from labs.catalog import load_exam_model, load_roadmap, phase_by_id

        roadmap = load_roadmap()
        self.assertEqual(roadmap["licenseLevels"], ["technician", "general"])
        self.assertEqual(
            roadmap["teachingModel"],
            ["learn", "see", "do", "explain", "exam", "field"],
        )
        ids = [track["id"] for track in roadmap["tracks"]]
        self.assertEqual(ids, ["technician", "general", "field-radio", "sota"])
        foundations = phase_by_id("technician-foundations")
        self.assertIsNotNone(foundations)
        assert foundations is not None
        self.assertEqual(foundations["status"], "available")
        self.assertEqual(foundations["content"], "curriculum.json")
        self.assertEqual(phase_by_id("technician-core")["status"], "planned")
        self.assertEqual(phase_by_id("technician-exam")["status"], "planned")
        self.assertEqual(phase_by_id("general-bridge")["status"], "planned")
        self.assertEqual(phase_by_id("general-core")["status"], "planned")
        self.assertEqual(phase_by_id("general-exam")["status"], "planned")
        self.assertIsNone(phase_by_id("general-core")["content"])

        model = load_exam_model()
        self.assertEqual(model["pools"], [])
        self.assertEqual(model["poolShape"]["questions"], [])
        self.assertEqual(model["licenseLevels"], ["technician", "general"])

        page = self.client.get("/")
        self.assertEqual(page.status_code, 200)
        self.assertIn(b"TECHNICIAN", page.data)
        self.assertIn(b"GENERAL", page.data)
        self.assertIn(b"AVAILABLE", page.data)
        self.assertIn(b"PLANNED", page.data)
        self.assertIn(b"FIELD RADIO", page.data)
        self.assertIn(b"SOTA", page.data)
        foundations_file = json.loads(
            (ROOT / "content" / "curriculum.json").read_text(encoding="utf-8")
        )
        self.assertEqual(len(foundations_file["labs"]), 8)
        for lab in foundations_file["labs"]:
            self.assertIn(html.escape(lab["title"]).encode(), page.data)
        page.close()

        served = self.client.get("/content/roadmap.json")
        self.assertEqual(served.status_code, 200)
        self.assertEqual(served.get_json()["tracks"][1]["id"], "general")
        served.close()

    def test_progress_keeps_foundations_when_general_is_added(self) -> None:
        import sqlite3

        from progress.store import (
            FOUNDATIONS_ID,
            get_lab_status,
            init_db,
            set_concept_status,
            set_lab_status,
        )

        path = os.environ["RADIO_LAB_DB"]
        legacy = sqlite3.connect(path)
        legacy.executescript(
            """
            CREATE TABLE schema_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
            CREATE TABLE lab_progress (
                lab_id TEXT PRIMARY KEY,
                status TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            INSERT INTO schema_meta VALUES ('schema_version', '1');
            INSERT INTO lab_progress VALUES ('01', 'complete', '2026-01-01T00:00:00+00:00');
            """
        )
        legacy.commit()
        legacy.close()

        init_db()
        self.assertEqual(get_lab_status("01"), "complete")
        self.assertEqual(get_lab_status("01", "general-core"), "not_started")
        set_lab_status("01", "in_progress", "general-core")
        self.assertEqual(get_lab_status("01", FOUNDATIONS_ID), "complete")
        self.assertEqual(get_lab_status("01", "general-core"), "in_progress")
        set_concept_status("frequency", "complete", FOUNDATIONS_ID, "technician")
        set_concept_status("frequency", "in_progress", "general-core", "general")
        from progress.store import get_concept_status

        self.assertEqual(get_concept_status("frequency", FOUNDATIONS_ID), "complete")
        self.assertEqual(get_concept_status("frequency", "general-core"), "in_progress")

        check = sqlite3.connect(path)
        version = check.execute(
            "SELECT value FROM schema_meta WHERE key = 'schema_version'"
        ).fetchone()[0]
        kept = check.execute(
            "SELECT status FROM lab_progress WHERE curriculum_id = ? AND lab_id = '01'",
            (FOUNDATIONS_ID,),
        ).fetchone()[0]
        check.close()
        self.assertEqual(version, "2")
        self.assertEqual(kept, "complete")

    def test_lab01_progress_api_and_pages(self) -> None:
        from progress.store import get_lab_status, init_db, stage_completed, weak_topics

        init_db()
        page = self.client.get("/labs/01")
        self.assertEqual(page.status_code, 200)
        self.assertIn(b"lab01.js", page.data)
        self.assertIn(b"radio-sim.js", page.data)
        self.assertIn(b"progress-local.js", page.data)
        for label in (b"LEARN", b"SEE IT", b"DO IT", b"EXPLAIN IT", b"EXAM CONNECTION", b"FIELD TASK"):
            self.assertIn(label, page.data)
        self.assertIn(b"RADIO LAB PRACTICE", page.data)
        self.assertNotIn(b"localStorage", page.data)
        page.close()

        closed = self.client.get("/labs/02")
        self.assertIn(b"not open yet", closed.data)
        self.assertNotIn(b"lab01.js", closed.data)
        closed.close()

        started = self.client.post(
            "/api/progress/01",
            json={"op": "stage", "stageId": "learn", "completed": True},
        )
        self.assertEqual(started.status_code, 200)
        self.assertEqual(started.get_json()["status"], "in_progress")
        self.assertTrue(started.get_json()["stages"]["learn"])
        self.assertFalse(started.get_json()["stages"]["see"])

        for stage_id in ("see", "do", "explain", "exam", "field"):
            done = self.client.post(
                "/api/progress/01",
                json={"op": "stage", "stageId": stage_id, "completed": True},
            )
            self.assertEqual(done.status_code, 200, stage_id)
            done.close()
        finished = self.client.get("/api/progress/01")
        self.assertEqual(finished.get_json()["status"], "complete")
        finished.close()
        self.assertEqual(get_lab_status("01"), "complete")
        self.assertTrue(stage_completed("01", "field"))

        miss = self.client.post(
            "/api/progress/01",
            json={
                "op": "exam",
                "questionId": "lab01-frequency",
                "topicId": "frequency",
                "correct": False,
                "kind": "pool",
                "poolId": "radio-lab-practice",
                "licenseLevel": "technician",
            },
        )
        self.assertEqual(miss.status_code, 200)
        miss.close()
        hit = self.client.post(
            "/api/progress/01",
            json={
                "op": "exam",
                "questionId": "lab01-frequency",
                "topicId": "frequency",
                "correct": True,
                "kind": "pool",
                "poolId": "radio-lab-practice",
            },
        )
        self.assertEqual(hit.status_code, 200)
        hit.close()
        self.assertEqual(weak_topics(), [])

        concept = self.client.post(
            "/api/progress/01",
            json={
                "op": "concept",
                "conceptId": "tuning-selects-frequency",
                "status": "complete",
                "licenseLevel": "technician",
            },
        )
        self.assertEqual(concept.get_json()["concepts"]["tuning-selects-frequency"], "complete")
        concept.close()

        rejected = self.client.post("/api/progress/01", json={"op": "nope"})
        self.assertEqual(rejected.status_code, 400)
        rejected.close()
        missing = self.client.get("/api/progress/99")
        self.assertEqual(missing.status_code, 404)
        missing.close()

        home = self.client.get("/")
        self.assertIn(b"COMPLETE", home.data)
        self.assertIn(b"GENERAL", home.data)
        self.assertIn(b"What Is Radio?", home.data)
        self.assertIn(b"First Field Operation", home.data)
        home.close()


if __name__ == "__main__":
    unittest.main()
