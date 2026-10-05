import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OnboardingForm from "@/components/OnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user!.email! },
    include: { business: true },
  });

  if (user?.business) {
    redirect("/admin");
  }

  // Invited as a co-owner of someone else's business — nothing to set up,
  // they go straight in.
  const asMember = await prisma.businessMember.findUnique({
    where: { email: session.user!.email!.toLowerCase() },
  });
  if (asMember) {
    redirect("/admin");
  }

  return (
    <main className="page" style={{ maxWidth: 480 }}>
      <h1 className="display title">Set up your business</h1>
      <p className="tagline">Takes about a minute. You can change any of this later.</p>
      <OnboardingForm />
    </main>
  );
}
