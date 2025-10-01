import { OGTemplateProps } from "@/lib/og";

export function MinimalBlogTemplate({
  title,
  author,
  date,
  readingTime,
  category,
  accentColor = "#f97316",
  bgColor = "#ffffff",
  logo,
  image,
}: OGTemplateProps) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: bgColor,
        padding: "80px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Left Content Section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          width: "55%",
          gap: "30px",
        }}
      >
        {/* Logo */}
        {logo && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: "60px",
            }}
          >
            <img
              src={logo || "/placeholder.svg"}
              alt="Logo"
              style={{
                height: "60px",
                width: "auto",
                objectFit: "contain",
              }}
            />
          </div>
        )}

        {/* Title */}
        <h1
          style={{
            fontSize: 58,
            fontWeight: "900",
            color: "#000000",
            lineHeight: 1.2,
            margin: 0,
            maxWidth: "100%",
          }}
        >
          {title}
        </h1>

        {/* Date */}
        {date && (
          <div
            style={{
              fontSize: "28px",
              color: "#000000",
              opacity: 0.8,
              margin: 0,
            }}
          >
            {new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        )}

        {/* CTA Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: accentColor,
            color: "#ffffff",
            fontSize: 28,
            fontWeight: "700",
            padding: "20px 40px",
            borderRadius: "8px",
            marginTop: "10px",
          }}
        >
          Read Article
        </div>
      </div>

      {/* Right Image Section */}
      {image && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "40%",
            height: "420px",
            position: "relative",
          }}
        >
          {/* Decorative Orange Rectangle */}
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "-50px",
              width: "200px",
              height: "150px",
              backgroundColor: accentColor,
              zIndex: 1,
            }}
          />

          {/* Image Container */}
          <div
            style={{
              display: "flex",
              position: "relative",
              zIndex: 2,
              borderRadius: "24px",
              overflow: "hidden",
              width: "100%",
              height: "100%",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
          >
            <img
              src={image || "/placeholder.svg"}
              alt="Post cover"
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
  )
}
