import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireOwner } from "@/lib/access";
import CustomerImportForm from "@/components/admin/CustomerImportForm";

export const dynamic = "force-dynamic";

export default async function ImportCustomersPage() {
  const business = await requireOwner();

  return (
    <div>
      <Link href="/admin/customers" className="back-link" style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> Customers
      </Link>

      <h1 className="display" style={{ fontSize: 24, margin: "12px 0 20px" }}>
        Import customers
      </h1>

      <CustomerImportForm />
    </div>
  );
}
