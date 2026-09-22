import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#171b20",
          position: "relative",
        }}
      >
        <span style={{ color: "#f6f7f8", fontSize: 110, fontWeight: 700, letterSpacing: "-0.05em" }}>H</span>
        <div
          style={{
            position: "absolute",
            right: 26,
            bottom: 26,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "#ff174f",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
