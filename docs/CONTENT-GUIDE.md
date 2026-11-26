# Content guide

The app loads `public/content/library.json`. The root `schema` identifies the JSON structure. The root `version` identifies the editorial release. Use lowercase, hyphenated IDs and preserve them once published. Existing routes, backups, and related links depend on them. Keep source URLs public and label them as online in the interface.

## Add a prayer

Put the record in `prayers`. Use category IDs from `prayerCategories`. Use arrays of paragraphs for `original` and `modern`. An optional `step` identifies a supported step. Include `source.title` and `source.rightsStatus`. For historical sources, include the publisher URL, edition, and printed page where applicable. Use `source.credit` for a required credit line, `source.excerpt` for a partial quotation, and `source.note` for context.

```json
{
  "id": "eleventh-step-prayer",
  "title": "Eleventh Step Prayer",
  "categories": ["step-prayers"],
  "step": 11,
  "source": {
    "title": "Twelve Steps and Twelve Traditions",
    "page": "99",
    "url": "https://www.aa.org/sites/default/files/2022-01/en_step11.pdf",
    "rightsStatus": "requires-review"
  },
  "original": null,
  "modern": null,
  "related": ["listening-prayer"],
  "editorialStatus": "requires-review"
}
```

The interface can show Daymark-authored material with `source.rightsStatus: "original-daymark"`. The current authored prayers are marked `daymark-preview` for John’s review before publication. For external or historical material, the interface requires `editorialStatus: "published"` and `source.rightsStatus: "approved"` to show text. Record permission and attribution in editorial notes before adding text to the public JSON. Keep passages and adaptations out of shipped assets until cleared. Even a hidden JSON field is downloadable. If a prayer has one readable version, the app displays it regardless of the reader’s preferred language. Source credit accompanies copied text.

## Add a difficult moment or reflection

Each situation has `id`, `title`, optional `detailTitle`, `icon`, `tone`, `grounding`, `principle`, `prayers` (IDs), `reading` (assignment ID), `actions` (a short ordered array), `connection`, and `urgent`. A true `urgent` flag shows live-support options near the top. Use directly usable language and suggest human connection. Verify crisis contact information before release. The situation route becomes `#/moment/<id>`. Situational guidance needs to make sense offline, including the actions and prayer selections.

A practice has `id`, `title`, `short`, `intro`, `icon`, `tone` and ordered `sections`. Each section has a `title` and may have `text`, `questions`, `prayer` or `reading`. Practice questions are for reflection and the interface has no response fields.

## Add a sponsor resource

| Collection | Fields and location |
| --- | --- |
| `toolkitGroups` | `id`, `title`, `description`, `icon`, `tone`. Most groups correspond to a collection or a resource category. |
| `steps` | `id`, `number`, `title`, `principle`, `intro`, `reading`, `questions`, `exercises`, `prayers`, `worksheets`, `related`. |
| `readings` | `id`, `title`, `step`, `source`, `reference`, `url`, `instructions`, `questions`, `related`. Routes live at `#/toolkit/readings/<id>`. |
| `worksheets` | `id`, `title`, `step`, `intro`, and `fields`, an array of `[prompt, hint]` pairs. Blank writing space appears in print. Routes live at `#/toolkit/worksheets/<id>`. |
| `resources` | `id`, `category`, `title`, `intro`, `sections`, `related`, optional `source` with `title` and `url`. Each section has a `title` and `text` paragraphs or `items`. |

Use globally unique IDs across toolkit collections because related toolkit links resolve an ID across those collections. Use step or resource IDs in `related`, and prayer IDs in `prayers`. Each step guide’s text describes a possible approach. The official Twelve Steps are available through the linked A.A. source.

## Publish a content revision

1. Validate the JSON and verify that all referenced IDs exist.
2. Check sources, permissions, and language with the designated editor. Preview each change and test the relevant shared path.
3. Update the library’s `version` and the service worker’s `CACHE_VERSION`.
4. Confirm that content works after an offline reload. If a reading needs an external site, its offline instructions should still be understandable.
