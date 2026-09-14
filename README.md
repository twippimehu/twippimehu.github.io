# benkku.me

Personal site: photography portfolio + a private utility app ("B Tools") hidden
behind a mysterious `. . .` entry, plus its companion browser extension.

No build step. No npm install. Plain HTML/CSS/JS with native ES modules,
deployed as static files + a couple of small serverless functions.

## 1. Project structure

```
public/                      <- deploy root (Cloudflare Pages "build output directory")
  index.html                 homepage
  photography/index.html     gallery
  about/index.html           about page
  downloads/index.html       public extension download page
  private/index.html         mysterious-entry content — served at /.../  (see _redirects)
  private/tools/index.html   the authenticated B Tools app — served at /.../tools/
  _redirects                 rewrites the literal /.../ URLs onto private/ (see below)
  data/photos.json           <- YOUR PHOTOS GO HERE
  photos/                    <- YOUR IMAGE FILES GO HERE
  assets/css/                site.css (public site), btools.css (private app)
  assets/js/site/             homepage + gallery + lightbox
  assets/js/btools/           window manager, registry, palette, tool modules

functions/                   Cloudflare Pages Functions (serverless, auto-routed)
  _middleware.js               runs on EVERY request; gates any /.../tools* URL
                                server-side before it's ever served — see below
  api/login.js                 POST — verifies credentials, sets signed session cookie
  api/logout.js                POST — clears the session cookie
  _lib/session.js              shared HMAC session sign/verify helper

extension/                   Browser extension (Manifest V3), replaces Tampermonkey
  manifest.json
  background.js               service worker: state + message router
  bridge.js                   content script, runs ONLY on benkku.me — talks to the app
  content.js                  content script, runs on all pages — does the actual work
  popup.html
```

### A note on the `/...` path

Windows cannot create a folder literally named `...` — it's a dots-only name, and
Explorer/most unzip tools silently mangle it (often to `_`). Since this project has
to be editable on Windows, the actual files live in safely-named folders
(`public/private/`), and two things make the *URL* still behave exactly like the
spec wanted:

- `public/_redirects` rewrites incoming `/...` and `/.../tools*` requests to serve
  content from `private/` — a **rewrite** (HTTP 200), not a redirect, so the address
  bar still shows the literal `/...` path. Visitors and the nav link never see
  `private` anywhere.
- `functions/_middleware.js` is a single root-level middleware that runs on every
  request and checks `new URL(request.url).pathname` directly for `/.../tools`,
  rather than relying on a folder named `...` to drive routing. Cloudflare Pages
  Functions execute *before* the `_redirects` rewrite happens, so this middleware
  still sees the real `/.../tools` URL the browser asked for and can block it before
  anything is served — auth enforcement doesn't depend on the folder rename at all.

You'll never need to create a `...` folder yourself. Just edit files under
`public/private/` as normal.

## 2. Local development

No build tool needed for the static parts — any static server works, e.g.:

```
npx serve public
```

To also test the login/session functions locally, use Cloudflare's own dev server
(free, no account required for local dev):

```
npm install -g wrangler
wrangler pages dev public --compatibility-date=2026-01-01
```

This serves `public/` AND runs everything in `functions/` locally, including cookies
and the `_redirects` rewrites, so `/...` and `/.../tools/` work exactly like production.

## 3. Deploying to Cloudflare Pages (recommended)

Your domain (`benkku.me`) was registered through GitHub Education, but GitHub Pages
only serves static files — it cannot run the server-side session check this project
requires. Cloudflare Pages gives you static hosting AND serverless functions in one
free project, deployed straight from your existing GitHub repo.

1. Push this project to `github.com/twippimehu/twippimehu.github.io`.
   Git's default branch name depends on your Git version/config — some create
   `master`, GitHub expects `main`. If `git push origin main` fails, run:
   ```
   git branch -M main
   git push -u origin main
   ```
   If the remote already has unrelated commits (e.g. old GitHub Pages content) and
   the push is rejected, and you're fine replacing it entirely, add `--force` to
   that push command.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**,
   pick the repo.
3. Build settings:
   - Framework preset: **None**
   - Build command: *(leave blank — there's nothing to build)*
   - Build output directory: `public`
4. Under **Settings → Environment variables**, add (as *encrypted* secrets, Production
   and Preview both):
   - `B_TOOLS_USERNAME`
   - `B_TOOLS_PASSWORD`
   - `SESSION_SECRET` — any long random string (e.g. `openssl rand -hex 32`)

   These are never written into the repo or the frontend — see `functions/api/login.js`.
5. Under **Custom domains**, add `benkku.me`. Cloudflare will show you either
   nameservers to switch to, or a CNAME to add — follow whichever it offers for your
   registrar. (Since the domain came through GitHub Education, check whatever
   registrar/DNS panel that benefit uses.)
6. Push to your main branch — Cloudflare auto-deploys on every push, same workflow
   as GitHub Pages.

## 4. Adding photographs

Edit `public/data/photos.json`. Each entry:

```json
{
  "id": "unique-id",
  "src": "/photos/your-file.jpg",
  "thumbnail": "/photos/thumbs/your-file.jpg",
  "title": "Title",
  "description": "",
  "category": "Nature",
  "featured": false,
  "date": "",
  "location": "",
  "width": 1600,
  "height": 2000
}
```

Drop the actual files in `public/photos/` (and a smaller thumbnail in
`public/photos/thumbs/`). `width`/`height` let the gallery reserve the right space
before the image loads (no layout shift) — use the real pixel dimensions.
Up to 5 `featured: true` photos show on the homepage.

## 5. Adding a new B Tools tool

1. Create `public/assets/js/btools/tools/your-tool.js` exporting:
   ```js
   export const tool = {
     id: 'your-tool', title: 'Your Tool', icon: '🔧', category: 'Developer',
     keywords: ['keyword1','keyword2'], width: 480, height: 480,
     build(body) { body.innerHTML = `...`; /* wire up listeners */ }
   };
   ```
2. In `public/assets/js/btools/registry.js`, add one import line and add it to the
   `ALL` array.

That's it — the command palette, search, favorites, recents and taskbar all read
from the registry automatically.

## 6. Building & installing the extension

There's nothing to "build" — it's plain JS. To install locally for development:

1. `chrome://extensions` → enable **Developer mode**.
2. **Load unpacked** → select the `extension/` folder.
3. Add real icons to `extension/icons/` (16/32/48/128 px PNGs) and reference them in
   `manifest.json` before distributing publicly — placeholders were deliberately not
   faked.

To distribute it from the site, it's already packaged at
`public/downloads/b-tools-extension.zip` — regenerate it after any extension change:

```
cd extension && zip -r ../public/downloads/b-tools-extension.zip . -x ".*"
```

If you host benkku.me somewhere other than production, or run it on
`localhost`/`127.0.0.1` for testing, `bridge.js`'s content-script `matches` in
`manifest.json` already covers both.

## 7. Security model — what to know

- **Login is never checked client-side.** `functions/api/login.js` compares against
  `B_TOOLS_USERNAME`/`B_TOOLS_PASSWORD` environment variables you set in the Cloudflare
  dashboard — never in code — and returns a generic "Access denied." either way, without
  saying which field was wrong.
- **Session is a signed, HttpOnly, Secure, SameSite=Strict cookie** (HMAC-SHA256 via
  `SESSION_SECRET`), verified on every request under `/.../tools` by the root
  `functions/_middleware.js` — not just hidden by client-side routing, and not
  dependent on any particular folder name (see "A note on the `/...` path" above).
  Directly navigating to the URL without a valid cookie redirects to login.
- **The extension never sees your password.** It only automates page content after
  you're already inside the authenticated app; `background.js` never talks to
  `/api/login`.
- Rate limiting the login endpoint (e.g. via Cloudflare's dashboard rules) is worth
  adding before going live — this build doesn't include it.

## 8. What's included vs. simplified vs. not yet built

**Fully implemented:** photography portfolio (masonry gallery, filtering,
lightbox with keyboard/touch/swipe support), homepage, about page, server-verified
auth, B Tools window manager (drag/resize/minimize/maximize/persisted layout),
command palette (⌘K, fuzzy search, favorites, recents), and ~38 tools across
Productivity, Developer, Web, Security, Design, Media, and Automation categories,
including a real (non-Tampermonkey) Auto-Fill, Auto-Type, Element Finder, Page
Inspector, and DOM Playground powered by the extension.

**Simplified:** Image Inspector reads dimensions/size/type directly from the file
but does not parse full EXIF metadata (needs a dedicated parser library).
User-Agent Decoder is explicitly labeled as a best-effort heuristic, per how
unreliable UA strings are.

**Not yet built:** Automation Builder (multi-step visual workflow recorder) and
Keyboard Macro Builder / Click Repeater — these are meaningfully bigger pieces
(a step editor, saved-workflow storage, and a safe execution engine with runaway
-loop protection) and were intentionally left out of this pass rather than shipped
as fake buttons. The registry/extension architecture here is built to add them
later without restructuring anything.
