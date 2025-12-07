import type { OGTemplateProps } from "@/lib/og";

export function EcommerceProductTemplate({
  title,
  // price,
  description,
  accentColor = "#dc2626",
  bgColor = "#ffffff",
  image,
  tags,
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
      }}
    >
      {/* Left Image Section */}
      {image && (
        <div
          style={{
            display: "flex",
            width: "50%",
            backgroundColor: "#f9fafb",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px",
          }}
        >
          <img
            src={image || "/placeholder.svg"}
            alt="Product"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              maxHeight: "500px",
            }}
          />
        </div>
      )}

      {/* Right Content Section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "50%",
          padding: "80px",
          gap: "32px",
        }}
      >
        {/* Sale Badge */}
        <div
          style={{
            display: "inline-flex",
            alignSelf: "flex-start",
            backgroundColor: accentColor,
            color: "#ffffff",
            fontSize: "28px",
            fontWeight: "900",
            padding: "16px 40px",
            borderRadius: "8px",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          SALE
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 64,
            fontWeight: "900",
            color: "#111827",
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          {title}
        </h1>

        {/* Description */}
        {description && (
          <p
            style={{
              fontSize: "26px",
              color: "#6b7280",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {description}
          </p>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {tags.slice(0, 3).map((tag, i) => (
              <div
                key={i}
                style={{
                  fontSize: "20px",
                  color: "#4b5563",
                  backgroundColor: "#f3f4f6",
                  padding: "8px 20px",
                  borderRadius: "20px",
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        )}

        {/* Price */}
        {/* {price && (
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "16px",
            }}
          >
            <div
              style={{
                fontSize: "72px",
                fontWeight: "900",
                color: accentColor,
              }}
            >
              {price}
            </div>
            <div
              style={{
                fontSize: "32px",
                color: "#9ca3af",
                textDecoration: "line-through",
              }}
            >
              $199
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
}
