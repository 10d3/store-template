import { OGTemplateProps } from "@/lib/og";

export function ModernDarkTemplate({
  title,
  description,
  author,
  date,
  tags,
  accentColor = "#ffffff",
  bgColor = "#0a0a0a",
}: OGTemplateProps) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: bgColor,
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "80px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Geometric accent shapes */}
      <div
        style={{
          position: "absolute",
          top: "-100px",
          right: "-100px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)`,
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
          background: `radial-gradient(circle, ${accentColor}10 0%, transparent 70%)`,
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Tags */}
          {tags && tags.length > 0 && (
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {tags.slice(0, 3).map((tag, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    padding: "8px 20px",
                    backgroundColor: `${accentColor}15`,
                    border: `1px solid ${accentColor}30`,
                    borderRadius: "6px",
                    fontSize: "18px",
                    color: accentColor,
                    fontWeight: "500",
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          )}

          {/* Title */}
          <h1
            style={{
              fontSize: "68px",
              fontWeight: "800",
              lineHeight: 1.15,
              color: accentColor,
              margin: 0,
              maxWidth: "95%",
              letterSpacing: "-0.03em",
            }}
          >
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p
              style={{
                fontSize: "28px",
                lineHeight: 1.5,
                color: accentColor,
                opacity: 0.7,
                margin: 0,
                maxWidth: "85%",
              }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            {author && (
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "600",
                  color: accentColor,
                }}
              >
                {author}
              </div>
            )}
            {date && (
              <>
                <div
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    backgroundColor: accentColor,
                    opacity: 0.5,
                  }}
                />
                <div
                  style={{
                    fontSize: "22px",
                    color: accentColor,
                    opacity: 0.6,
                  }}
                >
                  {date}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
