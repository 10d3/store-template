import { Metadata } from "next"
import SupportForm from "./_components/support-form"

export const metadata: Metadata = {
    title: "Support",
    description: "Contact our support team for assistance.",
}

export default function SupportPage() {
    return <SupportForm />
}
