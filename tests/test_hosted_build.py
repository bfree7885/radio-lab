"""Static learner site. Flask local mode stays separate."""

from __future__ import annotations

import json
import os
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class HostedBuildTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        os.environ["RADIO_LAB_DB"] = str(Path(self._tmp.name) / "progress.sqlite")
        os.environ.pop("RADIO_LAB_DELIVERY", None)
        import app as app_module

        app_module._db_ready = False
        self.client = app_module.app.test_client()

    def tearDown(self) -> None:
        os.environ.pop("RADIO_LAB_DELIVERY", None)
        self._tmp.cleanup()

    def test_local_pages_stay_local(self) -> None:
        page = self.client.get("/")
        self.assertEqual(page.status_code, 200)
        self.assertIn(b'data-delivery="local"', page.data)
        self.assertIn(b"local mode", page.data)
        self.assertNotIn(b"boot-hosted.js", page.data)
        self.assertNotIn(b"learner-data.js", page.data)
        self.assertIn(b"capabilities-local.js", page.data)
        page.close()
        lab = self.client.get("/labs/01")
        self.assertIn(b"progress-local.js", lab.data)
        self.assertNotIn(b"boot-hosted.js", lab.data)
        lab.close()

    def test_static_site_is_hosted_and_publishable(self) -> None:
        from labs.build_hosted import audit_publication, build

        out = Path(self._tmp.name) / "learner"
        build(out)
        audit_publication(out)
        index = (out / "index.html").read_text(encoding="utf-8")
        self.assertIn('data-delivery="hosted"', index)
        self.assertIn("this browser", index)
        self.assertIn("boot-hosted.js", index)
        self.assertNotIn("progress-local.js", index)
        self.assertNotIn("capabilities-local.js", index)
        lab01 = (out / "labs" / "01" / "index.html").read_text(encoding="utf-8")
        self.assertIn("lab01.js", lab01)
        self.assertIn('data-delivery="hosted"', lab01)
        rebuilt = json.loads((out / "content" / "labs" / "01" / "lesson.json").read_text(encoding="utf-8"))
        self.assertEqual(rebuilt["revision"], 2)
        self.assertIn("signal-bench", json.dumps(rebuilt))
        lab = (out / "labs" / "tr-08" / "index.html").read_text(encoding="utf-8")
        self.assertIn("lesson-kit.js", lab)
        self.assertNotIn("progress-local.js", lab)
        self.assertIn('data-delivery="hosted"', lab)
        readiness = (out / "readiness" / "index.html").read_text(encoding="utf-8")
        self.assertIn("readiness-engine.js", readiness)
        self.assertIn("readiness-ui.js", readiness)
        progress = (out / "progress" / "index.html").read_text(encoding="utf-8")
        self.assertIn("learner-export", progress)
        self.assertIn("Replace progress in this browser", progress)
        names = [path.name for path in out.rglob("*") if path.is_file()]
        self.assertNotIn("app.py", names)
        self.assertFalse(any(name.endswith(".pdf") for name in names))
        self.assertFalse(any(name.endswith(".sqlite") for name in names))
        self.assertTrue((out / "content" / "exam" / "technician-readiness-v1.json").is_file())
        self.assertTrue(
            (
                out
                / "content"
                / "exam"
                / "sources"
                / "technician-2026-2030"
                / "diagrams"
                / "technician-diagram-t2.jpg"
            ).is_file()
        )

        home = self.client.get("/")
        self.assertIn(b'data-delivery="local"', home.data)
        home.close()
