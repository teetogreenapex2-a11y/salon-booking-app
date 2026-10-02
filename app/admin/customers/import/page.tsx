import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentBusiness } from "@/lib/auth";
import CustomerImportForm from "@/components/admin/CustomerImportForm";

export const dynamic = "force-dynamic";

export default async function ImportCustomersPage() {
  const business = await getCurrentBusiness();
  if (!business) {
    redirect("/onboarding");
  }

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
