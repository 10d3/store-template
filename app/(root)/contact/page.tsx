import { Metadata } from "next"
import ContactForm from "./_components/contact-form"

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with us for any questions or feedback.",
}

export default function ContactPage() {
  return <ContactForm />
}
