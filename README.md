# Eleosstyles — Receipt System

A clean, mobile-first receipt management UI for **Eleosstyles**, a Lagos-based bespoke
fashion house. Issue branded receipts, track payment status, manage customers, and
share or print receipts — all from one dashboard.

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
| `/settings` | Business details, logo (auto-saves), brand colours with a live template preview, account |

Every route except `/login` and `/signup` requires a signed-in organization —
the app shell redirects to `/login` otherwise.

## Design system

- **Palette:** cream `#FBF7EE` background, black `#111111` header/sidebar, gold
  `#B8912F` accent with `#D9B45C` tint, ink `#22262E` text, muted `#5A6472` secondary.
- **Type:** Inter for UI, Playfair Display for the wordmark and receipt headings.
- **One primary button:** solid gold with black text; secondary = black with gold text;
  destructive = muted grey outline (no red).
- Tokens live in `app/globals.css` (Tailwind v4 CSS-first `@theme` block).

## Data layer

All reads and writes go through `src/lib/api.ts`, an HTTP client for the real
Eleosstyles receipt API. There is **no localStorage mock and no seed data** —
an empty account really is empty.

### Configuration

The API origin lives in `.env` (git-ignored) with a committed template:

```bash
cp .env.example .env.local   # then adjust if the API moves
```

```dotenv
API_URL=https://receipt-backend-1-biue.onrender.com/api
```

`API_URL` is read by `next.config.ts`; the client-side code never sees it.

### Why the `/api/*` proxy exists

`next.config.ts` rewrites `/api/:path*` → `${API_URL}/:path*`:

```ts
async rewrites() {
  return [{ source: "/api/:path*", destination: `${API_URL}/:path*` }];
}
```

The API's session cookie `el_session` is **`SameSite=Lax`**, so a direct
browser call from `localhost:3000` to `receipt-backend-1-biue.onrender.com`
is cross-site: the cookie is sent on the first request but dropped on
subsequent ones, so signup returns `201` and the very next `GET /auth/me`
returns `401`. Proxying through Next keeps the request **same-origin**, so the
browser attaches the cookie normally.

Because of the rewrite, `src/lib/api.ts` calls **relative** paths
(`/auth/me`, `/receipts`, …) with `credentials: "same-origin"` — it never
builds an absolute URL. Signed logo URLs returned by the API (`/api/files/…`)
resolve back through the same proxy.

### What `src/lib/api.ts` does

- `request()` — one `fetch` wrapper: JSON headers, same-origin credentials,
  network-error handling, and throws an `ApiError` carrying `{message, code, details}`.
- `Api*` types mirror the wire format; `toBusiness` / `toCustomer` / `toReceipt`
  / `toSession` map them onto the UI's `src/lib/types.ts` types.
- `resolveReceiptId()` — the API only addresses receipts by UUID, but the UI
  routes use the human number (`ES-000001`), so reads search
  `GET /receipts?search=` first and fall back to passing the number through.
- `getReceipts()` pages client-side (`limit` is capped at 100 server-side).
- Share links are **server-minted** (`GET /receipts/:id/share`); when a link
  can't be fetched the QR block is omitted and Copy is disabled rather than
  faking a URL.

### Auth

`src/lib/api.ts` implements `signUp` / `signIn` / `signOut` / `getSession`
against `POST /auth/signup`, `/auth/login`, `/auth/logout` and `GET /auth/me`.
The API sets an **httpOnly** cookie, so there is nothing readable in the
browser — `SessionProvider` resolves the session once on mount by calling
`/auth/me` and maps a `401` to "unauthenticated".

Every other endpoint is tenant-scoped by that cookie: one organization can
never see another's receipts, customers, or business record.

### Business rules

- Receipts are **immutable after issue**: corrections are *void + reissue*.
  Voiding requires an audit note, and voided receipts stay in history struck through.
- Receipt numbers use the `ES-000214` format, allocated by the API; every issued
  receipt carries a server-minted verification link (rendered as a QR code when
  the link is available).
- Payment status enum: `paid` / `partial` / `pending`. Receipt state: `active` / `void`.
  Payment methods: `cash` / `transfer` / `card` / `other`.
- Brand colours set in Settings are used by the **receipt document only** (inline
  styles), so the app chrome stays on the house palette.

## Project layout

```
app/                  # routes only (layouts & pages)
next.config.ts        # /api/* rewrite proxy to API_URL
src/
  components/
    auth/             # session provider + login/signup screen
    receipt/          # form, document, preview, history view
    customers/        # list + drawer
    settings/         # settings form + template preview
    shell/            # top bar, sidebar, bottom nav, app shell (auth gate)
    ui/               # Button, Card, Field, StatusBadge, dialogs, …
  lib/                # api (HTTP client), types, calc, format, share, …
```

## Printing / PDF

**Download PDF** on a receipt opens the browser print dialog. Print styles in
`app/globals.css` hide all app chrome (top bar, sidebar, page title, share
buttons) and render only the receipt document — use "Save as PDF" in the print
dialog.

The receipt sets `print-color-adjust: exact`, so the black header band, gold
total, and uploaded logo print even when the browser's "Background graphics"
option is off.

### Logo

**Upload logo** in Settings saves immediately — no "Save changes" click needed.
The logo is stored on the business record and flows into the receipt header,
the live template preview, and the print/PDF output automatically.
