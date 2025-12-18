import type * as React from "react";

interface SupportRequestEmailProps {
    name: string;
    email: string;
    subject: string;
    message: string;
    requestId: string;
    submittedAt: string;
}

export const SupportRequestEmail: React.FC<
    Readonly<SupportRequestEmailProps>
> = ({ name, subject, message, requestId, submittedAt }) => (
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
                Confirmation de votre demande de support
            </h1>

            <p
                style={{
                    fontSize: "16px",
                    lineHeight: "1.6",
                    color: "#4a5568",
                    marginBottom: "20px",
                }}
            >
                Bonjour {name},
            </p>

            <p
                style={{
                    fontSize: "16px",
                    lineHeight: "1.6",
                    color: "#4a5568",
                    marginBottom: "20px",
                }}
            >
                Nous avons bien reçu votre demande de support. Notre équipe va
                l&apos;examiner et vous répondre dans les plus brefs délais.
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
                    Récapitulatif de votre demande :
                </h3>
                <p style={{ margin: "5px 0", color: "#555" }}>
                    <strong>Numéro de référence :</strong> {requestId}
                </p>
                <p style={{ margin: "5px 0", color: "#555" }}>
                    <strong>Sujet :</strong> {subject}
                </p>
                <p style={{ margin: "5px 0", color: "#555" }}>
                    <strong>Date de soumission :</strong> {submittedAt}
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
                <h3 style={{ color: "#2d3748", marginBottom: "15px" }}>
                    Votre message :
                </h3>
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
                    backgroundColor: "#e3f2fd",
                    border: "1px solid #90caf9",
                    padding: "15px",
                    borderRadius: "6px",
                    marginBottom: "25px",
                }}
            >
                <p style={{ margin: "0", fontSize: "14px", color: "#1565c0" }}>
                    <strong>ℹ️ Délai de réponse :</strong> Nous nous efforçons de répondre
                    à toutes les demandes dans un délai de 24 à 48 heures ouvrables.
                </p>
            </div>

            <div
                style={{
                    backgroundColor: "#f8f9fa",
                    padding: "15px",
                    borderRadius: "6px",
                    marginBottom: "25px",
                    border: "1px solid #e9ecef",
                }}
            >
                <h4
                    style={{ color: "#2d3748", marginBottom: "10px", fontSize: "14px" }}
                >
                    Que se passe-t-il ensuite ?
                </h4>
                <ol
                    style={{
                        margin: "0",
                        paddingLeft: "20px",
                        color: "#555",
                        fontSize: "14px",
                    }}
                >
                    <li style={{ marginBottom: "5px" }}>
                        Notre équipe examine votre demande
                    </li>
                    <li style={{ marginBottom: "5px" }}>
                        Un membre de notre équipe vous contactera par email
                    </li>
                    <li style={{ marginBottom: "5px" }}>
                        Nous travaillerons ensemble pour résoudre votre problème
                    </li>
                    <li>Vous recevrez une confirmation une fois le ticket résolu</li>
                </ol>
            </div>

            <hr
                style={{
                    border: "none",
                    borderTop: "1px solid #e9ecef",
                    margin: "25px 0",
                }}
            />

            <p style={{ fontSize: "12px", color: "#777", textAlign: "center" }}>
                Cet email est une confirmation automatique de votre demande de support.
                Merci de ne pas répondre directement à cet email. Référence :{" "}
                {requestId}
            </p>
        </div>
    </div>
);

export default SupportRequestEmail;
