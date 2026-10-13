# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Docs first (required)

**Before generating any code, ALWAYS first read the relevant documentation file(s) in the `/docs` directory.** Every piece of code Claude Code writes must follow the conventions and requirements those docs describe. If no file in `/docs` covers the task, say so before proceeding. Current docs:

- `docs/ui.md` — UI conventions

## Commands

```bash
npm run dev     # next dev (http://localhost:3000)
npm run build   # next build
npm run start   # next start (after build)
npm run lint    # eslint (flat config, next/core-web-vitals + next/typescript)
```

There is no test runner configured. Type-check with `npx tsc --noEmit`.

## Stack and important caveats

- Next.js **16.4.0**, React **19.3.0**, Tailwind CSS v4, TypeScript (strict), App Router under `src/app/`. Path alias `@/*` → `./src/*`.
- `AGENTS.md` warns that this Next.js version has breaking changes relative to common training data. **Read the relevant guide in `node_modules/next/dist/docs/` (`01-app/` for App Router) before writing Next.js code**, and heed deprecation notices.
- `next dev` re-creates the `AGENTS.md` block if removed; commit it rather than deleting it.

## Architecture notes

- **Cache Components is enabled** (`cacheComponents: true` and `partialPrefetching: true` in `next.config.ts`). Data fetching is dynamic by default; caching is opt-in via the `use cache` directive (with `cacheLife` / `cacheTag`). Routes are partially prerendered: a static shell is served while dynamic content streams in. Navigation uses React `<Activity>`, so previous routes stay mounted-but-hidden and keep component state. Requires the Node.js runtime (no `runtime = 'edge'`). Docs: `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/cacheComponents.md`.
- **Tailwind via Turbopack loader**: `next.config.ts` wires `@tailwindcss/turbopack` as a Turbopack rule for `*.css` rather than using a PostCSS config. Styling is entered through `src/app/globals.css` (`@import "tailwindcss"`, theme tokens `--background`/`--foreground`, dark mode via `prefers-color-scheme`).
- **Typed route props**: `src/app/layout.tsx` uses the globally available `LayoutProps<"/">` helper (generated types, no import) instead of hand-written props types. Expect the same pattern for `PageProps<...>`.
- Fonts (Geist, Geist Mono) are loaded with `next/font/google` in the root layout and exposed as CSS variables consumed by `@theme inline` in `globals.css`.

## Current state

The project is still the unmodified Create Next App scaffold (`src/app/page.tsx` is the default landing page; layout metadata is still "Create Next App").
