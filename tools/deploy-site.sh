#!/usr/bin/env bash
# Publishes the website as ONE snapshot commit on the gh-pages branch (force-pushed, no history), so the repo never
# grows however many daily updates there are. Site = the code on main + the latest data.
#   tools/deploy-site.sh             code changed: republish with the data already live
#   tools/deploy-site.sh <dir>       new data: files in <dir> (catalog.json, catalog-more/, netflix-world.json…) replace the live ones
# Run from a checkout of main. Callers serialise on the "site" concurrency group; the push uses --force-with-lease and
# retries, so two publishers can never drop each other's files.
set -euo pipefail
NEW="${1:-}"
DATA=(catalog.json catalog-more.json catalog-more netflix-world.json trailers.json)
# (identity is set only on the snapshot commit below, never on the caller's checkout)
for try in 1 2 3 4 5; do
  rm -rf _site && mkdir _site
  git archive HEAD | tar -x -C _site                                   # the code (main)
  lease=""
  if git fetch -q origin gh-pages 2>/dev/null; then                    # the data that's live now
    lease="--force-with-lease=gh-pages:$(git rev-parse FETCH_HEAD)"
    for f in "${DATA[@]}"; do
      if git cat-file -e "FETCH_HEAD:$f" 2>/dev/null; then rm -rf "_site/$f"; git archive FETCH_HEAD "$f" | tar -x -C _site; fi
    done
  fi
  if [ -n "$NEW" ]; then                                               # today's new data on top
    for f in "${DATA[@]}"; do [ -e "$NEW/$f" ] && { rm -rf "_site/$f"; cp -R "$NEW/$f" "_site/$f"; }; done
  fi
  [ -f _site/catalog.json ] || { echo "refusing to publish: no catalog.json in the site"; exit 1; }
  touch _site/.nojekyll                                                # serve files as they are
  rm -rf _site/.github _site/jwcache _site/.gitignore                  # .gitignore would hide the data files from this commit
  (
    cd _site
    git init -q -b gh-pages
    git add -A --force
    git -c user.name="Vesper robot" -c user.email="actions@users.noreply.github.com" commit -q -m "Site $(date -u +%F\ %H:%M) — $(git -C .. log -1 --format=%h)"
    git remote add origin "$(git -C .. remote get-url origin)"
    # the checkout's auth header (actions/checkout) lives in the parent repo's config
    hdr="$(git -C .. config --get http.https://github.com/.extraheader || true)"
    if [ -n "$hdr" ]; then git config http.https://github.com/.extraheader "$hdr"; fi
    if [ -n "$lease" ]; then git push -q "$lease" origin gh-pages:gh-pages; else git push -q origin gh-pages:gh-pages; fi   # lease: only replace what we read
  ) && { echo "published site (try $try)"; rm -rf _site; exit 0; }
  echo "someone else published at the same moment — retrying"; sleep $((try * 5))
done
echo "could not publish the site"; exit 1
