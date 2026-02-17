import * as React from "react";

interface OrderUpdateEmailProps {
    customerName?: string;
    orderId: string;
    orderStatus: string;
    orderTotal: number;
}

const statusConfig: Record<string, { label: string; icon: string }> = {
    processing: { label: "Processing", icon: "\u29D7" },
    shipped: { label: "Shipped", icon: "\u2197" },
    delivered: { label: "Delivered", icon: "\u2713" },
    cancelled: { label: "Cancelled", icon: "\u2715" },
};

export const OrderUpdateEmail: React.FC<Readonly<OrderUpdateEmailProps>> = ({
    customerName,
    orderId,
    orderStatus,
    orderTotal,
}) => {
    const status = statusConfig[orderStatus] || {
        label: orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1),
        icon: "\u2022",
    };

    return (
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
                <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
                <title>Order Update - Vitanou</title>
                {/*[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]*/}
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
                {/* Preheader text for email clients */}
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
                    Your order #{orderId} status has been updated to {status.label}.
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
                        {/* Logo / Brand */}
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
                            {/* Status Icon */}
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
                                    {status.icon}
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
                                Order Update
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
                                Hi {customerName || "Customer"}, here is the latest on your
                                order.
                            </p>

                            {/* Divider */}
                            <div
                                style={{
                                    height: "1px",
                                    backgroundColor: "#f0eeeb",
                                    margin: "0 0 32px",
                                }}
                            />

                            {/* Order Number */}
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

                            {/* Status */}
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
                                    Status
                                </span>
                                <span
                                    style={{
                                        fontSize: "13px",
                                        fontWeight: 500,
                                        color: "#1a1a1a",
                                    }}
                                >
                                    {status.label}
                                </span>
                            </div>

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

                            {/* Help text */}
                            <p
                                style={{
                                    margin: "0 0 40px",
                                    fontSize: "13px",
                                    lineHeight: "20px",
                                    color: "#888888",
                                    textAlign: "center",
                                }}
                            >
                                Questions about your order? Reach out to our support team and
                                we&apos;ll be happy to help.
                            </p>

                            {/* CTA */}
                            <div style={{ textAlign: "center" }}>
                                <a
                                    href={`https://vitanou.com/orders/${orderId}`}
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
                                    Track Order
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
};

export default OrderUpdateEmail;
