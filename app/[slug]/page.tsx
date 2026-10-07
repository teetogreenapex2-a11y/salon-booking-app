export const dynamic = "force-dynamic";
import InstallTip from "@/components/InstallTip";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MapPin, Clock, Instagram, Star, Scissors } from "lucide-react";

export default async function BusinessPage({ params }: { params: { slug: string } }) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug },
    include: { stylists: { where: { active: true } } },
  });
 if (!business) notFound();

  return (
    <main className="page">
      <div
        className="hero"
        style={
          business.coverUrl
            ? { background: `linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.28) 100%), center / cover no-repeat url(${business.coverUrl})`, position: "relative", marginBottom: business.logoUrl ? 46 : 20, overflow: "visible" }
            : undefined
        }
      >
        {business.coverUrl ? (
          business.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.logoUrl}
              alt={business.name}
              style={{ position: "absolute", left: 20, bottom: -34, width: 72, height: 72, borderRadius: 18, objectFit: "contain", background: "var(--panel)", padding: 6, boxShadow: "0 4px 14px rgba(0,0,0,0.22)" }}
            />
          )
        ) : business.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.logoUrl}
            alt={business.name}
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
          />
        ) : (
          <Scissors size={32} color="var(--berry)" />
        )}
      </div>

      <h1 className="display title">{business.name}</h1>
      {business.tagline && <p className="tagline">{business.tagline}</p>}

      <div className="meta">
        {business.address && (
          <span><MapPin size={13} /> {business.address}</span>
        )}
        <span><Clock size={13} /> {business.timezone}</span>
        {business.instagram && (
          <span><Instagram size={13} /> {business.instagram}</span>
        )}
      </div>

      <Link href={`/${business.slug}/book`} className="btn-primary">
        Book an appointment
      </Link>

      <h2 className="display" style={{ fontSize: 20, margin: "40px 0 14px" }}>Our stylists</h2>
      <div className="stylist-list">
        {business.stylists.map((s) => (
          <div key={s.id} className="card static">
            <div className="avatar" style={{ overflow: "hidden" }}>
              {s.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.photoUrl} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                initials(s.name)
              )}
            </div>
            <div>
              <p className="name">{s.name}</p>
              {s.specialty && <p className="specialty">{s.specialty}</p>}
            </div>
          </div>
        ))}
      </div>

      <InstallTip businessName={business.name} />
    </main>
  );
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}
