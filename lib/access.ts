import { redirect } from "next/navigation";
import { getCurrentBusiness, getCurrentStylist } from "@/lib/auth";

// Use on any page only the salon OWNER should see — business settings,
// billing, the full stylist/customer/service lists, etc. A stylist
// account gets sent to their calendar instead of a dead end; someone
// signed in under neither kind of account gets sent to set up a new
// business.
export async function requireOwner() {
  const business = await getCurrentBusiness();
  if (business) return business;

  const stylist = await getCurrentStylist();
  if (stylist) {
    redirect("/admin/calendar");
  }
  redirect("/onboarding");
}

// Use on pages BOTH an owner and a stylist can see, just scoped
// differently (Calendar, Reports, Hours). Returns which kind of account
// is signed in so the page can narrow the data it shows — an owner sees
// every stylist, a stylist account only ever sees itself.
export async function requireOwnerOrStylist() {
  const business = await getCurrentBusiness();
  if (business) {
    return { role: "owner" as const, business, stylist: null };
  }

  const stylist = await getCurrentStylist();
  if (stylist) {
    return { role: "stylist" as const, business: stylist.business, stylist };
  }

  redirect("/onboarding");
}
