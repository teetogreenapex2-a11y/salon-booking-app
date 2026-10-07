// Per-salon accent color helpers. The accent drives the public booking
// pages' berry/blush shades; only strict #rrggbb values are ever accepted.

export const DEFAULT_ACCENT = "#7f2d4a";

export const ACCENT_PRESETS = [
  { name: "Merlot", hex: "#7f2d4a" },
  { name: "Rose", hex: "#b4476a" },
  { name: "Plum", hex: "#5b3a8c" },
  { name: "Ocean", hex: "#1f6f8b" },
  { name: "Forest", hex: "#2f6b4f" },
  { name: "Terracotta", hex: "#b5573a" },
  { name: "Gold", hex: "#a8791e" },
  { name: "Charcoal", hex: "#3a3a42" },
];

export function cleanAccent(value: unknown): string | null | undefined {
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const v = value.trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(v) ? v : undefined;
}

function rgb(hex: string) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}
function toHex(c: number[]) {
  return "#" + c.map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")).join("");
}
function mix(hex: string, other: string, t: number) {
  const a = rgb(hex);
  const b = rgb(other);
  return toHex(a.map((v, i) => v + (b[i] - v) * t));
}

// The CSS variables the public pages use, derived from one accent color.
export function accentVars(accent: string | null | undefined): Record<string, string> {
  const hex = accent && /^#[0-9a-f]{6}$/.test(accent) ? accent : DEFAULT_ACCENT;
  return {
    "--berry": hex,
    "--berry-dark": mix(hex, "#000000", 0.35),
    "--blush": mix(hex, "#ffffff", 0.82),
  };
}
