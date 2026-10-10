import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import JoinSalonForm from "@/components/JoinSalonForm";
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

  // Already added as a stylist by a salon owner (or approved) — go in.
  const asStylist = await prisma.stylist.findUnique({ where: { email: session.user!.email! } });
  if (asStylist) {
    redirect("/admin");
  }

  const pending = await prisma.joinRequest.findFirst({
    where: { email: session.user!.email!.toLowerCase(), status: "PENDING" },
    include: { business: true },
  });
  if (pending) {
    return (
      <main className="page" style={{ maxWidth: 480 }}>
        <h1 className="display title">Waiting for approval</h1>
        <p className="tagline">
          You asked to join {pending.business.name}. Once the owner approves you, sign in again and you'll go
          straight to your dashboard.
        </p>
      </main>
    );
  }

  return (
    <main className="page" style={{ maxWidth: 480 }}>
      <h1 className="display title">Set up your business</h1>
      <p className="tagline">Takes about a minute. You can change any of this later.</p>
      <OnboardingForm />
      <h2 className="display" style={{ fontSize: 20, margin: "32px 0 6px" }}>Joining an existing salon?</h2>
      <p className="subtle" style={{ marginBottom: 12 }}>
        Ask the owner for their booking link, then request to join. They approve you on their Stylists page.
      </p>
      <JoinSalonForm />
    </main>
  );
}
