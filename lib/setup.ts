import { prisma } from "@/lib/prisma";
import type { SetupAnswers } from "@/lib/setupQuestions";

export type SetupStep = {
  key: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  done: boolean;
  // Optional steps are suggestions shown below the main list — they don't
  // count toward "all done" and never nag.
  optional?: boolean;
};

type OwnerBusiness = {
  id: string;
  address: string | null;
  tagline: string | null;
  stripeChargesEnabled: boolean;
};

const APP_NAMES: Record<string, string> = {
  vagaro: "Vagaro",
  booksy: "Booksy",
  glossgenius: "GlossGenius",
  fresha: "Fresha",
  other: "your old app or spreadsheet",
};

// The owner's "Get set up" list. Every step is worked out from what
// already exists in the database, so it ticks itself off as they go —
// there's nothing to store and nothing they can forget to check off.
//
// If the owner answered the first-visit questionnaire, the answers
// reshape the list: steps that don't apply are dropped, ones that matter
// to them become required, and a few extra steps appear. With no answers
// (skipped, or an older account) they get the standard list.
export async function ownerSetupSteps(
  business: OwnerBusiness,
  answers: SetupAnswers | null = null
): Promise<SetupStep[]> {
  const [
    serviceCount,
    stylistCount,
    hoursCount,
    photoCount,
    bookingCount,
    customerCount,
    productCount,
    boothCount,
    handleCount,
    commissionCount,
    coOwnerCount,
  ] = await Promise.all([
    prisma.service.count({ where: { businessId: business.id, active: true } }),
    prisma.stylist.count({ where: { businessId: business.id, active: true } }),
    prisma.availability.count({ where: { stylist: { businessId: business.id, active: true } } }),
    prisma.photo.count({ where: { businessId: business.id } }),
    prisma.booking.count({ where: { businessId: business.id } }),
    prisma.customer.count({ where: { businessId: business.id } }),
    prisma.product.count({ where: { businessId: business.id } }),
    prisma.stylist.count({
      where: {
        businessId: business.id,
        active: true,
        OR: [{ independentPayouts: true }, { independentBilling: true }],
      },
    }),
    prisma.stylist.count({
      where: {
        businessId: business.id,
        active: true,
        OR: [{ venmoHandle: { not: null } }, { cashAppHandle: { not: null } }, { zelleInfo: { not: null } }],
      },
    }),
    prisma.stylist.count({
      where: { businessId: business.id, active: true, retailCommissionPct: { gt: 0 } },
    }),
    prisma.businessMember.count({ where: { businessId: business.id } }),
  ]);

  const answered = !!answers && !answers.skipped;
  const a: SetupAnswers = answered ? answers! : {};

  const switchingApp = a.switching && a.switching !== "none" ? APP_NAMES[a.switching] : null;
  const hasChairRenters = a.who === "booth" || a.who === "mix";
  const stripeRequired =
    !answered || a.payments === "card" || a.payments === "mix" || a.noshow === "yes";
  const appsRequired = a.payments === "apps" || a.payments === "mix";
  const productsRequired = a.products === "yes";
  const productsOptional = !answered; // answered "no" drops the step entirely
  const importOptional = !answered; // answered "starting fresh" drops it

  const steps: SetupStep[] = [];

  steps.push({
    key: "profile",
    title: "Finish your business profile",
    description: "Add your address and a one-line tagline so clients know who you are and where to find you.",
    href: "/admin/business",
    cta: "Edit profile",
    done: !!business.address && !!business.tagline,
  });

  if (a.coowner === "yes") {
    steps.push({
      key: "coowner",
      title: "Invite your co-owner",
      description:
        "Add your partner by email on the Business page. They sign in with their own login and get the same full access you have.",
      href: "/admin/business",
      cta: "Invite co-owner",
      done: coOwnerCount > 0,
    });
  }

  steps.push({
    key: "services",
    title: "Add your services",
    description: "List what you offer — cuts, color, styling — with a price and how long each takes.",
    href: "/admin/services",
    cta: "Add services",
    done: serviceCount > 0,
  });

  steps.push({
    key: "team",
    title: a.who === "solo" ? "Check your stylist profile" : "Add your stylists",
    description:
      a.who === "solo"
        ? "You're already set up as your own stylist. Check your name and specialty look right."
        : "Add everyone clients can book with. Each stylist can get their own login if you want.",
    href: "/admin/stylists",
    cta: a.who === "solo" ? "Check profile" : "Add stylists",
    done: stylistCount > 0,
  });

  if (hasChairRenters) {
    steps.push({
      key: "booth",
      title: "Set up your chair renters",
      description:
        "On the Stylists page, tick the booth-renter options for each person who rents a chair — their own Stripe payouts and/or paying Hairsalonix for their own seat — and give them a login email.",
      href: "/admin/stylists",
      cta: "Set up renters",
      done: boothCount > 0,
    });
  }

  steps.push({
    key: "hours",
    title: "Set working hours",
    description: "Choose the days and times each stylist can be booked. Clients only see open times inside these hours.",
    href: "/admin/availability",
    cta: "Set hours",
    done: hoursCount > 0,
  });

  if (switchingApp) {
    steps.push({
      key: "import",
      title: `Bring your clients over from ${switchingApp}`,
      description: `Export your client list from ${
        a.switching === "other" ? "your old app or spreadsheet" : switchingApp
      } as a CSV file (look for an Export option under Clients or Customers), then upload it here. Clients will add their card again the next time they book.`,
      href: "/admin/customers/import",
      cta: "Import clients",
      done: customerCount > 1,
    });
  }

  if (stripeRequired) {
    steps.push({
      key: "payments",
      title: "Connect payments",
      description:
        a.noshow === "yes"
          ? "Connect your Stripe account so a card is kept on file and no-show fees can be charged."
          : "Connect your Stripe account so you can keep a card on file and take card payments.",
      href: "/admin/billing",
      cta: "Connect Stripe",
      done: business.stripeChargesEnabled,
    });
  }

  if (appsRequired) {
    steps.push({
      key: "apps",
      title: "Add Venmo, Cash App or Zelle",
      description:
        "Add each stylist's Venmo, Cash App or Zelle on the Stylists page. Clients get a pay link in their confirmation, and you mark bookings paid.",
      href: "/admin/stylists",
      cta: "Add payment options",
      done: handleCount > 0,
    });
  }

  steps.push({
    key: "photos",
    title: "Show off your work",
    description: "Add photos of your best work — they appear on your public booking page.",
    href: "/admin/gallery",
    cta: "Add photos",
    done: photoCount > 0,
  });

  if (productsRequired) {
    steps.push({
      key: "products",
      title: "Add your products",
      description: "Add shampoo, styling products and more so you can ring them up at checkout and track stock.",
      href: "/admin/products",
      cta: "Add products",
      done: productCount > 0,
    });
  }

  if (productsRequired && a.commission === "yes") {
    steps.push({
      key: "commission",
      title: "Set product commissions",
      description:
        "On the Stylists page, set the percent each stylist earns on products they ring up. Every sale records that stylist's commission automatically.",
      href: "/admin/stylists",
      cta: "Set commissions",
      done: commissionCount > 0,
    });
  }

  steps.push({
    key: "share",
    title: "Share your booking link",
    description:
      "Put your link in your Instagram bio, texts, and email signature. This ticks off when your first booking comes in.",
    href: "/admin/business",
    cta: "See my link",
    done: bookingCount > 0,
  });

  // Suggestions that don't count toward "all done". Which ones appear
  // depends on what they said matters to them.
  if (importOptional) {
    steps.push({
      key: "import-optional",
      title: "Bring your existing clients",
      description: "Moving from another app? Import your client list from a spreadsheet (CSV).",
      href: "/admin/customers/import",
      cta: "Import clients",
      done: customerCount > 1,
      optional: true,
    });
  }
  if (!stripeRequired) {
    steps.push({
      key: "payments-optional",
      title: "Connect Stripe for card payments",
      description: "Optional — lets you keep a card on file and charge no-show fees if you change your mind later.",
      href: "/admin/billing",
      cta: "Connect Stripe",
      done: business.stripeChargesEnabled,
      optional: true,
    });
  }
  if (productsOptional) {
    steps.push({
      key: "products-optional",
      title: "Sell products",
      description: "Add shampoo, styling products and more so you can ring them up at checkout.",
      href: "/admin/products",
      cta: "Add products",
      done: productCount > 0,
      optional: true,
    });
  }

  return steps;
}

type StylistLike = {
  id: string;
  independentPayouts: boolean;
  independentBilling: boolean;
  stripeChargesEnabled: boolean;
  subscriptionStatus: string | null;
  venmoHandle: string | null;
  cashAppHandle: string | null;
  zelleInfo: string | null;
  canEditOwnHours: boolean;
};

// The same idea for a stylist who signs in under a salon's account (or a
// booth renter) — shorter, and only the steps that are actually theirs.
export async function stylistSetupSteps(stylist: StylistLike): Promise<SetupStep[]> {
  const hoursCount = await prisma.availability.count({ where: { stylistId: stylist.id } });
  const overrideCount = await prisma.stylistService.count({ where: { stylistId: stylist.id } });

  const steps: SetupStep[] = [];

  if (stylist.canEditOwnHours) {
    steps.push({
      key: "hours",
      title: "Set your working hours",
      description: "Choose the days and times clients can book you.",
      href: "/admin/availability",
      cta: "Set hours",
      done: hoursCount > 0,
    });
  }

  steps.push({
    key: "pricing",
    title: "Check your prices",
    description: "Review the price and time for each service. Set a service to $0 if you don't offer it.",
    href: `/admin/stylists/${stylist.id}/pricing`,
    cta: "Review pricing",
    // There's no "reviewed" flag, so this ticks once they've changed
    // anything from the salon defaults.
    done: overrideCount > 0,
  });

  if (stylist.independentPayouts) {
    steps.push({
      key: "stripe",
      title: "Connect your Stripe account",
      description: "So no-show fees and product sales on your bookings pay out to you directly.",
      href: "/admin/my-billing",
      cta: "Connect Stripe",
      done: stylist.stripeChargesEnabled,
    });
  }

  if (stylist.independentBilling) {
    steps.push({
      key: "subscribe",
      title: "Start your subscription",
      description: "You pay for your own seat. Subscribe to keep your booking page running.",
      href: "/admin/my-billing",
      cta: "Subscribe",
      done: stylist.subscriptionStatus === "active" || stylist.subscriptionStatus === "trialing",
    });
  }

  steps.push({
    key: "pay",
    title: "Add Venmo, Cash App or Zelle",
    description: "Optional — lets clients who prefer those apps pay you with a tap.",
    href: "/admin/get-paid",
    cta: "Add payment options",
    done: !!(stylist.venmoHandle || stylist.cashAppHandle || stylist.zelleInfo),
    optional: true,
  });

  return steps;
}
