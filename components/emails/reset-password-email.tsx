interface ResetPasswordEmailProps {
  url: string;
}

export function ResetPasswordEmail({ url }: ResetPasswordEmailProps) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", lineHeight: 1.6, color: "#111" }}>
      <h1 style={{ fontSize: 22 }}>Reset your password</h1>
      <p>Click the button below to choose a new password. This link expires in one hour.</p>
      <p>
        <a
          href={url}
          style={{
            display: "inline-block",
            padding: "12px 20px",
            background: "#111",
            color: "#fff",
            textDecoration: "none",
            borderRadius: 6,
          }}
        >
          Reset password
        </a>
      </p>
      <p style={{ color: "#666", fontSize: 13 }}>
        If you did not request this, you can ignore this email.
      </p>
    </div>
  );
}
