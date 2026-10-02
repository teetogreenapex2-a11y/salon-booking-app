import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";

// Imports a batch of customers for the LOGGED-IN user's own business only —
// matches existing customers by email (same compound key the booking flow
// uses), so re-importing the same file is always safe to re-run.
export async function POST(req: NextRequest) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { rows } = await req.json();
  if (!Array.isArray(rows)) {
    return NextResponse.json({ error: "No rows provided" }, { status: 400 });
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const email = String(row?.email || "").trim().toLowerCase();
    const name = String(row?.name || "").trim();
    const phone = String(row?.phone || "").trim();

    if (!email) {
      skipped++;
      continue;
    }

    const existing = await prisma.customer.findUnique({
      where: { businessId_email: { businessId: business.id, email } },
    });

    if (existing) {
      await prisma.customer.update({
        where: { id: existing.id },
        data: {
          name: name || existing.name,
          phone: phone || existing.phone,
        },
      });
      updated++;
    } else {
      await prisma.customer.create({
        data: {
          businessId: business.id,
          name: name || email.split("@")[0],
          email,
          phone: phone || null,
        },
      });
      created++;
    }
  }

  return NextResponse.json({ created, updated, skipped });
}
