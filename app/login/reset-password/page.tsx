import ResetPasswordForm from "@/components/ResetPasswordForm";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { email?: string; token?: string };
}) {
  return (
    <main className="page" style={{ maxWidth: 420 }}>
      <h1 className="display title">Set a new password</h1>
      <ResetPasswordForm email={searchParams.email || ""} token={searchParams.token || ""} />
    </main>
  );
}
