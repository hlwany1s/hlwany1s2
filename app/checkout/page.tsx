"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart/CartContext";

const inputSafeStyle: React.CSSProperties = {
  backgroundColor: "#0a2b26",
  color: "#f2fbf8",
  WebkitTextFillColor: "#f2fbf8",
};

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <main className="max-w-md mx-auto px-5 py-16 text-center">
        <p className="text-dim text-sm mb-6">السلة فاضية، ارجع تصفح الفئات الأول.</p>
        <Link href="/" className="inline-block bg-mint text-[#0d0018] font-extrabold py-3 px-6 rounded-xl">
          تصفح الفئات
        </Link>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          customerEmail: email,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "حصل خطأ، حاول تاني");
        setLoading(false);
        return;
      }

      clear();
      window.location.href = data.paymentUrl;
    } catch {
      setError("تعذر الاتصال بالسيرفر");
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto px-5 py-10">
      <h1 className="text-xl font-extrabold mb-4">إتمام الطلب</h1>

      <div className="bg-panel border border-line rounded-xl p-4 mb-6">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center justify-between text-sm py-1">
            <span>{item.name} × {item.quantity}</span>
            <span className="font-extrabold">{item.price * item.quantity} ج.م</span>
          </div>
        ))}
        <div className="flex items-center justify-between text-sm pt-2 mt-2 border-t border-line">
          <span className="text-dim">الإجمالي</span>
          <span className="font-extrabold text-mint">{subtotal} ج.م</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs text-dim mb-1 block">الاسم</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-panel border border-line rounded-xl px-4 py-3 text-sm outline-none focus:border-mint"
            style={inputSafeStyle}
            placeholder="اسمك"
          />
        </div>

        <div>
          <label className="text-xs text-dim mb-1 block">رقم الواتساب</label>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-panel border border-line rounded-xl px-4 py-3 text-sm outline-none focus:border-mint"
            style={inputSafeStyle}
            placeholder="01xxxxxxxxx"
            dir="ltr"
          />
        </div>

        <div>
          <label className="text-xs text-dim mb-1 block">
            الإيميل <span className="text-coral">*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-panel border border-line rounded-xl px-4 py-3 text-sm outline-none focus:border-mint"
            style={inputSafeStyle}
            placeholder="هيتبعتلك الكود على الإيميل ده"
            dir="ltr"
          />
          <p className="text-dim text-[11px] mt-1">الإيميل مطلوب — الكود هيوصلك عليه بعد الدفع.</p>
        </div>

        {error && <p className="text-coral text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-mint text-[#0d0018] font-extrabold py-3 rounded-xl disabled:opacity-50"
        >
          {loading ? "جاري التحويل..." : "ادفع الآن"}
        </button>
      </form>
    </main>
  );
}
