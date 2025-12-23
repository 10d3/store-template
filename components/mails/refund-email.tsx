import * as React from "react";

interface RefundEmailProps {
    customerName?: string;
    orderId: string;
    orderTotal: number;
    refundAmount?: number;
}

export const RefundEmail: React.FC<Readonly<RefundEmailProps>> = ({
    customerName,
    orderId,
    orderTotal,
    refundAmount,
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
                        background: "#10b981",
                        color: "white",
                        padding: "20px",
                        textAlign: "center",
                        borderRadius: "8px 8px 0 0",
                    }}
                >
                    <h1 style={{ margin: 0 }}>Refund Processed</h1>
                </div>

                <div
                    style={{
                        background: "#f9fafb",
                        padding: "30px",
                        borderRadius: "0 0 8px 8px",
                    }}
                >
                    <p>Hi {customerName || "Valued Customer"},</p>

                    <p>Your refund has been successfully processed.</p>

                    <div
                        style={{
                            background: "white",
                            padding: "20px",
                            borderRadius: "8px",
                            margin: "20px 0",
                        }}
                    >
                        <h3 style={{ marginTop: 0 }}>Refund Details</h3>
                        <p>
                            <strong>Order ID:</strong> #{orderId}
                        </p>
                        <p>
                            <strong>Original Order Total:</strong> ${orderTotal.toFixed(2)}
                        </p>
                        <p>
                            <strong>Refund Amount:</strong>{" "}
                            <span
                                style={{ fontWeight: "bold", fontSize: "18px", color: "#10b981" }}
                            >
                                ${(refundAmount || orderTotal).toFixed(2)}
                            </span>
                        </p>
                    </div>

                    <p>
                        The refund will appear on your original payment method within 5-7
                        business days.
                    </p>

                    <p>
                        If you have any questions about this refund, please contact our customer
                        support team.
                    </p>

                    <p>Thank you for your understanding.</p>
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

export default RefundEmail;
