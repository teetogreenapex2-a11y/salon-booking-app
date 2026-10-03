import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";
import { syncStylistSubscriptionQuantity } from "@/lib/stripe";

// Checks the stylist belongs to the logged-in user's business before
// updating — otherwise anyone signed in could edit any stylist in the
// database just by knowing (or guessing) its id.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const existing = await prisma.stylist.findFirst({
    where: { id: params.id, businessId: business.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = await req.json();

  let stylist;
  try {
    stylist = await prisma.stylist.update({ where: { id: params.id }, data });
  } catch (err: unknown) {
    // P2002 = unique constraint failed — most likely someone tried to set
    // a login email that's already in use by another stylist.
    if (typeof err === "object" && err !== null && "code" in err && err.code === "P2002") {
      return NextResponse.json(
        { error: "That email is already set up as a login for another stylist." },
        { status: 409 }
      );
    }
    throw err;
  }

  // Toggling `active` off/on, or any edit, is a good moment to re-check the
  // subscription quantity still matches — cheap no-op if unchanged.
  await syncStylistSubscriptionQuantity(business.id);

  return NextResponse.json(stylist);
}
