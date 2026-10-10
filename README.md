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
| `/receipts/[id]` | Receipt document — export as PDF/PNG, native share, WhatsApp, email, copy link; duplicate or void |
| `/invoices/new` | Create an invoice — line items, tax rate, discount, due date, terms, PO reference. Save as draft, or issue immediately |
| `/invoices` | Invoice history — search, status filters, and real invoiced / outstanding / overdue totals |
| `/invoices/[id]` | Invoice document — issue, record payments, export as PDF/PNG, share; cancel with a reason |
| `/customers` | Customer list with lifetime stats + detail drawer |
| `/settings` | Organization details, website, logo (auto-saves), brand colours, **document watermark**, account |

Every route except `/login` and `/signup` requires a signed-in organization —
the app shell redirects to `/login` otherwise.

## Invoicing

An invoice is a document someone owes money on, so it is modelled differently
from a receipt — and deliberately so.

- **Lifecycle.** `draft → issued → partially_paid → paid`, with `overdue`
  derived from "issued, unpaid, past the due date" and `cancelled` as a
  business event rather than a delete. A draft is editable; an issued invoice
  is **not** — corrections are cancel + reissue, enforced at the ORM
  boundary, not just in the UI.
- **Creating an invoice never marks it paid.** Issuing assigns the number and
  freezes the figures. Money only moves when a payment is recorded.
- **Partial payments.** Several payments can settle one invoice. Each records
  the amount, date, method and reference, and advances the status through
  `nextInvoiceStatus`. The outstanding balance is always
  `total − amount_paid`, computed server-side; the UI renders what the API
  returns rather than repeating the arithmetic.
- **Payment → receipt.** Recording a payment generates a receipt *in the same
  transaction*, for the amount actually received — a ₦200,000 part-payment
  against a ₦570,000 invoice yields a ₦200,000 receipt that names the invoice
  and the remaining balance. `receipts.invoice_payment_id` is `UNIQUE`, so a
  payment can never produce two documents.
- **Numbering.** Invoices use their own `INV-000001` series, allocated under
  the same row lock as receipts but on a separate counter, so issuing an
  invoice never leaves a gap in receipt numbering.
- **Documents.** Invoices render through the same template family as receipts
  (same band, table, totals, watermark), with a due date, a terms line, a
  balance and a payment history instead of an amount paid.

## Exports & sharing

The receipt "Download PDF" button used to call `window.print()`, which handed
the browser's print dialog the *app's preview page* — so the exported file was
whatever the local printer driver produced from CSS print rules, not the
branded document the product generates. It now downloads the real PDF the API
renders, and every export goes through the server:

| Action | Endpoint |
| --- | --- |
| Download receipt PDF / PNG | `GET /api/receipts/:id/pdf` · `/image` |
| Download invoice PDF / PNG | `GET /api/invoices/:id/pdf` · `/image` |

- **PDF** — Puppeteer rendering the same HTML the preview uses, A4, real page
  dimensions and page breaks.
- **PNG** — the *same* HTML in the same headless browser at 2× scale with
  `fullPage`, so the image is the document, not a screenshot of the app's
  preview pane. A long itemisation is never cut off.
- **Filenames** — `visionarygene-receipt-ES-000123.pdf`,
  `visionarygene-invoice-INV-000123.pdf`. Namespaced by *document*, never by
  organization: the number is already unique per tenant, and a business name
  in a filename would leak another tenant's identity into a file that gets
  forwarded.
- **Share** — `navigator.share` with the file attached, where the device
  supports it. `canShareFiles()` checks that `canShare` actually accepts a
  file, because desktop Chrome exposes `navigator.share` but frequently cannot
  take one — offering Share there would promise something it cannot deliver.
- **Fallback** — everywhere else the identical file downloads, and the UI says
  so plainly. A user dismissing the share sheet is reported as a cancellation,
  not a success; a generation failure is never dressed up as one.

## Document watermark

Every generated receipt and invoice carries a faint diagonal **VISIONARYGENE**
mark, painted into the HTML template that Puppeteer turns into the PDF — so it
is a real layer of the exported file, not a browser overlay.

| Property | Value |
| --- | --- |
| Text | `VISIONARYGENE` (spelled exactly) |
| Rotation | −38°, inside the 35–45° band |
| Opacity | 8% by default, capped at 25% |
| Layer | Behind the header band, table and totals |

- **Every page.** On screen it is `position: absolute`, centred in the document
  box; in print it is `position: fixed`, which Chromium repeats on each page —
  verified by decompressing a 4-page PDF and confirming the mark adds bytes to
  pages 2, 3 and 4.
- **Per-organization.** Settings → *Document Watermark* lets a tenant re-word
  the text, change the opacity, or switch it off entirely. Owner-only in the
  API (`requireOwner` on `PATCH /business`).
- **Safe by construction.** Blank text falls back to the platform name and the
  opacity is clamped, so no stored value can produce an unwatermarked document
  by accident or an unreadable one by choice. The text is HTML-escaped like
  every other interpolated value.

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

**Dark-first.** Every colour in the product is declared once, in `:root` inside
`app/globals.css`. The `@theme inline` block below it maps those same custom
properties onto Tailwind's colour namespace, so `bg-vg-surface-2` and
`var(--vg-surface-2)` are literally the same value and cannot drift apart. No
component contains a hex literal.

| Token | Value | Used for |
| --- | --- | --- |
| `--vg-red-900` | `#B71C1C` | Primary fills, borders, large elements |
| `--vg-orange-red` | `#D4430F` | Accent fills, rules, icons, large text |
| `--vg-white` / `--vg-black` | `#FFFFFF` / `#050505` | Text / app background |
| `--vg-surface-1` | `#0B0B0B` | Top bar, sidebar, bottom nav, table header |
| `--vg-surface-2` | `#141414` | Cards, panels, inputs |
| `--vg-surface-3` | `#262525` | Raised elements, hover, borders, loader track |
| `--vg-text-muted` | `#A8A3A2` | Secondary text, labels, captions |
| `--vg-row-hover` | `#1B1B1B` | Table and list row hover |

**Contrast.** Several tokens exist only because their parent failed WCAG AA on a
dark surface, and each carries its measured ratio in the token file:

- **Brand red is never used for text.** `#B71C1C` reaches only 3.10:1 on the app
  background and 2.80:1 on a card. It carries fills, borders, the active nav
  item, and large elements — nothing small.
- **`--vg-accent-text` (`#DA5F33`) exists for small accent text.** `#D4430F`
  tops out at 4.47:1, just under the 4.5:1 body bar; lightened 15% it clears
  5.50 / 5.31 / 4.97:1 on app / nav / card. Links, the wordmark's "GENE", and
  small accents use it.
- **Status sits outside the brand family.** Green `#4CAF50` (6.63:1) for Paid —
  the spec's `#2E7D32` only manages 3.59:1 — amber `#FFB300` for Pending, and
  `#FF5252` (5.77:1) for errors, so a problem is never confused with the
  brand. Void leans on a red *border and fill* with white text, because red
  lettering would not clear contrast.
- **Placeholder and disabled text are lifted** from the spec's `#6B6766`
  (3.30:1 and 2.73:1) to `#898585` and `#979594`.

Status is never carried by colour alone — every badge pairs a hue with a glyph
and a word, the active nav item has both a fill and a 3px indicator, and void
rows are struck through.

**Type:** one geometric sans — Inter. The former Playfair Display pairing was
dropped along with the light theme.

**Shape:** buttons 8px, inputs 8px, cards and panels 12px.

**Motion:** `prefers-reduced-motion: reduce` collapses every animation and
transition, and the loading shimmer becomes a static block.

**Focus:** inputs take an accent border plus a 20%-opacity accent glow; every
other interactive element takes the global 2px accent ring at 2px offset.

### Responsive behaviour

Tables collapse to stacked cards at the `sm` breakpoint (640px) in both the
receipt list and the line-item editor. Every button, nav item, and icon button
is at least 44px tall — the three button sizes step 44 / 48 / 52px rather than
shrinking below the touch floor.

## Print / PDF

**Download PDF** on a receipt or invoice fetches the branded document the API
renders. There is a browser print stylesheet in `app/globals.css` as well, for
the cases where printing the on-screen page is what someone actually wants;
it hides all app chrome (top bar, sidebar, page title, share buttons) and
renders only the document.

The print stylesheet is deliberately **monochrome**: the page goes white,
header bands become rules, tinted strips become white, and all text goes
black — high contrast, low ink, and it stays legible on any office printer.
Four things keep their colour on purpose, all red enough to survive as
*darker* ink on a mono printer: the **header rule**, the **total**, the
**footer rule**, and the organization's **logo**. The **QR code** stays pure
black on white so it scans.

The receipt document stays a light "paper" object even on the dark app. An
organization's logo and header band are designed for white, and a dark preview
would stop predicting what actually prints — so what changes on dark is the
frame the paper sits in (`.receipt-frame`), which the print stylesheet removes
entirely.

The on-screen document and the API's own exported PDF keep the full brand
treatment.

## Organization branding on the receipt

The receipt carries **the issuing organization's** colours — `brand_primary`
and `brand_accent` — not the platform's. A new organization defaults to a
near-black band with the brand orange-red accent (`safeAccent` repairs it to
`#D75121` against that band); the band deliberately does *not* default to brand
red, because the accent solver washes the accent out to near-pink on a red
band. Settings lets either be changed, and the accent is nudged whenever it
would fall below WCAG contrast against the primary, so the picker and the
receipt always agree.

## Brand assets

The VisionaryGene mark is derived from the source artwork and committed as
files, so nothing is generated at build time and no image CDN is involved.

| File | Purpose |
| --- | --- |
| `app/icon.png` | Browser tab favicon (512px, black rounded plate) |
| `app/apple-icon.png` | iOS home-screen icon (180px, square — iOS masks it) |
| `app/opengraph-image.png` | Social/link preview card (1200×630) |
| `public/brand/mark.png` | The mark on transparent — used by `Logo.tsx` |
| `public/brand/logo-lockup.png` | Mark over the `VISIONARYGENE` wordmark, on black |

Two decisions are baked into those files:

- **The mark is red ink on a transparent plate.** The neuron lines are *holes*,
  not white pixels, so one file reads correctly on both the black top bar and the
  cream loading splash. The favicon and OG card instead sit on an explicit black
  plate, because the white half of the wordmark would vanish on a light surface
  and the thin neuron lines disappear when scaled into a 16px tab.
- **The favicon carries the platform mark, not a tenant's.** It is the one
  surface every organization shares, so it identifies the platform rather than
  whichever workspace happens to be open. A signed-in organization still leads
  the header, sidebar, receipt, and page title with its own logo.

`Logo.tsx` prefers the signed-in organization's uploaded logo, then its
monogram, and only falls back to the platform mark when nobody is signed in
(the loading splash and the sign-in / sign-up screens).

`SITE_URL` (see `.env.example`) is the public origin used to resolve the
absolute Open Graph URL; it defaults to `http://localhost:3000`.

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
                      # + icon.png / apple-icon.png / opengraph-image.png
app/globals.css       # the ONLY place a hex value is written (`:root` tokens)
next.config.ts        # /api/* rewrite proxy to API_URL
public/brand/         # mark.png, logo-lockup.png
src/
  components/
    auth/             # session provider + login/signup screen
    brand/            # Logo (organization mark, platform fallback)
    dashboard/        # dashboard view (client child of a server page)
    receipt/          # form, document, preview, history view, share/export bar
    invoice/          # builder, history, detail + payment recording
    customers/        # list + drawer
    settings/         # settings form + template preview
    shell/            # top bar, sidebar, bottom nav, app shell (auth gate)
    ui/               # Button, Card, Field, StatusBadge, dialogs, …
  lib/
    api.ts            # HTTP client
    calc.ts           # line/total arithmetic (mirrors @eleos/shared)
    export.ts         # PDF/PNG fetch, Web Share API + download fallback
    share.ts          # WhatsApp / email deep links, shareable projection
    brand.ts          # monograms, WCAG contrast, logo sampling, palette
    server/brand.ts   # server-side organization name for page titles
    types.ts          # domain types
```

### Logo

**Upload logo** in Settings saves immediately — no "Save changes" click needed.
It is stored on the organization record and flows into the receipt header, the
top bar, the sidebar, the settings preview, and the print/PDF output
automatically. Replacing or removing it does the same. Files are limited to
3 MB; anything the app cannot sample simply keeps the existing brand colours.
