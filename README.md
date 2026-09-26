# Eleosstyles — Receipt System

A clean, mobile-first receipt management UI for **Eleosstyles**, a Lagos-based bespoke
fashion house. Issue branded receipts, track payment status, manage customers, and
share or print receipts — all from one dashboard.

Built with **Next.js (App Router) · TypeScript · Tailwind CSS v4**.

## Getting Started

```bash
npm install
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
| `/` | Dashboard — today / week / month totals + recent receipts |
| `/receipts/new` | Issue a receipt — customer picker, live line totals, discount & tax, payment status |
| `/receipts` | History — search, date & status filters (Paid / Partial / Pending / Void) |
| `/receipts/[id]` | Receipt document — share via WhatsApp, email, PDF (print), copy link; duplicate or void |
| `/customers` | Customer list with lifetime stats + detail drawer |
| `/settings` | Business details, logo, brand colours with a live template preview |

## Design system

- **Palette:** cream `#FBF7EE` background, black `#111111` header/sidebar, gold
  `#B8912F` accent with `#D9B45C` tint, ink `#22262E` text, muted `#5A6472` secondary.
- **Type:** Inter for UI, Playfair Display for the wordmark and receipt headings.
- **One primary button:** solid gold with black text; secondary = black with gold text;
  destructive = muted grey outline (no red).
- Tokens live in `app/globals.css` (Tailwind v4 CSS-first `@theme` block).

## Data layer

There is no backend yet. All reads/writes go through `src/lib/api.ts`, a small
async, REST-shaped mock API (260–420 ms simulated latency) persisted to
`localStorage` under `eleosstyles.receipt-system.v1`. Seed data lives in
`src/lib/seed.ts` (12 sample receipts `ES-000203`–`ES-000214`).

To start over from seed data, clear the key in devtools or run
`localStorage.removeItem('eleosstyles.receipt-system.v1')` in the console and reload.

Swapping in a real backend means replacing the internals of `src/lib/api.ts` —
every screen already consumes promises through that one module.

### Business rules

- Receipts are **immutable after issue**: corrections are *void + reissue*.
  Voiding requires an audit note, and voided receipts stay in history struck through.
- Receipt numbers use the `ES-000214` format; every receipt carries a QR code and a
  short verification link.
- Payment status enum: `paid` / `partial` / `pending`. Receipt state: `active` / `void`.
  Payment methods: `cash` / `transfer` / `card` / `other`.
- Brand colours set in Settings are used by the **receipt document only** (inline
  styles), so the app chrome stays on the house palette.

## Project layout

```
app/                  # routes only (layouts & pages)
src/
  components/
    receipt/          # form, document, preview, history view
    customers/        # list + drawer
    settings/         # settings form + template preview
    shell/            # top bar, sidebar, bottom nav, app shell
    ui/               # Button, Card, Field, StatusBadge, dialogs, …
  lib/                # api, seed, types, calc, format, share, …
```

## Printing / PDF

**Download PDF** on a receipt opens the browser print dialog. Print styles in
`app/globals.css` hide all app chrome and render only the receipt document —
use "Save as PDF" in the print dialog.
