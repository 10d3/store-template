import * as React from "react";

interface TrackingEmailProps {
    customerName?: string;
    orderId: string;
    orderTotal: number;
    trackingNumber?: string;
    trackingUrl?: string;
    carrier?: string;
    orderItems?: any[];
}

export const TrackingEmail: React.FC<Readonly<TrackingEmailProps>> = ({
    customerName,
    orderId,
    orderTotal,
    trackingNumber,
    trackingUrl,
    carrier,
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
                        background: "#10b981",
                        color: "white",
                        padding: "20px",
                        textAlign: "center",
                        borderRadius: "8px 8px 0 0",
                    }}
                >
                    <h1 style={{ margin: 0 }}>📦 Your Order Has Shipped!</h1>
                    <p style={{ margin: "10px 0 0 0" }}>Your package is on its way</p>
                </div>

                <div
                    style={{
                        background: "#f9fafb",
                        padding: "30px",
                        borderRadius: "0 0 8px 8px",
                    }}
                >
                    <p>Hi {customerName || "Valued Customer"},</p>

                    <p>Great news! Your order has been shipped and is on its way to you.</p>

                    <div
                        style={{
                            background: "#ecfdf5",
                            border: "2px solid #10b981",
                            padding: "20px",
                            borderRadius: "8px",
                            margin: "20px 0",
                            textAlign: "center",
                        }}
                    >
                        <h3 style={{ marginTop: 0 }}>📍 Tracking Information</h3>
                        <div
                            style={{
                                fontWeight: "bold",
                                fontSize: "20px",
                                color: "#10b981",
                                margin: "10px 0",
                            }}
                        >
                            {trackingNumber || "N/A"}
                        </div>
                        <p>
                            <strong>Carrier:</strong> {carrier || "Standard Shipping"}
                        </p>
                        {trackingUrl && (
                            <a
                                href={trackingUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    display: "inline-block",
                                    background: "#10b981",
                                    color: "white",
                                    padding: "12px 24px",
                                    textDecoration: "none",
                                    borderRadius: "6px",
                                    fontWeight: "bold",
                                    margin: "15px 0",
                                }}
                            >
                                Track Your Package
                            </a>
                        )}
                        <p>
                            <small>
                                You can use this tracking number to monitor your package&apos;s
                                progress
                            </small>
                        </p>
                    </div>

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

                        {orderItems && orderItems.length > 0 && (
                            <>
                                <h4>Items Shipped:</h4>
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
                                        Quantity: {item.quantity || 1}
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    <p>
                        <strong>Estimated Delivery:</strong> Please check the tracking link above
                        for the most up-to-date delivery estimate.
                    </p>

                    <p>
                        If you have any questions about your shipment, please don&apos;t hesitate
                        to contact our customer support team.
                    </p>

                    <p>Thank you for choosing Store Ricardo!</p>
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

export default TrackingEmail;
