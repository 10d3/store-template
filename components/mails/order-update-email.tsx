import * as React from "react";

interface OrderUpdateEmailProps {
    customerName?: string;
    orderId: string;
    orderStatus: string;
    orderTotal: number;
}

export const OrderUpdateEmail: React.FC<Readonly<OrderUpdateEmailProps>> = ({
    customerName,
    orderId,
    orderStatus,
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
                        background: "#6366f1",
                        color: "white",
                        padding: "20px",
                        textAlign: "center",
                        borderRadius: "8px 8px 0 0",
                    }}
                >
                    <h1 style={{ margin: 0 }}>Order Update</h1>
                </div>

                <div
                    style={{
                        background: "#f9fafb",
                        padding: "30px",
                        borderRadius: "0 0 8px 8px",
                    }}
                >
                    <p>Hi {customerName || "Valued Customer"},</p>

                    <p>We wanted to update you on the status of your order.</p>

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
                            <strong>Current Status:</strong>{" "}
                            {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
                        </p>
                        <p>
                            <strong>Order Total:</strong> ${orderTotal.toFixed(2)}
                        </p>
                    </div>

                    <p>
                        If you have any questions about your order, please contact our customer
                        support team.
                    </p>

                    <p>Thank you for choosing Vitanou!</p>
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

export default OrderUpdateEmail;
