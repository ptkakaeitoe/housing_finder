<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Saved user preferences

- Prefer Tailwind utilities for UI styling. When existing CSS conflicts with Tailwind, remove or refactor the conflicting CSS instead of adding override rules. Keep shared tokens and CSS that still serves a purpose.
- Keep authentication pages within the viewport. Make registration content compact enough to fit typical desktop screens without a separately scrolling right panel; retain page scrolling only as a fallback for small screens or zoom. Preserve the sign-in page’s existing appearance when changing registration.
