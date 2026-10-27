import { Allura } from "next/font/google";

const script = Allura({ weight: "400", subsets: ["latin"], display: "swap" });

// "Hairsalonix" in script. Allura runs small for its font-size, so `size`
// is the visual size you'd expect from a normal font (it's scaled up here).
export default function Wordmark({
  size = 24,
  color,
  style,
}: {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={script.className}
      style={{ fontSize: Math.round(size * 1.6), fontWeight: 400, lineHeight: 1, color, ...style }}
    >
      Hairsalonix
    </span>
  );
}
