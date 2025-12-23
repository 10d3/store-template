import * as React from "react";

interface DisputeEmailProps {
    customerName?: string;
    orderId: string;
    orderTotal: number;
}

export const DisputeEmail: React.FC<Readonly<DisputeEmailProps>> = ({
    customerName,
    orderId,
    orderTotal,
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
                        background: "#dc2626",
                        color: "white",
                        padding: "20px",
                        textAlign: "center",
                        borderRadius: "8px 8px 0 0",
                    }}
                >
                    <h1 style={{ margin: 0 }}>Payment Dispute Received</h1>
                </div>

                <div
                    style={{
                        background: "#f9fafb",
                        padding: "30px",
                        borderRadius: "0 0 8px 8px",
                    }}
                >
                    <p>Hi {customerName || "Valued Customer"},</p>

                    <p>
                        We(&apos;)ve received a payment dispute for your order. We&apos;re working to
                        resolve this matter promptly.
                    </p>

                    <div
                        style={{
                            background: "white",
                            padding: "20px",
                            borderRadius: "8px",
                            margin: "20px 0",
                        }}
                    >
                        <h3 style={{ marginTop: 0 }}>Order Details</h3>
                        <p>
                            <strong>Order Number:</strong> #{orderId}
                        </p>
                        <p>
                            <strong>Order Total:</strong> ${orderTotal.toFixed(2)}
                        </p>
                    </div>

                    <p>
                        Our customer support team will be in touch with you shortly to help
                        resolve this dispute.
                    </p>

                    <p>
                        If you have any immediate questions, please contact our customer support
                        team.
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

export default DisputeEmail;
