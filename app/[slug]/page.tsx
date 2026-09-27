import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { MapPin, Clock, Instagram, Star, Scissors } from "lucide-react";

export default async function BusinessPage({ params }: { params: { slug: string } }) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug },
    include: { stylists: { where: { active: true } } },
  });

  if (!business) notFound();

  return (
    <main className="page">
      <div className="hero">
        <Scissors size={32} color="var(--berry)" />
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
            <div className="avatar">{initials(s.name)}</div>
            <div>
              <p className="name">{s.name}</p>
              {s.specialty && <p className="specialty">{s.specialty}</p>}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}
