import type * as React from "react";

interface MagicLinkEmailProps {
    url: string;
    email: string;
}

export const MagicLinkEmail: React.FC<Readonly<MagicLinkEmailProps>> = ({
    url,
    email,
}) => (
    <div
        style={{
            fontFamily: "Arial, sans-serif",
            maxWidth: "600px",
            margin: "0 auto",
            padding: "20px",
        }}
    >
        <div
            style={{
                backgroundColor: "#f8f9fa",
                padding: "30px",
                borderRadius: "8px",
            }}
        >
            <h1 style={{ color: "#2d3748", marginBottom: "20px", textAlign: "center" }}>
                🔐 Secure Sign In
            </h1>

            <p
                style={{
                    fontSize: "16px",
                    lineHeight: "1.6",
                    color: "#4a5568",
                    marginBottom: "20px",
                }}
            >
                Hello,
            </p>

            <p
                style={{
                    fontSize: "16px",
                    lineHeight: "1.6",
                    color: "#4a5568",
                    marginBottom: "25px",
                }}
            >
                You requested a sign-in link for your account associated with{" "}
                <strong>{email}</strong>. Click the button below to sign in:
            </p>

            <div style={{ textAlign: "center", marginBottom: "30px" }}>
                <a
                    href={url}
                    style={{
                        display: "inline-block",
                        backgroundColor: "#3b82f6",
                        color: "#ffffff",
                        padding: "14px 32px",
                        fontSize: "16px",
                        fontWeight: "bold",
                        textDecoration: "none",
                        borderRadius: "8px",
                    }}
                >
                    Sign In
                </a>
            </div>

            <div
                style={{
                    backgroundColor: "#fff3cd",
                    border: "1px solid #ffc107",
                    padding: "15px",
                    borderRadius: "6px",
                    marginBottom: "25px",
                }}
            >
                <p style={{ margin: "0", fontSize: "14px", color: "#856404" }}>
                    <strong>⚠️ This link expires in 15 minutes.</strong> If you
                    didn&apos;t request this link, you can safely ignore this email.
                </p>
            </div>

            <div
                style={{
                    backgroundColor: "#fff",
                    padding: "15px",
                    borderRadius: "6px",
                    marginBottom: "25px",
                    border: "1px solid #e9ecef",
                }}
            >
                <p
                    style={{
                        margin: "0 0 10px 0",
                        fontSize: "14px",
                        color: "#555",
                    }}
                >
                    If the button doesn&apos;t work, copy and paste this link into your
                    browser:
                </p>
                <p
                    style={{
                        margin: "0",
                        fontSize: "12px",
                        color: "#3b82f6",
                        wordBreak: "break-all",
                    }}
                >
                    {url}
                </p>
            </div>

            <hr
                style={{
                    border: "none",
                    borderTop: "1px solid #e9ecef",
                    margin: "25px 0",
                }}
            />

            <p style={{ fontSize: "12px", color: "#777", textAlign: "center" }}>
                This email was sent automatically. Please do not reply directly to this
                email.
            </p>
        </div>
    </div>
);

export default MagicLinkEmail;

