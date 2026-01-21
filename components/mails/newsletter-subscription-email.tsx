import * as React from "react";

interface NewsletterSubscriptionEmailProps {
    customerName?: string;
    couponCode?: string;
    discountValue?: string;
}

export const NewsletterSubscriptionEmail: React.FC<Readonly<NewsletterSubscriptionEmailProps>> = ({
    customerName,
    couponCode = "WELCOME10",
    discountValue = "10% OFF",
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
                    {/* Header Image or Banner Area */}
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
                            Welcome to the Family!
                        </h1>
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
                            Thank you for subscribing to our newsletter! We're thrilled to have you with us. You'll be the first to know about our latest drops, exclusive offers, and behind-the-scenes stories.
                        </p>

                        <p
                            style={{
                                margin: "0 0 24px",
                                fontSize: "16px",
                                lineHeight: "26px",
                                color: "#374151",
                            }}
                        >
                            As a special thank you, here is a discount code for your next purchase:
                        </p>

                        {/* Coupon Section */}
                        <div
                            style={{
                                backgroundColor: "#f3f4f6",
                                border: "1px dashed #9ca3af",
                                borderRadius: "8px",
                                padding: "24px",
                                textAlign: "center",
                                margin: "32px 0",
                            }}
                        >
                            <p
                                style={{
                                    margin: "0 0 8px",
                                    fontSize: "14px",
                                    color: "#6b7280",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    fontWeight: "600",
                                }}
                            >
                                Your Personal Code
                            </p>
                            <div
                                style={{
                                    fontSize: "32px",
                                    fontWeight: "700",
                                    color: "#111827",
                                    letterSpacing: "0.1em",
                                    marginBottom: "8px",
                                }}
                            >
                                {couponCode}
                            </div>
                            <p
                                style={{
                                    margin: "0",
                                    fontSize: "16px",
                                    color: "#059669",
                                    fontWeight: "500",
                                }}
                            >
                                Get {discountValue} your next order
                            </p>
                        </div>

                        <div style={{ textAlign: "center", marginTop: "40px" }}>
                            <a
                                href="https://vitanou.com"
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
                                Shop Now
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
                            If you have any questions, reply to this email or contact our support team.
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

export default NewsletterSubscriptionEmail;
