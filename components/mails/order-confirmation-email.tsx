import * as React from "react";

interface OrderConfirmationEmailProps {
    customerName?: string;
    orderId: string;
    orderTotal: number;
    orderItems?: any[];
}

export const OrderConfirmationEmail: React.FC<Readonly<OrderConfirmationEmailProps>> = ({
    customerName,
    orderId,
    orderTotal,
    orderItems,
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
                        background: "#4f46e5",
                        color: "white",
                        padding: "20px",
                        textAlign: "center",
                        borderRadius: "8px 8px 0 0",
                    }}
                >
                    <h1 style={{ margin: 0 }}>Order Confirmed!</h1>
                    <p style={{ margin: "10px 0 0 0" }}>Thank you for your purchase</p>
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
                        We&apos;re excited to confirm that your order has been successfully placed
                        and payment has been processed.
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
                            <strong>Order Total:</strong>{" "}
                            <span style={{ fontWeight: "bold", fontSize: "18px", color: "#4f46e5" }}>
                                ${orderTotal.toFixed(2)}
                            </span>
                        </p>

                        {orderItems && orderItems.length > 0 && (
                            <>
                                <h4>Items Ordered:</h4>
                                {orderItems.map((item, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            borderBottom: "1px solid #e5e7eb",
                                            padding: "10px 0",
                                        }}
                                    >
                                        <strong>{item.name || "Product"}</strong>
                                        <br />
                                        Quantity: {item.quantity || 1} × $
                                        {(item.price || 0).toFixed(2)}
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    <p>
                        You will receive another email with tracking information once your order
                        ships.
                    </p>

                    <p>
                        If you have any questions about your order, please don&apos;t hesitate to
                        contact our customer support team.
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

export default OrderConfirmationEmail;
