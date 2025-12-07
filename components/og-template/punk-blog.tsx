import type { OGTemplateProps } from "@/lib/og"

export function PunkBlogTemplate({
  title,
  author,
  category,
  accentColor = "#ef4444",
  bgColor = "#000000",
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
      {/* Diagonal Split Background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor} 45%, ${accentColor} 45%, ${accentColor} 55%, #fbbf24 55%, #fbbf24 100%)`,
        }}
      />

      {/* Noise Texture Overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0.15,
          backgroundImage:
            "url(data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E)",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          position: "relative",
          zIndex: 1,
          width: "100%",
        }}
      >
        {/* Category Badge */}
        {category && (
          <div
            style={{
              display: "inline-flex",
              alignSelf: "flex-start",
              backgroundColor: accentColor,
              color: "#000000",
              fontSize: "28px",
              fontWeight: "900",
              padding: "12px 32px",
              transform: "rotate(-2deg)",
              border: "4px solid #ffffff",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            {category}
          </div>
        )}

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <h1
            style={{
              fontSize: 72,
              fontWeight: "900",
              color: "#ffffff",
              lineHeight: 1,
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "-2px",
              textShadow: `4px 4px 0px ${accentColor}, 8px 8px 0px #fbbf24`,
            }}
          >
            {title}
          </h1>

          {author && (
            <div
              style={{
                fontSize: "32px",
                fontWeight: "700",
                color: "#fbbf24",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              BY {author}
            </div>
          )}
        </div>

        {/* Bottom Stripe */}
        <div
          style={{
            display: "flex",
            gap: "20px",
          }}
        >
          <div style={{ width: "100px", height: "8px", backgroundColor: accentColor }} />
          <div style={{ width: "100px", height: "8px", backgroundColor: "#fbbf24" }} />
          <div style={{ width: "100px", height: "8px", backgroundColor: "#ffffff" }} />
        </div>
      </div>
    </div>
  )
}
