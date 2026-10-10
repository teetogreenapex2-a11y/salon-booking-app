import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { syncStylistSubscriptionQuantity } from "@/lib/stripe";

// Owner approves or declines. Approve = create the Stylist row for that email.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { action } = await req.json().catch(() => ({}));

  const jr = await prisma.joinRequest.findFirst({ where: { id: params.id, businessId: business.id } });
  if (!jr) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const base = process.env.APP_URL || "https://www.hairsalonix.com";

  if (action === "approve") {
    const taken = await prisma.stylist.findUnique({ where: { email: jr.email } });
    if (taken) {
      return NextResponse.json({ error: "That email is already a stylist somewhere." }, { status: 409 });
    }
    await prisma.stylist.create({ data: { businessId: business.id, name: jr.name, email: jr.email } });
    await prisma.joinRequest.deleteMany({ where: { email: jr.email } });
    await syncStylistSubscriptionQuantity(business.id);
    sendEmail(
      jr.email,
      `You're in at ${business.name}`,
      `<p>Hi ${jr.name.replace(/</g, "")},</p><p>${business.name} approved you. <a href="${base}/login">Sign in</a> to set up your hours and services.</p>`
    ).catch((e) => console.error("Approval email failed", e));
    return NextResponse.json({ ok: true });
  }

  if (action === "decline") {
    await prisma.joinRequest.update({ where: { id: jr.id }, data: { status: "DECLINED" } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Bad action" }, { status: 400 });
}
