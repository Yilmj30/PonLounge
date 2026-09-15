# Contributing to PON Lounge

Thanks for helping build this. A few conventions to keep the repo easy for
everyone to work in together.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

See the [README](./README.md) for the full script list and project
structure.

## Branching

- `main` is always deployable — every push to it goes live on Vercel.
- Work on feature branches: `feat/menu-page`, `fix/hero-mobile-spacing`,
  `chore/upgrade-next`.
- Open a PR into `main`. Don't push directly to `main` unless it's a trivial
  fix you've already verified locally (lint + build + tests green).

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add reservations wizard step 2 (date & time)
fix: correct clock hand rotation on ClockMark
chore: bump next to 16.3
docs: update deployment steps in README
test: add e2e coverage for mobile nav
```

This keeps history scannable and makes it easy to generate changelogs later
if we want to.

## Before opening a PR

Run the full check locally (the same checks CI runs):

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

A pre-commit hook (Husky + lint-staged) already auto-formats and lints
staged files, so most of this should be clean by the time you commit. CI
will block merging on `main` if any of these fail.

## Code style

- Don't fight the formatter — if `prettier --write` changes it, that's the
  style. Tailwind classes are auto-sorted by `prettier-plugin-tailwindcss`.
- Prefer editing/extending existing components over introducing new
  patterns for the same problem.
- Keep components small and colocate their unit tests
  (`Component.tsx` + `Component.test.tsx`).
- No dead code, no commented-out blocks — delete it, git history remembers
  it if we need it back.

## Design/content changes

The brand direction (name, tagline, palette, "Sala del Tiempo" concept) is
locked in — see the README. Menu items, reservation details, address, and
photos are still placeholders; when replacing them with real content, keep
the data-driven pattern already used elsewhere (config/JSON in, component
renders it) rather than hardcoding real business data directly into JSX,
so it stays easy to update without a code change later.

## Questions

Open an issue or ask in whatever channel the team is using — don't block on
a design decision, just flag it in the PR description and keep moving on
everything else.
