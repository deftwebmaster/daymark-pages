# Newleaf by StepOneArt

Newleaf is a browser-local recovery companion for sobriety milestones, prayer, morning and evening reflection, difficult moments, and Twelve Step sponsorship. It runs from static files and works offline after its first successful online load.

## Run locally

From this directory, serve `public/` with any static web server. For example:

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory public
```

Open [Newleaf locally](http://127.0.0.1:8765/). A local loopback address is a secure context for service workers. Use HTTPS for hosted or cross-device testing. Keep the hostname and port consistent to retain that browser profile’s data. The app has no build or install step.

## Static hosting and Cloudflare Pages

Serve the contents of `public/` as the web root with HTTPS and correct JavaScript, JSON and manifest MIME types. The site uses hash routing and supports links such as [Step Four](http://127.0.0.1:8765/#/toolkit/steps/step-4) without server-side routing rules. On other static hosts, mirror the security headers in `public/_headers` where supported. Serve `sw.js` with revalidation.

Cloudflare Pages can accept the `public` folder directly via **Workers & Pages → Create application → Get started → Drag and drop your files**. For Git integration, use no framework preset, set the output directory to `public`, and leave the build command empty or use Cloudflare’s documented no-op `exit 0`. The intended custom hostname lives in `public/js/config.js`. [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/) · [Static HTML setup](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)

Production is configured for [app.steponeart24.com](https://app.steponeart24.com/) and the [daymark-pages GitHub repository](https://github.com/deftwebmaster/daymark-pages). Use `main` as the Cloudflare Pages production branch.

## Code map

| Location | Responsibility |
| --- | --- |
| `public/index.html` | Semantic entry point, stylesheet and native ES module |
| `public/js/config.js` | Product name, tagline, StepOneArt link, theme colors, deployment URL, app version |
| `public/js/registry.js` | Feature IDs, navigation placement, home cards and renderers |
| `public/js/app.js` | Hash routing, shell, actions, dialog, preference and PWA integration |
| `public/js/core/` | Calendar dates, IndexedDB, validated backups, content loader and shared UI |
| `public/js/modules/` | Today, tracker, prayers, guided practice, difficult moments, toolkit and settings |
| `public/content/library.json` | Versioned recovery library and source metadata |
| `public/css/app.css` | Design tokens, adaptive layout, accessibility and print styles |
| `public/sw.js` | Versioned offline shell, cache cleanup and user-controlled updates |

[Architecture](docs/ARCHITECTURE.md) covers the design decisions and IndexedDB details. [Content guide](docs/CONTENT-GUIDE.md) covers schemas and editorial workflow.

## Add content or features

- Add a prayer in `prayers` with an immutable ID, category IDs, attribution, editorial status, optional text variants, and related prayer IDs. Keep unresolved historical text fields null.
- Add a difficult moment in `situations` with a choice label, grounding copy, principle, Newleaf prayers, reading ID, practical next actions and a connection prompt.
- Add sponsor resources in `resources`, `readings` or `worksheets`. Assign the relevant category or step, and link the IDs from the appropriate step or other resource. The existing templates render shareable routes and print styles.
- Add a feature by exporting its renderer and registering it in `registry.js`. The registry controls navigation and the Today resource cards. Add any new files to the worker’s shell list so they work offline.

## Branding and versions

Change in-app branding, the StepOneArt logo and artwork, and the deployment URL in `public/js/config.js`. Change surface colors and type in `public/css/app.css`. When rebranding, sync the browser-facing manifest, initial HTML metadata, offline title, and icon files. Keep the manifest ID and app scope stable for existing installs. The app uses the current host for preview links and the configured base URL on the production origin.

Update `config.version` for an app release and `library.json`’s `version` for a content release. Increment `CACHE_VERSION` in `sw.js` whenever any precached file changes, even for content-only releases. Increment database and backup schemas only for data format changes and provide explicit migration code.

The [daybreak artwork](public/assets/images/daybreak.jpg) was generated with built-in ImageGen. Its complete generation prompt is recorded in the [architecture notes](docs/ARCHITECTURE.md#artwork).

## Local data and PWA behavior

The `daymark-local` IndexedDB database uses schema 1. The `profile` store holds the optional date, `preferences` holds individual settings, `favorites` holds stable resource keys, and `metadata` holds the schema marker. A synchronous localStorage theme hint avoids a color flash. IndexedDB is authoritative.

Personal data and JSON backups are unencrypted. Clearing site data or removing the app can erase it. If IndexedDB is unavailable, Newleaf displays a notice and keeps changes in memory for that visit. Import validates the file and replaces local data only after confirmation. It never uploads a file.

The browser downloads the app shell and library during the initial service worker installation. Subsequent updates prepare a complete cache and wait for **Reload to update**. Web links and phone services require their respective connections. Install instructions are in Settings. On iOS, open the app in Safari and use **Share → Add to Home Screen**.

## Verification and launch limits

- Chromium browser checks covered all ten difficult moments, both reflections, the twelve step guides, search and language switching, favorites, assignment link fallback, printable worksheet layout, local storage, invalid imports, backup restore, and destructive-action confirmation.
- Checked Chromium install eligibility and manifest validation, an offline deep-link reload, and a two-version service worker update that preserved local data.
- Checked keyboard navigation and focus, light and dark themes, narrow and landscape layouts, enlarged reading text, and calendar calculations across daylight saving transitions and leap years.
- Physical-device installation, VoiceOver and TalkBack walkthroughs, and production-origin smoke tests remain release checks. Native sharing varies by browser. The app offers clipboard and manual copying where needed.
- The library includes cleared prayer text and excerpts, the short Serenity Prayer, the Step Eleven Peace Prayer, and original Newleaf companion prayers. The initial emergency and crisis numbers are labeled for the United States. See the [editorial review](docs/EDITORIAL-REVIEW.md).

[Implementation plan](docs/IMPLEMENTATION-PLAN.md) · [Roadmap](docs/ROADMAP.md)
