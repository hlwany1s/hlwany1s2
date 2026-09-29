"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function CheckoutForm() {
  const params = useSearchParams();
  const productId = params.get("productId") ?? "";
  const productName = params.get("name") ?? "";
  const productPrice = params.get("price") ?? "";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          customerName: name,
          customerPhone: phone,
          customerEmail: email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "حصل خطأ، حاول تاني");
        setLoading(false);
        return;
      }

      window.location.href = data.paymentUrl;
    } catch (err) {
      setError("حصل خطأ في الاتصال، حاول تاني");
      setLoading(false);
    }
  }

  return (
    <main dir="rtl" style={{ maxWidth: 480, margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1f4438", marginBottom: 8 }}>
        إتمام الطلب
      </h1>
      {productName && (
        <p style={{ color: "#4b5563", marginBottom: 24 }}>
          {decodeURIComponent(productName)} {productPrice && `— ${productPrice} ج.م`}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#374151" }}>
            الاسم
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسمك بالكامل"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#374151" }}>
            رقم الموبايل
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01xxxxxxxxx"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#374151" }}>
            الإيميل <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="هيتبعتلك الكود عليه"
            style={inputStyle}
          />
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            الكود هيتبعتلك على الإيميل ده، اكتبه صح.
          </p>
        </div>

        {error && (
          <p style={{ color: "#dc2626", fontSize: 14, marginBottom: 16 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 10,
            border: "none",
            background: loading ? "#9ca3af" : "#2f5d50",
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "جاري التحويل..." : "ادفع دلوقتي"}
        </button>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  fontSize: 15,
  outline: "none",
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={<main style={{ padding: 32, textAlign: "center" }}>جاري التحميل...</main>}>
      <CheckoutForm />
    </Suspense>
  );
}
