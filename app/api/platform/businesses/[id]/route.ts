import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getPlatformAdminEmail } from "@/lib/platform";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await getPlatformAdminEmail())) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const { action } = await req.json();
  if (!["approve", "reject", "pending"].includes(action)) {
    return NextResponse.json({ error: "Bad action" }, { status: 400 });
  }

  const status = action === "approve" ? "APPROVED" : action === "reject" ? "REJECTED" : "PENDING";
  const business = await prisma.business.update({
    where: { id: params.id },
    data: {
      approvalStatus: status,
      approvedAt: status === "APPROVED" ? new Date() : null,
      listed: status === "APPROVED" ? true : false,
    },
    include: { owner: { select: { email: true } } },
  });

  if (status === "APPROVED" && business.owner?.email) {
    try {
      await sendEmail(
        business.owner.email,
        "You're approved on Hairsalonix",
        `<p>Good news — <strong>${business.name.replace(/</g, "&lt;")}</strong> has been approved.</p>` +
          `<p><a href="https://www.hairsalonix.com/admin">Open your dashboard</a></p>`
      );
    } catch (e) {
      console.error("[platform] approval email failed", e);
    }
  }
  return NextResponse.json({ ok: true, status });
}
