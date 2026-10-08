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
| `/signup` | Create an organization — org name, your name, email, password |
| `/login` | Sign in to an existing organization |
| `/` | Dashboard — today / week / month totals + recent receipts |
| `/receipts/new` | Issue a receipt — customer picker, live line totals, discount & tax, payment status |
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

There is no backend yet. All reads/writes go through `src/lib/api.ts`, a small
async, REST-shaped mock API (260–420 ms simulated latency). Seed data lives in
`src/lib/seed.ts` (12 sample receipts `ES-000203`–`ES-000214`).

Data is **partitioned per organization**:

| Key | Holds |
| --- | --- |
| `eleosstyles.accounts.v1` | Registered organizations (email + salted password hash) |
| `eleosstyles.session.v1` | The currently signed-in session |
| `eleosstyles.workspace.<orgId>` | That org's business profile, customers, and receipts |
| `eleosstyles.receipt-system.v1` | Pre-auth data — claimed by the **first** account that signs up |

The **first account created on a browser adopts the data already there**
(renamed to the new organization's name); every later account starts with a
clean, empty workspace. One org can never see another org's receipts.

To start over, run this in the devtools console and reload:

```js
Object.keys(localStorage)
  .filter((k) => k.startsWith("eleosstyles."))
  .forEach((k) => localStorage.removeItem(k));
```

Swapping in a real backend means replacing the internals of `src/lib/api.ts`
(for auth, `src/lib/auth.ts`) — every screen already consumes promises through
those two modules.

### Auth

`src/lib/auth.ts` implements register / login / logout / session against
`localStorage`. Passwords are salted and hashed with an iterated SHA-256 via
Web Crypto before storage, and the session only ever stores the org id, name,
owner name, and email — never the password.

⚠️ This is a **UI prototype, not a security boundary**: everything still runs
in the browser, so anyone with devtools access can read the stored data. A real
deployment must move registration and login to a server and keep workspaces
scoped by the authenticated user.

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
    auth/             # session provider + login/signup screen
    receipt/          # form, document, preview, history view
    customers/        # list + drawer
    settings/         # settings form + template preview
    shell/            # top bar, sidebar, bottom nav, app shell (auth gate)
    ui/               # Button, Card, Field, StatusBadge, dialogs, …
  lib/                # api, auth, seed, types, calc, format, share, …
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
