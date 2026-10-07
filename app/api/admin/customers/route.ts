import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness, getCurrentStylist } from "@/lib/auth";
import { makePlaceholderEmail } from "@/lib/placeholderEmail";

// Adds a customer by hand (e.g. a walk-in). Open to the owner and to stylist
// accounts. Needs a name and at least a phone number or an email.
export async function POST(req: NextRequest) {
  const business = await getCurrentBusiness();
  let businessId = business?.id;
  if (!businessId) {
    const stylist = await getCurrentStylist();
    businessId = stylist?.businessId;
  }
  if (!businessId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json();
  const name = String(body.name ?? "").trim().slice(0, 100);
  const phone = String(body.phone ?? "").trim().slice(0, 40);
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 200);

  if (!name) return NextResponse.json({ error: "Enter the customer's name." }, { status: 400 });
  if (!phone && !email) {
    return NextResponse.json({ error: "Enter a phone number or an email." }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  }

  const customer = email
    ? await prisma.customer.upsert({
        where: { businessId_email: { businessId, email } },
        update: { name, phone: phone || undefined },
        create: { businessId, name, email, phone: phone || null },
      })
    : await prisma.customer.create({
        data: { businessId, name, email: makePlaceholderEmail(), phone },
      });

  return NextResponse.json({ id: customer.id, name: customer.name, email: customer.email, phone: customer.phone });
}
