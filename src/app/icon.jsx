import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 7,
          position: "relative",
        }}
      >
        <span style={{ color: "#f6f7f8", fontSize: 20, fontWeight: 700, letterSpacing: "-0.05em" }}>H</span>
        <div
          style={{
            position: "absolute",
            right: 4,
            bottom: 4,
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#ff174f",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
