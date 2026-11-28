# Vesper for iPhone

Your Vesper wall on your iPhone, as a home-screen app that never expires.

**Install (once):** open https://ayushman09122004.github.io/vesper/ in **Safari** → tap **Share** → **Add to Home Screen** → **Add**.

- The show list refreshes itself every morning (GitHub robot in `.github/workflows/refresh.yml`).
- **Play** opens Netflix / Prime Video / JioHotstar / Apple TV / Crunchyroll right on that show. Tap **◀ Vesper** (top-left) to come back.
- My List, likes and profiles are saved on the phone.

## For later (developer notes)
- Shared brain with the Mac app: `core.js`, `shape.js`, `taste.js` are copied from `../ui` by `./sync.sh`.
- Phone screens: `m.js`, `m.css`. Native-bridge stand-in: `shim.js`. Offline: `sw.js` (bump `V` when shipping UI changes).
- Episode lists need a small helper because JustWatch blocks browsers: deploy `proxy/` on Render, then put its address in `config.js`.
- Publish changes: `git add -A && git commit -m "…" && git push` (uploads over the `github-vesper` SSH key).
