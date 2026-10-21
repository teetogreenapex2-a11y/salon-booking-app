import { Allura } from "next/font/google";

const script = Allura({ weight: "400", subsets: ["latin"], display: "swap" });

// The salon's name in script over its cover photo (or a rich color
// gradient when there's no photo). Replaces the small logo badge.
export default function SalonHeader({
  name,
  coverUrl,
  tagline,
  compact,
}: {
  name: string;
  coverUrl?: string | null;
  tagline?: string | null;
  compact?: boolean;
}) {
  const height = compact ? 150 : 240;
  return (
    <div
      style={{
        position: "relative",
        height,
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 22,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        background: coverUrl
          ? `center / cover no-repeat url(${coverUrl})`
          : "linear-gradient(135deg, var(--berry) 0%, #4a1a2c 100%)",
        boxShadow: "0 10px 30px rgba(36, 28, 31, 0.18)",
      }}
    >
      {coverUrl && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.55) 100%)",
          }}
        />
      )}
      <div style={{ position: "relative", padding: "0 20px" }}>
        <h1
          className={script.className}
          style={{
            margin: 0,
            color: "#fff",
            fontWeight: 400,
            fontSize: compact ? 52 : 72,
            lineHeight: 1.05,
            textShadow: "0 2px 14px rgba(0,0,0,0.45)",
          }}
        >
          {name}
        </h1>
        {tagline && !compact && (
          <p
            style={{
              margin: "10px 0 0",
              color: "rgba(255,255,255,0.92)",
              fontSize: 14,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              textShadow: "0 1px 8px rgba(0,0,0,0.5)",
            }}
          >
            {tagline}
          </p>
        )}
      </div>
    </div>
  );
}
