"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ImageUp, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { readImageAsDataUrl } from "@/lib/image";
import { formatMoney } from "@/lib/format";
import type { Business } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, SelectInput, TextInput } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

const HEX = /^#([0-9a-f]{6})$/i;
const DEFAULT_PRIMARY = "#111111";
const DEFAULT_ACCENT = "#B8912F";

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
  primary,
  accent,
  currency,
}: {
  businessName: string;
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
        <span className="font-display text-[13px] uppercase tracking-[0.2em] text-white">
          {businessName || "Your Business"}
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [logo, setLogo] = useState<string | null>(null);
  const [primary, setPrimary] = useState(DEFAULT_PRIMARY);
  const [accent, setAccent] = useState(DEFAULT_ACCENT);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    api.getBusiness().then((business: Business) => {
      if (cancelled) return;
      setName(business.name);
      setAddress(business.address);
      setPhone(business.phone);
      setEmail(business.email);
      setCurrency(business.currency);
      setLogo(business.logo_url);
      setPrimary(business.brand_primary);
      setAccent(business.brand_accent);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onFileChange(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG or JPG).");
      return;
    }
    setError(null);
    const dataUrl = await readImageAsDataUrl(file, 320);
    setLogo(dataUrl);
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
    await api.updateBusiness({
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      currency,
      logo_url: logo,
      brand_primary: primary.toLowerCase(),
      brand_accent: accent.toLowerCase(),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Business Settings" />
        <div className="space-y-6">
          <SkeletonBlock className="h-56 w-full" />
          <div className="grid gap-6 lg:grid-cols-2">
            <SkeletonBlock className="h-48 w-full" />
            <SkeletonBlock className="h-48 w-full" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Business Settings"
        description="Your logo, details, and brand colours flow straight into every receipt and PDF."
      />

      <div className="space-y-6">
        {/* ---- Business details ---- */}
        <Card>
          <CardHeader
            title="Business Details"
            description="Printed in the receipt header and footer."
          />
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business name" required className="sm:col-span-2">
                <TextInput
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Eleosstyles"
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
                      alt="Business logo preview"
                      className="h-full w-full bg-white object-contain p-1"
                    />
                  ) : (
                    <span className="font-display text-4xl text-brand-gold">E</span>
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
                    Upload logo
                  </Button>
                  {logo && (
                    <Button variant="ghost" onClick={() => setLogo(null)}>
                      Remove
                    </Button>
                  )}
                  <p className="pt-1 text-xs text-muted">
                    PNG or JPG · recommended square, at least 256×256.
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
                hint="Used for the receipt header band and table head — default is Eleosstyles black."
                value={primary}
                onChange={setPrimary}
                onReset={() => setPrimary(DEFAULT_PRIMARY)}
              />
              <ColorField
                label="Accent"
                hint="Used for totals, rules, and highlights — default is Eleosstyles gold."
                value={accent}
                onChange={setAccent}
                onReset={() => setAccent(DEFAULT_ACCENT)}
              />
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
              primary={primary}
              accent={accent}
              currency={currency}
            />
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
