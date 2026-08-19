"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CORE_NAV } from "@/lib/core-nav";

function isActive(pathname: string, href: string): boolean {
  if (href === "/core") return pathname === "/core" || pathname.startsWith("/core/");
  if (href === "/") return pathname === "/";
  return false;
}

export function CoreSidebarNav({ layout }: { layout: "sidebar" | "topbar" }) {
  const pathname = usePathname() ?? "";
  const horizontal = layout === "topbar";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: horizontal ? "row" : "column",
        gap: horizontal ? "6px" : "2px",
        ...(horizontal ? {} : { padding: "0 12px" }),
      }}
    >
      {CORE_NAV.map((item) => {
        const active = isActive(pathname, item.href);
        const style: CSSProperties = {
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: horizontal ? "8px 12px" : "10px 12px",
          borderRadius: "10px",
          background: active ? "#15151A" : "transparent",
          fontSize: horizontal ? "12px" : "13px",
          fontWeight: 600,
          color: active ? "#fff" : "#6E6E78",
          textDecoration: "none",
        };
        const content = (
          <>
            <span
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "11px",
                fontWeight: 600,
                color: active ? "#7AA2FF" : "#4A4A54",
              }}
            >
              {item.n}
            </span>
            <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>
          </>
        );
        if (item.href.startsWith("http")) {
          return (
            <a key={item.n} href={item.href} style={style}>
              {content}
            </a>
          );
        }
        return (
          <Link key={item.n} href={item.href} style={style}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
