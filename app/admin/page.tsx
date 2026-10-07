export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/access";
import Link from "next/link";
import { Users, Scissors, CalendarCheck, CalendarPlus } from "lucide-react";
import SetupChecklist from "@/components/admin/SetupChecklist";
import SetupQuiz from "@/components/admin/SetupQuiz";
import { ownerSetupSteps } from "@/lib/setup";
import { parseAnswers } from "@/lib/setupQuestions";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { quiz?: string };
}) {
  const business = await requireOwner();

  // First visit (no answers yet, setup not finished) or "tailor this list" (?quiz=1): ask the
  // short questionnaire. Skipping saves {skipped:true}, so it never nags.
  const answers = parseAnswers(business.setupAnswers);
  const setupSteps = await ownerSetupSteps(business, answers);
  // Accounts that already finished the standard setup never see the quiz
  // unless they ask for it (?quiz=1).
  const alreadySetUp = setupSteps.filter((s) => !s.optional).every((s) => s.done);
  const showQuiz = (!answers && !alreadySetUp) || searchParams.quiz === "1";

  const [stylistCount, serviceCount, upcomingBookings] = await Promise.all([
    prisma.stylist.count({ where: { businessId: business.id, active: true } }),
    prisma.service.count({ where: { businessId: business.id, active: true } }),
    prisma.booking.findMany({
      where: { businessId: business.id, status: "CONFIRMED", startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 5,
      include: { service: true, stylist: true },
    }),
  ]);

  return (
    <div>
      <h1 className="display" style={{ fontSize: 26, marginBottom: 4 }}>
        {business.name}
      </h1>
      <p className="subtle" style={{ marginBottom: 24 }}>
        Overview
      </p>

      {showQuiz ? (
        <SetupQuiz />
      ) : (
        <>
          {answers?.skipped && (
            <p className="subtle" style={{ marginBottom: 8, fontSize: 13 }}>
              <Link href="/admin?quiz=1">Answer a few quick questions</Link> to tailor your setup list.
            </p>
          )}
          <SetupChecklist
        storageKey={`setup-hidden-${business.id}`}
        title="Get set up — here's what to do next"
        steps={setupSteps}
        bookingLink={`https://hairsalonix.com/${business.slug}`}
          />
        </>
      )}

      <div className="stat-row">
        <div className="stat-card">
          <span className="stat-icon"><Users size={18} /></span>
          <span className="stat-number">{stylistCount}</span>
          <span className="subtle">Active stylists</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon"><Scissors size={18} /></span>
          <span className="stat-number">{serviceCount}</span>
          <span className="subtle">Services offered</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon"><CalendarCheck size={18} /></span>
          <span className="stat-number">{upcomingBookings.length}</span>
          <span className="subtle">Upcoming bookings</span>
        </div>
      </div>

      <h2 className="display" style={{ fontSize: 20, margin: "32px 0 12px" }}>
        Next up
      </h2>
      {upcomingBookings.length === 0 ? (
        <div className="empty-state">
          <span className="stat-icon"><CalendarPlus size={22} /></span>
          <p className="name">No upcoming bookings yet</p>
          <p className="subtle" style={{ margin: "6px 0 14px" }}>
            Share your booking link and new appointments will show up here.
          </p>
          <a className="btn-primary" href={`/${business.slug}`} style={{ textDecoration: "none" }}>
            View my booking page
          </a>
        </div>
      ) : (
        <div className="list">
          {upcomingBookings.map((b) => (
            <div key={b.id} className="card static" style={{ justifyContent: "space-between" }}>
              <div>
                <p className="name">
                  {b.customerName} — {b.service.name}
                </p>
                <p className="subtle" style={{ margin: "2px 0 0" }}>
                  with {b.stylist.name} ·{" "}
                  {b.startsAt.toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p style={{ marginTop: 24 }}>
        <Link href="/admin/bookings" className="subtle">
          See all bookings
        </Link>
      </p>
    </div>
  );
}
