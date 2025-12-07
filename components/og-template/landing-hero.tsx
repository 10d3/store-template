import type { OGTemplateProps } from "@/lib/og"

export function LandingHeroTemplate({
  title,
  description,
  accentColor = "#8b5cf6",
  bgColor = "#0f172a",
  logo,
}: OGTemplateProps) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bgColor,
        padding: "80px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Gradient Orbs Background */}
      <div
        style={{
          position: "absolute",
          top: "-200px",
          right: "-200px",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}40 0%, transparent 70%)`,
          filter: "blur(80px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-200px",
          left: "-200px",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`,
          filter: "blur(80px)",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "40px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {logo && (
          <img
            src={logo || "/placeholder.svg"}
            alt="Logo"
            style={{
              height: "70px",
              objectFit: "contain",
            }}
          />
        )}

        <h1
          style={{
            fontSize: 80,
            fontWeight: "900",
            color: "#ffffff",
            lineHeight: 1.1,
            margin: 0,
            maxWidth: "900px",
            background: `linear-gradient(135deg, #ffffff 0%, ${accentColor} 100%)`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {title}
        </h1>

        {description && (
          <p
            style={{
              fontSize: "32px",
              color: "#cbd5e1",
              lineHeight: 1.5,
              margin: 0,
              maxWidth: "700px",
            }}
          >
            {description}
          </p>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: accentColor,
            color: "#ffffff",
            fontSize: 32,
            fontWeight: "700",
            padding: "24px 60px",
            borderRadius: "16px",
            marginTop: "20px",
          }}
        >
          Get Started
        </div>
      </div>
    </div>
  )
}
