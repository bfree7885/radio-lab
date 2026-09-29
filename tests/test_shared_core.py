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
        self.assertIsNotNone(load_lesson("02"))
        self.assertIsNotNone(load_lesson("05"))
        self.assertIsNotNone(load_lesson("08"))
        self.assertIsNone(load_lesson("09"))
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

        rules = self.client.get("/content/regulations/us-fcc-amateur.json")
        self.assertEqual(rules.status_code, 200)
        catalog = rules.get_json()
        self.assertEqual(catalog["jurisdiction"], "US")
        self.assertEqual(catalog["regulator"], "FCC")
        self.assertIn("versionLabel", catalog["source"])
        self.assertIn("reviewedThrough", catalog["source"])
        two_meter = next(band for band in catalog["bands"] if band["id"] == "2m")
        self.assertIn("general", two_meter["segments"][0]["licenseLevels"])
        rules.close()

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
        for script in (
            "tests/browser-core.test.js",
            "tests/lab01.test.js",
            "tests/labs-02-04.test.js",
            "tests/labs-05-08.test.js",
            "tests/core-01-04.test.js",
            "tests/core-05-08.test.js",
        ):
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
        self.assertEqual(phase_by_id("technician-core")["status"], "available")
        self.assertEqual(phase_by_id("technician-core")["content"], "technician-core.json")
        self.assertEqual(phase_by_id("technician-exam")["status"], "planned")
        self.assertEqual(phase_by_id("general-bridge")["status"], "planned")
        self.assertEqual(phase_by_id("general-core")["status"], "planned")
        self.assertEqual(phase_by_id("general-exam")["status"], "planned")
        self.assertIsNone(phase_by_id("general-core")["content"])

        model = load_exam_model()
        self.assertEqual(model["pools"], [])
        self.assertEqual(model["poolShape"]["questions"], [])
        self.assertEqual(model["licenseLevels"], ["technician", "general"])
        active = model["activeTechnician"]
        self.assertEqual(active["pool"], "2026-2030")
        self.assertEqual(active["effectiveFrom"], "2026-07-01")
        self.assertEqual(active["effectiveThrough"], "2030-06-30")
        self.assertEqual(active["questionsImported"], False)

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

        for lab_id, script in (
            ("02", b"lab02.js"),
            ("03", b"lab03.js"),
            ("04", b"lab04.js"),
            ("05", b"lab05.js"),
            ("06", b"lab06.js"),
            ("07", b"lab07.js"),
            ("08", b"lab08.js"),
        ):
            opened = self.client.get(f"/labs/{lab_id}")
            self.assertEqual(opened.status_code, 200)
            self.assertIn(script, opened.data)
            self.assertIn(b"lesson-kit.js", opened.data)
            self.assertNotIn(b"not open yet", opened.data)
            self.assertNotIn(b"lab01.js", opened.data)
            opened.close()

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

    def test_technician_core_is_separate_from_foundations(self) -> None:
        from labs.catalog import CORE_ID, FOUNDATIONS_ID, get_core_labs, get_labs, load_lesson, load_technician_syllabus
        from progress.store import (
            concept_count,
            get_concept_status,
            get_lab_status,
            init_db,
            record_exam,
            set_lab_status,
            set_stage_completed,
            sync_lab_status,
            weak_topics,
        )

        self.assertEqual([lab["id"] for lab in get_labs()], ["01", "02", "03", "04", "05", "06", "07", "08"])
        self.assertEqual(
            [lab["id"] for lab in get_core_labs()],
            ["tc-01", "tc-02", "tc-03", "tc-04", "tc-05", "tc-06", "tc-07", "tc-08"],
        )
        lesson = load_lesson("tc-01")
        self.assertIsNotNone(lesson)
        assert lesson is not None
        self.assertEqual(lesson["alignment"]["pool"], "2026-2030")
        self.assertEqual(lesson["alignment"]["effectiveFrom"], "2026-07-01")
        self.assertEqual(lesson["alignment"]["effectiveThrough"], "2030-06-30")
        syllabus = load_technician_syllabus()
        self.assertFalse(syllabus["questionsIncluded"])
        group_ids = []
        for subelement in syllabus["subelements"]:
            for group in subelement["groups"]:
                group_ids.append(group["id"])
        for topic in lesson["alignment"]["topics"]:
            self.assertIn(topic, group_ids)

        page = self.client.get("/labs/tc-01")
        self.assertEqual(page.status_code, 200)
        self.assertIn(b"core-labs.js", page.data)
        self.assertIn(b"technician-core.json", page.data)
        self.assertIn(b"not Technician exam readiness", page.data)
        self.assertNotIn(b"not open yet", page.data)
        page.close()
        for lab_id in ("tc-02", "tc-03", "tc-04", "tc-05", "tc-06", "tc-07", "tc-08"):
            opened = self.client.get(f"/labs/{lab_id}")
            self.assertEqual(opened.status_code, 200)
            self.assertIn(b"core-labs.js", opened.data)
            opened.close()

        init_db()
        stage_ids = ["learn", "see", "do", "explain", "exam", "field"]
        for stage_id in stage_ids:
            set_stage_completed("tc-01", stage_id, True, CORE_ID)
        sync_lab_status("tc-01", stage_ids, CORE_ID)
        self.assertEqual(get_lab_status("tc-01", CORE_ID), "complete")
        self.assertEqual(get_lab_status("tc-01", FOUNDATIONS_ID), "not_started")
        self.assertEqual(get_lab_status("01", FOUNDATIONS_ID), "not_started")
        self.assertEqual(get_concept_status("license-is-responsibility", CORE_ID), "not_started")
        self.assertEqual(concept_count(CORE_ID), 0)
        record_exam(
            "tc01-purpose",
            False,
            lab_id="tc-01",
            topic_id="T1A",
            curriculum_id=CORE_ID,
            license_level="technician",
            pool_id="radio-lab-practice",
            kind="pool",
        )
        self.assertEqual(weak_topics(curriculum_id=CORE_ID)[0]["topic_id"], "T1A")
        self.assertEqual(weak_topics(curriculum_id=FOUNDATIONS_ID), [])
        set_lab_status("01", "complete", FOUNDATIONS_ID)
        self.assertEqual(get_lab_status("tc-01", CORE_ID), "complete")
        self.assertEqual(get_concept_status("license-is-responsibility", CORE_ID), "not_started")

    def test_current_core_completion_is_not_exam_readiness(self) -> None:
        from labs.catalog import get_labs, load_roadmap, syllabus_coverage
        from progress.store import init_db, set_stage_completed, sync_lab_status

        coverage = syllabus_coverage()
        self.assertGreater(coverage["counts"]["notCovered"], 0)
        self.assertGreater(coverage["counts"]["partial"], 0)
        self.assertLess(coverage["counts"]["recorded"], coverage["counts"]["groups"])
        self.assertIn("T5B", [row["id"] for row in coverage["notCovered"]])
        self.assertIn("not a coverage audit", coverage["note"])
        self.assertEqual(len(get_labs()), 8)

        roadmap = load_roadmap()
        general = next(track for track in roadmap["tracks"] if track["id"] == "general")
        self.assertTrue(all(phase["status"] == "planned" for phase in general["phases"]))
        technician = next(track for track in roadmap["tracks"] if track["id"] == "technician")
        exam_phase = next(phase for phase in technician["phases"] if phase["id"] == "technician-exam")
        self.assertEqual(exam_phase["status"], "planned")

        progress = self.client.get("/progress")
        self.assertIn(b"T5B", progress.data)
        self.assertIn(b"not a coverage audit", progress.data)
        self.assertNotIn(b"TECHNICIAN READY", progress.data)
        progress.close()

        init_db()
        stage_ids = ["learn", "see", "do", "explain", "exam", "field"]
        for lab_id in ("tc-01", "tc-02", "tc-03", "tc-04", "tc-05", "tc-06", "tc-07", "tc-08"):
            for stage_id in stage_ids:
                set_stage_completed(lab_id, stage_id, True, "technician-core")
            sync_lab_status(lab_id, stage_ids, "technician-core")
        home = self.client.get("/")
        self.assertIn("TECHNICIAN CORE — CURRENT LABS COMPLETE".encode(), home.data)
        self.assertIn(b"NEXT: TECHNICIAN COVERAGE AUDIT", home.data)
        self.assertIn(b"not Technician exam readiness", home.data)
        self.assertNotIn(b"TECHNICIAN READY", home.data)
        home.close()


if __name__ == "__main__":
    unittest.main()
