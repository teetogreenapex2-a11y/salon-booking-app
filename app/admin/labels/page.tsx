import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/access";
import { makeLabelCode } from "@/lib/labels";
import PrintButton from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";

async function ensureCodes(kind: "service" | "product", businessId: string) {
  const model: any = kind === "service" ? prisma.service : prisma.product;
  const rows = await model.findMany({ where: kind === "product" ? { businessId, barcode: null, stylistId: null } : { businessId, barcode: null } });
  for (const r of rows) {
    for (let i = 0; i < 5; i++) {
      try {
        await model.update({ where: { id: r.id }, data: { barcode: makeLabelCode(kind === "service" ? "SVC" : "PRD") } });
        break;
      } catch {
        // code collision — try another
      }
    }
  }
}

export default async function LabelsPage() {
  const business = await requireOwner();
  await ensureCodes("service", business.id);
  await ensureCodes("product", business.id);

  const [services, products] = await Promise.all([
    prisma.service.findMany({ where: { businessId: business.id, active: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { businessId: business.id, stylistId: null, active: true }, orderBy: { name: "asc" } }),
  ]);

  const items = [
    ...services.map((s) => ({ id: s.id, kind: "Service", name: s.name, code: s.barcode! })),
    ...products.map((p) => ({ id: p.id, kind: "Product", name: p.name, code: p.barcode! })),
  ];
  const withImg = await Promise.all(
    items.map(async (i) => ({ ...i, img: await QRCode.toDataURL(i.code, { margin: 1, width: 220 }) }))
  );

  return (
    <div>
      <div className="no-print" style={{ marginBottom: 16 }}>
        <h1 className="display" style={{ fontSize: 26, marginBottom: 4 }}>QR labels</h1>
        <p className="subtle" style={{ marginBottom: 12 }}>
          Print these and stick them on a card or product. Scan a service label to add it to a client&apos;s bill, or a
          product label to add stock or ring up a sale. Products with a store barcode already on them don&apos;t need a
          label — scan the store barcode and save it on the product.
        </p>
        <PrintButton />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
        {withImg.map((i) => (
          <div key={i.id} style={{ border: "1px dashed #bbb", borderRadius: 8, padding: 8, textAlign: "center", breakInside: "avoid" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={i.img} alt={i.code} style={{ width: "100%", maxWidth: 140 }} />
            <div style={{ fontWeight: 600, fontSize: 13 }}>{i.name}</div>
            <div className="subtle" style={{ fontSize: 10 }}>{i.kind} · {i.code}</div>
          </div>
        ))}
      </div>
      <style>{`@media print { .no-print, nav, header { display: none !important; } }`}</style>
    </div>
  );
}
