import { Metadata } from "next";
import CheckEmailContent from "./_components/check-email-content";

export const metadata: Metadata = {
    title: "Check Email",
    description: "Check your email for the sign-in link.",
};

export default function CheckEmailPage() {
    return <CheckEmailContent />;
}
