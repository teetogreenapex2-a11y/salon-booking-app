import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";
import { cleanTabs, MAX_TABS } from "@/lib/navTabs";

export async function PUT(req: NextRequest) {
  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { tabs } = await req.json().catch(() => ({}));
  const clean = cleanTabs(tabs);
  if (clean.length === 0) {
    return NextResponse.json({ error: `Pick 1 to ${MAX_TABS} tabs.` }, { status: 400 });
  }
  await prisma.business.update({ where: { id: business.id }, data: { navTabs: JSON.stringify(clean) } });
  return NextResponse.json({ ok: true, tabs: clean });
}
