import { prisma } from "@/lib/prisma";

// Finds a booking by its secret link token, with what the manage routes need.
export async function bookingByToken(token: string) {
  if (!token || token.length < 10) return null;
  return prisma.booking.findUnique({
    where: { manageToken: token },
    include: { business: true, service: true, stylist: true },
  });
}
