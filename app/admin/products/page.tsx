import { prisma } from "@/lib/prisma";
import { requireOwnerOrStylist } from "@/lib/access";
import ProductManager from "@/components/admin/ProductManager";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const access = await requireOwnerOrStylist();
  const business = access.business;
  const mine = access.role === "stylist";

  const products = await prisma.product.findMany({
    where: { businessId: business.id, stylistId: mine ? access.stylist.id : null },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 4 }}>
        Products
      </h1>
      <p className="subtle" style={{ marginBottom: 20 }}>
        {mine
          ? "Your own retail products. Sold on your clients\u2019 bookings and paid out to you."
          : "The salon\u2019s retail products. Stylists with their own payouts add and sell their own on their Products page."} Enter what you pay for each one to see profit in Reports.
      </p>
      <ProductManager businessId={business.id} initialProducts={products} />
    </div>
  );
}
