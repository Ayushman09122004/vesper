#!/usr/bin/env python3
"""Writes the bot-relay workflows. Edit HERE, then run:  python3 tools/gen-workflows.py
(10+ near-identical bot jobs are easier to keep right generated than hand-edited.)

How a relay works: JustWatch blocks one machine's address after ~100 quick requests. Each bot is a fresh GitHub machine
(fresh address): it replays everything the bots before it saved (artifact "<key>-progress"), fetches until JustWatch
blocks it, and hands its saved answers on. The first bot to finish uploads the result (artifact "<key>-out");
the rest see it and stop at once. "publish" commits the result only if it's newer than what's live.
"""
import os

RELAYS = [
    dict(file="refresh.yml", name="Refresh catalog", key="catalog", script="tools/build-catalog.mjs",
         outputs=["catalog.json", "catalog-more.json", "catalog-more/"], check="catalog.json", min_titles=500, bots=12,
         crons=[("30 0 * * *", "06:00 India"), ("30 2 * * *", "08:00 — only if 06:00 didn't make it"), ("30 5 * * *", "11:00"), ("30 9 * * *", "15:00")],
         trailers=True, alert_hours=30,
         what="Vesper's daily catalog: everything on your five apps in India, plus the lists the rows use"),
    dict(file="netflix-world.yml", name="Netflix worldwide", key="world", script="tools/netflix-world.mjs",
         outputs=["netflix-world.json"], check="netflix-world.json", min_titles=5000, bots=10,
         crons=[("0 1 * * *", "06:30 India"), ("0 4 * * *", "09:30 — only if 06:30 didn't make it"), ("0 8 * * *", "13:30")],
         trailers=False, alert_hours=54,
         what="which of 48 countries has each title on Netflix (for Search → Netflix worldwide)"),
]

def bot(r, n):
    k = r["key"]
    needs = "" if n == 1 else f"    needs: bot{n-1}\n    if: ${{{{ !cancelled() }}}}\n"
    paths = "\n".join(f"            {p}" for p in r["outputs"])
    return f"""  bot{n}:
{needs}    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - id: have
        name: Already built by an earlier bot?
        uses: actions/download-artifact@v4
        continue-on-error: true
        with: {{ name: {k}-out, path: .done }}
      - name: Progress from the bots before
        if: steps.have.outcome != 'success'
        uses: actions/download-artifact@v4
        continue-on-error: true
        with: {{ name: {k}-progress, path: jwcache }}
      - uses: actions/setup-node@v4
        if: steps.have.outcome != 'success'
        with: {{ node-version: 22 }}
      - id: build
        name: Build (bot {n})
        if: steps.have.outcome != 'success'
        run: |
          set +e
          node {r["script"]}; code=$?
          # words, not numbers: GitHub's conditions treat '' == '0' as true
          case $code in 0) res=done;; 3) res=partial;; *) res=error;; esac
          echo "result=$res" >> "$GITHUB_OUTPUT"
          [ "$res" = error ] && echo "::warning::bot {n} hit an error — the next bot carries on"
          exit 0
      - name: Hand progress on
        if: steps.build.outputs.result == 'partial' || steps.build.outputs.result == 'error'
        uses: actions/upload-artifact@v4
        with: {{ name: {k}-progress, path: jwcache/, overwrite: true, retention-days: 1, if-no-files-found: warn }}
      - name: Hand over the result
        if: steps.build.outputs.result == 'done'
        uses: actions/upload-artifact@v4
        with:
          name: {k}-out
          retention-days: 1
          path: |
{paths}
"""

def publish(r):
    k, chk = r["key"], r["check"]
    allbots = ", ".join(f"bot{i}" for i in range(1, r["bots"] + 1))
    cps = "\n".join((f"          [ -d .done/{p} ] && rm -rf {p} && cp -R .done/{p} {p}" if p.endswith("/") else f"          [ -f .done/{p} ] && cp .done/{p} {p}") for p in r["outputs"])
    adds = " ".join(r["outputs"])
    trailers = """      # trailers are a nice extra: after the catalog is safely out, never blocking it
      - name: Trailers
        if: ${{ !cancelled() }}
        continue-on-error: true
        timeout-minutes: 20
        run: |
          node tools/trailers.mjs 600 || true
          git add trailers.json
          git diff --cached --quiet && exit 0
          git commit -m "Trailers $(date -u +%F)"
          for i in 1 2 3; do git pull --rebase -q origin main && git push && exit 0; sleep 5; done
""" if r["trailers"] else ""
    return f"""  publish:
    needs: [{allbots}]
    if: ${{{{ !cancelled() }}}}
    runs-on: ubuntu-latest
    timeout-minutes: 40
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: {{ node-version: 22 }}
      - id: got
        uses: actions/download-artifact@v4
        continue-on-error: true
        with: {{ name: {k}-out, path: .done }}
      - name: Check the result
        id: ok
        if: steps.got.outcome == 'success'
        run: |
          # must be real AND newer than what's already published (never re-publish an old file)
          node -e 'const fs=require("fs");const c=JSON.parse(fs.readFileSync(".done/{chk}"));let o={{}};try{{o=JSON.parse(fs.readFileSync("{chk}"))}}catch(e){{}}
            const n=(c.titles||c.t||[]).length; if(n<{r["min_titles"]}){{console.log("too small",n);process.exit(1)}}
            if(o.generated&&Date.parse(c.generated)<=Date.parse(o.generated)){{console.log("not newer than the published one",c.generated);process.exit(2)}}
            console.log(n,"titles,",c.generated)' || {{ [ $? = 2 ] && echo "nothing new to publish" && exit 0; exit 1; }}
{cps}
          echo "fresh=1" >> "$GITHUB_OUTPUT"
      - name: Publish
        if: steps.ok.outputs.fresh == '1'
        run: |
          git config user.name "Vesper robot"
          git config user.email "actions@users.noreply.github.com"
          git add {adds}
          git diff --cached --quiet && echo "no change" && exit 0
          git commit -m "{r["name"]} $(date -u +%F)"
          for i in 1 2 3; do git pull --rebase -q origin main && git push && exit 0; sleep 5; done; exit 1
{trailers}      - name: Nothing new — tell the owner if it's getting old
        if: ${{{{ !cancelled() && steps.ok.outputs.fresh != '1' }}}}
        env: {{ GH_TOKEN: "${{{{ github.token }}}}" }}
        run: |
          # only alarm when the PUBLISHED file is really getting old (a later run today may still make it)
          age=$(node -e 'console.log(Math.round((Date.now()-Date.parse(JSON.parse(require("fs").readFileSync("{chk}")).generated))/36e5))')
          echo "published {chk} is ${{age}}h old"
          [ "$age" -lt {r["alert_hours"]} ] && exit 0
          url="${{{{ github.server_url }}}}/${{{{ github.repository }}}}/actions/runs/${{{{ github.run_id }}}}"
          n=$(gh issue list --state open --label robot-failed --json number,title --jq '.[] | select(.title | contains("{r["name"]}")) | .number' 2>/dev/null | head -1)
          if [ -n "$n" ]; then gh issue comment "$n" --body "Still failing ($(date -u +%F), ${{age}}h old): $url"
          else gh label create robot-failed --color d73a4a --force >/dev/null 2>&1 || true
               gh issue create --label robot-failed --title "{r["name"]}: data is ${{age}}h old" --body "The bots couldn't build it. Run log: $url"; fi
          exit 1
      - name: All good — close any alert
        if: steps.ok.outputs.fresh == '1'
        env: {{ GH_TOKEN: "${{{{ github.token }}}}" }}
        run: |
          for n in $(gh issue list --state open --label robot-failed --json number,title --jq '.[] | select(.title | contains("{r["name"]}")) | .number' 2>/dev/null); do
            gh issue close "$n" --comment "Updated fine on $(date -u +%F)."; done
"""

def workflow(r):
    crons = "\n".join(f'    - cron: "{c}"    # {why}' for c, why in r["crons"])
    head = f"""# GENERATED by tools/gen-workflows.py — edit that, not this.
# {r["name"]}: {r["what"]}.
# A relay of {r["bots"]} bots, no computer or phone needed: each bot is a fresh GitHub machine that continues where the
# last one was blocked by JustWatch. Runs every morning; later runs stop at once when today's data is out.
name: {r["name"]}
on:
  schedule:
{crons}
  workflow_dispatch:
    inputs:
      force: {{ description: "Build even if today's data is already out", type: boolean, default: false }}
permissions:
  contents: write
  issues: write
  actions: read
concurrency:
  group: {r["key"]}
  cancel-in-progress: false
env:
  JW_CACHE: jwcache/answers.json.gz
  JW_PACE_MS: "500"
  SKIP_IF_FRESH_HOURS: ${{{{ inputs.force && '0' || '20' }}}}
jobs:
"""
    return head + "".join(bot(r, n) for n in range(1, r["bots"] + 1)) + publish(r)

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".github", "workflows")
for r in RELAYS:
    with open(os.path.join(root, r["file"]), "w") as f:
        f.write(workflow(r))
    print("wrote", r["file"])
