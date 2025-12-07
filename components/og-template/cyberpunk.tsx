import type { OGTemplateProps } from "@/lib/og"

export function CyberpunkTemplate({
  title,
  category,
  accentColor = "#06b6d4",
  bgColor = "#0a0a0a",
  // image,
}: OGTemplateProps) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        backgroundColor: bgColor,
        padding: "0",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Neon Grid Background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `
            linear-gradient(${accentColor}40 2px, transparent 2px),
            linear-gradient(90deg, ${accentColor}40 2px, transparent 2px),
            linear-gradient(${accentColor}20 1px, transparent 1px),
            linear-gradient(90deg, ${accentColor}20 1px, transparent 1px)
          `,
          backgroundSize: "100px 100px, 100px 100px, 20px 20px, 20px 20px",
          transform: "perspective(500px) rotateX(60deg)",
          transformOrigin: "center bottom",
          opacity: 0.3,
        }}
      />

      {/* Neon Glow Effects */}
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "50%",
          width: "600px",
          height: "600px",
          background: `radial-gradient(circle, ${accentColor}60 0%, transparent 70%)`,
          filter: "blur(100px)",
          transform: "translateX(-50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "0",
          right: "0",
          width: "500px",
          height: "500px",
          background: `radial-gradient(circle, #ec4899 60 0%, transparent 70%)`,
          filter: "blur(100px)",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          position: "relative",
          zIndex: 1,
          width: "100%",
          gap: "40px",
        }}
      >
        {/* Category Badge */}
        {category && (
          <div
            style={{
              display: "inline-flex",
              alignSelf: "flex-start",
              backgroundColor: "transparent",
              color: accentColor,
              fontSize: "24px",
              fontWeight: "900",
              padding: "12px 32px",
              border: `3px solid ${accentColor}`,
              textTransform: "uppercase",
              letterSpacing: "4px",
              boxShadow: `0 0 20px ${accentColor}80, inset 0 0 20px ${accentColor}40`,
            }}
          >
            {category}
          </div>
        )}

        {/* Title */}
        <h1
          style={{
            fontSize: 80,
            fontWeight: "900",
            color: "#ffffff",
            lineHeight: 1,
            margin: 0,
            textTransform: "uppercase",
            letterSpacing: "-2px",
            textShadow: `
              0 0 10px ${accentColor},
              0 0 20px ${accentColor},
              0 0 30px ${accentColor},
              0 0 40px ${accentColor}
            `,
          }}
        >
          {title}
        </h1>

        {/* Glitch Lines */}
        <div
          style={{
            display: "flex",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "150px",
              height: "4px",
              backgroundColor: accentColor,
              boxShadow: `0 0 10px ${accentColor}`,
            }}
          />
          <div style={{ width: "80px", height: "4px", backgroundColor: "#ec4899", boxShadow: "0 0 10px #ec4899" }} />
          <div style={{ width: "120px", height: "4px", backgroundColor: "#fbbf24", boxShadow: "0 0 10px #fbbf24" }} />
        </div>

        {/* Scanline Effect */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 255, 255, 0.03) 2px, rgba(255, 255, 255, 0.03) 4px)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  )
}
