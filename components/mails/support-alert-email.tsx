import type * as React from "react";

interface SupportAlertEmailProps {
    name: string;
    email: string;
    subject: string;
    message: string;
    requestId: string;
    submittedAt: string;
}

export const SupportAlertEmail: React.FC<
    Readonly<SupportAlertEmailProps>
> = ({ name, email, subject, message, requestId, submittedAt }) => (
    <div
        style={{
            fontFamily: "Arial, sans-serif",
            maxWidth: "600px",
            margin: "0 auto",
            padding: "20px",
        }}
    >
        <div
            style={{
                backgroundColor: "#f8f9fa",
                padding: "30px",
                borderRadius: "8px",
            }}
        >
            <h1 style={{ color: "#2d3748", marginBottom: "20px" }}>
                🔔 New Support Request
            </h1>

            <p
                style={{
                    fontSize: "16px",
                    lineHeight: "1.6",
                    color: "#4a5568",
                    marginBottom: "20px",
                }}
            >
                A new support request has been submitted through the contact form.
            </p>

            <div
                style={{
                    backgroundColor: "#fff",
                    padding: "20px",
                    borderRadius: "6px",
                    marginBottom: "25px",
                    border: "1px solid #e9ecef",
                }}
            >
                <h3 style={{ color: "#2d3748", marginBottom: "15px" }}>
                    Request Details:
                </h3>
                <p style={{ margin: "5px 0", color: "#555" }}>
                    <strong>Reference ID:</strong> {requestId}
                </p>
                <p style={{ margin: "5px 0", color: "#555" }}>
                    <strong>Name:</strong> {name}
                </p>
                <p style={{ margin: "5px 0", color: "#555" }}>
                    <strong>Email:</strong> {email}
                </p>
                <p style={{ margin: "5px 0", color: "#555" }}>
                    <strong>Subject:</strong> {subject}
                </p>
                <p style={{ margin: "5px 0", color: "#555" }}>
                    <strong>Submitted:</strong> {submittedAt}
                </p>
            </div>

            <div
                style={{
                    backgroundColor: "#fff",
                    padding: "20px",
                    borderRadius: "6px",
                    marginBottom: "25px",
                    border: "1px solid #e9ecef",
                }}
            >
                <h3 style={{ color: "#2d3748", marginBottom: "15px" }}>Message:</h3>
                <p
                    style={{
                        margin: "0",
                        color: "#555",
                        lineHeight: "1.6",
                        whiteSpace: "pre-wrap",
                    }}
                >
                    {message}
                </p>
            </div>

            <div
                style={{
                    backgroundColor: "#fff3cd",
                    border: "1px solid #ffc107",
                    padding: "15px",
                    borderRadius: "6px",
                    marginBottom: "25px",
                }}
            >
                <p style={{ margin: "0", fontSize: "14px", color: "#856404" }}>
                    <strong>⚡ Action Required:</strong> Please respond to this request
                    within 24 hours. You can reply directly to the customer at {email}.
                </p>
            </div>

            <div style={{ textAlign: "center", marginBottom: "25px" }}>
                <a
                    href={`mailto:${email}?subject=Re: ${subject} - ${requestId}`}
                    style={{
                        backgroundColor: "#28a745",
                        color: "white",
                        padding: "15px 35px",
                        textDecoration: "none",
                        borderRadius: "5px",
                        fontSize: "16px",
                        fontWeight: "bold",
                        display: "inline-block",
                    }}
                >
                    Reply to Customer
                </a>
            </div>

            <hr
                style={{
                    border: "none",
                    borderTop: "1px solid #e9ecef",
                    margin: "25px 0",
                }}
            />

            <p style={{ fontSize: "12px", color: "#777", textAlign: "center" }}>
                This is an automated notification for new support requests. Reference
                ID: {requestId}
            </p>
        </div>
    </div>
);

export default SupportAlertEmail;
