import importlib.util
import os
import stat
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / "install_catalog_assets_local.py"
spec = importlib.util.spec_from_file_location("local_assets", SCRIPT)
assets = importlib.util.module_from_spec(spec)
spec.loader.exec_module(assets)


class LocalAssetInstallerTests(unittest.TestCase):
    def test_normalizes_expected_catalog_paths(self):
        self.assertEqual(assets.normalized_member("uploads/catalog/preview.png"), Path("catalog/preview.png"))
        self.assertEqual(assets.normalized_member("./uploads/catalog/preview.webp"), Path("catalog/preview.webp"))
        self.assertEqual(assets.normalized_member("public/uploads/catalog/atlas.json"), Path("catalog/atlas.json"))
        self.assertIsNone(assets.normalized_member("uploads/admin/backdoor.php"))
        for name in ("/etc/passwd.png", "../secrets.png", "uploads/../.env.png", "uploads//photo.png"):
            with self.assertRaises(ValueError):
                assets.normalized_member(name)

    def test_dry_run_and_manual_install_never_overwrite_existing_file(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            archive_path = root / "assets.zip"
            target = root / "public" / "uploads"
            with zipfile.ZipFile(archive_path, "w") as archive:
                archive.writestr("uploads/catalog/icon.png", b"thumbnail")
                archive.writestr("catalog/texture.webp", b"sprite")
                archive.writestr("uploads/catalog/unsafe.php", b"<?php bad(); ?>")
            count, copied = assets.install(archive_path, target, False)
            self.assertEqual((count, copied), (2, 0))
            self.assertFalse(target.exists())
            with patch.dict(os.environ, {"APP_ENV": "local"}):
                count, copied = assets.install(archive_path, target, True)
                self.assertEqual((count, copied), (2, 2))
                self.assertEqual((target / "catalog/icon.png").read_bytes(), b"thumbnail")
                (target / "catalog/icon.png").write_bytes(b"custom")
                _, copied_again = assets.install(archive_path, target, True)
                self.assertEqual(copied_again, 0)
                self.assertEqual((target / "catalog/icon.png").read_bytes(), b"custom")
            self.assertFalse((target / "catalog/unsafe.php").exists())

    def test_rejects_duplicate_paths_and_links(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "duplicate.zip"
            with zipfile.ZipFile(path, "w") as archive:
                archive.writestr("uploads/catalog/item.PNG", b"1")
                archive.writestr("catalog/item.png", b"2")
            with self.assertRaisesRegex(ValueError, "duplicada"):
                assets.install(path, Path(temp) / "out", False)

            link_path = Path(temp) / "link.zip"
            with zipfile.ZipFile(link_path, "w") as archive:
                entry = zipfile.ZipInfo("uploads/catalog/linked.png")
                entry.create_system = 3
                entry.external_attr = (stat.S_IFLNK | 0o777) << 16
                archive.writestr(entry, "elsewhere")
            with self.assertRaisesRegex(ValueError, "simbólico"):
                assets.install(link_path, Path(temp) / "out", False)

    def test_blocks_production_install(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "assets.zip"
            with zipfile.ZipFile(path, "w") as archive:
                archive.writestr("uploads/test.png", b"x")
            with patch.dict(os.environ, {"APP_ENV": "production"}):
                with self.assertRaisesRegex(ValueError, "producción"):
                    assets.install(path, Path(temp) / "uploads", True)
                count, copied = assets.install(path, Path(temp) / "uploads", False)
                self.assertEqual((count, copied), (1, 0))


if __name__ == "__main__":
    unittest.main()
