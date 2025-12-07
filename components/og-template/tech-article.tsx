import type { OGTemplateProps } from "@/lib/og";

export function TechArticleTemplate({
  title,
  author,
  readingTime,
  category,
  accentColor = "#3b82f6",
  bgColor = "#ffffff",
  logo,
}: OGTemplateProps) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: bgColor,
        padding: "80px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
      }}
    >
      {/* Grid Pattern Background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `linear-gradient(${accentColor}15 1px, transparent 1px), linear-gradient(90deg, ${accentColor}15 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          opacity: 0.5,
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
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {logo && (
            <img
              src={logo || "/placeholder.svg"}
              alt="Logo"
              style={{
                height: "50px",
                objectFit: "contain",
              }}
            />
          )}
          {category && (
            <div
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: accentColor,
                textTransform: "uppercase",
                letterSpacing: "2px",
              }}
            >
              {category}
            </div>
          )}
        </div>

        {/* Main Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "30px",
          }}
        >
          <h1
            style={{
              fontSize: 72,
              fontWeight: "900",
              color: "#111827",
              lineHeight: 1.1,
              margin: 0,
              maxWidth: "90%",
            }}
          >
            {title}
          </h1>

          {/* Accent Line */}
          <div
            style={{
              width: "200px",
              height: "8px",
              backgroundColor: accentColor,
              borderRadius: "4px",
            }}
          />
        </div>

        {/* Footer Meta */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {author && (
            <div
              style={{
                fontSize: "28px",
                fontWeight: "600",
                color: "#4b5563",
              }}
            >
              By {author}
            </div>
          )}
          {readingTime && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "24px",
                color: "#6b7280",
                backgroundColor: "#f3f4f6",
                padding: "16px 32px",
                borderRadius: "12px",
              }}
            >
              <span>📖</span>
              <span>{readingTime}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
