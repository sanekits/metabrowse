# Plan: Replace Metabrowse Buildserver with Client-Side SPA

## Context

The metabrowse content build (bb-metabrowse-links) currently uses a Python pipeline on permanent build servers to convert markdown to static HTML, then deploys to gh-pages. This creates a friction-heavy workflow: users push content, then cross fingers waiting for webhook delivery, build execution, gh-pages push, and GHES Pages cache invalidation -- all invisible. The buildserver also requires maintenance (Thursday reboots, NFS coordination, webhook secrets).

The goal is to eliminate the build step entirely for content. A client-side SPA fetches markdown from the GitHub API at runtime, parses and renders it in the browser. Users see their changes immediately after pushing. This also unifies the tech stack (everything TypeScript/Vite) and works identically on GHES and public GitHub.

## Target Architecture

```
metabrowse repo (gh-pages)  ──serves SPA──→  Browser
                                                ├── GitHub Contents API → text/README.md files
                                                ├── Parses markdown (TypeScript port of parser.py)
                                                ├── Renders DOM (replaces Jinja2 templates)
                                                ├── veditor.web loaded from CDN (unchanged)
                                                └── Edits files via GitHub Contents API (existing editor code)
```

- **metabrowse repo**: Becomes a pure TypeScript/Vite SPA. `gh-pages` serves the built app.
- **Content repos** (bb-metabrowse-links on GHES, metabrowse-links on public): Data-only. Just `text/` markdown on `main`. No gh-pages branch, no build step.
- **veditor.web, notehub.web**: Unchanged.

## Key Design Decisions

### Routing: Hash-based
`#/teach/python` fetches `text/teach/python/README.md`. Works on GitHub Pages without server config or 404.html tricks. Root hash (`#/` or empty) loads `text/README.md`.

### Content repo configuration: Build-time defaults + localStorage overrides
- `VITE_DEFAULT_HOST`, `VITE_CONTENT_OWNER`, `VITE_CONTENT_REPO` set at build time
- User can reconfigure via auth/settings screen (stored in localStorage)
- Matches the notehub.web pattern exactly

### Caching: Trees API + ETag conditional requests
- Single `GET /repos/{owner}/{repo}/git/trees/main?recursive=1` call on app load gives the full file tree (37 files currently)
- Individual README.md files fetched on navigation with `If-None-Match` ETags
- Cached in localStorage. Show cached content immediately, revalidate in background.

### Search: Lazy index built from cached pages
- As pages are visited and parsed, they're added to an in-memory search index
- On first global search, offer to fetch all README.md files in parallel (~37 API calls, within rate limits)
- Index persisted in localStorage

### Editor: Same SPA, separate tab
- Editor becomes a route: `#/edit/path/to/dir`
- "Edit" button opens `window.open()` with editor route (preserves current tab, matches current UX)
- After save, `window.opener?.location.reload()` triggers re-fetch in parent tab
- Editor code moves from `editor/src/` into main `src/editor.ts`

## What Changes in Each Repo

### metabrowse repo (major restructure)

**New structure:**
```
metabrowse/
├── src/
│   ├── main.ts          # Entry point, router
│   ├── app.ts           # App shell, auth, navigation view
│   ├── github.ts        # GitHub API (merged from editor/src/github.ts, add Trees API)
│   ├── parser.ts        # Port of parser.py
│   ├── transformer.ts   # Port of transformer.py
│   ├── renderer.ts      # DOM construction (replaces Jinja2 template)
│   ├── search.ts        # Local filter + global cross-page search
│   ├── favicon.ts       # Favicon loading with localStorage cache
│   ├── keyboard.ts      # Keyboard shortcuts (/, Ctrl+K, e, r, c)
│   ├── editor.ts        # Editor view (from editor/src/app.ts)
│   ├── cache.ts         # localStorage + ETag caching layer
│   ├── router.ts        # Hash-based routing
│   ├── veditor.d.ts     # veditor.web type declarations
│   └── style.css        # Merged from templates/style.css + editor styles
├── public/              # PWA assets (manifest, icons, sw.js, favicon)
├── index.html           # SPA entry point
├── package.json
├── tsconfig.json
├── vite.config.ts       # Requires VITE_BASE (like notehub.web)
└── .github/workflows/
    └── deploy.yml       # Build + deploy to gh-pages (public GitHub)
```

**Remove after migration validated:** `parser.py`, `transformer.py`, `generator.py`, `build.py`, `build-metabrowse.sh`, `build-editor.sh`, `serve-metabrowse.sh`, `templates/`, `editor/`, `requirements.txt`

### bb-metabrowse-links (GHES content)
- Remove `gh-pages` branch
- Remove `.metabrowse.conf` (SPA computes edit URLs from repo info)
- Keep `text/` directory unchanged

### metabrowse-links (public GitHub content)
- Same changes as bb-metabrowse-links

### Parent workspace (metabrowse-notehub-maint)

**Makefile updates:**
- `serve-metabrowse`: Vite dev server for the SPA
- `build-metabrowse`: `npm run build` with env vars
- `deploy-metabrowse`: `npx gh-pages -d dist`
- Remove `build-links`, `serve-links` (no content build step)
- `deploy-links` simplifies to just `git push` (content is live immediately)

**Buildserver updates:**
- Remove `bb-metabrowse-links` entry from config
- Remove `metabrowse-code-build.sh` and `metabrowse-build.sh`
- Remove metabrowse-links from veditor.web cascade
- Add metabrowse SPA build entry (optional, or use `make deploy-metabrowse`)

## Deployment

### GHES
```bash
VITE_BASE=/pages/training-lmatheson4/metabrowse/ \
VITE_VEDITOR_BASE=https://bbgithub.dev.bloomberg.com/pages/lmatheson4/veditor.web/ \
VITE_DEFAULT_HOST=bbgithub.dev.bloomberg.com \
VITE_CONTENT_OWNER=training-lmatheson4 \
VITE_CONTENT_REPO=bb-metabrowse-links \
npm run build
# Then: npx gh-pages -d dist
```
URL: `https://bbgithub.dev.bloomberg.com/pages/training-lmatheson4/metabrowse/`

### Public GitHub
GitHub Actions on push to main. Build with:
```bash
VITE_BASE=/metabrowse/ \
VITE_CONTENT_OWNER=Stabledog \
VITE_CONTENT_REPO=metabrowse-links \
npm run build
```
URL: `https://stabledog.github.io/metabrowse/`

### URL Migration
Users currently bookmark `https://bbgithub.dev.bloomberg.com/pages/training-lmatheson4/bb-metabrowse-links/`. Deploy a single redirect `index.html` to the old gh-pages as a bridge, then retire it.

## TypeScript Port Notes

### parser.ts (from parser.py, 232 lines)
- Same 4 cascading regex patterns (HTML passthrough, markdown+target, standard markdown, bare URL)
- `parseContent(content: string): ParsedDocument` (takes string, not file path)
- Comment extraction logic must handle `#` in URL fragments correctly
- Indentation-tracking state machine ports directly

### transformer.ts (from transformer.py, 164 lines)
- SHA256 targets: `crypto.subtle.digest('SHA-256', ...)` — async but produces identical output to Python's `hashlib.sha256().hexdigest()[:8]`
- Link coalescing, scheme detection, explicit target override — all straightforward

### renderer.ts (replaces templates/index.html Jinja2, ~750 lines)
- DOM construction using same CSS class names as current template
- Breadcrumbs computed from hash route path
- Children computed from cached tree (subdirs containing README.md)
- Same `<details>`/`<summary>` for collapsible sections

### Client-side features (from templates/index.html inline JS)
- Favicon loading + localStorage cache + DuckDuckGo fallback → `favicon.ts`
- Local filter + global search → `search.ts`
- Copy-to-clipboard with checkmark feedback
- Keyboard shortcuts: `/`, `Ctrl+K`, `e`, `r`, `c` → `keyboard.ts`
- Mobile edit link swap (touch → GitHub web editor)
- PWA service worker registration

## Implementation Phases

### Phase 1: Project restructure + parser/transformer port
- Set up root-level Vite project in metabrowse repo
- Port parser.py → src/parser.ts with tests
- Port transformer.py → src/transformer.ts, validate SHA256 output matches Python
- Verify by running both parsers on same README.md content

### Phase 2: GitHub API + caching + routing
- Merge editor/src/github.ts into src/github.ts, add Trees API
- Implement cache.ts (localStorage + ETags)
- Implement router.ts (hash-based)
- Wire up: route change → fetch → parse → log output

### Phase 3: Renderer
- Implement renderer.ts with same DOM structure/CSS classes as Jinja2 template
- Copy templates/style.css into src/style.css
- Breadcrumbs, children, edit URLs computed from route + tree
- Visual comparison against existing static site

### Phase 4: Search + favicons + keyboard shortcuts
- Port all inline JS from templates/index.html into separate modules
- Global search builds index lazily from cached pages

### Phase 5: Editor integration
- Move editor/src/app.ts into src/editor.ts
- Router detects `#/edit/...` prefix, renders editor view
- After save, parent tab re-fetches current page

### Phase 6: PWA + deployment + migration
- PWA assets in public/
- GitHub Actions workflow for public deploy
- Makefile targets for GHES deploy
- Redirect page on old gh-pages
- Buildserver config cleanup

## Risks

| Risk | Mitigation |
|------|-----------|
| Regex differences Python↔JS | Test all 4 patterns with edge cases from real content |
| SHA256 target mismatch | Verify `crypto.subtle` matches `hashlib` for test URLs |
| API rate limits (5000/hr) | ETags + tree API (1 call for directory structure) |
| URL bookmark breakage | Redirect page on old gh-pages |
| Veditor cascade no longer needed | SPA loads veditor at runtime — veditor updates picked up on next page load |

## Verification

1. **Parser correctness**: Run TypeScript parser on all 37 README.md files, compare structured output to Python parser
2. **Visual parity**: Side-by-side screenshots of SPA vs current static site for same content
3. **Edit round-trip**: Edit a file in the SPA editor, verify content updates immediately in browse view
4. **Search**: Test local filter and global search against known content
5. **Both hosts**: Deploy to both GHES and public GitHub Pages, test each
6. **Keyboard shortcuts**: Verify all shortcuts work (/, Ctrl+K, e, r, c)
7. **Offline/cache**: Visit pages, go offline, verify cached pages still render
