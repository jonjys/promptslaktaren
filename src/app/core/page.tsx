import Link from "next/link";
import { CORE_NAV } from "@/components/core/CoreSidebarNav";

export default function CorePage() {
  return (
    <>
      <div
        style={{
          display: "inline-flex",
          padding: "6px 12px",
          borderRadius: 999,
          background: "rgba(122,92,250,0.12)",
          border: "1px solid rgba(122,92,250,0.2)",
          fontSize: 11,
          fontWeight: 700,
          color: "#A99CFF",
        }}
      >
        FRED OS CORENAV 01-10
      </div>
      <h1 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.04em", marginTop: 14 }}>
        Architecture
      </h1>
      <p style={{ color: "#6E6E78", marginTop: 8, maxWidth: 560 }}>
        01-10 are locked slots. Bridge (07) runs on this origin. Other slots open Fred Platform.
      </p>
      <div
        style={{
          marginTop: 28,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {CORE_NAV.map((item) => {
          const style = {
            padding: 18,
            borderRadius: 16,
            background: "linear-gradient(180deg, #13131A 0%, #0E0E12 100%)",
            border: "1px solid #1E1E24",
            textDecoration: "none",
            display: "block",
          } as const;
          const body = (
            <>
              <div
                style={{
                  fontFamily: "ui-monospace, Menlo, monospace",
                  fontSize: 11,
                  color: "#7AA2FF",
                  fontWeight: 700,
                }}
              >
                {item.n}
              </div>
              <div style={{ marginTop: 6, fontSize: 16, fontWeight: 700, color: "#fff" }}>
                {item.label}
              </div>
            </>
          );
          if (item.href.startsWith("http")) {
            return (
              <a key={item.n} href={item.href} style={style}>
                {body}
              </a>
            );
          }
          return (
            <Link key={item.n} href={item.href} style={style}>
              {body}
            </Link>
          );
        })}
      </div>
    </>
  );
}
