#!/usr/bin/env python3
"""Audita fondos de áreas públicas del SQL histórico frente a uploads.zip.

Solo inspecciona metadatos del ZIP; no extrae imágenes, no toca MySQL y no
publica recursos de terceros. Usa: python3 scripts/audit_public_scene_assets.py
"""
import argparse
import json
import re
import sys
import zipfile
from pathlib import Path


def split_sql_values(text):
    rows, fields, value = [], [], []
    depth = 0
    quoted = False
    escaped = False
    for char in text:
        if quoted:
            value.append(char)
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == "'":
                quoted = False
        elif char == "'":
            quoted = True
            value.append(char)
        elif char == "(":
            depth += 1
            if depth == 1:
                fields, value = [], []
            else:
                value.append(char)
        elif char == ")" and depth == 1:
            fields.append("".join(value).strip())
            rows.append(fields)
            depth = 0
        elif char == ")":
            depth -= 1
            value.append(char)
        elif char == "," and depth == 1:
            fields.append("".join(value).strip())
            value = []
        elif depth:
            value.append(char)
    if quoted or depth:
        raise ValueError("INSERT de public_scenes incompleto")
    return rows


def decode_sql(value):
    if value.upper() == "NULL":
        return None
    if value.startswith("'") and value.endswith("'"):
        return re.sub(
            r"\\(.)",
            lambda m: {"n": "\n", "r": "\r", "t": "\t", "0": "\0"}.get(m.group(1), m.group(1)),
            value[1:-1],
        )
    return value


def parse_scenes(sql):
    quote = chr(96)
    create = "CREATE TABLE " + quote + "public_scenes" + quote + " ("
    start = sql.index(create) + len(create)
    ddl = sql[start:sql.index(") ENGINE=", start)]
    columns = re.findall(r"(?m)^\s*`([^`]+)`\s", ddl)
    marker = "INSERT INTO " + quote + "public_scenes" + quote + " VALUES "
    data = sql.split(marker, 1)[1].split(";\n", 1)[0]
    records = split_sql_values(data)
    if not records or not columns:
        raise ValueError("La exportación no contiene datos de salas públicas")
    if any(len(r) != len(columns) for r in records):
        raise ValueError("Cantidad de columnas SQL inconsistente")
    return [dict(zip(columns, map(decode_sql, r))) for r in records]


def audit_scenes(scenes, archive_names):
    report = []
    for scene in scenes:
        raw = scene.get("assets_data")
        try:
            data = json.loads(raw) if raw else {}
        except (ValueError, TypeError):
            data = {}
        items = data.get("assets_data_repeatable", []) if isinstance(data, dict) else []
        if not isinstance(items, list):
            items = []
        backgrounds = []
        for item in items:
            if not isinstance(item, dict) or str(item.get("is_background")) != "1":
                continue
            source = item.get("image")
            source = source.strip().replace("\\", "/").lstrip("/") if isinstance(source, str) else ""
            options = [
                source,
                source.removeprefix("uploads/"),
                "public/" + source,
            ]
            found = bool(source) and any(x.lower() in archive_names for x in options)
            backgrounds.append({"path": source, "found_in_archive": found})
        report.append({
            "id": int(scene["id"]),
            "name": scene.get("name"),
            "active": str(scene.get("active")) == "1",
            "asset_count": len(items),
            "backgrounds": backgrounds,
        })
    return report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sql", type=Path, default=Path("boombang_api.sql"))
    parser.add_argument("--zip", type=Path, default=Path("api/public/uploads.zip"))
    parser.add_argument("--out", type=Path, default=Path("public-scene-assets-report.json"))
    parser.add_argument("--require-ufo", action="store_true", help="falla si el respaldo no contiene el fondo UFO")
    args = parser.parse_args()

    scenes = parse_scenes(args.sql.read_text(encoding="utf-8-sig"))
    with zipfile.ZipFile(args.zip) as archive:
        names = {member.filename.lower().lstrip("./") for member in archive.infolist()
                 if not member.is_dir()}
    result = audit_scenes(scenes, names)
    summary = {
        "scenes": len(result),
        "active_scenes": sum(row["active"] for row in result),
        "backgrounds_total": sum(len(row["backgrounds"]) for row in result),
        "backgrounds_in_archive": sum(b["found_in_archive"] for row in result for b in row["backgrounds"]),
        "backgrounds_missing": sum(not b["found_in_archive"] for row in result for b in row["backgrounds"]),
        "details": result,
    }
    args.out.write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    print(json.dumps({k: v for k, v in summary.items() if k != "details"}, ensure_ascii=False))
    ufo = next((row for row in result if row["name"].casefold() == "ufo" and row["active"]), None)
    if args.require_ufo and (not ufo or not ufo["backgrounds"] or
                             not all(b["found_in_archive"] for b in ufo["backgrounds"])):
        print("ERROR: fondo de UFO ausente del ZIP histórico", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
