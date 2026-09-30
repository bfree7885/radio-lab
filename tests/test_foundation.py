"""Route and storage checks for the V0.1 foundation."""

from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path


class FoundationTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        os.environ["RADIO_LAB_DB"] = str(Path(self._tmp.name) / "progress.sqlite")
        import app as app_module

        app_module._db_ready = False
        self.client = app_module.app.test_client()
        self.app_module = app_module

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def test_loopback_bind_constants(self) -> None:
        self.assertEqual(self.app_module.HOST, "127.0.0.1")
        self.assertEqual(self.app_module.PORT, 5070)

    def test_pages_render(self) -> None:
        for path in ("/", "/labs", "/labs/01", "/progress", "/about"):
            response = self.client.get(path)
            self.assertEqual(response.status_code, 200, path)
            self.assertIn(b"Simulation", response.data)

        missing = self.client.get("/labs/99")
        self.assertEqual(missing.status_code, 404)

    def test_lab_one_is_open_and_later_labs_are_closed(self) -> None:
        home = self.client.get("/")
        self.assertIn(b"WAYPOINT RADIO LAB", home.data)
        self.assertIn(b"TECHNICIAN FOUNDATIONS // V0.1", home.data)
        self.assertIn(b"Continue Learning", home.data)
        self.assertIn(b"NOT STARTED", home.data)
        self.assertIn(b"Electricity Without the Textbook", home.data)
        foundations = home.data.split(b"Technician Core")[0]
        self.assertNotIn(b"COMING SOON", foundations)
        self.assertIn(b"COMING SOON", home.data)

        lab = self.client.get("/labs/01")
        for label in (
            b"LEARN",
            b"SEE IT",
            b"DO IT",
            b"EXPLAIN IT",
            b"EXAM CONNECTION",
            b"FIELD TASK",
        ):
            self.assertIn(label, lab.data)

        opened = self.client.get("/labs/05")
        self.assertEqual(opened.status_code, 200)
        self.assertIn(b"lab05.js", opened.data)
        self.assertNotIn(b"not open yet", opened.data)
        self.assertNotIn(b"Hands-on controls will be added here.", opened.data)

    def test_foundations_completion_is_not_exam_readiness(self) -> None:
        from progress.store import init_db, set_lab_status

        init_db()
        for lab_id in ("01", "02", "03", "04", "05", "06", "07", "08"):
            set_lab_status(lab_id, "complete")
        home = self.client.get("/")
        self.assertIn(b"TECHNICIAN FOUNDATIONS COMPLETE", home.data)
        self.assertIn(b"NEXT: TECHNICIAN CORE", home.data)
        self.assertIn(b"not Technician exam readiness", home.data)
        self.assertNotIn(b"LICENSE READY", home.data)
        self.assertNotIn(b"TECHNICIAN READY", home.data)
        progress = self.client.get("/progress")
        self.assertIn(b"TECHNICIAN FOUNDATIONS COMPLETE", progress.data)
        self.assertIn(b"NEXT: TECHNICIAN CORE", progress.data)

    def test_progress_starts_empty_and_honest(self) -> None:
        page = self.client.get("/progress")
        self.assertIn(b"None recorded yet", page.data)
        self.assertIn(b"Not enough evidence yet", page.data)

    def test_hardware_gate_stays_simulation(self) -> None:
        from hardware.capabilities import capability_available, lab_mode, live_lab_available

        self.assertFalse(live_lab_available())
        self.assertFalse(capability_available("rtl_sdr"))
        self.assertFalse(capability_available("not-a-device"))
        self.assertEqual(lab_mode(), "simulation")

    def test_lab_status_round_trip(self) -> None:
        from progress.store import COMPLETE, get_lab_status, init_db, set_lab_status

        init_db()
        self.assertEqual(get_lab_status("01"), "not_started")
        set_lab_status("01", COMPLETE)
        self.assertEqual(get_lab_status("01"), COMPLETE)


if __name__ == "__main__":
    unittest.main()
