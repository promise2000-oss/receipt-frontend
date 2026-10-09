"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ImageUp, LogOut, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { useSession } from "@/components/auth/SessionProvider";
import { invalidateOrgName } from "@/lib/server/brand-actions";
import { readImageAsDataUrl } from "@/lib/image";
import { formatMoney } from "@/lib/format";
import {
  CONTRAST_TEXT,
  derivePalette,
  ensureContrast,
  extractLogoColor,
  initials,
} from "@/lib/brand";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, SelectInput, TextInput } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/cn";

const HEX = /^#([0-9a-f]{6})$/i;
const DEFAULT_PRIMARY = "#111111";
const DEFAULT_ACCENT = "#B8912F";
/** `POST /business/logo` rejects anything larger. */
const MAX_LOGO_BYTES = 3 * 1024 * 1024;

const CURRENCIES = [
  { value: "NGN", label: "NGN — Naira (₦)" },
  { value: "USD", label: "USD — US Dollar ($)" },
  { value: "GBP", label: "GBP — Pound Sterling (£)" },
  { value: "EUR", label: "EUR — Euro (€)" },
  { value: "GHS", label: "GHS — Cedi (₵)" },
  { value: "KES", label: "KES — Kenyan Shilling (KSh)" },
  { value: "ZAR", label: "ZAR — Rand (R)" },
];

const tint = (color: string, percent: number) =>
  `color-mix(in srgb, ${color} ${percent}%, transparent)`;

/**
 * Brand colours as they get persisted.
 *
 * The primary is stored exactly as chosen — the receipt band adopts it and
 * picks its own text colour to match, so nothing needs correcting here. The
 * accent *is* corrected, because it is drawn on top of the primary for the
 * column headers and the total: a picker can land on a pair like
 * `#3d1d63` + `#1f9d6b`, which looks fine and renders at 3.9:1. Storing the
 * repaired value means what the picker shows afterwards is what actually
 * appears on the receipt.
 */
function persistablePalette(primaryHex: string, accentHex: string) {
  const primary = primaryHex.toLowerCase();
  const accent = accentHex.toLowerCase();
  const readable =
    /^#[0-9a-f]{6}$/i.test(primary) && /^#[0-9a-f]{6}$/i.test(accent);
  return {
    brand_primary: primary,
    brand_accent: readable
      ? ensureContrast(accent, primary, CONTRAST_TEXT)
      : accent,
  };
}

/* ---------------- Reusable pieces (module scope — stable identity) ------- */

function ColorField({
  label,
  hint,
  value,
  onChange,
  onReset,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  onReset: () => void;
}) {
  const valid = HEX.test(value);
  return (
    <div className="rounded-control border border-brand-gold/15 bg-white/50 p-4">
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={valid ? value : DEFAULT_PRIMARY}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-14 shrink-0 rounded-control border border-brand-gold/25"
          aria-label={`${label} colour picker`}
        />
        <div className="min-w-0 flex-1">
          <span className="mb-1.5 block text-[13px] font-medium text-ink">
            {label}
          </span>
          <TextInput
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="uppercase"
            spellCheck={false}
            maxLength={7}
            aria-label={`${label} hex value`}
          />
        </div>
        <Button size="sm" variant="ghost" onClick={onReset} className="mt-5">
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
          Reset
        </Button>
      </div>
      <p className="mt-2.5 text-xs">
        {valid ? (
          <span className="text-muted">{hint}</span>
        ) : (
          <span className="text-gold-deep">Enter a hex colour like #B8912F</span>
        )}
      </p>
    </div>
  );
}

function TemplatePreview({
  businessName,
  logo,
  primary,
  accent,
  currency,
}: {
  businessName: string;
  logo: string | null;
  primary: string;
  accent: string;
  currency: string;
}) {
  const primaryOk = HEX.test(primary);
  const accentOk = HEX.test(accent);
  const p = primaryOk ? primary : DEFAULT_PRIMARY;
  const a = accentOk ? accent : DEFAULT_ACCENT;

  return (
    <div
      className="overflow-hidden rounded-card border bg-cream"
      style={{ borderColor: tint(a, 35) }}
    >
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ backgroundColor: p }}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt=""
              className="h-6 w-6 shrink-0 rounded-[6px] bg-white object-contain p-0.5"
            />
          ) : null}
          <span className="truncate font-display text-[13px] uppercase tracking-[0.2em] text-white">
            {businessName || "Your Business"}
          </span>
        </span>
        <span
          className="text-[9.5px] font-semibold uppercase tracking-[0.28em]"
          style={{ color: a }}
        >
          Receipt
        </span>
      </div>
      <div className="space-y-3 px-5 py-5">
        <div
          className="h-2.5 w-2/3 rounded-full"
          style={{ backgroundColor: tint(p, 15) }}
        />
        <div
          className="h-2.5 w-1/2 rounded-full"
          style={{ backgroundColor: tint(p, 10) }}
        />
        <div
          className="h-2.5 w-5/6 rounded-full"
          style={{ backgroundColor: tint(p, 10) }}
        />
        <div className="flex items-center justify-between pt-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            Total
          </span>
          <span
            className="rounded-[8px] px-3 py-2 text-sm font-semibold tabular-nums"
            style={{ backgroundColor: a, color: p }}
          >
            {formatMoney(85000, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ The screen ------------------------------ */

export function SettingsView() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session, signOut, refresh } = useSession();

  /**
   * Seeded straight from the session's organization rather than fetched again
   * — the same record the header and titles already rendered, so the page
   * opens with data instead of a skeleton and costs no extra request. The app
   * shell holds its splash until the session resolves, so this is never
   * undefined on the first render of a signed-in route.
   *
   * Deliberately *not* re-synced on every session change: after `refresh()`
   * the server value equals what was just saved, and re-seeding would wipe out
   * half-typed edits the moment an upload finished.
   */
  const business = session?.business ?? null;

  const [name, setName] = useState(business?.name ?? "");
  const [address, setAddress] = useState(business?.address ?? "");
  const [phone, setPhone] = useState(business?.phone ?? "");
  const [email, setEmail] = useState(business?.email ?? "");
  const [website, setWebsite] = useState(business?.website ?? "");
  const [currency, setCurrency] = useState(business?.currency ?? "NGN");
  const [logo, setLogo] = useState<string | null>(business?.logo_url ?? null);
  const [logoStatus, setLogoStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [primary, setPrimary] = useState(business?.brand_primary ?? DEFAULT_PRIMARY);
  const [accent, setAccent] = useState(business?.brand_accent ?? DEFAULT_ACCENT);

  const fileRef = useRef<HTMLInputElement>(null);

  async function onFileChange(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPG, WebP, SVG or GIF).");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError("That image is over 3 MB — please pick a smaller one.");
      return;
    }
    setError(null);

    // Show it straight away, then swap in the signed URL the API returns.
    setLogo(await readImageAsDataUrl(file, 320));

    // Save immediately — the whole point is that the next receipt (and its
    // print/PDF) picks the logo up without a second click.
    setLogoStatus("saving");
    try {
      const uploaded = await api.uploadLogo(file);
      setLogo(uploaded.logo_url);

      // Optional, limited re-palette: two colours, only where brand colour
      // already exists (header band, total, active states). The design system
      // and layout are untouched, and `derivePalette` guarantees the pair
      // clears WCAG regardless of what the logo happens to look like.
      try {
        const sample = await readImageAsDataUrl(file, 320);
        const picked = await extractLogoColor(sample);
        if (picked) {
          const palette = derivePalette(picked);
          setPrimary(palette.primary);
          setAccent(palette.accent);
          await api.updateBusiness({
            brand_primary: palette.primary,
            brand_accent: palette.accent,
          });
        }
      } catch {
        // A logo we cannot sample (SVG without a size, unreadable file) simply
        // keeps the existing colours — that is the intended fallback, not a
        // failure worth surfacing.
      }

      await refresh();
      setLogoStatus("saved");
      setTimeout(() => setLogoStatus("idle"), 2600);
    } catch (caught) {
      setLogo(null);
      setLogoStatus("error");
      setError(
        caught instanceof Error ? caught.message : "Couldn't save the logo.",
      );
    }
  }

  async function onRemoveLogo() {
    const previous = logo;
    setLogo(null);
    setLogoStatus("saving");
    try {
      await api.removeLogo();
      await refresh();
      setLogoStatus("idle");
    } catch (caught) {
      setLogo(previous);
      setLogoStatus("error");
      setError(
        caught instanceof Error ? caught.message : "Couldn't remove the logo.",
      );
    }
  }

  async function save() {
    if (saving) return;
    if (name.trim().length < 2) {
      setError("Business name is required.");
      return;
    }
    if (!HEX.test(primary) || !HEX.test(accent)) {
      setError("Both brand colours must be valid hex values (e.g. #111111).");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const palette = persistablePalette(primary, accent);
      await api.updateBusiness({
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        website: website.trim(),
        currency,
        ...palette,
      });
      // The accent may have been nudged for contrast; show the value that was
      // actually stored rather than leaving the picker on a colour that will
      // not be used.
      setPrimary(palette.brand_primary);
      setAccent(palette.brand_accent);
      // Re-read the session so the new name/logo/palette reach the header,
      // sidebar, monograms and browser title at once — no reload, no source
      // change, and no surface that fetches branding on its own.
      await refresh();
      // The server keeps a short per-session cache of the organization name
      // for `generateMetadata`; drop it and re-render so the tab title stops
      // showing the previous name the moment this saves.
      await invalidateOrgName();
      router.refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2400);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Couldn't save your changes.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Organization Settings"
        description="Your logo, details, and brand colours flow straight into every receipt and PDF."
      />

      <div className="space-y-6">
        {/* ---- Organization details ---- */}
        <Card>
          <CardHeader
            title="Organization Details"
            description="Printed in the receipt header, footer, and verification page."
          />
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Organization name" required className="sm:col-span-2">
                <TextInput
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. ABC Pharmacy"
                />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <TextInput
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Street, city, state"
                />
              </Field>
              <Field label="Phone">
                <TextInput
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+234 800 000 0000"
                  type="tel"
                />
              </Field>
              <Field label="Email">
                <TextInput
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="hello@yourbusiness.com"
                  type="email"
                />
              </Field>
              <Field
                label="Website"
                hint="Shown on the receipt footer and verification page"
                className="sm:col-span-2"
              >
                <TextInput
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  placeholder="https://yourbusiness.com"
                  type="url"
                  inputMode="url"
                />
              </Field>
              <Field label="Currency" hint="Used across receipts and totals">
                <SelectInput
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                >
                  {CURRENCIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </div>
          </CardBody>
        </Card>

        {/* ---- Logo + colours ---- */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Logo"
              description="Shown on the receipt header band."
            />
            <CardBody>
              <div className="flex items-center gap-5">
                <div
                  className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-card border border-brand-gold/30 bg-brand-black"
                  aria-hidden={!logo}
                >
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logo}
                      alt="Organization logo preview"
                      className="h-full w-full bg-white object-contain p-1"
                    />
                  ) : (
                    <span className="font-display text-4xl text-brand-gold">
                      {initials(name)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 space-y-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      void onFileChange(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                  <Button variant="outline" onClick={() => fileRef.current?.click()}>
                    <ImageUp className="h-4 w-4" strokeWidth={1.9} />
                    {logoStatus === "saving" ? "Saving…" : "Upload logo"}
                  </Button>
                  {logo && (
                    <Button variant="ghost" onClick={onRemoveLogo}>
                      Remove
                    </Button>
                  )}
                  <p className="pt-1 text-xs text-muted">
                    PNG or JPG · recommended square, at least 256×256.
                  </p>
                  <p
                    className={cn(
                      "pt-0.5 text-xs",
                      logoStatus === "error" ? "text-gold-deep" : "text-brand-gold",
                    )}
                    role="status"
                  >
                    {logoStatus === "saving" && "Saving logo…"}
                    {logoStatus === "saved" &&
                      "Saved — it's on your next receipt and printout."}
                    {logoStatus === "error" && "Not saved yet."}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Brand Colours"
              description="The two colours every receipt is built from."
            />
            <CardBody className="space-y-4">
              <ColorField
                label="Header (primary)"
                hint="Used for the receipt header band and table head — default is near-black."
                value={primary}
                onChange={setPrimary}
                onReset={() => setPrimary(DEFAULT_PRIMARY)}
              />
              <ColorField
                label="Accent"
                hint="Used for totals, rules, and highlights — default is gold."
                value={accent}
                onChange={setAccent}
                onReset={() => setAccent(DEFAULT_ACCENT)}
              />
              <p className="text-xs text-muted">
                Uploading a logo suggests a pair of colours drawn from it; both
                stay editable here. The accent is nudged if it would fall below
                WCAG contrast against the primary, so the picker and the
                receipt always agree.
              </p>
            </CardBody>
          </Card>
        </div>

        {/* ---- Live template preview ---- */}
        <Card>
          <CardHeader
            title="Template Preview"
            description="What customers see — updates live with your colours."
          />
          <CardBody>
            <TemplatePreview
              businessName={name}
              logo={logo}
              primary={primary}
              accent={accent}
              currency={currency}
            />
          </CardBody>
        </Card>

        {/* ---- Account ---- */}
        <Card>
          <CardHeader
            title="Organization Account"
            description="This workspace, its receipts, and its customers belong to this account only."
          />
          <CardBody className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[15px] font-medium text-ink">
                {session?.org_name}
              </p>
              <p className="mt-1 text-sm text-muted">
                {session?.owner_name} · {session?.email}
              </p>
            </div>
            <Button variant="outline" onClick={() => void signOut()}>
              <LogOut className="h-4 w-4" strokeWidth={1.9} />
              Sign out
            </Button>
          </CardBody>
        </Card>

        {/* ---- Save ---- */}
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-4 rounded-card border border-brand-gold/20 bg-surface px-5 py-4",
          )}
        >
          <p className={cn("text-sm", error ? "text-gold-deep" : "text-muted")}>
            {error ??
              (saved
                ? "Saved — your receipts will use the updated branding."
                : "Changes apply to receipts issued from now on.")}
          </p>
          <Button size="lg" onClick={save} disabled={saving}>
            {saving ? (
              "Saving…"
            ) : saved ? (
              <>
                <Check className="h-4 w-4" strokeWidth={2.4} />
                Saved
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
