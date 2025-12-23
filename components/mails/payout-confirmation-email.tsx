import * as React from "react";

interface PayoutConfirmationEmailProps {
    affiliateName: string;
    amount: number;
    bankAccount: string;
    payoutDate: Date;
    referralCount?: number;
    period?: string;
}

export const PayoutConfirmationEmail: React.FC<Readonly<PayoutConfirmationEmailProps>> = ({
    affiliateName,
    amount,
    bankAccount,
    payoutDate,
    referralCount,
    period,
}) => {
    // Mask bank account (show only last 4 digits)
    const maskedAccount =
        bankAccount.length > 4 ? `****${bankAccount.slice(-4)}` : bankAccount;

    return (
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
                        <h1 style={{ margin: 0 }}>💸 Payout Processed!</h1>
                        <p style={{ margin: "10px 0 0 0" }}>Your affiliate earnings are on the way</p>
                    </div>

                    <div
                        style={{
                            background: "#f9fafb",
                            padding: "30px",
                            borderRadius: "0 0 8px 8px",
                        }}
                    >
                        <p>Hi {affiliateName || "Valued Affiliate"},</p>

                        <div style={{ fontSize: "48px", textAlign: "center", margin: "20px 0" }}>
                            ✅
                        </div>

                        <p>
                            Great news! Your affiliate payout has been successfully processed and
                            the funds are being transferred to your account.
                        </p>

                        <div
                            style={{
                                background: "white",
                                padding: "20px",
                                borderRadius: "8px",
                                margin: "20px 0",
                                borderLeft: "4px solid #10b981",
                            }}
                        >
                            <h3 style={{ marginTop: 0 }}>Payout Details</h3>

                            <div
                                style={{
                                    fontWeight: "bold",
                                    fontSize: "32px",
                                    color: "#10b981",
                                    margin: "20px 0",
                                    textAlign: "center",
                                }}
                            >
                                ${amount.toFixed(2)}
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    padding: "10px 0",
                                    borderBottom: "1px solid #e5e7eb",
                                }}
                            >
                                <span style={{ color: "#6b7280" }}>Bank Account:</span>
                                <span style={{ fontWeight: 600 }}>{maskedAccount}</span>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    padding: "10px 0",
                                    borderBottom: "1px solid #e5e7eb",
                                }}
                            >
                                <span style={{ color: "#6b7280" }}>Payout Date:</span>
                                <span style={{ fontWeight: 600 }}>
                                    {payoutDate.toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </span>
                            </div>

                            {period && (
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        padding: "10px 0",
                                        borderBottom: "1px solid #e5e7eb",
                                    }}
                                >
                                    <span style={{ color: "#6b7280" }}>Period:</span>
                                    <span style={{ fontWeight: 600 }}>{period}</span>
                                </div>
                            )}
                        </div>

                        {referralCount && (
                            <div
                                style={{
                                    background: "#ecfdf5",
                                    padding: "15px",
                                    borderRadius: "8px",
                                    margin: "20px 0",
                                }}
                            >
                                <h4 style={{ marginTop: 0 }}>📊 Your Performance</h4>
                                <p style={{ margin: "5px 0" }}>
                                    <strong>{referralCount}</strong> successful referral
                                    {referralCount !== 1 ? "s" : ""} this period
                                </p>
                                <p style={{ margin: "5px 0", color: "#6b7280", fontSize: "14px" }}>
                                    Keep up the great work! 🚀
                                </p>
                            </div>
                        )}

                        <p>
                            <strong>What happens next?</strong>
                        </p>
                        <ul>
                            <li>
                                The funds should appear in your bank account within 3-5 business days
                            </li>
                            <li>You&apos;ll receive a notification once the transfer is complete</li>
                            <li>
                                You can view your full payout history in your affiliate dashboard
                            </li>
                        </ul>

                        <p>
                            Thank you for being a valued member of our affiliate program! Your
                            efforts help us grow and we truly appreciate your partnership.
                        </p>

                        <p>
                            If you have any questions about this payout, please don&apos;t hesitate to
                            contact our support team.
                        </p>

                        <p style={{ marginTop: "30px" }}>Keep sharing, keep earning! 💰</p>
                    </div>

                    <div
                        style={{
                            textAlign: "center",
                            marginTop: "30px",
                            color: "#6b7280",
                            fontSize: "14px",
                        }}
                    >
                        <p>
                            <strong>Vitanou Affiliate Program</strong>
                        </p>
                        <p>
                            affiliates@vitanou.com |{" "}
                            <a href="https://vitanou.com/affiliate">Affiliate Dashboard</a>
                        </p>
                        <p style={{ fontSize: "12px", marginTop: "15px" }}>
                            This is an automated payout confirmation. Please do not reply to this
                            email.
                        </p>
                    </div>
                </div>
            </body>
        </html>
    );
};

export default PayoutConfirmationEmail;
