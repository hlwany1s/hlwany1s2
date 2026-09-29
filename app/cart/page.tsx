"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/CartContext";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <main className="max-w-md mx-auto px-5 py-16 text-center">
        <div className="text-4xl mb-4">🛒</div>
        <h1 className="font-extrabold text-lg mb-2">السلة فاضية</h1>
        <p className="text-dim text-sm mb-6">لسه مضفتش أي بطاقة للسلة.</p>
        <Link
          href="/"
          className="inline-block bg-mint text-[#0d0018] font-extrabold py-3 px-6 rounded-xl"
        >
          تصفح الفئات
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-5 py-10">
      <h1 className="text-xl font-extrabold mb-6">سلة الشراء</h1>

      <div className="flex flex-col gap-3 mb-6">
        {items.map((item) => (
          <div
            key={item.productId}
            className="bg-panel border border-line rounded-xl p-3 flex items-center justify-between gap-3"
          >
            <div className="flex-1">
              <div className="font-extrabold text-sm">{item.name}</div>
              <div className="text-dim text-xs mt-0.5">{item.price} ج.م × {item.quantity}</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                className="w-7 h-7 rounded-md bg-bg border border-line text-sm font-bold"
              >
                −
              </button>
              <span className="text-sm font-extrabold w-5 text-center">{item.quantity}</span>
              <button
                type="button"
                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                className="w-7 h-7 rounded-md bg-bg border border-line text-sm font-bold"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={() => removeItem(item.productId)}
              className="text-coral text-xs font-extrabold px-2"
              aria-label="حذف"
            >
              حذف
            </button>
          </div>
        ))}
      </div>

      <div className="bg-panel border border-line rounded-xl p-4 flex items-center justify-between mb-6">
        <span className="text-dim text-sm">الإجمالي</span>
        <span className="font-extrabold text-lg">{subtotal} ج.م</span>
      </div>

      <Link
        href="/checkout"
        className="block text-center bg-mint text-[#0d0018] font-extrabold py-3 rounded-xl"
      >
        إتمام الشراء
      </Link>
    </main>
  );
}
