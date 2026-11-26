# Newleaf Version 1 implementation plan

The starting checkout contained only Git metadata. Build a standalone static application under `public/`, the deployment directory.

| Pass | Deliverables | Checks |
| --- | --- | --- |
| 1. Foundation | Responsive shell, feature registry, hash routes, theme tokens and Today screen | Route rendering, keyboard focus and layout at mobile and desktop widths |
| 2. Core features | IndexedDB, optional setup, calendar-based sobriety tracker and searchable prayer library | Date boundaries, persistence, filtering, favorites and sharing fallbacks |
| 3. Recovery resources | Ten situations, guided practices, twelve step guides, assignments and printable worksheets | Deep links, content references, offline essentials and print layout |
| 4. Settings and PWA | Backup and restore, deletion, privacy, About, installation and opt-in updates | Invalid backups, update lifecycle, offline reload and supported installation surfaces |
| 5. Refinement | Cross-viewport and keyboard QA, release documentation | Record the tested surfaces and remaining launch checks |

Use English for the initial release and label the U.S. emergency and crisis numbers explicitly. Use independent recovery copy with links to verified primary sources. Keep historical texts unavailable pending rights and editorial review. John should review the mission copy, recovery guidance and prayer language before publication.

Keep this checkout local. The eventual deployment domain is configurable.
