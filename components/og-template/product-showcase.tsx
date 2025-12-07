import type { OGTemplateProps } from "@/lib/og";

export function ProductShowcaseTemplate({
  title,
  // price,
  description,
  accentColor = "#10b981",
  bgColor = "#f9fafb",
  logo,
  image,
}: OGTemplateProps) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: bgColor,
        padding: "60px 80px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header with Logo */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "60px",
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
        <div
          style={{
            fontSize: "32px",
            fontWeight: "700",
            color: accentColor,
          }}
        >
          NEW
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flex: 1,
          gap: "60px",
        }}
      >
        {/* Product Image */}
        {image && (
          <div
            style={{
              display: "flex",
              width: "45%",
              height: "400px",
              backgroundColor: "#ffffff",
              borderRadius: "32px",
              padding: "40px",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
            }}
          >
            <img
              src={image || "/placeholder.svg"}
              alt="Product"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </div>
        )}

        {/* Product Info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "50%",
            gap: "24px",
          }}
        >
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

          {description && (
            <p
              style={{
                fontSize: "28px",
                color: "#6b7280",
                lineHeight: 1.4,
                margin: 0,
              }}
            >
              {description}
            </p>
          )}

          {/* {price && (
            <div
              style={{
                fontSize: "56px",
                fontWeight: "800",
                color: accentColor,
                marginTop: "20px",
              }}
            >
              {price}
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}
