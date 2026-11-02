#!/usr/bin/env python3
"""Install assets already supplied in api/public/uploads.zip into a LOCAL development copy.

This command does not download third-party assets, grant redistribution rights,
modify SQL, or enable items for purchase. Nothing is extracted unless --install
is explicitly provided. Never run it during a public deployment without
checking the rights for every distributed resource.
"""
from __future__ import annotations

import argparse
import os
import shutil
import stat
import zipfile
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "api/public/uploads.zip"
DEST = ROOT / "api/public/uploads"
ALLOWED_SUFFIXES = {
    ".png", ".jpg", ".jpeg", ".webp", ".gif", ".json",
    ".mp4", ".webm", ".ogg", ".mov",
}
MAX_UNCOMPRESSED_BYTES = 3 * 1024**3
MAX_SINGLE_BYTES = 150 * 1024**2


def normalized_member(name: str) -> Path | None:
    if not name or name.startswith("/") or "\0" in name:
        raise ValueError(f"Ruta insegura en ZIP: {name!r}")
    # Backslashes must not be interpreted as filesystem escape sequences.
    normalized = name.replace("\\", "/")
    if normalized.startswith("./"):
        normalized = normalized[2:]
    parts = normalized.split("/")
    if any(part in {"", ".", ".."} for part in parts):
        raise ValueError(f"Ruta insegura en ZIP: {name!r}")
    if parts[:2] == ["public", "uploads"]:
        parts = parts[2:]
    elif parts[0] == "uploads":
        parts = parts[1:]
    if not parts or parts[0] == "public":
        return None
    dest = Path(*parts)
    if dest.suffix.lower() not in ALLOWED_SUFFIXES:
        return None
    return dest


def validate_archive(archive: zipfile.ZipFile) -> list[tuple[zipfile.ZipInfo, Path]]:
    validated = []
    seen: set[str] = set()
    total = 0
    for info in archive.infolist():
        if info.is_dir():
            continue
        mode = info.external_attr >> 16
        if stat.S_ISLNK(mode):
            raise ValueError(f"Enlace simbólico bloqueado: {info.filename}")
        if info.file_size < 0 or info.file_size > MAX_SINGLE_BYTES:
            raise ValueError(f"Archivo demasiado grande: {info.filename}")
        relative = normalized_member(info.filename)
        if relative is None:
            continue
        key = relative.as_posix().casefold()
        if key in seen:
            raise ValueError(f"Entrada duplicada: {info.filename}")
        seen.add(key)
        total += info.file_size
        if total > MAX_UNCOMPRESSED_BYTES:
            raise ValueError("ZIP supera el tamaño máximo permitido")
        validated.append((info, relative))
    return validated


def install(archive_path: Path, target: Path, perform: bool) -> tuple[int, int]:
    if os.getenv("APP_ENV", "").lower() == "production" and perform:
        raise ValueError("No se permite instalar recursos sin revisar derechos en producción")
    with zipfile.ZipFile(archive_path) as archive:
        members = validate_archive(archive)
        if not members:
            raise ValueError("No se encontraron imágenes o atlas válidos en el ZIP")
        extracted = 0
        if perform:
            target.mkdir(parents=True, exist_ok=True)
            target_root = target.resolve()
            for info, relative in members:
                destination = target_root / relative
                # Do not follow pre-existing symbolic links within the output path.
                if any(part.is_symlink() for part in [destination, *destination.parents]
                       if part == target_root or target_root in part.parents):
                    raise ValueError(f"Destino contiene enlace simbólico: {relative}")
                destination.parent.mkdir(parents=True, exist_ok=True)
                if destination.exists():
                    continue  # No overwrite of existing local files.
                try:
                    with archive.open(info) as source, destination.open("xb") as output:
                        shutil.copyfileobj(source, output, length=1024 * 1024)
                    extracted += 1
                except Exception:
                    destination.unlink(missing_ok=True)
                    raise
        return len(members), extracted


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--install", action="store_true",
                        help="Extract to api/public/uploads only in local development")
    args = parser.parse_args()
    if not ARCHIVE.is_file():
        parser.error("No existe api/public/uploads.zip")
    try:
        total, written = install(ARCHIVE, DEST, args.install)
    except (OSError, zipfile.BadZipFile, ValueError) as exc:
        parser.error(str(exc))
    if args.install:
        print(f"Archivos compatibles en ZIP: {total}; instalados: {written}.")
        print("Solo para desarrollo local. Verifica los derechos antes de publicar.")
    else:
        print(f"Vista previa: {total} archivos compatibles; no se modificó nada.")
        print("Para preparar la copia local: python3 scripts/install_catalog_assets_local.py --install")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
