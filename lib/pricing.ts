import { prisma } from "./prisma";

// Resolves the effective price and duration for a given stylist + service
// combo: the stylist's override if they have one set for that field,
// otherwise the business's base Service value. Used both when computing
// open slots (needs the duration) and when actually booking/charging
// (needs both), so the two never drift apart.
//
// A stylist with their price override explicitly set to $0 is signaling
// "I don't do this service" (set from their own Pricing page or the
// owner's) — `offered: false` lets callers refuse to book that combo even
// if someone reaches the booking API directly, bypassing the UI that
// normally hides it.
export async function getEffectiveServiceInfo(stylistId: string, serviceId: string) {
  const [service, override] = await Promise.all([
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.stylistService.findUnique({
      where: { stylistId_serviceId: { stylistId, serviceId } },
    }),
  ]);

  if (!service) return null;

  return {
    service,
    priceCents: override?.priceCents ?? service.priceCents,
    durationMin: override?.durationMin ?? service.durationMin,
    offered: override?.priceCents !== 0,
  };
}
