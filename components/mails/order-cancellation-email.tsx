import * as React from "react";

interface OrderCancellationEmailProps {
    customerName?: string;
    orderId: string;
    orderTotal: number;
}

export const OrderCancellationEmail: React.FC<Readonly<OrderCancellationEmailProps>> = ({
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
                        background: "#ef4444",
                        color: "white",
                        padding: "20px",
                        textAlign: "center",
                        borderRadius: "8px 8px 0 0",
                    }}
                >
                    <h1 style={{ margin: 0 }}>Order Cancelled</h1>
                </div>

                <div
                    style={{
                        background: "#f9fafb",
                        padding: "30px",
                        borderRadius: "0 0 8px 8px",
                    }}
                >
                    <p>Hi {customerName || "Valued Customer"},</p>

                    <p>We&apos;re writing to inform you that your order has been cancelled.</p>

                    <div
                        style={{
                            background: "white",
                            padding: "20px",
                            borderRadius: "8px",
                            margin: "20px 0",
                        }}
                    >
                        <h3 style={{ marginTop: 0 }}>Cancelled Order Details</h3>
                        <p>
                            <strong>Order ID:</strong> #{orderId}
                        </p>
                        <p>
                            <strong>Order Total:</strong> ${orderTotal.toFixed(2)}
                        </p>
                    </div>

                    <p>
                        If you were charged for this order, the refund will be processed within
                        5-7 business days and will appear on your original payment method.
                    </p>

                    <p>
                        If you have any questions about this cancellation, please contact our
                        customer support team.
                    </p>

                    <p>We apologize for any inconvenience.</p>
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

export default OrderCancellationEmail;
