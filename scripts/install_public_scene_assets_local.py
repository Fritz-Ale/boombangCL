#!/usr/bin/env python3
"""Prepare licensed public-scene images from the historical ZIP for LOCAL use.

Default is read-only. Requires --install --acknowledge-rights to write files.
Never deploys to hosting, touches the database, or overwrites existing assets.
"""
import argparse
import json
import os
import re
import sys
import zipfile
from pathlib import Path, PurePosixPath

from audit_public_scene_assets import parse_scenes

ALLOWED_SUFFIXES = {".png", ".webp", ".jpg", ".jpeg", ".gif", ".webm", ".mp4", ".ogg"}
MAX_BYTES = 80 * 1024 * 1024


def referenced_paths(scenes):
    paths = set()
    for scene in scenes:
        try:
            decoded = json.loads(scene.get("assets_data") or "{}")
        except (ValueError, TypeError):
            continue
        entries = decoded.get("assets_data_repeatable", []) if isinstance(decoded, dict) else []
        if not isinstance(entries, list):
            continue
        for entry in entries:
            if not isinstance(entry, dict):
                continue
            source = entry.get("image")
            if not isinstance(source, str):
                continue
            source = source.strip().replace("\\", "/").lstrip("/")
            parts = PurePosixPath(source).parts
            if (len(parts) < 4 or parts[:2] != ("uploads", "public-scene") or
                    any(part in {".", ".."} for part in parts) or
                    PurePosixPath(source).suffix.lower() not in ALLOWED_SUFFIXES):
                continue
            paths.add(source)
    return sorted(paths)


def archive_map(archive):
    # Use the central directory only. Do not trust ZIP paths as destinations.
    return {f.filename.lower().lstrip("./"): f for f in archive.infolist()
            if not f.is_dir()}


def find_member(members, source):
    for candidate in (source, source.removeprefix("uploads/"), "public/" + source):
        item = members.get(candidate.lower())
        if item:
            return item
    return None


def install(scenes, archive, target_uploads, do_install=False):
    members = archive_map(archive)
    root = target_uploads.resolve()
    results = {"referenced": 0, "available": 0, "missing": [], "existing": 0, "written": 0}
    for source in referenced_paths(scenes):
        results["referenced"] += 1
        member = find_member(members, source)
        if not member:
            results["missing"].append(source)
            continue
        results["available"] += 1
        relative = PurePosixPath(source).relative_to("uploads")
        target = root.joinpath(*relative.parts)
        if not target.resolve().is_relative_to(root):
            raise ValueError("El recurso escapa del directorio de uploads")
        if target.exists():
            results["existing"] += 1
            continue
        if not do_install:
            continue
        if member.file_size > MAX_BYTES:
            raise ValueError("Recurso demasiado grande para extracción local")
        data = archive.read(member)
        if len(data) != member.file_size:
            raise ValueError("Recurso ZIP incompleto")
        target.parent.mkdir(parents=True, exist_ok=True)
        with target.open("xb") as output:
            output.write(data)
        results["written"] += 1
    return results


def production_configured(root):
    if os.getenv("APP_ENV", "").strip().lower() == "production" or os.getenv("API_APP_ENV", "").strip().lower() == "production":
        return True
    for env_file in (root / ".env", root / "api/.env"):
        if not env_file.is_file():
            continue
        for line in env_file.read_text(encoding="utf8").splitlines():
            if re.match(r"""^\s*(APP_ENV|API_APP_ENV)\s*=\s*["']?production(?:["']|\s|$)""", line, flags=re.I):
                return True
    return False


def main():
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser()
    parser.add_argument("--install", action="store_true")
    parser.add_argument("--acknowledge-rights", action="store_true",
                        help="Confirma que tienes permiso para usar estos recursos en desarrollo local")
    parser.add_argument("--sql", type=Path, default=root / "boombang_api.sql")
    parser.add_argument("--zip", type=Path, default=root / "api/public/uploads.zip")
    parser.add_argument("--destination", type=Path, default=root / "api/public/uploads")
    args = parser.parse_args()
    if args.install and not args.acknowledge_rights:
        parser.error("Debes confirmar la autorización con --acknowledge-rights")
    if args.install and production_configured(root):
        parser.error("Bloqueado: no extraer recursos históricos en entornos de producción")

    scenes = parse_scenes(args.sql.read_text(encoding="utf-8-sig"))
    with zipfile.ZipFile(args.zip) as archive:
        report = install(scenes, archive, args.destination, do_install=args.install)
    print(json.dumps(report, indent=2, ensure_ascii=False))
    if not args.install:
        print("Solo auditoría: ningún archivo se ha extraído.")
    else:
        print("Instalación local terminada. No se han habilitado ventas ni publicado recursos.")


if __name__ == "__main__":
    sys.exit(main())
