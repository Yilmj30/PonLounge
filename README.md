# PON Lounge — La Sala del Tiempo

The real, production-track site for **PON Lounge**, a VIP lounge in
Medellín built as an ode to time and luxury — precision, exclusivity, and
timeless nightlife (deliberately not a literal theme like an "exotic watch
museum" — the motif is time itself). Built with Next.js (App Router) +
TypeScript + Tailwind CSS v4, deployable on Vercel.

> This repo replaces the static HTML preview that used to live in
> `../borrador pon lounge/site`. That folder is kept only as an archived
> reference for the earlier draft — all new work happens here.

**Brand direction (locked in):**

- **Concept:** "La Sala del Tiempo" — time and VIP/luxury as the motif.
- **Tagline:** _"Donde el tiempo se detiene y el lujo no tiene hora."_
- **Palette:** obsidian black + brass/gold, with a deep emerald accent.
  Typography: Playfair Display (headings) + Inter (body).

The cocktail menu (`src/data/menu.ts` → `cocktailMenu`), gallery photos, and
address are the client's real info. Food and testimonials are still
placeholder/sample content pending the client's real information.

## Tech stack

| Concern       | Choice                                                   |
| ------------- | -------------------------------------------------------- |
| Framework     | Next.js 16 (App Router, Turbopack)                       |
| Language      | TypeScript (strict)                                      |
| Styling       | Tailwind CSS v4 (CSS-first `@theme` config)              |
| i18n          | Custom ES/EN context (`src/lib/i18n`), no page routing   |
| Database      | Postgres (Vercel Postgres / Neon) + Drizzle ORM          |
| Email         | Resend (automatic reservation confirmations)             |
| Unit tests    | Vitest + React Testing Library                           |
| E2E tests     | Playwright (API responses mocked via route interception) |
| Lint / format | ESLint (`eslint-config-next`) + Prettier                 |
| Git hooks     | Husky + lint-staged (auto lint/format on commit)         |
| CI            | GitHub Actions (`.github/workflows/ci.yml`)              |
| Hosting       | Vercel                                                   |

## Getting started

Requires Node 20+.

```bash
npm install
cp .env.example .env.local   # then fill in real values as they become available
npm run dev
```

The app runs at **http://localhost:3100** (not the Next.js default 3000 —
pinned explicitly so it never collides with other local projects).

Without `DATABASE_URL` set, reservations still book automatically — they're
just stored in a local, file-simulated database instead of real Postgres
(see "Reservations" below). Nothing to provision, nothing breaks.

## Reservations: automatic, no one has to manage them

The reservation wizard books directly against a database — no person has
to read WhatsApp and reply. The flow:

1. Customer picks a date → the UI fetches real remaining capacity per time
   slot (`GET /api/availability?date=`).
2. Customer fills in their details and hits **Confirmar reserva** →
   `POST /api/reservations` checks capacity and inserts the reservation
   atomically, so two people booking the last spot at the same moment
   can't both succeed — no double-booking race condition.
3. On success, a confirmation email is sent immediately via Resend (only
   when running against real Postgres — see below). No inbox to check, no
   reply needed.
4. If a slot is full or something goes wrong, the customer sees that
   instantly and can pick another time — never a false "confirmed".

**Two backends, chosen automatically** (`src/db/reservationsStore.ts`):

- **No `DATABASE_URL`/`POSTGRES_URL` set** (the default, e.g. fresh clone
  or before Postgres is provisioned): reservations are stored in a local
  JSON file at `.data/local-reservations.json` (gitignored, created
  automatically). This is a real working booking system — capacity limits,
  slot locking, everything — just backed by a file instead of Postgres.
  Good enough to run the venue on while the real database isn't set up
  yet. On serverless (e.g. an early Vercel deploy without Postgres
  configured), writes are best-effort per instance since the filesystem
  isn't persistent there — provision Postgres before relying on it in
  production.
- **`DATABASE_URL`/`POSTGRES_URL` set**: reservations go through real
  Postgres (Neon) via the `book_reservation()` SQL function, which uses
  `pg_advisory_xact_lock` for the same atomicity guarantee. Confirmation
  emails only fire in this mode.

If the API itself is unreachable (network error, not just an empty
database), the wizard **falls back further** to the original manual flow
(WhatsApp / call / email with a prefilled message) — see
`ReservationWizard.tsx`'s `slotsFailed`/`liveMode` state.

### Switching to real Postgres

1. **Provision Postgres on Neon.** Create a project at
   [neon.tech](https://neon.tech) (free plan is enough to start). Neon is
   reached over HTTPS, so it works from any host (Hostinger, Vercel, a
   VPS...) with no code changes.
2. **Set the connection string.** Copy it from Neon's dashboard
   (**Connect** → connection string, with `sslmode=require`) into
   `DATABASE_URL` — in `.env.local` locally, and in the hosting panel's
   environment variables in production.
3. **Create the tables, install the SQL functions, seed time slots:**
   ```bash
   npm run db:setup
   ```
   This runs `db:migrate` (applies `src/db/migrations/`) and then `db:seed`
   (installs `book_reservation()`/`approve_deposit()`/`reject_deposit()` and
   upserts the slots from `src/lib/hours.ts`). Safe to re-run.
4. **Add a Resend API key** (resend.com → API Keys → Sending access) as
   `RESEND_API_KEY` in `.env.local` and in the hosting panel's env vars. Until
   a real domain (e.g. `ponlounge.co`) is verified in Resend, emails send
   from `onboarding@resend.dev`, which works fine for any recipient — just
   swap the `FROM_ADDRESS` in `src/lib/email.ts` once a domain is verified.

### Database tables

| Table                      | What it stores                                                                                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `reservations`             | Every booking: customer details, date/time, party size, status, channel (`web`/`email`), language, deposit (required/reported/reference/verified), and when it was created/confirmed/cancelled and why |
| `slot_capacity`            | Capacity per time slot (seeded from `src/lib/hours.ts`)                                                                                                                                                |
| `deposit_receipts`         | The transfer screenshot the customer uploads, keyed by its `DEP-XXXXXX` reference                                                                                                                      |
| `processed_webhook_events` | Inbound-email webhook deliveries already handled, so a retry can't double-book                                                                                                                         |
| `menu_categories`          | Menu sections (Cócteles de la Casa, Whiskies…) and their order                                                                                                                                         |
| `menu_items`               | Every product: names/descriptions (ES + optional EN), price, photo, subgroup, visible/hidden, order                                                                                                    |
| `menu_images`              | Photos uploaded from `/admin/carta` (resized in the browser before upload)                                                                                                                             |

To change the schema: edit `src/db/schema.ts`, run `npm run db:generate`
(creates a new file in `src/db/migrations/` — commit it), then
`npm run db:migrate`.

### Changing hours or capacity

Operating hours, the last reservation time, and per-slot capacity all come
from one file: **`src/lib/hours.ts`**. It generates a slot every 30
minutes from open until the last reservation time (currently **4:00 p.m.
to 9:00 p.m.**, venue open until midnight), each with a default capacity
of **30** — both the local simulated DB and the Postgres seed
(`src/db/seed.ts`) read from it, so there's one source of truth regardless
of which backend is active.

- Editing `src/lib/hours.ts` and restarting the dev server updates the
  local simulated DB immediately (delete `.data/local-reservations.json`
  if you want to also clear existing local test bookings).
- On real Postgres, edit `src/lib/hours.ts` and re-run `npm run db:seed`
  (upserts, safe to re-run) — or update the `slot_capacity` table directly
  via Vercel's Postgres dashboard/Neon's SQL editor for a one-off change
  without redeploying.

### Cancelling a reservation

Self-service cancellation, no staff involvement needed, available two ways:

1. **Right after booking** — the confirmed step of the wizard shows a
   "Cancelar reserva" link (`CancelBlock` in `ReservationWizard.tsx`), using
   the reservation `id` already in memory from the booking response.
2. **From the confirmation email, any time later** — the email includes a
   link to `/cancelar/[id]`, a standalone page that shows the reservation's
   details and a confirm button. There's also `/cancelar` (no id), a small
   lookup form (paste the code or the full email link) for anyone who
   navigates there without a direct link — linked from the reservations
   section on the homepage, not the main nav.

Both paths call the same `POST /api/reservations/[id]/cancel`, which enforces
one business rule server-side: cancellation is blocked within
**`CANCELLATION_CUTOFF_HOURS`** (currently 2h, in `src/lib/hours.ts`) of the
reservation time — matches the "cancelaciones flexibles hasta 2 horas antes"
copy shown next to the wizard. Works against both backends (local-simulated
and real Postgres) the same way availability/booking do.

### Files involved

```
src/lib/hours.ts                # Single source of truth: hours, slots, capacity, cancellation cutoff
src/db/reservationsStore.ts     # Picks local-simulated vs real Postgres automatically
src/db/localStore.ts            # Local JSON-file-simulated DB (no setup required)
src/db/schema.ts              # Drizzle schema: reservations, slot_capacity, deposit_receipts, processed_webhook_events
src/db/migrations/            # Generated SQL migrations (npm run db:generate)
src/db/migrate.ts             # Applies migrations (npm run db:migrate)
src/db/client.ts               # Lazily-initialized Neon/Drizzle client
src/db/sql/book_reservation.sql  # The atomic booking Postgres function
src/db/seed.ts                  # Installs the function + seeds default slots (Postgres only)
src/app/api/availability/route.ts   # GET real-time remaining capacity
src/app/api/reservations/route.ts   # POST — books + triggers confirmation email
src/app/api/reservations/[id]/cancel/route.ts  # POST — cancels a reservation
src/app/cancelar/page.tsx           # Lookup form (paste a reservation code)
src/app/cancelar/[id]/page.tsx      # Cancellation confirmation page (from the email link)
src/lib/email.ts                # Resend confirmation email (includes the cancel link)
src/lib/reservation.ts          # Date/time formatting + cancellation-cutoff check
src/components/ReservationWizard.tsx     # Live mode + manual-fallback UI + inline cancel
src/components/CancelReservationPanel.tsx  # UI for the /cancelar/[id] page
src/components/CancelLookupForm.tsx        # UI for the /cancelar lookup page
src/lib/useCancelReservation.ts            # Shared cancel-request hook (used by both UIs)
```

## Menu admin (`/admin/carta`)

The owners edit the menu themselves — no code changes, no redeploy. Log in
at `/admin` with `ADMIN_PASSWORD`, then open **Carta**:

- Change prices, names, descriptions and photos (photos are resized to a
  ~200KB JPEG in the browser before upload).
- Add or delete products, move them between categories, reorder them.
- **Ocultar** hides a product from the public menu without deleting it
  (e.g. out of stock).
- Add, rename, reorder and delete categories (only empty ones can be
  deleted). English names/descriptions are optional — the site falls back
  to Spanish.

`/carta` and the home page teaser are statically cached and refreshed on
demand after every save (`revalidateMenuPages()` in `src/lib/adminApi.ts`),
so edits are live on the next visit.

**Where the data lives:** `npm run db:seed` copies `src/data/menu.ts` into
the `menu_*` tables **once** (when they're empty); from then on the database
is the source of truth and re-running the seed never overwrites the owners'
edits. Without `DATABASE_URL`, the same editor works against
`.data/local-menu.json` (created on the first edit). If the database is
unreachable, the public pages fall back to `src/data/menu.ts` instead of
erroring.

```
src/app/admin/carta/page.tsx          # Editor page (server: auth + load menu)
src/components/admin/MenuEditor.tsx   # Category/product list, search, actions
src/components/admin/MenuItemDialog.tsx, MenuCategoryDialog.tsx
src/app/api/admin/menu/**             # Admin API: items, categories, move, image upload
src/app/api/menu-images/[id]/route.ts # Public, cached photo serving
src/db/menuStore.ts                   # Postgres backend + backend selection + seeding
src/db/menuLocalStore.ts              # Local JSON-file backend
src/lib/menu.ts                       # Shared types, public-menu mapping, seed conversion
src/lib/menuValidation.ts             # zod schemas for the admin API
```

## Scripts

| Script                 | What it does                                          |
| ---------------------- | ----------------------------------------------------- |
| `npm run dev`          | Start the dev server on port 3100                     |
| `npm run build`        | Production build                                      |
| `npm run start`        | Serve the production build (port 3100)                |
| `npm run lint`         | ESLint                                                |
| `npm run lint:fix`     | ESLint with autofix                                   |
| `npm run format`       | Prettier — write                                      |
| `npm run format:check` | Prettier — check only (used in CI)                    |
| `npm run typecheck`    | `tsc --noEmit`                                        |
| `npm run test`         | Unit tests (Vitest), single run                       |
| `npm run test:watch`   | Unit tests, watch mode                                |
| `npm run test:e2e`     | E2E tests (Playwright, builds + serves the app)       |
| `npm run test:e2e:ui`  | E2E tests with Playwright's UI runner                 |
| `npm run db:generate`  | Generate a Drizzle migration from `schema.ts` changes |
| `npm run db:push`      | Push the current schema straight to the database      |
| `npm run db:migrate`   | Apply pending migrations from `src/db/migrations/`    |
| `npm run db:seed`      | SQL functions, time slots, and the menu (first run)   |
| `npm run db:setup`     | `db:migrate` + `db:seed` (first-time database setup)  |

## Project structure

```
src/
  app/
    api/availability/  # GET real-time slot capacity for a date
    api/reservations/  # POST — books a reservation
    carta/              # /carta — standalone menu page (accordion), for table QR codes
    layout.tsx, page.tsx, globals.css, robots.ts, sitemap.ts
  components/
    sections/           # Home page sections (Hero, About, MenuTeaser, ...)
    ReservationWizard.tsx, MenuAccordion.tsx, MenuItemPhoto.tsx, Header.tsx, Footer.tsx, ...
    *.test.tsx           # Co-located unit tests
  db/                    # Drizzle schema, client, atomic booking SQL, seed script
  data/menu.ts           # Initial menu, copied into the database by db:seed (then edited at /admin/carta)
  lib/
    i18n/                # ES/EN dictionaries + React context (no page routing)
    config.ts            # Contact details, sourced from env vars
    email.ts              # Resend confirmation email
    reservation.ts         # Date/time formatting, .ics generation, WhatsApp message builder
e2e/                     # Playwright specs (external APIs mocked via page.route())
.github/workflows/ci.yml # Lint, typecheck, unit tests, build, e2e on every PR
```

### Cocktail photos

Menu items render a branded gradient placeholder (`MenuItemPhoto.tsx`) until
a real photo exists. Upload photos from `/admin/carta` → **Editar** →
**Subir foto** — they show up on both the homepage teaser and `/carta`.

## Environment variables

See `.env.example` for the full list with comments. Copy it to `.env.local`
(gitignored) and fill in real values — never commit secrets.

`NEXT_PUBLIC_ENV=production` is what flips `robots.ts`/`sitemap.ts` to allow
indexing. Keep it unset (or anything else) until the real content is ready
to go live, so search engines don't index placeholder content.

## Deployment (Vercel)

This repo has not been connected to Vercel yet. To do that:

1. In the [Vercel dashboard](https://vercel.com/new), import the
   `NicoRDJ/pon-longue` GitHub repo — Vercel auto-detects Next.js, no
   config needed.
2. Add the environment variables from `.env.example` (at minimum
   `NEXT_PUBLIC_SITE_URL` pointing at the real domain, and
   `NEXT_PUBLIC_ENV=production` once content is ready to be indexed).
3. Provision Postgres and add `RESEND_API_KEY` as described in
   "Reservations" above, so automatic booking works in production too.
4. Every push to `main` deploys to production; every PR gets its own
   preview URL automatically — this is how collaborators can review changes
   without needing local setup.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) — branch naming, commit convention,
and the PR checklist (CI must pass: lint, typecheck, unit tests, build, e2e).
