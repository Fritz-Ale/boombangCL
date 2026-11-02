#!/usr/bin/env sh
set -eu

# Ejecutar desde la raíz del repositorio en Cloudflare Pages:
# Build command: sh web/build-pages.sh
# Output directory: web
if [ ! -d doc/screenshots ]; then
  echo "Error: falta doc/screenshots (capturas propias del repositorio)." >&2
  exit 1
fi
mkdir -p web/screenshots
cp -R doc/screenshots/. web/screenshots/
echo "BoomBangCL: recursos de la portada preparados en web/screenshots."
