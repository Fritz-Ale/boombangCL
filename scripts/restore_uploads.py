#!/usr/bin/env python3
"""Restore missing Laravel upload assets from api/public/uploads.zip.

Dry-run by default. Never overwrites existing files.
Usage: python3 scripts/restore_uploads.py [--apply]
"""
import argparse
from pathlib import Path, PurePosixPath
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "api/public/uploads.zip"
DEST = ROOT / "api/public/uploads"

def destination_for(name):
    parts = list(PurePosixPath(name.replace("\\", "/")).parts)
    if not parts or name.startswith("/") or ".." in parts:
        return None
    # Accept archives built from either the uploads directory or its parent.
    for prefix in (("api", "public", "uploads"), ("public", "uploads"), ("uploads",)):
        if tuple(parts[:len(prefix)]) == prefix:
            parts = parts[len(prefix):]
            break
    if not parts:
        return None
    # Reject absolute/drive paths and non-content entries.
    if any(part in ("", ".", "..") or ":" in part for part in parts):
        return None
    return DEST.joinpath(*parts)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Extract missing files")
    args = parser.parse_args()
    if not ARCHIVE.is_file():
        raise SystemExit(f"Archive not found: {ARCHIVE}")
    scanned = missing = restored = unsafe = 0
    with ZipFile(ARCHIVE) as archive:
        for info in archive.infolist():
            if info.is_dir():
                continue
            scanned += 1
            dest = destination_for(info.filename)
            if dest is None:
                unsafe += 1
                continue
            if dest.exists():
                continue
            missing += 1
            if args.apply:
                dest.parent.mkdir(parents=True, exist_ok=True)
                # 'xb' ensures existing images are never replaced.
                with archive.open(info) as src, dest.open("xb") as output:
                    import shutil
                    shutil.copyfileobj(src, output)
                restored += 1
    print(f"Archive entries: {scanned}; missing: {missing}; unsafe/skipped: {unsafe}; restored: {restored}")
    if not args.apply:
        print("Dry run only. Re-run with --apply to copy missing assets without overwriting.")
    print("Check example files with: find api/public/uploads -type f | head")
    print("Note: Docker mounts api_uploads separately; restore into the active volume if needed.")

if __name__ == "__main__":
    main()
