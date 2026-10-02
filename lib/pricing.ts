import { prisma } from "./prisma";

// Resolves the effective price and duration for a given stylist + service
// combo: the stylist's override if they have one set for that field,
// otherwise the business's base Service value. Used both when computing
// open slots (needs the duration) and when actually booking/charging
// (needs both), so the two never drift apart.
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
  };
}
