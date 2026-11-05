#!/bin/bash
# Copies the shared Vesper brain (catalog builder, shaping, taste) and assets from the Mac app into the iPhone site.
set -e; D="$(cd "$(dirname "$0")" && pwd)"; U="$D/../ui"
cp "$U/core.js" "$U/shape.js" "$U/taste.js" "$D/"
mkdir -p "$D/logos" "$D/fonts"; cp "$U"/logos/*.png "$D/logos/"; cp "$U"/fonts/*.woff2 "$D/fonts/"
echo synced
