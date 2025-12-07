import type { OGTemplateProps } from "@/lib/og"

export function PortfolioTemplate({
  title,
  author,
  category,
  accentColor = "#8b5cf6",
  bgColor = "#1f2937",
  image,
}: OGTemplateProps) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        backgroundColor: bgColor,
        padding: "80px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Gradient Background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: `linear-gradient(135deg, ${bgColor} 0%, ${accentColor}30 100%)`,
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          position: "relative",
          zIndex: 1,
          gap: "60px",
        }}
      >
        {/* Left Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "50%",
            gap: "40px",
          }}
        >
          {/* Category */}
          {category && (
            <div
              style={{
                fontSize: "28px",
                fontWeight: "600",
                color: accentColor,
                textTransform: "uppercase",
                letterSpacing: "4px",
              }}
            >
              {category}
            </div>
          )}

          {/* Title */}
          <h1
            style={{
              fontSize: 72,
              fontWeight: "900",
              color: "#ffffff",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            {title}
          </h1>

          {/* Author */}
          {author && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "4px",
                  backgroundColor: accentColor,
                }}
              />
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "600",
                  color: "#d1d5db",
                }}
              >
                {author}
              </div>
            </div>
          )}
        </div>

        {/* Right Image */}
        {image && (
          <div
            style={{
              display: "flex",
              width: "45%",
              height: "450px",
              position: "relative",
            }}
          >
            {/* Glow Effect */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "120%",
                height: "120%",
                background: `radial-gradient(circle, ${accentColor}40 0%, transparent 70%)`,
                filter: "blur(60px)",
              }}
            />
            <div
              style={{
                display: "flex",
                width: "100%",
                height: "100%",
                borderRadius: "24px",
                overflow: "hidden",
                border: `4px solid ${accentColor}`,
                boxShadow: `0 0 60px ${accentColor}60`,
                position: "relative",
                zIndex: 1,
              }}
            >
              <img
                src={image || "/placeholder.svg"}
                alt="Portfolio"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
