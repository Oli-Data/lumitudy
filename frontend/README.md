# Lumitudy frontend

React and Vite study interface for Lumitudy, a CO³ Labs project.

## Local development

Run `npm run dev` from this folder. Set `VITE_API_URL` to your intended backend. The sign-in screen can be previewed without a backend; accounts, documents, generation, saved sets, and multiplayer require the API.

- `npm run build`: production frontend build
- `npm run preview`: serve the latest build locally
- `npm test`: existing server-graded exam regression checks

## Visual system

`src/theme.css` owns the shared day/night palette, glass surfaces, responsive layouts, and Frutiger Aero finish. The visual connection to CO³ Labs uses Syne headings, DM Sans body text, translucent panels, and aquatic colors. Lumitudy adds fresh green, sky blue, warm yellow, and peach accents, with glossy study cards, and decorative bubbles. All illustration elements are local CSS or SVG; fonts use the existing Google Fonts source.

`src/components/Brand.jsx` contains the shared wordmark, backdrop, study illustration, footer, and appearance switch. The preference is saved under `lumitudy-theme`; day is the default. `src/study.css` contains flashcard transition animations, with reduced-motion support in the shared theme.

Existing study components use semantic color variables so questions, results, friends, and multiplayer stay readable in both appearances. The visual refresh keeps study API paths; the session migration described below changes authentication. Source passages are described as review aids, not automatic proof of correctness.

Domain, hosting, and deployment configuration are managed separately from this frontend design.

## AI generation

The backend defaults to `claude-sonnet-5-5`. An existing Render `ANTHROPIC_MODEL` environment variable overrides that default; set it to `claude-sonnet-5-5` if an older override is present. Keep `ANTHROPIC_API_KEY` on the backend only.

Sonnet 5.5 requests explicitly use `thinking: {type: "between_tools"}` and high effort. With no tools in these generation requests, this keeps the existing token budget available for study material rather than up-front thinking. Other model overrides retain their previous request parameters. Flashcard source references, exact item counts, and exam answer choices still pass the existing validation. SDK request tests use a mock HTTP transport; they do not verify live account access, answer quality, latency, or cost.

## Bookshelf prototype (local only)

The separate bookshelf entry lives at `/observatory.html` and in `src/observatory/`; the normal production entry remains in place. Its sample lessons still use original prepared notes for three courses, six chapters, and eighteen questions. The new Log in / Sign up and Play together views connect to the existing authentication, upload, and multiplayer services. Google login is not implemented.

- `npm run prototype` starts the separate development configuration and opens the prototype.
- `npm run prototype:build` writes only to `dist-observatory/`.
- `npm run prototype:preview -- --host 127.0.0.1 --port 4178` serves that build; open `/observatory.html`.
- `npm test` covers the new learning loop alongside the existing exam checks.

The bookshelf presents illustrated course covers and a ribbon on the selected volume. Chapter tabs open a translucent study workspace with a reading preview and session planner. Liquid-glass covers, beveled shelf edges, watery light, and the shared Syne typography keep the Frutiger Aero identity. Mint green, sky blue, and honey distinguish the courses. The bookshelf navigation gives the app its own structure within the company identity. Day/night themes and narrow phone layouts are supported. The existing `/observatory.html` route and storage key are retained so saved progress carries forward.

The prototype includes course/chapter selection, two suggested session lengths, readings, confidence-aware recall, optional source notes, mistake reflections, recap, review shelf, pause/resume, and progress reset. The five-minute option includes two questions; the ten-minute option includes three. These are estimated session sizes, not timers.

Progress is versioned under `lumitudy-observatory-v1` in local storage. It is browser-local, not account-synced. Malformed saved data falls back to a clean prototype state. Storage failures show a temporary-progress warning. Reset touches only prototype progress; account sessions and saved study sets are not accessed. A completed session updates the review shelf from each question's most recent answer and confidence. A correct, confident retry clears that question. Progress counts represent questions explored, not demonstrated mastery.

The bookshelf sample progress is not account-synced, and uploaded textbooks do not yet replace the sample course covers. Authentication and multiplayer are connected: signed-out players return to Play together after login/signup; joining requires a code but no upload; hosting accepts an existing account textbook or a new PDF/DOCX/EPUB and uses the existing quiz generation service. Game sockets close when leaving the screen or logging out. Adaptive scheduling and Google sign-in remain outside this change.

### Connected local preview

From `frontend/`, run `../.venv/bin/python scripts/preview-api.py` in one terminal and `npm run prototype -- --host 127.0.0.1 --port 4178 --strictPort` in another. The API binds only to `127.0.0.1:8000`; the preview forwards `/api` HTTP and WebSocket requests. The launcher uses ignored `.preview-data/` for its database and uploads, and explicitly enables development cookies for loopback origins only. Local-preview accounts are separate from the live app. The backend can still load its existing AI-provider configuration for generation; an API key is needed to generate real questions.

To target a different service explicitly, configure `VITE_API_URL` before starting/building the preview. `LUMITUDY_PREVIEW_API_TARGET` can change the proxy destination. Deploying the separate build requires the corresponding API/proxy configuration; opening a downloaded HTML file cannot provide connected account or multiplayer services.

Validation covers account registration/login, returning to multiplayer, joining without a book, host chapter selection, library failures, socket cleanup, and a real two-account backend quiz round with fixed generation output. It does not claim a live paid-model generation test.


## Cookie sessions (local migration, not deployed)

Both frontend entries use `src/api.js`, a dedicated credentialed API client. The login credential is an HttpOnly cookie; no bearer token is saved in localStorage or included in game URLs. Old local token keys are removed on startup. `/auth/session` restores identity and supplies an in-memory CSRF token; every modifying request attaches it. Login/signup rotate the session and CSRF token. Logout revokes the server session before clearing the UI; a network failure leaves an explicit retry message.

The backend stores SHA-256 hashes of random 256-bit session credentials in the new `browser_sessions` SQL table. Sessions have a seven-day absolute lifetime and expire after 24 hours of inactivity. Anonymous CSRF bootstrap sessions last 30 minutes. Game heartbeats do not extend inactivity; player actions do. WebSockets require the cookie, exact allowed Origin, and matching username. They check sessions on each message and every 15 seconds; local logout wakes the connection immediately. Game rooms are still in memory: use one backend process/instance until shared room storage is implemented.

### Existing Render service and Vercel rollout

Do not publish only one half of this migration. Old clients use bearer tokens and will need a refresh and a fresh sign-in after rollout. The migration retains account records, password hashes, and documents only if the underlying database and uploads survive deployment. Back them up first; a free Render service's local files are ephemeral. Startup adds `browser_sessions` using the existing table-creation mechanism; it does not replace the users table. A rollback to old JWT code would re-enable any still-valid old JWTs unless its signing key is rotated first.

1. Add `api.lumitudy.com` to the **existing** Render web service's custom domains, apply the DNS record Render supplies, and wait for HTTPS validation.
2. On that service set `SESSION_COOKIE_SECURE=true` and `ALLOWED_ORIGINS=https://lumitudy.com,https://www.lumitudy.com`. The production cookie is `__Host-lumitudy_session`, with Secure, HttpOnly, SameSite=Lax, Path=/, and no Domain attribute. Never use the local insecure-cookie setting on Render.
3. Set Vercel's `VITE_API_URL=https://api.lumitudy.com` and rebuild the intended entry. An unrelated `onrender.com` API and `vercel.app` frontend are cross-site and are deliberately not the production cookie setup. Test under the custom domains, including Safari.
4. Preserve the existing `DATABASE_URL` and `UPLOAD_DIR`. Confirm that SQLite **and uploaded files** reside on an attached persistent disk, or use a managed database plus durable file storage. Render's ordinary filesystem is ephemeral. Do not point the service at a fresh empty path without migrating its existing data. `SECRET_KEY` is no longer used by this session implementation; provider API secrets remain backend-only.
5. Coordinate backend and frontend rollout, then test register, login, refresh, logout/replay rejection, upload ownership, and a two-player game on the production domains. No deployment or DNS changes have been made by this local work.

Session/CSRF regression checks: `../.venv/bin/python -m pytest ../backend/tests -q` and `npm test`. The cookie change reduces credential theft through scripts; it does not make XSS harmless. Login throttling, email verification, and password recovery remain separate hardening work.
