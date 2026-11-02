"""Regression tests for the optional, non-destructive local asset installer."""
import io
import json
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from install_public_scene_assets_local import install, referenced_paths


class LocalPublicSceneInstallTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / "public" / "uploads"
        self.scene = [{
            "id": "1",
            "assets_data": json.dumps({"assets_data_repeatable": [
                {"image": "uploads/public-scene/ufo/assets/fondo.webp", "is_background": 1},
                {"image": "uploads/public-scene/ufo/assets/objeto.png", "is_background": 0},
                {"image": "uploads/../../sensitive/password.txt"},
                {"image": "https://example.test/asset.png"},
                {"image": ""},
            ]})
        }]
        memory = io.BytesIO()
        with zipfile.ZipFile(memory, "w") as z:
            z.writestr("public-scene/ufo/assets/fondo.webp", b"image-bytes")
            z.writestr("public-scene/ufo/assets/objeto.png", b"sprite-bytes")
            z.writestr("../malicious.txt", b"never-copy")
        memory.seek(0)
        self.archive = zipfile.ZipFile(memory)
        self.addCleanup(self.archive.close)

    def test_lists_only_scene_assets_and_rejects_paths_outside_scene_directory(self):
        self.assertEqual(len(referenced_paths(self.scene)), 2)

    def test_dry_run_does_not_create_files_or_directories(self):
        result = install(self.scene, self.archive, self.root, do_install=False)
        self.assertEqual(result["available"], 2)
        self.assertEqual(result["written"], 0)
        self.assertFalse(self.root.exists())

    def test_install_retains_paths_and_does_not_overwrite_on_second_run(self):
        first = install(self.scene, self.archive, self.root, do_install=True)
        self.assertEqual(first["written"], 2)
        filename = self.root / "public-scene/ufo/assets/fondo.webp"
        self.assertEqual(filename.read_bytes(), b"image-bytes")
        filename.write_bytes(b"local-custom-art")
        again = install(self.scene, self.archive, self.root, do_install=True)
        self.assertEqual(again["written"], 0)
        self.assertEqual(again["existing"], 2)
        self.assertEqual(filename.read_bytes(), b"local-custom-art")
        self.assertFalse((Path(self.tmp.name) / "malicious.txt").exists())


if __name__ == "__main__":
    unittest.main()
