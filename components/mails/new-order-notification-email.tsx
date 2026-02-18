import * as React from "react";

interface OrderItem {
    name: string;
    quantity?: number;
    price: number;
}

interface NewOrderNotificationEmailProps {
    orderId: string;
    customerName: string;
    customerEmail: string;
    orderTotal: number;
    orderItems?: OrderItem[];
}

export const NewOrderNotificationEmail: React.FC<
    Readonly<NewOrderNotificationEmailProps>
> = ({ orderId, customerName, customerEmail, orderTotal, orderItems = [] }) => (
    <html
        lang="en"
        {...({
            "xmlns": "http://www.w3.org/1999/xhtml",
            "xmlns:o": "urn:schemas-microsoft-com:office:office",
        } as any)}
    >
        <head>
            <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="x-apple-disable-message-reformatting" />
            <meta
                name="format-detection"
                content="telephone=no, date=no, address=no, email=no"
            />
            <title>New Order Notification - Vitanou</title>
        </head>
        <body
            style={{
                margin: "0",
                padding: "0",
                backgroundColor: "#faf9f7",
                fontFamily:
                    "'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
                WebkitTextSizeAdjust: "100%",
                msTextSizeAdjust: "100%",
            } as any}
        >
            {/* Preheader */}
            <div
                style={{
                    display: "none",
                    maxHeight: "0",
                    overflow: "hidden",
                    fontSize: "1px",
                    lineHeight: "1px",
                    color: "#faf9f7",
                }}
            >
                New order #{orderId} received from {customerName} - $
                {orderTotal.toFixed(2)}
            </div>

            <div
                style={{
                    backgroundColor: "#faf9f7",
                    padding: "48px 24px",
                }}
            >
                <div
                    style={{
                        maxWidth: "520px",
                        margin: "0 auto",
                    }}
                >
                    {/* Brand */}
                    <div
                        style={{
                            textAlign: "center",
                            marginBottom: "48px",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "13px",
                                fontWeight: 500,
                                letterSpacing: "0.2em",
                                textTransform: "uppercase",
                                color: "#1a1a1a",
                            }}
                        >
                            Vitanou
                        </span>
                    </div>

                    {/* Main Card */}
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "2px",
                            padding: "48px 40px",
                        }}
                    >
                        {/* Icon */}
                        <div
                            style={{
                                textAlign: "center",
                                marginBottom: "32px",
                            }}
                        >
                            <div
                                style={{
                                    display: "inline-block",
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "50%",
                                    backgroundColor: "#1a1a1a",
                                    lineHeight: "48px",
                                    textAlign: "center",
                                    fontSize: "20px",
                                    color: "#ffffff",
                                }}
                            >
                                &#9733;
                            </div>
                        </div>

                        <h1
                            style={{
                                margin: "0 0 8px",
                                fontSize: "22px",
                                fontWeight: 500,
                                letterSpacing: "-0.02em",
                                color: "#1a1a1a",
                                textAlign: "center",
                            }}
                        >
                            New Order Received
                        </h1>

                        <p
                            style={{
                                margin: "0 0 40px",
                                fontSize: "14px",
                                lineHeight: "22px",
                                color: "#888888",
                                textAlign: "center",
                            }}
                        >
                            A new order has been placed and requires your attention.
                        </p>

                        {/* Divider */}
                        <div
                            style={{
                                height: "1px",
                                backgroundColor: "#f0eeeb",
                                margin: "0 0 32px",
                            }}
                        />

                        {/* Order Info Rows */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "20px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 500,
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    color: "#888888",
                                }}
                            >
                                Order
                            </span>
                            <span
                                style={{
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    color: "#1a1a1a",
                                    fontFamily:
                                        "'SF Mono', 'Fira Code', 'Fira Mono', monospace",
                                }}
                            >
                                #{orderId}
                            </span>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "20px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 500,
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    color: "#888888",
                                }}
                            >
                                Customer
                            </span>
                            <span
                                style={{
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    color: "#1a1a1a",
                                }}
                            >
                                {customerName}
                            </span>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "32px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 500,
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    color: "#888888",
                                }}
                            >
                                Email
                            </span>
                            <a
                                href={`mailto:${customerEmail}`}
                                style={{
                                    fontSize: "13px",
                                    fontWeight: 400,
                                    color: "#1a1a1a",
                                    textDecoration: "none",
                                    borderBottom: "1px solid #dddddd",
                                }}
                            >
                                {customerEmail}
                            </a>
                        </div>

                        {/* Items */}
                        {orderItems.length > 0 && (
                            <div style={{ marginBottom: "32px" }}>
                                <p
                                    style={{
                                        fontSize: "11px",
                                        fontWeight: 500,
                                        letterSpacing: "0.1em",
                                        textTransform: "uppercase",
                                        color: "#888888",
                                        margin: "0 0 16px",
                                    }}
                                >
                                    Items
                                </p>
                                {orderItems.map((item, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "baseline",
                                            padding: "14px 0",
                                            borderBottom:
                                                index < orderItems.length - 1
                                                    ? "1px solid #f0eeeb"
                                                    : "none",
                                        }}
                                    >
                                        <div>
                                            <span
                                                style={{
                                                    fontSize: "14px",
                                                    color: "#1a1a1a",
                                                    fontWeight: 400,
                                                }}
                                            >
                                                {item.name}
                                            </span>
                                            {(item.quantity || 1) > 1 && (
                                                <span
                                                    style={{
                                                        fontSize: "12px",
                                                        color: "#aaaaaa",
                                                        marginLeft: "8px",
                                                    }}
                                                >
                                                    x{item.quantity}
                                                </span>
                                            )}
                                        </div>
                                        <span
                                            style={{
                                                fontSize: "14px",
                                                color: "#1a1a1a",
                                                fontWeight: 500,
                                                fontFamily:
                                                    "'SF Mono', 'Fira Code', 'Fira Mono', monospace",
                                            }}
                                        >
                                            ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Divider */}
                        <div
                            style={{
                                height: "1px",
                                backgroundColor: "#f0eeeb",
                                margin: "0 0 20px",
                            }}
                        />

                        {/* Total */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "baseline",
                                marginBottom: "40px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 500,
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    color: "#888888",
                                }}
                            >
                                Total
                            </span>
                            <span
                                style={{
                                    fontSize: "18px",
                                    fontWeight: 500,
                                    color: "#1a1a1a",
                                    letterSpacing: "-0.02em",
                                }}
                            >
                                ${orderTotal.toFixed(2)}
                            </span>
                        </div>

                        {/* Admin notice */}
                        <div
                            style={{
                                backgroundColor: "#faf9f7",
                                borderRadius: "2px",
                                padding: "16px 20px",
                                marginBottom: "32px",
                            }}
                        >
                            <p
                                style={{
                                    margin: "0",
                                    fontSize: "13px",
                                    lineHeight: "20px",
                                    color: "#888888",
                                    textAlign: "center",
                                }}
                            >
                                This is an automated notification. Log in to manage this order.
                            </p>
                        </div>

                        {/* CTA */}
                        <div style={{ textAlign: "center" }}>
                            <a
                                href={`https://vitanou.com/admin/orders/${orderId}`}
                                style={{
                                    display: "inline-block",
                                    backgroundColor: "#1a1a1a",
                                    color: "#ffffff",
                                    padding: "14px 40px",
                                    borderRadius: "2px",
                                    textDecoration: "none",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                }}
                            >
                                View in Dashboard
                            </a>
                        </div>
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            textAlign: "center",
                            padding: "40px 0 0",
                        }}
                    >
                        <p
                            style={{
                                margin: "0 0 8px",
                                fontSize: "12px",
                                color: "#aaaaaa",
                            }}
                        >
                            <a
                                href="mailto:support@vitanou.com"
                                style={{
                                    color: "#888888",
                                    textDecoration: "none",
                                    borderBottom: "1px solid #dddddd",
                                }}
                            >
                                support@vitanou.com
                            </a>
                        </p>
                        <p
                            style={{
                                margin: "0",
                                fontSize: "11px",
                                color: "#cccccc",
                            }}
                        >
                            {new Date().getFullYear()} Vitanou
                        </p>
                    </div>
                </div>
            </div>
        </body>
    </html>
);

export default NewOrderNotificationEmail;
