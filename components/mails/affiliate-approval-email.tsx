import * as React from "react";

interface AffiliateApprovalEmailProps {
    affiliateName: string;
    loginUrl: string;
    dashboardUrl: string;
}

export const AffiliateApprovalEmail: React.FC<Readonly<AffiliateApprovalEmailProps>> = ({
    affiliateName,
    loginUrl,
    dashboardUrl,
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
                        background: "#6366f1",
                        color: "white",
                        padding: "20px",
                        textAlign: "center",
                        borderRadius: "8px 8px 0 0",
                    }}
                >
                    <h1 style={{ margin: 0 }}>Welcome to the Partner Program!</h1>
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
                        We are thrilled to inform you that your application to join the
                        Vitanou Affiliate Program has been <strong>APPROVED</strong>!
                    </p>

                    <p>
                        You can now access your affiliate dashboard to generate links, track
                        your earnings, and update your payment details.
                    </p>

                    <div
                        style={{
                            textAlign: "center",
                            margin: "30px 0",
                        }}
                    >
                        <a
                            href={dashboardUrl}
                            style={{
                                background: "#6366f1",
                                color: "white",
                                padding: "12px 24px",
                                borderRadius: "6px",
                                textDecoration: "none",
                                fontWeight: "bold",
                            }}
                        >
                            Access Dashboard
                        </a>
                    </div>

                    <p>
                        If you have any questions or need assistance, feel free to reply to
                        this email.
                    </p>

                    <p>Welcome aboard!</p>
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

export default AffiliateApprovalEmail;
