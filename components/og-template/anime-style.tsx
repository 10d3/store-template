import type { OGTemplateProps } from "@/lib/og"

export function AnimeStyleTemplate({
  title,
  category,
  accentColor = "#ec4899",
  bgColor = "#fef3c7",
  image,
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
      {/* Decorative Circles */}
      <div
        style={{
          position: "absolute",
          top: "-100px",
          right: "-100px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          backgroundColor: "#fbbf24",
          opacity: 0.3,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-150px",
          left: "-150px",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          backgroundColor: accentColor,
          opacity: 0.2,
        }}
      />

      {/* Main Content */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "80px",
          position: "relative",
          zIndex: 1,
          width: "100%",
          gap: "60px",
        }}
      >
        {/* Left Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "55%",
            gap: "30px",
          }}
        >
          {/* Category with Japanese-style badge */}
          {category && (
            <div
              style={{
                display: "inline-flex",
                alignSelf: "flex-start",
                backgroundColor: accentColor,
                color: "#ffffff",
                fontSize: "24px",
                fontWeight: "800",
                padding: "16px 40px",
                borderRadius: "50px",
                border: "4px solid #ffffff",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
              }}
            >
              ★ {category} ★
            </div>
          )}

          {/* Title */}
          <h1
            style={{
              fontSize: 68,
              fontWeight: "900",
              color: "#1f2937",
              lineHeight: 1.1,
              margin: 0,
              textShadow: "4px 4px 0px #ffffff, 6px 6px 0px rgba(0, 0, 0, 0.1)",
            }}
          >
            {title}
          </h1>

          {/* Decorative Stars */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              fontSize: "40px",
            }}
          >
            <span style={{ color: accentColor }}>★</span>
            <span style={{ color: "#fbbf24" }}>★</span>
            <span style={{ color: "#60a5fa" }}>★</span>
          </div>
        </div>

        {/* Right Image with Frame */}
        {image && (
          <div
            style={{
              display: "flex",
              width: "40%",
              height: "450px",
              position: "relative",
            }}
          >
            {/* Frame Border */}
            <div
              style={{
                position: "absolute",
                top: "-20px",
                left: "-20px",
                right: "-20px",
                bottom: "-20px",
                border: `8px solid ${accentColor}`,
                borderRadius: "32px",
                transform: "rotate(2deg)",
              }}
            />
            <div
              style={{
                display: "flex",
                width: "100%",
                height: "100%",
                borderRadius: "24px",
                overflow: "hidden",
                border: "8px solid #ffffff",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
                position: "relative",
                zIndex: 1,
              }}
            >
              <img
                src={image || "/placeholder.svg"}
                alt="Cover"
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
