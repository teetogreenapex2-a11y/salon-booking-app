import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim().slice(0, 100);
  const slug = String(b.slug || "")
    .toLowerCase()
    .trim()
    .replace(/^.*hairsalonix\.com\//, "")
    .replace(/[^a-z0-9-]/g, "");
  if (!name || !slug) {
    return NextResponse.json({ error: "Enter your name and the salon's web address." }, { status: 400 });
  }

  const business = await prisma.business.findUnique({ where: { slug }, include: { owner: true } });
  if (!business) {
    return NextResponse.json({ error: "We couldn't find a salon at that address. Ask the owner for their booking link." }, { status: 404 });
  }
  const already = await prisma.stylist.findUnique({ where: { email } });
  if (already) return NextResponse.json({ error: "You're already set up as a stylist." }, { status: 409 });

  await prisma.joinRequest.upsert({
    where: { businessId_email: { businessId: business.id, email } },
    update: { name, status: "PENDING" },
    create: { businessId: business.id, name, email },
  });

  if (business.owner?.email) {
    sendEmail(
      business.owner.email,
      `${name} asked to join ${business.name}`,
      `<p><strong>${esc(name)}</strong> (${esc(email)}) asked to join your salon on Hairsalonix.</p>
       <p>Approve or decline on your <a href="${process.env.APP_URL || "https://www.hairsalonix.com"}/admin/stylists">Stylists page</a>.</p>`
    ).catch((e) => console.error("Join request email failed", e));
  }
  return NextResponse.json({ ok: true, salon: business.name });
}
