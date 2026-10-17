export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPlatformAdminEmail } from "@/lib/platform";
import ApprovalButtons from "@/components/platform/ApprovalButtons";

export const metadata = { title: "Signups — Hairsalonix", robots: { index: false, follow: false } };

export default async function PlatformPage() {
  if (!(await getPlatformAdminEmail())) notFound();

  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { name: true, email: true } } },
  });
  const order: Record<string, number> = { PENDING: 0, REJECTED: 1, APPROVED: 2 };
  businesses.sort((a, b) => (order[a.approvalStatus] ?? 3) - (order[b.approvalStatus] ?? 3));

  return (
    <main className="page" style={{ maxWidth: 760 }}>
      <h1 className="display title">Signups</h1>
      <p className="tagline">New salons wait here until you approve them.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {businesses.map((b) => (
          <div key={b.id} className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <strong>{b.name}</strong>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{b.approvalStatus}</span>
            </div>
            <div className="subtle" style={{ fontSize: 13 }}>
              {b.owner?.name ? `${b.owner.name} · ` : ""}
              {b.owner?.email ?? "no owner email"} · hairsalonix.com/{b.slug} · signed up{" "}
              {b.createdAt.toLocaleDateString("en-US")}
            </div>
            <ApprovalButtons id={b.id} status={b.approvalStatus} />
          </div>
        ))}
        {businesses.length === 0 && <p className="subtle">No signups yet.</p>}
      </div>
    </main>
  );
}
