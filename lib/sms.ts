// Sends SMS via Twilio's REST API directly (no twilio npm package needed).
// One shared Twilio number sends on behalf of every business on the
// platform — the salon's name is included in the message text itself so
// customers know who it's from.
export async function sendSms(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    console.warn("Twilio env vars not set — skipping SMS send");
    return { skipped: true };
  }

  const cleaned = to.replace(/[^\d+]/g, "");
  if (!cleaned) return { skipped: true };
  // Assume US numbers if no country code was given.
  const formatted = cleaned.startsWith("+") ? cleaned : `+1${cleaned}`;

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: formatted, From: from, Body: body }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Twilio send failed", res.status, text);
    return { skipped: false, error: true };
  }

  return { skipped: false, error: false };
}
