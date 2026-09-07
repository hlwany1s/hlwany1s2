"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function CheckoutForm() {
  const params = useSearchParams();
  const productId = params.get("productId") ?? "";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, customerName: name, customerPhone: phone, customerEmail: email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "حصل خطأ، حاول تاني");
        setLoading(false);
        return;
      }

      window.location.href = data.paymentUrl;
    } catch {
      setError("تعذر الاتصال بالسيرفر");
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto px-5 py-10">
      <h1 className="text-xl font-extrabold mb-6">إتمام الطلب</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs text-dim mb-1 block">الاسم</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-panel border border-line rounded-xl px-4 py-3 text-sm outline-none focus:border-mint"
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
            placeholder="01xxxxxxxxx"
            dir="ltr"
          />
        </div>

        <div>
          <label className="text-xs text-dim mb-1 block">الإيميل (اختياري)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-panel border border-line rounded-xl px-4 py-3 text-sm outline-none focus:border-mint"
            placeholder="لو عايز إيصال بالإيميل"
            dir="ltr"
          />
        </div>

        {error && <p className="text-coral text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !productId}
          className="bg-mint text-[#0d0018] font-extrabold py-3 rounded-xl disabled:opacity-50"
        >
          {loading ? "جاري التحويل..." : "ادفع الآن"}
        </button>
      </form>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<main className="max-w-md mx-auto px-5 py-16 text-center text-dim">جاري التحميل...</main>}>
      <CheckoutForm />
    </Suspense>
  );
}
