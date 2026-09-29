"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/CartContext";

export function SiteHeader() {
  const { count } = useCart();

  return (
    <header className="flex items-center justify-between py-4 border-b border-line max-w-5xl mx-auto px-5">
      <Link href="/" className="flex items-center gap-2.5">
        <img
          src="https://raw.githubusercontent.com/hlwany1s/Orders/refs/heads/main/hlwany_logo_final.png"
          alt="7lwany Store"
          className="w-9 h-9 rounded-lg"
        />
        <span className="font-extrabold">7lwany Store</span>
      </Link>

      <Link
        href="/cart"
        className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-panel border border-line"
        aria-label="السلة"
      >
        <span className="text-lg">🛒</span>
        {count > 0 && (
          <span className="absolute -top-1.5 -left-1.5 bg-mint text-[#0d0018] text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center">
            {count}
          </span>
        )}
      </Link>
    </header>
  );
}
