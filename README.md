# NOVA DAILY — Personal News Desk MVP

A responsive, dark-mode personal news-content management workspace for preparing Facebook and Pinterest content.

## Run locally

1. Download and unzip the project.
2. Open `index.html` in a modern browser.
3. No build step or package installation is required.

## Included in this MVP

- Four editorial areas: Trending, USA News, Movies & TV, Entertainment.
- All requested categories and headline/search filters.
- Story inspection panel with source/evidence checklist.
- Local review queue with approve/reject actions.
- Manual story entry requiring an HTTPS source URL.
- Facebook and Pinterest draft-copy templates.
- Browser-generated 3:4 branded PNG poster template.
- Local browser persistence via `localStorage` and JSON export.
- Responsive desktop/mobile dark UI.

## Important limitations

- Seed stories are explicitly illustrative demo data, not current news.
- No live AP, Reuters, CNN or other news feeds are connected.
- No automated fact-checking or live trending-score provider is connected.
- Copy generation currently uses local templates, not an AI API.
- No social platform publishing is performed.
- Local data is stored only in the current browser profile. It is not a secure multi-user database.

## Production integration plan

1. **GitHub Pages:** host the static frontend. Keep repository public if using the standard GitHub Pages offering, and do not store secrets in the repository.
2. **Supabase:** add authentication, Postgres tables, Row Level Security and image storage. Move local story data to the database.
3. **Cloudflare Workers Cron:** run the 3-hour collection job server-side. Fetch permitted RSS/API sources and official primary sources. Keep API tokens in Worker secrets.
4. **Verification workflow:** store source URLs, timestamps, claim-level evidence, corroboration state and reviewer decision. Unverified items remain blocked from approval.
5. **OpenAI API:** call from a server-side Worker or protected function for summaries, captions and image generation. Never expose API keys in browser JavaScript.
6. **Social platforms:** initially download/copy content for manual publishing. Add official Meta/Pinterest APIs only after account permissions and app review are configured.

## Deploy to GitHub Pages

1. Create a GitHub repository, for example `nova-daily`.
2. Upload `index.html`, `styles.css`, `app.js` and `README.md` to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
5. Wait for the Pages deployment and open the published URL.

GitHub Pages serves the frontend only. It does not run scheduled jobs, private API endpoints or a database.
