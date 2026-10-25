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

Existing study components use semantic color variables so questions, results, friends, and multiplayer stay readable in both appearances. The visual refresh does not change API paths or backend authentication. Source passages are described as review aids, not automatic proof of correctness.

Domain, hosting, and deployment configuration are managed separately from this frontend design.
