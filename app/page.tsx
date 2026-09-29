import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const supabase = createServerSupabase();

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, category_face_value, price, featured")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) console.error("Supabase products query error:", JSON.stringify(error));

  const { data: stockSummary, error: stockError } = await supabase
    .from("itunes_stock_summary")
    .select("category, available");

  if (stockError) console.error("Stock summary query error:", JSON.stringify(stockError));

  const stockMap = new Map<string, number>(
    (stockSummary ?? []).map((row) => [String(row.category), Number(row.available)])
  );

  return (
    <main dir="rtl" style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 16px" }}>
      <header style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1f4438" }}>7lwany Store</h1>
        <p style={{ color: "#6b7280", marginTop: 6 }}>بطاقات آيتونز مصر — تسليم فوري بعد الدفع</p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 14,
        }}
      >
        {(products ?? []).map((product) => {
          const available = stockMap.get(String(product.category_face_value)) ?? 0;
          const outOfStock = available === 0;

          return (
            <div
              key={product.id}
              style={{
                position: "relative",
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                padding: 16,
                textAlign: "center",
                background: "#fff",
                opacity: outOfStock ? 0.55 : 1,
              }}
            >
              {product.featured && !outOfStock && (
                <span
                  style={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    background: "#2f5d50",
                    color: "#fff",
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 999,
                  }}
                >
                  الأكثر طلبًا
                </span>
              )}

              {outOfStock && (
                <span
                  style={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    background: "#dc2626",
                    color: "#fff",
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 999,
                  }}
                >
                  نفذ من المخزون
                </span>
              )}

              <div style={{ fontSize: 15, fontWeight: 700, color: "#1f4438", marginTop: 12 }}>
                {product.name}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: "10px 0" }}>
                {product.price} ج.م
              </div>

              {outOfStock ? (
                <button
                  disabled
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: 10,
                    border: "none",
                    background: "#e5e7eb",
                    color: "#6b7280",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "not-allowed",
                  }}
                >
                  غير متاح حاليًا
                </button>
              ) : (
                <Link
                  href={`/checkout?productId=${product.id}&name=${encodeURIComponent(
                    product.name
                  )}&price=${product.price}`}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "10px",
                    borderRadius: 10,
                    background: "#2f5d50",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  اشتري دلوقتي
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
