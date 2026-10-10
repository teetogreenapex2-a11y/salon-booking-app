import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/access";
import { NewPlanForm, PlanToggle, AddMemberForm, MemberActions } from "@/components/admin/MembershipManager";

export const dynamic = "force-dynamic";

const $ = (c: number) => `$${(c / 100).toFixed(2)}`;
const day = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function MembershipsPage() {
  const business = await requireOwner();
  const [plans, members, customers] = await Promise.all([
    prisma.membershipPlan.findMany({ where: { businessId: business.id }, orderBy: { createdAt: "asc" } }),
    prisma.membership.findMany({
      where: { businessId: business.id, status: "ACTIVE" },
      include: { customer: true, plan: true },
      orderBy: { paidThrough: "asc" },
    }),
    prisma.customer.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const now = new Date();

  return (
    <div>
      <h1 className="display">Memberships</h1>
      <p className="subtle">
        A monthly plan with a discount on services. You collect each month's payment yourself (Venmo, cash, in
        person) and tap "Record payment". While a member is paid up, their bookings are discounted automatically.
      </p>

      <h2 className="display" style={{ fontSize: 20, margin: "20px 0 10px" }}>Plans</h2>
      {plans.map((p: any) => (
        <div key={p.id} className="card" style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: p.active ? 1 : 0.55 }}>
          <div>
            <strong>{p.name}</strong> — {$(p.priceCents)}/month, {p.discountPct}% off services{p.active ? "" : " (retired)"}
          </div>
          <PlanToggle id={p.id} active={p.active} />
        </div>
      ))}
      <NewPlanForm />

      <h2 className="display" style={{ fontSize: 20, margin: "28px 0 10px" }}>Members</h2>
      {members.length === 0 ? (
        <p className="subtle">No members yet.</p>
      ) : (
        members.map((m: any) => {
          const current = m.paidThrough >= now;
          return (
            <div key={m.id} className="card" style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <strong>{m.customer.name}</strong> — {m.plan.name}
                <div className="subtle">
                  {current ? `Paid through ${day(m.paidThrough)}` : `Lapsed ${day(m.paidThrough)} — no discount until paid`}
                </div>
              </div>
              <MemberActions id={m.id} />
            </div>
          );
        })
      )}
      {plans.some((p: any) => p.active) && (
        <>
          <h3 className="display" style={{ fontSize: 17, margin: "20px 0 8px" }}>Sign up a customer</h3>
          <AddMemberForm customers={customers} plans={plans.filter((p: any) => p.active).map((p: any) => ({ id: p.id, name: p.name }))} />
        </>
      )}
    </div>
  );
}
