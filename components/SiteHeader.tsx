"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/CartContext";

export function SiteHeader() {
  const { count } = useCart();

  return (
    <header style={{ width: "100%", borderBottom: "1px solid rgba(25,246,167,.10)" }}>
      <div
        className="max-w-5xl mx-auto"
        style={{
          width: "100%",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="font-extrabold">7lwany Store</span>
          <img
  src="https://raw.githubusercontent.com/hlwany1s/Orders/refs/heads/main/hlwany_logo_final.png"
  alt="7lwany Store"
  className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
/>
        </Link>

        <Link
          href="/cart"
          aria-label="السلة"
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "#0a2b26",
            border: "1px solid rgba(25,246,167,.10)",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: "18px", lineHeight: 1 }}>🛒</span>
          {count > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-6px",
                left: "-6px",
                background: "#19f6a7",
                color: "#0d0018",
                fontSize: "10px",
                fontWeight: 800,
                width: "20px",
                height: "20px",
                borderRadius: "999px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
              }}
            >
              {count}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
