import { redirect } from "next/navigation";
import { Container } from "@/components/store/container";
import { LoginForm } from "@/components/auth/login-form";
import { getSession } from "@/lib/session";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/account");
  return (
    <Container className="py-16">
      <LoginForm />
    </Container>
  );
}
