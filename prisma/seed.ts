import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const business = await prisma.business.create({
    data: {
      slug: "studio-fern",
      name: "Studio Fern",
      tagline: "Color, cuts & curls in the heart of downtown",
      address: "214 Elm Street",
      instagram: "@studiofern",
      timezone: "America/New_York",
    },
  });

  const [mara, devon, priya] = await Promise.all([
    prisma.stylist.create({ data: { businessId: business.id, name: "Mara Ilić", specialty: "Color & balayage" } }),
    prisma.stylist.create({ data: { businessId: business.id, name: "Devon Ray", specialty: "Precision cuts" } }),
    prisma.stylist.create({ data: { businessId: business.id, name: "Priya Nadar", specialty: "Curly & textured" } }),
  ]);

  await prisma.service.createMany({
    data: [
      { businessId: business.id, name: "Signature Cut", durationMin: 45, priceCents: 6500, tag: "Most booked" },
      { businessId: business.id, name: "Full Color", durationMin: 120, priceCents: 16500 },
      { businessId: business.id, name: "Balayage", durationMin: 150, priceCents: 22000, tag: "Popular" },
      { businessId: business.id, name: "Blowout & Style", durationMin: 40, priceCents: 5500 },
      { businessId: business.id, name: "Keratin Treatment", durationMin: 100, priceCents: 19000 },
    ],
  });

  // Mon–Fri, 9am (540 min) to 5pm (1020 min), for every stylist
  const weekdayAvailability = [1, 2, 3, 4, 5].flatMap((dayOfWeek) =>
    [mara, devon, priya].map((s) => ({
      stylistId: s.id,
      dayOfWeek,
      startMin: 540,
      endMin: 1020,
    }))
  );
  await prisma.availability.createMany({ data: weekdayAvailability });

  console.log(`Seeded ${business.name} at /${business.slug}`);
}

main().finally(() => prisma.$disconnect());
