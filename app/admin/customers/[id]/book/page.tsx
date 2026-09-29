import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdminBookingFlow from "@/components/AdminBookingFlow";

export const dynamic = "force-dynamic";

export default async function AdminBookCustomer({ params }: { params: { id: string } }) {
  const business = await prisma.business.findFirst();
  if (!business) {
    return <p className="subtle">No business set up yet.</p>;
  }

  const customer = await prisma.customer.findFirst({
    where: { id: params.id, businessId: business.id },
  });

  if (!customer) notFound();

  const [services, stylists] = await Promise.all([
    prisma.service.findMany({
      where: { businessId: business.id, active: true },
    }),
    prisma.stylist.findMany({
      where: { businessId: business.id, active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <Link href={`/admin/customers/${customer.id}`} className="back-link" style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> {customer.name}
      </Link>

      <h1 className="display" style={{ fontSize: 24, margin: "12px 0 20px" }}>
        Book next appointment
      </h1>

      <AdminBookingFlow
        businessSlug={business.slug}
        services={services}
        stylists={stylists}
        customer={{
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        }}
      />
    </div>
  );
}
