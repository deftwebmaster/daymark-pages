# Architecture

## Static app and navigation

`public/` is both the source for the browser and the deployment output. A static host serves the entry point, CSS, native JavaScript modules, JSON, images, and the manifest. Server endpoints and runtime dependencies are unnecessary.

The registry maps an ID to a renderer, label, icon, navigation group, enabled status, and optional Today card. Routes use `#/<feature>/<optional segments>`; a hash change re-renders the current module and moves keyboard focus to the main landmark. Browser Back and Forward retain route history. For a new module, export a renderer that accepts the context and returns `{ title, html }` for a known route or `null` for an unknown one. Add `shareTitle` to a detail with a public share button. Use the existing UI helpers to escape display text and build links, cards and reading sections.

The browser requests the app shell for each direct link. Fragments remain in the browser, including for difficult-moment screens. Browser history can retain those fragments. There is no app-level history of situation visits, and requests contain no personal recovery information. Shared routes identify resources. The preview shares its actual origin, and the configured production origin can supply a canonical base.

## Data

Database `daymark-local`, version 1. Each store uses `id` as its key path.

| Store | Key | Value |
| --- | --- | --- |
| `profile` | `sobriety` | Local calendar date as `YYYY-MM-DD`. No record when unset. |
| `preferences` | `theme`, `language`, `size`, `motion`, `onboarding` | One setting per record, with bounded enums or a boolean |
| `favorites` | Resource route path | Presence means saved |
| `metadata` | `schema` | Schema marker |

The initial upgrade creates these stores. Add future stores by checking `oldVersion` in `onupgradeneeded`; preserve existing stores unless a deliberate, tested migration requires different handling. Updating a preference writes its individual key. Toggling a favorite reads and writes its key in one transaction. Restore and clear update all personal stores in one transaction, and tabs refresh data when they regain focus.

The localStorage key `daymark.theme` is a synchronous copy for first paint. Successful database reads replace it with the authoritative theme. If IndexedDB cannot open, use an in-memory state with a visible notice. Backup version 1 uses `{ format, version, date, preferences, favorites }`. The reader validates dates, bounded preferences, favorite path shape, and size before accepting the file. Restoring a valid backup requires confirmation.

## Calendar model

The chosen local date counts as zero. An integer Gregorian ordinal gives elapsed calendar days across daylight saving time and leap years. The “24 hours” milestone uses the next calendar date. Months and years use the start date as the anchor and clamp to the last day of shorter target months. Progress measures the fraction from the latest milestone or day zero to the next milestone. The app checks the local date on focus, on visibility, and periodically while open.

## PWA

Install precaches the complete release in a cache keyed by scope and version. The worker caches the HTML entry point by its directory URL so the Pages redirect from `index.html` works with offline navigation. It serves the entry point and static assets from the same cache to keep the shell and content on the same release. The fallback page handles other navigation in scope when the network is unavailable. Unlisted requests use the network. The app does not cache external pages or place personal data in Cache Storage.

A new worker remains waiting while the current worker serves installed clients. The app displays **Reload to update** when the worker has cached the new release. Selecting it sends an activation message and reloads that tab after the controller changes. Activation removes old Daymark caches in the same scope and leaves IndexedDB intact. Other open tabs continue showing their current page and receive the new files when reloaded. Every deployment that changes the shell or library must use a new cache version.

## Accessibility

Use native links, forms, fieldsets, buttons, and dialogs. The shell provides labeled navigation, a skip link and a focus target for route changes. Confirm destructive changes in a modal with focus initially on Cancel. Use the system text scale, three reading sizes, sufficient text and focus contrast, reduced-motion preferences, and responsive navigation. Screen reader and native installation checks should be repeated on physical devices before publication.

## Artwork

The built-in ImageGen tool generated the landscape and reframed it for the larger StepOneArt crest. The active photo is `public/assets/images/daybreak.jpg`. The original generation prompt was:

> Create a landscape 3:2 image for the right half of a premium recovery companion web app hero. Editorial analog landscape photograph, lightly film-grained, timeless and peaceful. Sunrise in the Appalachian foothills, slender layered jade and dark forest green ridges, valley mist, a small soft golden sun just above the hills in the upper middle-right, deep grassy foreground with delicate backlit meadow stems at the far right edge. Celadon shadows and warm amber sky, restrained palette, cinematic and quiet, realistic image with good tonal depth, dark left margin for a forest-green gradient overlay leading into the hero card. No people, buildings, type, borders, graphics, lens flare or excessive saturation. Strong composition when cropped in wide and narrow frames.

The edit prompt used the original sunrise as its image reference.

> Reframe the supplied Daymark sunrise landscape photograph for the website hero, landscape 3:2. Keep the recognizable Appalachian foothill landscape, layered jade and forest green ridges, soft valley mist, and dark botanicals in foreground, as well as the warmth and film texture of the reference. Change the composition decisively: position the only sun as a distinct round golden-white disc centered about 58% from the left and 43% down from the top, sitting just clear above the distant ridgeline. Give the disc about 3% of the image width, with a soft warm halo and open sky so its round edge reads clearly in a phone crop. Keep the left 40% rich dark evergreen with quiet low-detail texture for overlaid cream text. The bottom right should have natural muted detail for a separately overlaid crest. Retain realistic morning exposure, warm olive and amber light on the right, and soft foreground grasses. Recompose the ridgeline descending from left to that low sunrise and rising gently on the far right. The file is the landscape photograph only, with no logo, badge, letters, double sun, graphics, border, lens flare, or blown-out haze.

The SVG and PNG marks depict sunrise over ridgelines. The maskable and Apple touch icons use a full-bleed forest background with their foreground within the central safe area.
