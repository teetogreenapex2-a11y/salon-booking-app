import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";

// Updates the LOGGED-IN user's own business only — the id always comes
// from the session, never from the request body.
export async function PUT(req: NextRequest) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { name, slug, tagline, address, instagram, timezone, noShowFeeCents } = await req.json();

  let cleanSlug: string | undefined;
  if (typeof slug === "string") {
    // Same cleanup as onboarding's slug — lowercase, dashes only, no
    // leading/trailing dash — so it stays safe to use in a URL.
    cleanSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (!cleanSlug) {
      return NextResponse.json({ error: "Web address can't be empty" }, { status: 400 });
    }

    if (cleanSlug !== business.slug) {
      const taken = await prisma.business.findUnique({ where: { slug: cleanSlug } });
      if (taken) {
        return NextResponse.json({ error: "That web address is already taken — try another" }, { status: 409 });
      }
    }
  }

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: {
      name,
      tagline,
      address,
      instagram,
      timezone,
      ...(cleanSlug ? { slug: cleanSlug } : {}),
      ...(typeof noShowFeeCents === "number" ? { noShowFeeCents } : {}),
    },
  });
  return NextResponse.json(updated);
}
