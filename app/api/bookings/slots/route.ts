import { NextRequest, NextResponse } from "next/server";
import { getOpenSlots } from "@/lib/availability";
import { getEffectiveServiceInfo } from "@/lib/pricing";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stylistId = searchParams.get("stylistId");
  const serviceId = searchParams.get("serviceId");
  const dateParam = searchParams.get("date");

  if (!stylistId || !serviceId || !dateParam) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const info = await getEffectiveServiceInfo(stylistId, serviceId);
  if (!info) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }
  if (!info.offered) {
    // This stylist has that service's price set to $0, meaning they don't
    // do it — no open slots for a combo that was never bookable.
    return NextResponse.json({ slots: [] });
  }

  const date = new Date(dateParam);
  const slots = await getOpenSlots(stylistId, date, info.durationMin);

  return NextResponse.json({ slots });
}
