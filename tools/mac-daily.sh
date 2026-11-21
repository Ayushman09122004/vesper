#!/bin/zsh
# Vesper's daily catalog, built on this Mac (home internet isn't rate-limited by JustWatch the way GitHub's servers are)
# and published to GitHub Pages → web app, Mac app and TV all pick it up. Run by launchd every 3 hours; does real work
# only when the published catalog is older than 20 hours. GitHub's robot (refresh.yml) is the backup.
export PATH="$HOME/webos-tools/node/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"
cd "${0:A:h}/.."
LOG="$HOME/Library/Logs/vesper-catalog.log"
exec >>"$LOG" 2>&1
echo "=== $(date '+%F %T')"
fail() { echo "FAILED: $1"; osascript -e "display notification \"$1\" with title \"Vesper catalog didn't update\"" ; exit 1; }
curl -s -o /dev/null --max-time 10 https://apis.justwatch.com || { echo "offline — later"; exit 0; }
git fetch -q origin main || { echo "can't reach GitHub — later"; exit 0; }
# judge freshness by what's PUBLISHED (origin), not the local file
gen=$(git show origin/main:catalog.json | head -c 400 | grep -o '"generated":"[^"]*"' | cut -d'"' -f4)
age=$(( $(date +%s) - $(date -j -u -f '%Y-%m-%dT%H:%M:%S' "${gen%%.*}" +%s 2>/dev/null || echo 0) ))
if (( age < 72000 )); then echo "published catalog is fresh ($gen)"; exit 0; fi
git pull -q --rebase --autostash origin main || fail "git pull failed"
node tools/build-catalog.mjs || fail "build failed — see ~/Library/Logs/vesper-catalog.log"
git commit -q -m "Daily catalog $(date -u +%F) (Mac)" -- catalog.json || { echo "no change"; exit 0; }
for i in 1 2 3; do git push -q origin HEAD:main && { echo "published"; exit 0; }; git pull -q --rebase --autostash origin main; done
fail "push to GitHub failed"
