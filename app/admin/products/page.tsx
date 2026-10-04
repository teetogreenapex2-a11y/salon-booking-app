import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/access";
import ProductManager from "@/components/admin/ProductManager";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const business = await requireOwner();

  const products = await prisma.product.findMany({
    where: { businessId: business.id },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 4 }}>
        Products
      </h1>
      <p className="subtle" style={{ marginBottom: 20 }}>
        Retail products your stylists can sell at checkout.
      </p>
      <ProductManager businessId={business.id} initialProducts={products} />
    </div>
  );
}
