import { Container } from "@/components/store/container";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <Container className="py-16">
      <ForgotPasswordForm />
    </Container>
  );
}
