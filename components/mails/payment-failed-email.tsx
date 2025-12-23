import * as React from "react";

interface PaymentFailedEmailProps {
    customerName?: string;
    orderId: string;
    orderTotal: number;
}

export const PaymentFailedEmail: React.FC<Readonly<PaymentFailedEmailProps>> = ({
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
                        background: "#f59e0b",
                        color: "white",
                        padding: "20px",
                        textAlign: "center",
                        borderRadius: "8px 8px 0 0",
                    }}
                >
                    <h1 style={{ margin: 0 }}>Payment Failed</h1>
                </div>

                <div
                    style={{
                        background: "#f9fafb",
                        padding: "30px",
                        borderRadius: "0 0 8px 8px",
                    }}
                >
                    <p>Hi {customerName || "Valued Customer"},</p>

                    <p>We were unable to process your payment for the following order:</p>

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
                            <strong>Order ID:</strong> #{orderId}
                        </p>
                        <p>
                            <strong>Order Total:</strong> ${orderTotal.toFixed(2)}
                        </p>
                    </div>

                    <p>
                        Please check your payment method and try again, or contact your bank if
                        you believe this is an error.
                    </p>

                    <p>
                        If you continue to experience issues, please contact our customer support
                        team for assistance.
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

export default PaymentFailedEmail;
