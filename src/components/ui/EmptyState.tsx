import type { ReactNode } from "react";

/**
 * Friendly empty state — a muted receipt illustration plus the call to
 * action.
 *
 * The artwork reads its colours from the theme variables rather than
 * literals, so it re-tints with the palette and never becomes the one
 * place a hex value hides.
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <svg
        width="140"
        height="132"
        viewBox="0 0 140 132"
        fill="none"
        aria-hidden
        className="mb-5 opacity-70"
      >
        {/* receipt body */}
        <rect
          x="34"
          y="26"
          width="72"
          height="92"
          rx="8"
          style={{ fill: "var(--vg-surface-3)", stroke: "var(--vg-border)" }}
          strokeWidth="2.5"
        />
        {/* header rule */}
        <line
          x1="46"
          y1="44"
          x2="94"
          y2="44"
          style={{ stroke: "var(--vg-red-900)" }}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* text lines */}
        <line
          x1="46"
          y1="58"
          x2="82"
          y2="58"
          style={{ stroke: "var(--vg-text-muted)" }}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="46"
          y1="70"
          x2="74"
          y2="70"
          style={{ stroke: "var(--vg-text-muted)" }}
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* accent total pill */}
        <rect
          x="46"
          y="82"
          width="34"
          height="12"
          rx="6"
          style={{ fill: "var(--vg-orange-red)" }}
        />
        {/* tear perforation */}
        <line
          x1="40"
          y1="104"
          x2="100"
          y2="104"
          style={{ stroke: "var(--vg-orange-red)" }}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="4 7"
        />
        {/* sparkles */}
        <path
          d="M112 30l2.7 6.6 6.6 2.7-6.6 2.7L112 48.6l-2.7-6.6-6.6-2.7 6.6-2.7L112 30z"
          style={{ fill: "var(--vg-red-900)" }}
        />
        <path
          d="M26 72l1.9 4.7 4.7 1.9-4.7 1.9L26 85.2l-1.9-4.7-4.7-1.9 4.7-1.9L26 72z"
          style={{ fill: "var(--vg-orange-red)" }}
        />
        <circle cx="118" cy="86" r="4" style={{ fill: "var(--vg-orange-red)" }} />
      </svg>

      <h3 className="text-xl font-semibold tracking-tight text-vg-white">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-vg-text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
