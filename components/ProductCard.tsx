"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/CartContext";

type Product = {
  id: string;
  name: string;
  price: number;
  categoryFaceValue: number;
  featured: boolean;
};

export function ProductCard({
  product,
  outOfStock,
}: {
  product: Product;
  outOfStock: boolean;
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        categoryFaceValue: product.categoryFaceValue,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  function handleBuyNow() {
    addItem(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        categoryFaceValue: product.categoryFaceValue,
      },
      qty
    );
    router.push("/cart");
  }

  return (
    <div
      className={`rounded-2xl border border-line bg-panel overflow-hidden ${
        outOfStock ? "opacity-60" : ""
      }`}
    >
      <div className="relative aspect-[1.7/1] flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-[#3a0e12] to-[#150608]">
        {product.featured && !outOfStock && (
          <span className="absolute top-1.5 left-1.5 bg-gold text-[#0e1400] text-[8px] font-extrabold px-1.5 py-0.5 rounded-full">
            الأكثر مبيعًا
          </span>
        )}
        {outOfStock && (
          <span className="absolute top-1.5 left-1.5 bg-coral text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full">
            نفذ من المخزون
          </span>
        )}
        <span className="text-lg">🍎</span>
        <span className="text-sm font-black text-[#ff9ca6]">{product.categoryFaceValue} ج.م</span>
      </div>

      <div className="p-2.5 flex flex-col gap-1.5">
        <div className="text-center font-extrabold text-sm">{product.price} ج.م</div>

        {outOfStock ? (
          <div className="bg-line text-dim text-[11px] font-extrabold text-center py-1.5 rounded-lg">
            غير متاح حاليًا
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-6 h-6 rounded-md bg-bg border border-line text-xs font-bold"
              >
                −
              </button>
              <span className="text-xs font-extrabold w-4 text-center">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="w-6 h-6 rounded-md bg-bg border border-line text-xs font-bold"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              className="bg-line text-ink text-[11px] font-extrabold text-center py-1.5 rounded-lg"
            >
              {added ? "✓ اتضاف للسلة" : "أضف للسلة"}
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              className="bg-mint text-[#0d0018] text-[11px] font-extrabold text-center py-1.5 rounded-lg"
            >
              🛒 اشتري الآن
            </button>
          </>
        )}
      </div>
    </div>
  );
}
