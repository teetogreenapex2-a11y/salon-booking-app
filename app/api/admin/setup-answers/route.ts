import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";
import { parseAnswers } from "@/lib/setupQuestions";

// Saves the owner's setup-questionnaire answers (or a "skip"). Only used
// to tailor the checklist — nothing else reads it.
export async function PUT(req: NextRequest) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const answers = parseAnswers(body.skip ? { skipped: true } : body);
  if (!answers) {
    return NextResponse.json({ error: "No answers to save." }, { status: 400 });
  }

  await prisma.business.update({
    where: { id: business.id },
    data: { setupAnswers: answers },
  });
  return NextResponse.json(answers);
}
