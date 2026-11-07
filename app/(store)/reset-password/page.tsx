import Link from "next/link";
import { Container } from "@/components/store/container";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Container className="py-16 text-center">
        <h1 className="font-serif text-3xl">Invalid reset link</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This link is missing its token. Request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block text-sm underline underline-offset-4"
        >
          Request a new link
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-16">
      <ResetPasswordForm token={token} />
    </Container>
  );
}
