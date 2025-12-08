import type { OGTemplateProps } from "@/lib/og"

export function EcommerceProductTemplate({
  title,
  // price,
  description,
  accentColor = "#dc2626",
  bgColor = "#ffffff",
  image,
  images,
  tags,
}: OGTemplateProps) {
  // Use images array if provided, otherwise fallback to single image
  const productImages = images?.length ? images.slice(0, 3) : image ? [image] : []

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        backgroundColor: bgColor,
        padding: "0",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif",
        position: "relative",
      }}
    >
      {/* Left Image Section - Stacked Cards */}
      {productImages.length > 0 && (
        <div
          style={{
            display: "flex",
            width: "50%",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {/* Stacked images container */}
          <div
            style={{
              display: "flex",
              position: "relative",
              width: "500px",
              height: "580px",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Back left card (index 2) - rotated left */}
            {productImages[2] && (
              <div
                style={{
                  display: "flex",
                  position: "absolute",
                  width: "380px",
                  height: "480px",
                  backgroundColor: "#ffffff",
                  borderRadius: "24px",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                  overflow: "hidden",
                  transform: "rotate(-8deg) translateX(-50px)",
                }}
              >
                <img
                  src={productImages[2]}
                  alt="Product 3"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}

            {/* Back right card (index 1) - rotated right */}
            {productImages[1] && (
              <div
                style={{
                  display: "flex",
                  position: "absolute",
                  width: "380px",
                  height: "480px",
                  backgroundColor: "#ffffff",
                  borderRadius: "24px",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                  overflow: "hidden",
                  transform: "rotate(8deg) translateX(50px)",
                }}
              >
                <img
                  src={productImages[1]}
                  alt="Product 2"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}

            {/* Front card (index 0) - centered on top */}
            {productImages[0] && (
              <div
                style={{
                  display: "flex",
                  position: "absolute",
                  width: "420px",
                  height: "540px",
                  backgroundColor: "#ffffff",
                  borderRadius: "28px",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                  overflow: "hidden",
                  zIndex: 10,
                }}
              >
                <img
                  src={productImages[0]}
                  alt="Product 1"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}
          </div>
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
          position: "relative",
        }}
      >
        {/* Sale Badge - Minimalist Positioning */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: "40px",
            right: "80px",
            backgroundColor: accentColor,
            color: "#ffffff",
            fontSize: "12px",
            fontWeight: "600",
            padding: "6px 16px",
            borderRadius: "4px",
            textTransform: "uppercase",
            letterSpacing: "1.2px",
          }}
        >
          Sale
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 80,
            fontWeight: 900,
            color: "#111827",
            lineHeight: 1.1,
            margin: 0,
            letterSpacing: "-1.5px",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif",
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
              lineHeight: 1.6,
              margin: 0,
              fontWeight: "400",
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
                  fontSize: "16px",
                  color: "#6b7280",
                  backgroundColor: "#f9fafb",
                  padding: "8px 18px",
                  borderRadius: "6px",
                  fontWeight: "500",
                  border: "1px solid #e5e7eb",
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
  )
}
