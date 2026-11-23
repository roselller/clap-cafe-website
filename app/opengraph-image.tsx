import { ImageResponse } from "next/og";
import { cafe } from "@/lib/cafe";

export const alt = `${cafe.name} — ${cafe.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f5f0e9",
          color: "#2a1a12",
        }}
      >
        <div style={{ display: "flex", flex: 1, alignItems: "center", padding: "0 90px", gap: 70 }}>
          {/* flat cup */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 260 }}>
            <div style={{ width: 260, height: 46, borderRadius: 130, background: "#d9b98f", border: "6px solid #2a1a12", display: "flex" }} />
            <div
              style={{
                marginTop: -20,
                width: 230,
                height: 250,
                background: "#fff",
                border: "6px solid #2a1a12",
                borderRadius: "0 0 40px 40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 62,
                fontWeight: 800,
                letterSpacing: 4,
              }}
            >
              CLAP
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: 4, lineHeight: 1 }}>{cafe.name}</div>
            <div style={{ fontSize: 40, marginTop: 24, lineHeight: 1.25, maxWidth: 640 }}>{cafe.tagline}</div>
            <div style={{ fontSize: 28, marginTop: 28, color: "#5e3e2b" }}>
              {`${cafe.location.building}, ${cafe.location.city}`}
            </div>
          </div>
        </div>
        <div style={{ height: 70, background: "#ec7e91", display: "flex" }} />
      </div>
    ),
    size,
  );
}
