import type { OGTemplateProps } from "@/lib/og"

export function MangaComicTemplate({
  title,
  author,
  category,
  accentColor = "#ef4444",
  bgColor = "#fef3c7",
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
      {/* Comic Book Dots Pattern */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `radial-gradient(circle, #00000020 1px, transparent 1px)`,
          backgroundSize: "8px 8px",
        }}
      />

      {/* Speed Lines Background */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "150%",
          height: "150%",
          transform: "translate(-50%, -50%)",
          background: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 20px,
            #00000010 20px,
            #00000010 22px
          )`,
        }}
      />

      {/* Main Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 80px",
          position: "relative",
          zIndex: 1,
          width: "100%",
        }}
      >
        {/* Top Section */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          {/* Category Badge */}
          {category && (
            <div
              style={{
                display: "flex",
                backgroundColor: "#000000",
                color: "#ffffff",
                fontSize: "28px",
                fontWeight: "900",
                padding: "20px 40px",
                border: "6px solid #ffffff",
                boxShadow: "8px 8px 0px rgba(0, 0, 0, 0.3)",
                transform: "rotate(-3deg)",
                textTransform: "uppercase",
              }}
            >
              {category}
            </div>
          )}

          {/* Explosion Burst */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "120px",
              height: "120px",
              backgroundColor: accentColor,
              color: "#ffffff",
              fontSize: "48px",
              fontWeight: "900",
              clipPath:
                "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
              border: "6px solid #000000",
            }}
          >
            NEW
          </div>
        </div>

        {/* Middle Title Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "30px",
          }}
        >
          {/* Title with Comic Style */}
          <h1
            style={{
              fontSize: 76,
              fontWeight: "900",
              color: "#000000",
              lineHeight: 0.9,
              margin: 0,
              textAlign: "center",
              textTransform: "uppercase",
              letterSpacing: "2px",
              textShadow: `
                4px 4px 0px #ffffff,
                8px 8px 0px ${accentColor},
                12px 12px 0px #000000
              `,
              WebkitTextStroke: "3px #000000",
              paintOrder: "stroke fill",
            }}
          >
            {title}
          </h1>

          {/* Action Lines */}
          <div
            style={{
              display: "flex",
              gap: "20px",
            }}
          >
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: "80px",
                  height: "8px",
                  backgroundColor: "#000000",
                  transform: `rotate(${i * 5 - 10}deg)`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Bottom Author Section */}
        {author && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "20px",
            }}
          >
            <div
              style={{
                fontSize: "36px",
                fontWeight: "900",
                color: "#000000",
                backgroundColor: "#ffffff",
                padding: "16px 40px",
                border: "4px solid #000000",
                boxShadow: "6px 6px 0px rgba(0, 0, 0, 0.3)",
              }}
            >
              BY {author.toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
