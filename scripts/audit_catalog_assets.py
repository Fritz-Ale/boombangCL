#!/usr/bin/env python3
"""Audit catalog SQL versus the existing ZIP without extracting image assets.

Requires Pillow only for image dimensions.
Run: python3 scripts/audit_catalog_assets.py --sql boombang_api.sql --zip api/public/uploads.zip --out /tmp/catalog-audit.json
"""
import argparse
import json
import re
import zipfile
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    Image = None


def split_values(source):
    rows = []
    fields = []
    value = []
    depth = 0
    quoted = False
    escaped = False
    for char in source:
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
        raise ValueError("Incomplete SQL record")
    return rows


def scalar(raw):
    if raw.upper() == "NULL":
        return None
    if raw.startswith("'") and raw.endswith("'"):
        return re.sub(r"\\(.)", lambda m: {
            "n": "\n", "r": "\r", "t": "\t", "0": "\0",
        }.get(m.group(1), m.group(1)), raw[1:-1])
    try:
        return int(raw)
    except ValueError:
        return raw


def read_catalog(sql):
    q = chr(96)
    marker = "CREATE TABLE " + q + "catalog_items" + q + " ("
    ddl_start = sql.index(marker)
    ddl = sql[ddl_start:sql.index(") ENGINE=", ddl_start)]
    columns = re.findall(r"(?m)^\s*" + q + "([^" + q + "]+)" + q + r"\s", ddl)
    marker = "INSERT INTO " + q + "catalog_items" + q + " VALUES "
    insert_start = sql.index(marker) + len(marker)
    values = sql[insert_start:].split(";\n", 1)[0]
    records = split_values(values)
    if any(len(row) != len(columns) for row in records):
        raise ValueError("Catalog fields differ from SQL column definition")
    return [dict(zip(columns, map(scalar, row))) for row in records]


def dimensions(archive, path):
    if Image is None or not path:
        return None
    try:
        with archive.open(path) as file:
            with Image.open(file) as image:
                return [image.width, image.height]
    except (OSError, ValueError):
        return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sql", type=Path, required=True)
    parser.add_argument("--zip", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()

    records = read_catalog(args.sql.read_text(encoding="utf-8-sig"))
    output = []
    with zipfile.ZipFile(args.zip) as archive:
        filenames = {f.lower().lstrip("./"): f for f in archive.namelist()
                     if not f.endswith("/")}

        def locate(raw):
            if not raw:
                return None
            source = str(raw).replace("\\", "/").lstrip("/")
            for candidate in [source, source.removeprefix("uploads/"),
                              "public/" + source]:
                if candidate.lower() in filenames:
                    return filenames[candidate.lower()]
            return None

        for row in records:
            assets = {}
            for field in ("image", "spreadsheet", "atlas"):
                original = row.get(field)
                file = locate(original)
                assets[field] = {
                    "sql_path": original,
                    "found_in_archive": file is not None,
                    "archive_path": file,
                    "source_dimensions_px": dimensions(archive, file)
                    if field != "atlas" else None,
                }
            try:
                name = json.loads(row.get("name") or "{}")
                if isinstance(name, dict):
                    name = name.get("es") or name.get("en") or str(name)
            except (json.JSONDecodeError, TypeError):
                name = row.get("name")
            output.append({
                "id": row.get("id"), "name": name,
                "sprite_name": row.get("sprite_name"),
                "width": row.get("width"), "height": row.get("height"),
                "scale": row.get("scale"), "map_size": row.get("map_size"),
                "is_active": row.get("is_active"),
                "is_purchasable": row.get("is_purchasable"),
                "assets": assets,
            })

    matches = {field: sum(1 for row in output
                         if row["assets"][field]["found_in_archive"])
               for field in ("image", "spreadsheet", "atlas")}
    missing = [row["id"] for row in output if
               row["assets"]["spreadsheet"]["sql_path"]
               and not row["assets"]["spreadsheet"]["found_in_archive"]]
    report = {
        "provenance": "project boombang_api.sql and api/public/uploads.zip",
        "warning": "Existing assets may have reserved rights; ZIP presence is not a license.",
        "total_sql_objects": len(output), "found_assets": matches,
        "missing_sprite_item_ids": missing,
        "pillow_dimensions_available": Image is not None,
        "objects": output,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, ensure_ascii=False, indent=2),
                        encoding="utf-8")
    print("SQL catalog objects:", len(output))
    print("Images in existing ZIP:", matches["image"])
    print("Sprite sheets in existing ZIP:", matches["spreadsheet"])
    print("Atlas files in existing ZIP:", matches["atlas"])
    print("Missing SQL sprite paths:", len(missing))
    print("Pixel dimensions collected:", Image is not None)
    print("Report:", args.out)


if __name__ == "__main__":
    main()
