import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/access";
import { IssueGiftCardForm, VoidGiftCardButton } from "@/components/admin/GiftCardManager";

export const dynamic = "force-dynamic";

const $ = (c: number) => `$${(c / 100).toFixed(2)}`;

export default async function GiftCardsPage() {
  const business = await requireOwner();
  const cards = await prisma.giftCard.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const outstanding = cards.filter((c: any) => !c.voided).reduce((n: number, c: any) => n + c.balanceCents, 0);

  return (
    <div>
      <h1 className="display">Gift cards</h1>
      <p className="subtle">
        Sell a card any way you like (cash, Venmo, in person), then create it here to get its code. When the
        customer pays, type the code in "Collect payment" on their booking and the balance is used up.
        Outstanding balance: <strong>{$(outstanding)}</strong>.
      </p>
      <IssueGiftCardForm />
      <h2 className="display" style={{ fontSize: 20, margin: "28px 0 10px" }}>All cards</h2>
      {cards.length === 0 ? (
        <p className="subtle">No gift cards yet.</p>
      ) : (
        cards.map((c: any) => (
          <div key={c.id} className="card" style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", opacity: c.voided ? 0.55 : 1 }}>
            <div>
              <strong style={{ letterSpacing: 1 }}>{c.code}</strong> — {$(c.balanceCents)} of {$(c.initialCents)} left
              {c.voided ? " (voided)" : ""}
              <div className="subtle">
                {c.recipientName ? `For ${c.recipientName}` : "No recipient"}
                {c.purchaserName ? ` · from ${c.purchaserName}` : ""} ·{" "}
                {c.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
            <VoidGiftCardButton id={c.id} voided={c.voided} />
          </div>
        ))
      )}
    </div>
  );
}
