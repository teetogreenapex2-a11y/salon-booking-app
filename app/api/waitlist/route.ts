import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public: a customer joins the waitlist for a fully booked day.
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim().slice(0, 100);
  const email = String(b.email || "").trim().toLowerCase().slice(0, 200);
  const phone = b.phone ? String(b.phone).trim().slice(0, 40) : null;
  const day = String(b.day || "");
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return NextResponse.json({ error: "Please enter your name, a valid email and a date." }, { status: 400 });
  }
  const stylist = await prisma.stylist.findUnique({ where: { id: String(b.stylistId || "") } });
  const service = await prisma.service.findUnique({ where: { id: String(b.serviceId || "") } });
  if (!stylist || !service || service.businessId !== stylist.businessId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const dup = await prisma.waitlistEntry.findFirst({
    where: { stylistId: stylist.id, day, email, status: "WAITING" },
  });
  if (!dup) {
    await prisma.waitlistEntry.create({
      data: { businessId: stylist.businessId, stylistId: stylist.id, serviceId: service.id, name, email, phone, day },
    });
  }
  return NextResponse.json({ ok: true });
}
