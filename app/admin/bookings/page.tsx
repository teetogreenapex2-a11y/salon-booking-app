import { fmtInTz } from "@/lib/tz";
import { displayEmail } from "@/lib/placeholderEmail";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/access";
import { resolvePayoutAccountId } from "@/lib/stripe";
import CancelBookingButton from "@/components/CancelBookingButton";
import MarkNoShowButton from "@/components/admin/MarkNoShowButton";
import ChargeNoShowFeeButton from "@/components/admin/ChargeNoShowFeeButton";
import SellProductsButton from "@/components/admin/SellProductsButton";
import AddServiceToBill from "@/components/admin/AddServiceToBill";
import CollectPaymentButton from "@/components/admin/CollectPaymentButton";

export const dynamic = "force-dynamic";

const money = (c: number) => `$${(c / 100).toFixed(2)}`;

export default async function BookingsPage() {
  const business = await requireOwner();
  const tz = business.timezone;
  const now = new Date();
  const include = { service: true, stylist: true, customer: true, sale: true, extras: true } as const;

  const [upcoming, past, products, services] = await Promise.all([
    prisma.booking.findMany({
      where: { businessId: business.id, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      include,
      take: 100,
    }),
    prisma.booking.findMany({
      where: { businessId: business.id, startsAt: { lt: now } },
      orderBy: { startsAt: "desc" },
      include,
      take: 60,
    }),
    prisma.product.findMany({
      where: { businessId: business.id, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.service.findMany({
      where: { businessId: business.id, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  const bookings = [...upcoming, ...past];

  // A booking's "do they have a card on file" question depends on which
  // connected account THAT booking's stylist pays out to — a card saved
  // under the salon's account doesn't carry over to a booth renter's own
  // account, or vice versa. Batch-fetch every card this page's bookings
  // could possibly need in one query rather than one per row.
  const customerIds = [...new Set(bookings.map((b) => b.customerId).filter((id): id is string => !!id))];
  const cardRows = customerIds.length
    ? await prisma.customerCard.findMany({ where: { customerId: { in: customerIds } } })
    : [];
  const cardFor = (customerId: string | null, accountId: string | null) =>
    customerId && accountId
      ? cardRows.find((c) => c.customerId === customerId && c.connectedAccountId === accountId)
      : undefined;

  const dayKey = (d: Date) => fmtInTz(d, tz, { year: "numeric", month: "2-digit", day: "2-digit" });
  const todayKey = dayKey(now);
  const dayLabel = (d: Date) => {
    const label = fmtInTz(d, tz, { weekday: "long", month: "long", day: "numeric" });
    return dayKey(d) === todayKey ? `Today · ${label}` : label;
  };

  type B = (typeof bookings)[number];
  const group = (list: B[]) => {
    const out: { key: string; label: string; items: B[] }[] = [];
    for (const b of list) {
      const k = dayKey(b.startsAt);
      const last = out[out.length - 1];
      if (last && last.key === k) last.items.push(b);
      else out.push({ key: k, label: dayLabel(b.startsAt), items: [b] });
    }
    return out;
  };

  function Card({ b }: { b: B }) {
    const accountId = resolvePayoutAccountId(b.stylist, business);
    const hasCard = !!cardFor(b.customerId, accountId)?.stripePaymentMethodId;
    const live = b.status !== "CANCELLED" && b.status !== "NO_SHOW";
    const showAddService = live && !b.paidOutsideAt;
    const showSell = b.status !== "CANCELLED" && !b.sale && hasCard && products.length > 0;
    const showFee = b.status === "NO_SHOW" && !b.noShowFeeChargedAt && hasCard;
    const hasMore = b.status === "CONFIRMED" || showFee || showSell || showAddService;
    const contact = [displayEmail(b.customerEmail), b.customerPhone].filter(Boolean).join(" · ");
    return (
      <div className="bk-card" style={{ opacity: b.status === "CANCELLED" ? 0.6 : 1 }}>
        <div className="bk-top">
          <div className="bk-time">
            {fmtInTz(b.startsAt, tz, { hour: "numeric", minute: "2-digit" })}
          </div>
          <div className="bk-main">
            <div className="bk-name">{b.customerName}</div>
            <div className="bk-sub">
              {b.service.name} · {b.stylist.name}
            </div>
            {contact && <div className="bk-contact">{contact}</div>}
          </div>
          <div className="bk-badges">
            {b.paidOutsideAt && <span className="bk-paid">PAID</span>}
            {b.status !== "CONFIRMED" && (
              <span className={`status-pill status-${b.status.toLowerCase()}`}>
                {b.status === "NO_SHOW" ? "NO SHOW" : b.status}
              </span>
            )}
            {b.status === "CONFIRMED" && b.clientConfirmedAt && <span className="bk-ok">✓ confirmed</span>}
          </div>
        </div>

        {(b.depositCents > 0 || b.noShowFeeChargedAt || b.sale) && (
          <div className="bk-notes">
            {b.depositCents > 0 &&
              (b.depositRefundedAt ? (
                <span>Deposit {money(b.depositCents)} refunded</span>
              ) : (
                <span>
                  Deposit {money(b.depositCents)} paid · balance {money(Math.max(0, b.priceCents - b.depositCents))}
                </span>
              ))}
            {b.noShowFeeChargedAt && <span>No-show fee charged</span>}
            {b.sale && <span>Products {money(b.sale.totalCents)}</span>}
          </div>
        )}

        {live && (
          <div className="bk-pay">
            <CollectPaymentButton
              bookingId={b.id}
              totalCents={b.priceCents}
              note={`${b.service.name} with ${b.stylist.name}`}
              venmoHandle={b.stylist.venmoHandle}
              cashAppHandle={b.stylist.cashAppHandle}
              zelleInfo={b.stylist.zelleInfo}
              paidMethod={b.paidOutsideMethod}
              creditCents={b.giftCardCents}
              depositCents={b.depositRefundedAt ? 0 : b.depositCents}
              tipCents={b.tipCents}
              hasCard={hasCard}
            />
          </div>
        )}

        {hasMore && (
          <details className="bk-more">
            <summary>More</summary>
            <div className="bk-actions">
              {b.status === "CONFIRMED" && (
                <>
                  <CancelBookingButton id={b.id} />
                  <MarkNoShowButton id={b.id} />
                </>
              )}
              {showFee && <ChargeNoShowFeeButton id={b.id} feeCents={business.noShowFeeCents} />}
              {showSell && <SellProductsButton bookingId={b.id} products={products} />}
              {showAddService && (
                <AddServiceToBill
                  bookingId={b.id}
                  services={services}
                  extras={b.extras.map((e) => ({ id: e.id, name: e.name, priceCents: e.priceCents }))}
                />
              )}
            </div>
          </details>
        )}
      </div>
    );
  }

  const Section = ({ title, list, empty }: { title: string; list: B[]; empty: string }) => (
    <section style={{ marginBottom: 28 }}>
      <h2 className="display" style={{ fontSize: 20, margin: "0 0 10px" }}>{title}</h2>
      {list.length === 0 ? (
        <p className="subtle">{empty}</p>
      ) : (
        group(list).map((g) => (
          <div key={g.key} style={{ marginBottom: 16 }}>
            <p className="bk-day">{g.label}</p>
            {g.items.map((b) => (
              <Card key={b.id} b={b} />
            ))}
          </div>
        ))
      )}
    </section>
  );

  return (
    <div style={{ maxWidth: 760 }}>
      <style>{`
        .bk-day { font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #73343A; margin: 0 0 6px; }
        .bk-card { background: #fff; border: 1px solid rgba(36,28,31,.1); border-radius: 12px; padding: 12px 14px; margin-bottom: 8px; }
        .bk-top { display: flex; gap: 12px; align-items: flex-start; }
        .bk-time { min-width: 64px; font-weight: 700; font-size: 14px; padding-top: 1px; }
        .bk-main { flex: 1; min-width: 0; }
        .bk-name { font-weight: 600; font-size: 15px; }
        .bk-sub { font-size: 13px; margin-top: 1px; }
        .bk-contact { font-size: 12px; color: rgba(36,28,31,.55); margin-top: 3px; overflow-wrap: anywhere; }
        .bk-badges { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
        .bk-paid { background: #1b7a3d; color: #fff; font-size: 11px; font-weight: 700; border-radius: 999px; padding: 2px 8px; }
        .bk-ok { font-size: 11px; color: #2e7d32; }
        .bk-notes { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 12px; color: rgba(36,28,31,.6); margin: 8px 0 0 76px; }
        .bk-pay { margin: 10px 0 0 76px; }
        .bk-more { margin: 8px 0 0 76px; }
        .bk-more summary { cursor: pointer; font-size: 12px; color: rgba(36,28,31,.6); list-style: none; }
        .bk-more summary::-webkit-details-marker { display: none; }
        .bk-more summary::after { content: " ▾"; }
        .bk-actions { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
        @media (max-width: 520px) {
          .bk-notes, .bk-pay, .bk-more { margin-left: 0; }
        }
      `}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
        <h1 className="display" style={{ fontSize: 26, margin: 0 }}>
          Bookings
        </h1>
        <a href="/admin/book" className="btn-primary" style={{ textDecoration: "none", padding: "9px 16px", fontSize: 14 }}>
          + New booking
        </a>
      </div>
      <Section title="Upcoming" list={upcoming} empty="Nothing coming up." />
      <Section title="Past" list={past} empty="No past bookings yet." />
    </div>
  );
}
