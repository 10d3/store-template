import { redirect } from "next/navigation";
import { Container } from "@/components/store/container";
import { SignupForm } from "@/components/auth/signup-form";
import { getSession } from "@/lib/session";

export const metadata = { title: "Create account" };

export default async function SignupPage() {
  const session = await getSession();
  if (session) redirect("/account");
  return (
    <Container className="py-16">
      <SignupForm />
    </Container>
  );
}
