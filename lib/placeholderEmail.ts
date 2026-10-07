// A walk-in who gives only a phone number has no email, but every customer
// and booking record needs one (it's how customers are matched). We store a
// private placeholder that can never receive mail, and skip emailing it.

export const PLACEHOLDER_DOMAIN = "no-email.hairsalonix.invalid";

export function makePlaceholderEmail() {
  const id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  return `walkin-${id}@${PLACEHOLDER_DOMAIN}`;
}

export function isPlaceholderEmail(email: string | null | undefined) {
  return !!email && email.toLowerCase().endsWith(`@${PLACEHOLDER_DOMAIN}`);
}

export function displayEmail(email: string | null | undefined) {
  return isPlaceholderEmail(email) ? "" : email ?? "";
}
