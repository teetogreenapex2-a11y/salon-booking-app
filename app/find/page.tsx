import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MapPin, Scissors } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Find a salon — Hairsalonix",
  description: "Search salons and independent stylists on Hairsalonix and book online — no account needed.",
};

export default async function FindASalon({ searchParams }: { searchParams?: { q?: string } }) {
  const q = (searchParams?.q || "").trim().slice(0, 80);
  const businesses = await prisma.business.findMany({
    where: {
      listed: true,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { address: { contains: q, mode: "insensitive" } },
              { tagline: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    include: {
      photos: { take: 1, orderBy: { order: "asc" } },
      stylists: { where: { active: true }, select: { id: true } },
    },
  });

  return (
    <main className="page" style={{ maxWidth: 720 }}>
      <h1 className="display title" style={{ marginBottom: 4 }}>
        Find a salon
      </h1>
      <p className="tagline">Browse salons on Hairsalonix and book directly — no account needed.</p>

      <form action="/find" method="get" style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by salon name or city"
          aria-label="Search salons"
          style={{ flex: 1, minWidth: 0 }}
        />
        <button className="btn-primary" type="submit">Search</button>
      </form>

      {businesses.length === 0 ? (
        <p className="subtle" style={{ marginTop: 20 }}>
          {q ? `No salons match "${q}". Try a city or a different name.` : "No salons listed yet."}
        </p>
      ) : (
        <div className="list" style={{ marginTop: 20 }}>
          {businesses.map((b) => {
            const cover = b.photos[0]?.url;
            return (
              <Link
                key={b.id}
                href={`/${b.slug}`}
                className="card"
                style={{ display: "flex", gap: 16, alignItems: "center", textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 8,
                    flexShrink: 0,
                    overflow: "hidden",
                    background: "var(--blush)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Scissors size={24} color="var(--berry)" />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="name">{b.name}</p>
                  {b.tagline && (
                    <p className="subtle" style={{ margin: "2px 0 0" }}>
                      {b.tagline}
                    </p>
                  )}
                  <div className="meta" style={{ marginTop: 6, marginBottom: 0 }}>
                    {b.address && (
                      <span>
                        <MapPin size={13} /> {b.address}
                      </span>
                    )}
                    <span>
                      {b.stylists.length} stylist{b.stylists.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
