import * as React from "react";

interface ContactFormEmailProps {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export const ContactFormEmail: React.FC<Readonly<ContactFormEmailProps>> = ({
    name,
    email,
    subject,
    message,
}) => (
    <html>
        <body>
            <div
                style={{
                    fontFamily: "Arial, sans-serif",
                    lineHeight: "1.6",
                    color: "#333",
                    maxWidth: "600px",
                    margin: "0 auto",
                    padding: "20px",
                }}
            >
                <div
                    style={{
                        background: "#6366f1", // Using Indigo (primary color) instead of Red
                        color: "white",
                        padding: "20px",
                        textAlign: "center",
                        borderRadius: "8px 8px 0 0",
                    }}
                >
                    <h1 style={{ margin: 0 }}>New Contact Message</h1>
                </div>

                <div
                    style={{
                        background: "#f9fafb",
                        padding: "30px",
                        borderRadius: "0 0 8px 8px",
                    }}
                >
                    <p>Hi Admin,</p>

                    <p>
                        You have received a new message from the contact form on your website.
                    </p>

                    <div
                        style={{
                            background: "white",
                            padding: "20px",
                            borderRadius: "8px",
                            margin: "20px 0",
                        }}
                    >
                        <h3 style={{ marginTop: 0 }}>Message Details</h3>
                        <p>
                            <strong>Name:</strong> {name}
                        </p>
                        <p>
                            <strong>Email:</strong> {email}
                        </p>
                        <p>
                            <strong>Subject:</strong> {subject}
                        </p>
                        <hr style={{ border: "0", borderTop: "1px solid #eee", margin: "20px 0" }} />
                        <p>
                            <strong>Message:</strong>
                        </p>
                        <p style={{ whiteSpace: "pre-wrap" }}>
                            {message}
                        </p>
                    </div>

                    <p>
                        You can reply directly to this email to contact the sender (implement Reply-To if needed, currently manual).
                    </p>
                </div>

                <div
                    style={{
                        textAlign: "center",
                        marginTop: "30px",
                        color: "#6b7280",
                    }}
                >
                    <p>Vitanou | noreply@vitanou.com</p>
                </div>
            </div>
        </body>
    </html>
);

export default ContactFormEmail;
