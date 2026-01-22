import * as React from "react";

interface AffiliateRejectionEmailProps {
    affiliateName: string;
    reason?: string;
}

export const AffiliateRejectionEmail: React.FC<Readonly<AffiliateRejectionEmailProps>> = ({
    affiliateName,
    reason,
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
                        background: "#ef4444",
                        color: "white",
                        padding: "20px",
                        textAlign: "center",
                        borderRadius: "8px 8px 0 0",
                    }}
                >
                    <h1 style={{ margin: 0 }}>Application Update</h1>
                </div>

                <div
                    style={{
                        background: "#f9fafb",
                        padding: "30px",
                        borderRadius: "0 0 8px 8px",
                    }}
                >
                    <p>Hi {affiliateName},</p>

                    <p>
                        Thank you for your interest in the Vitanou Affiliate Program.
                    </p>

                    <p>
                        After careful review of your application, we regret to inform you that
                        we are unable to accept your application at this time.
                    </p>

                    {reason && (
                        <div
                            style={{
                                background: "white",
                                padding: "15px",
                                borderRadius: "6px",
                                margin: "20px 0",
                                borderLeft: "4px solid #ef4444",
                            }}
                        >
                            <strong>Reason:</strong>
                            <p style={{ margin: "5px 0 0" }}>{reason}</p>
                        </div>
                    )}

                    <p>
                        You are welcome to re-apply in the future if your circumstances
                        change.
                    </p>

                    <p>Best regards,</p>
                    <p>The Vitanou Team</p>
                </div>

                <div
                    style={{
                        textAlign: "center",
                        marginTop: "30px",
                        color: "#6b7280",
                    }}
                >
                    <p>Vitanou | no-reply@vitanou.com</p>
                </div>
            </div>
        </body>
    </html>
);

export default AffiliateRejectionEmail;
