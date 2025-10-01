import { OGTemplateProps } from "@/lib/og";

export function ElegantSerifTemplate({
  title,
  author,
  date,
  category,
  accentColor = "#2d2d2d",
  bgColor = "#f5f5f0",
}: OGTemplateProps) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: bgColor,
        fontFamily: "Georgia, serif",
        padding: "80px",
        position: "relative",
      }}
    >
      {/* Decorative corner elements */}
      <div
        style={{
          position: "absolute",
          top: "40px",
          left: "40px",
          width: "80px",
          height: "2px",
          backgroundColor: accentColor,
          opacity: 0.3,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "40px",
          left: "40px",
          width: "2px",
          height: "80px",
          backgroundColor: accentColor,
          opacity: 0.3,
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: "40px",
          right: "40px",
          width: "80px",
          height: "2px",
          backgroundColor: accentColor,
          opacity: 0.3,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          right: "40px",
          width: "2px",
          height: "80px",
          backgroundColor: accentColor,
          opacity: 0.3,
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          textAlign: "center",
          gap: "48px",
        }}
      >
        {/* Category with decorative lines */}
        {category && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              width: "100%",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "1px",
                backgroundColor: accentColor,
                opacity: 0.4,
              }}
            />
            <div
              style={{
                fontSize: "18px",
                fontWeight: "400",
                letterSpacing: "3px",
                textTransform: "uppercase",
                color: accentColor,
                opacity: 0.7,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {category}
            </div>
            <div
              style={{
                width: "60px",
                height: "1px",
                backgroundColor: accentColor,
                opacity: 0.4,
              }}
            />
          </div>
        )}

        {/* Title */}
        <h1
          style={{
            fontSize: "64px",
            fontWeight: "400",
            lineHeight: 1.3,
            color: accentColor,
            margin: 0,
            maxWidth: "85%",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h1>

        {/* Author and date */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            alignItems: "center",
          }}
        >
          {author && (
            <div
              style={{
                fontSize: "24px",
                fontWeight: "400",
                color: accentColor,
                fontStyle: "italic",
              }}
            >
              {author}
            </div>
          )}
          {date && (
            <div
              style={{
                fontSize: "20px",
                color: accentColor,
                opacity: 0.6,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {date}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
