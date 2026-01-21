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
                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                    backgroundColor: "#f9fafb",
                    padding: "40px 20px",
                }}
            >
                <div
                    style={{
                        maxWidth: "600px",
                        margin: "0 auto",
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        overflow: "hidden",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "#111827",
                            padding: "40px",
                            textAlign: "center",
                        }}
                    >
                        <h1
                            style={{
                                color: "#ffffff",
                                margin: "0",
                                fontSize: "24px",
                                fontWeight: "600",
                                letterSpacing: "-0.025em",
                            }}
                        >
                            Order Confirmed!
                        </h1>
                        <p
                            style={{
                                margin: "8px 0 0",
                                fontSize: "16px",
                                color: "#e5e7eb",
                            }}
                        >
                            Thank you for your purchase
                        </p>
                    </div>

                    <div style={{ padding: "40px" }}>
                        <p
                            style={{
                                margin: "0 0 24px",
                                fontSize: "16px",
                                lineHeight: "26px",
                                color: "#374151",
                            }}
                        >
                            Hi {customerName || "Customer"},
                        </p>

                        <p
                            style={{
                                margin: "0 0 24px",
                                fontSize: "16px",
                                lineHeight: "26px",
                                color: "#374151",
                            }}
                        >
                            We&apos;re getting your order ready to be shipped. We will notify you when it has been sent.
                        </p>

                        <div
                            style={{
                                backgroundColor: "#f9fafb",
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb",
                                padding: "24px",
                                margin: "32px 0",
                            }}
                        >
                            <h3
                                style={{
                                    margin: "0 0 16px",
                                    fontSize: "18px",
                                    fontWeight: "600",
                                    color: "#111827",
                                }}
                            >
                                Order Details
                            </h3>
                            <p
                                style={{
                                    margin: "0 0 8px",
                                    fontSize: "14px",
                                    color: "#6b7280",
                                }}
                            >
                                <strong>Order Number:</strong> #{orderId}
                            </p>
                            <div
                                style={{
                                    margin: "16px 0",
                                    borderTop: "1px solid #e5e7eb",
                                }}
                            />

                            {orderItems && orderItems.length > 0 && (
                                <div style={{ marginBottom: "16px" }}>
                                    {orderItems.map((item, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                padding: "8px 0",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                borderBottom:
                                                    index === orderItems.length - 1
                                                        ? "none"
                                                        : "1px solid #f3f4f6",
                                            }}
                                        >
                                            <span style={{ color: "#374151", fontSize: "14px" }}>
                                                {item.quantity || 1} × {item.name || "Product"}
                                            </span>
                                            <span
                                                style={{
                                                    color: "#111827",
                                                    fontWeight: "500",
                                                    fontSize: "14px",
                                                }}
                                            >
                                                ${(item.price || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                    <div
                                        style={{
                                            margin: "16px 0",
                                            borderTop: "1px solid #e5e7eb",
                                        }}
                                    />
                                </div>
                            )}

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: "16px",
                                        fontWeight: "600",
                                        color: "#374151",
                                    }}
                                >
                                    Total
                                </span>
                                <span
                                    style={{
                                        fontSize: "20px",
                                        fontWeight: "700",
                                        color: "#111827",
                                    }}
                                >
                                    ${orderTotal.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <p
                            style={{
                                margin: "0 0 24px",
                                fontSize: "16px",
                                lineHeight: "26px",
                                color: "#374151",
                            }}
                        >
                            You will receive another email with tracking information once your order ships.
                        </p>

                        <div style={{ textAlign: "center", marginTop: "40px" }}>
                            <a
                                href={`https://vitanou.com/orders/${orderId}`}
                                style={{
                                    display: "inline-block",
                                    backgroundColor: "#111827",
                                    color: "#ffffff",
                                    padding: "16px 32px",
                                    borderRadius: "6px",
                                    textDecoration: "none",
                                    fontSize: "16px",
                                    fontWeight: "600",
                                }}
                            >
                                View Order
                            </a>
                        </div>
                    </div>

                    <div
                        style={{
                            backgroundColor: "#f9fafb",
                            padding: "24px 40px",
                            borderTop: "1px solid #e5e7eb",
                            textAlign: "center",
                        }}
                    >
                        <p
                            style={{
                                margin: "0",
                                fontSize: "14px",
                                color: "#6b7280",
                            }}
                        >
                            Need help? <a href="mailto:support@vitanou.com" style={{ color: "#111827", textDecoration: "underline" }}>Contact us</a>
                        </p>
                        <p
                            style={{
                                margin: "12px 0 0",
                                fontSize: "12px",
                                color: "#9ca3af",
                            }}
                        >
                            © {new Date().getFullYear()} Vitanou. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </body>
    </html>
);

export default OrderConfirmationEmail;
