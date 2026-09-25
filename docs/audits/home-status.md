# Homepage tool status

The homepage lists every registered tool (42 available) plus 12 selected planned tools. Available entries are generated from the same registry as the tool cards, so names/categories and local-storage labels stay aligned. Planned entries have no launch links and are not registered as working tools.

Search matches names or categories; status filtering selects Available, Planned, or all. Counters distinguish implemented tools from roadmap entries. The page explicitly states that this is implementation progress, not a live uptime monitor or promise of universal browser compatibility. Roadmap entries are not delivery commitments.

Validation before PR merge:

- 56 unit tests passed, including a registry/status coverage and uniqueness check.
- 116 browser tests passed against the production build in desktop and mobile-emulated Chromium.
- New browser checks verify every available tool has exactly one status-table launch link, planned tools are non-launchable, filters/empty states work, and status links open the correct tool.
- Existing dashboard axe checks passed in light/dark themes on both viewport profiles with the new section present.
- Production build passed. Deployment/offline caching remain pending; merging source into main does not itself configure GitHub Pages publishing.
