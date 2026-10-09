# VisionaryGene — Receipt Platform

A clean, mobile-first, **multi-tenant** receipt management UI. Each organization
gets its own workspace — its own name, logo, contact details, brand colours,
customers, and receipts — and every one of those flows automatically into the
receipt, the printout, the PDF, and the browser tab. The platform is attributed
quietly: **Powered by VisionaryGene**.

Built with **Next.js (App Router) · TypeScript · Tailwind CSS v4**.

## Getting Started

```bash
npm install
cp .env.example .env    # points the app at the receipt API
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint
npm run test    # Vitest (brand/identity unit tests)
```

## Screens

| Route | What it does |
| --- | --- |
| `/signup` | Create an organization — org name, your name, email, password |
| `/login` | Sign in to an existing organization |
| `/` | Dashboard — today / week / month totals + recent receipts |
| `/receipts/new` | Issue a receipt — customer picker, live line totals, discount, payment status |
| `/receipts` | History — search, date & status filters (Paid / Partial / Pending / Void) |
| `/receipts/[id]` | Receipt document — share via WhatsApp, email, PDF (print), copy link; duplicate or void |
| `/customers` | Customer list with lifetime stats + detail drawer |
| `/settings` | Organization details, website, logo (auto-saves), brand colours, account |

Every route except `/login` and `/signup` requires a signed-in organization —
the app shell redirects to `/login` otherwise.

## Organization identity

The `Business` record **is** the organization. There is no second tenant model.

- `SessionProvider` fetches `GET /auth/me` once on mount; the response carries
  the whole `Business`, so the header, sidebar, monograms, receipt, and
  settings all read **one** object instead of fetching branding per screen.
- `refresh()` re-reads the session. Settings calls it after every save, so a
  renamed organization propagates to every surface — and to the browser title —
  without a reload and without any code change.
- Monograms come from `src/lib/brand.ts#initials(name)`. No organization and no
  fixed letter is baked into any component.
- Browser titles come from the framework's metadata system
  (`generateMetadata` → `pageTitle(section)` in `src/lib/server/brand.ts`),
  e.g. `ABC Pharmacy — Receipts`, `ABC Pharmacy — Settings`. Signed-out pages
  fall back to `… · VisionaryGene`. The server helper reads the session cookie,
  memoizes per request, and keeps a short process cache so navigating does not
  call the API once per view.
- **Logo-derived colour is optional and limited.** Uploading a logo samples its
  dominant colour and derives two colours (`brand_primary`, `brand_accent`) that
  only touch places brand colour already exists — receipt header band, total
  row, accents. The design system, layout, and chrome are never recoloured.
  `derivePalette()` solves both values against WCAG (13:1 for the band
  background, 4.5:1 for the accent on it), so a black, white, dark, light,
  low-contrast, or transparent logo still yields readable output.

## Design system

- **Palette:** cream `#FBF7EE` background, black `#111111` header/sidebar, gold
  `#B8912F` accent with `#D9B45C` tint, ink `#22262E` text, muted `#5A6472` secondary.
- **Type:** Inter for UI, Playfair Display for the wordmark and receipt headings.
- **One primary button:** solid gold with black text; secondary = black with gold text;
  destructive = muted grey outline (no red).
- Tokens live in `app/globals.css` (Tailwind v4 CSS-first `@theme` block).

## Data layer

All reads and writes go through `src/lib/api.ts`, an HTTP client for the real
receipt API. There is **no localStorage mock and no seed data** — an empty
account really is empty.

### Configuration

The API origin lives in `.env` (git-ignored) with a committed template:

```bash
cp .env.example .env.local   # then adjust if the API moves
```

```dotenv
API_URL=https://receipt-backend-1-biue.onrender.com/api
```

`API_URL` is read by `next.config.ts` **and** by `src/lib/server/brand.ts`
(server-side only). The client-side code never sees it.

### Why the `/api/*` proxy exists

`next.config.ts` rewrites `/api/:path*` → `${API_URL}/:path*`:

```ts
async rewrites() {
  return [{ source: "/api/:path*", destination: `${API_URL}/:path*` }];
}
```

The API's session cookie `el_session` is **`SameSite=Lax`**, so a direct
browser call from `localhost:3000` to the API host is cross-site: the cookie is
sent on the first request but dropped on subsequent ones, so signup returns
`201` and the very next `GET /auth/me` returns `401`. Proxying through Next
keeps the request **same-origin**, so the browser attaches the cookie normally.

Because of the rewrite, `src/lib/api.ts` calls **relative** paths
(`/auth/me`, `/receipts`, …) with `credentials: "same-origin"` — it never
builds an absolute URL. Signed logo URLs returned by the API (`/api/files/…`)
resolve back through the same proxy.

### What `src/lib/api.ts` does

- `request()` — one `fetch` wrapper: JSON headers, same-origin credentials,
  network-error handling, and throws an `ApiError` carrying `{message, code, details}`.
- `Api*` types mirror the wire format; `toBusiness` / `toCustomer` / `toReceipt`
  / `toSession` map them onto the UI's `src/lib/types.ts` types. Mappers are
  tolerant of fields an older API build may not return yet.
- `resolveReceiptId()` — the API only addresses receipts by UUID, but the UI
  routes use the human number (`ES-000001`), so reads search
  `GET /receipts?search=` first and fall back to passing the number through.
- `getReceipts()` pages client-side (`limit` is capped at 100 server-side).
- `getShareLinks()` returns both the expiring share URL and the **non-expiring
  verification URL** the QR code encodes; when a link can't be fetched the QR
  block is omitted and Copy is disabled rather than faking a URL.

### Auth

`src/lib/api.ts` implements `signUp` / `signIn` / `signOut` / `getSession`
against `POST /auth/signup`, `/auth/login`, `/auth/logout` and `GET /auth/me`.
The API sets an **httpOnly** cookie, so there is nothing readable in the
browser — `SessionProvider` resolves the session once on mount by calling
`/auth/me` and maps a `401` to "unauthenticated".

Every other endpoint is tenant-scoped by that cookie, **server-side**: one
organization can never read another's receipts, customers, or business record,
and role checks (owner vs. staff) happen in the API, not the UI.

### Business rules

- Receipts are **immutable after issue**: corrections are *void + reissue*.
  Voiding requires an audit note, and voided receipts stay in history struck through.
- Receipt numbers use the `ES-000214` format, allocated by the API.
- Payment status enum: `paid` / `partial` / `pending`. Receipt state: `active` / `void`.
  Payment methods: `cash` / `transfer` / `card` / `other`.
- Brand colours set in Settings are used by the **receipt document only** (inline
  styles), so the app chrome stays on the house palette.

## Receipts & verification

Every receipt carries the issuing organization's identity: logo (or a monogram
derived from the name), name, address, phone, email, website, receipt number,
date, customer, line items, subtotal, discount, total, and a QR code.

- The **QR encodes `GET /public/verify/:token`** — a signed, non-expiring
  capability token, not a guessable id. Opening it needs no login and shows
  only: organization, receipt number, amount, date, status. No line items, no
  customer details, no tenancy ids.
- The QR is always **pure black on white** with a quiet zone and no overlaid
  logo, so it survives being printed, photocopied, or screenshotted.
- Receipt `tax` / `tax_rate` are display-only (there is no tax input in the
  form); a tax row renders only when `tax > 0`, so legacy receipts reconcile.

## Project layout

```
app/                  # routes only (layouts & pages, incl. generateMetadata)
next.config.ts        # /api/* rewrite proxy to API_URL
src/
  components/
    auth/             # session provider + login/signup screen
    brand/            # Logo (organization mark, platform fallback)
    dashboard/        # dashboard view (client child of a server page)
    receipt/          # form, document, preview, history view
    customers/        # list + drawer
    settings/         # settings form + template preview
    shell/            # top bar, sidebar, bottom nav, app shell (auth gate)
    ui/               # Button, Card, Field, StatusBadge, dialogs, …
  lib/
    api.ts            # HTTP client
    brand.ts          # monograms, WCAG contrast, logo sampling, palette
    server/brand.ts   # server-side organization name for page titles
    types.ts          # domain types
```

## Printing / PDF

**Download PDF** on a receipt opens the browser print dialog. Print styles in
`app/globals.css` hide all app chrome (top bar, sidebar, page title, share
buttons) and render only the receipt document.

The printout is deliberately **monochrome**: header bands become rules, tinted
strips become white, and all text goes black — high contrast, low ink, and it
stays legible on any office printer. Two things keep their colour on purpose:
the organization's **logo**, and the **QR code**, which stays pure black on
white so it scans. The on-screen document and the API's own exported PDF keep
the full brand treatment.

### Logo

**Upload logo** in Settings saves immediately — no "Save changes" click needed.
It is stored on the organization record and flows into the receipt header, the
top bar, the sidebar, the settings preview, and the print/PDF output
automatically. Replacing or removing it does the same. Files are limited to
3 MB; anything the app cannot sample simply keeps the existing brand colours.
