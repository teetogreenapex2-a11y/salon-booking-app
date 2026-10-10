import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/access";
import { audienceFor } from "@/lib/marketing";
import CampaignForm from "@/components/admin/CampaignForm";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const business = await requireOwner();
  const [all, lapsed, history] = await Promise.all([
    audienceFor(business.id, "ALL"),
    audienceFor(business.id, "LAPSED"),
    prisma.campaign.findMany({ where: { businessId: business.id }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return (
    <div>
      <h1 className="display">Email customers</h1>
      <p className="subtle">
        Send a promo or a "we miss you" note. Customers can unsubscribe with one click, and anyone without a real
        email is skipped. {!business.address && <strong>Add your salon's address on the Business page first — it's required in every marketing email.</strong>}
      </p>
      <CampaignForm allCount={all.length} lapsedCount={lapsed.length} />
      <h2 className="display" style={{ fontSize: 20, margin: "28px 0 10px" }}>Sent</h2>
      {history.length === 0 ? (
        <p className="subtle">Nothing sent yet.</p>
      ) : (
        history.map((c: any) => (
          <div key={c.id} className="card" style={{ marginBottom: 10 }}>
            <strong>{c.subject}</strong>
            <div className="subtle">
              {c.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · sent to {c.sentCount}
              {c.audience === "LAPSED" ? " (lapsed customers)" : ""}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
