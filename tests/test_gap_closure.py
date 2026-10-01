"""Progress stays incomplete when a new gap-closure stage is added."""

from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class GapClosureProgressTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        os.environ["RADIO_LAB_DB"] = str(Path(self._tmp.name) / "progress.sqlite")
        import app as app_module

        app_module._db_ready = False
        self.client = app_module.app.test_client()

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def test_a_finished_lab_is_not_complete_until_the_new_check_is_done(self) -> None:
        from labs.catalog import stages_for_lab
        from progress.store import get_lab_status, init_db, set_stage_completed, stage_completed, sync_lab_status

        init_db()
        curriculum = "technician-remediation"
        previous = ["learn", "see", "do", "explain", "exam", "field"]
        for stage_id in previous:
            set_stage_completed("tr-09", stage_id, True, curriculum)
        sync_lab_status("tr-09", previous, curriculum)
        self.assertEqual(get_lab_status("tr-09", curriculum), "complete")

        current = [stage["id"] for stage in stages_for_lab("tr-09")]
        self.assertIn("close", current)
        saved = self.client.get("/api/progress/tr-09?curriculumId=technician-remediation").get_json()
        self.assertEqual(saved["status"], "in_progress")
        self.assertTrue(saved["stages"]["field"])
        self.assertFalse(saved["stages"]["close"])
        self.assertTrue(stage_completed("tr-09", "learn", curriculum))

        set_stage_completed("tr-09", "close", True, curriculum)
        sync_lab_status("tr-09", current, curriculum)
        self.assertEqual(get_lab_status("tr-09", curriculum), "complete")

        page = self.client.get("/labs/tr-09")
        self.assertEqual(page.status_code, 200)
        self.assertIn(b"gap-closure.js", page.data)
        self.assertIn(b"ONE MORE CHECK", page.data)
        page.close()
