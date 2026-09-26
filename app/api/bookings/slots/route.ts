import { NextRequest, NextResponse } from "next/server";
import { getOpenSlots } from "@/lib/availability";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stylistId = searchParams.get("stylistId");
  const durationMin = Number(searchParams.get("durationMin"));
  const dateParam = searchParams.get("date");

  if (!stylistId || !durationMin || !dateParam) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const date = new Date(dateParam);
  const slots = await getOpenSlots(stylistId, date, durationMin);

  return NextResponse.json({ slots });
}
