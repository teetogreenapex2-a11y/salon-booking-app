import UnsubscribeButton from "@/components/UnsubscribeButton";

export default function UnsubscribePage({ params }: { params: { customerId: string; sig: string } }) {
  return (
    <main className="page" style={{ maxWidth: 480 }}>
      <h1 className="display title">Unsubscribe</h1>
      <p className="tagline">Stop getting promotional emails from this salon. Appointment confirmations and reminders aren't affected.</p>
      <UnsubscribeButton customerId={params.customerId} sig={params.sig} />
    </main>
  );
}
