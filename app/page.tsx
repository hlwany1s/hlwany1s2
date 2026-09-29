import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic"; // متحاولش تتصل بـ Supabase وقت البناء، بس وقت الطلب الفعلي
export const revalidate = 0;

export default async function HomePage() {
  const supabase = createServerSupabase();
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, category_face_value, price, featured")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Supabase products query error:", JSON.stringify(error));
  }

  const { data: stockSummary, error: stockError } = await supabase
    .from("itunes_stock_summary")
    .select("category, available");

  if (stockError) {
    console.error("Stock summary query error:", JSON.stringify(stockError));
  }

  const stockMap = new Map<string, number>(
    (stockSummary ?? []).map((row) => [String(row.category), Number(row.available)])
  );

  return (
    <main className="max-w-5xl mx-auto px-5 pb-20">
      <header className="flex items-center justify-between py-4 border-b border-line">
        <div className="flex items-center gap-2.5">
          <img
            src="https://raw.githubusercontent.com/hlwany1s/Orders/refs/heads/main/hlwany_logo_final.png"
            alt="7lwany Store"
            className="w-9 h-9 rounded-lg"
          />
          <span className="font-extrabold">7lwany Store</span>
        </div>
      </header>

      <section className="my-6 rounded-2xl border border-line bg-panel px-6 py-5">
        <span className="text-gold text-[11px] font-extrabold">شحن فوري · موثوق من ٢٠١٩</span>
        <h1 className="text-xl font-extrabold mt-1">اختار فئة الكارت وادفع — الكود يوصلك أوتوماتيك</h1>
      </section>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {(products ?? []).map((p) => {
          const available = stockMap.get(String(p.category_face_value)) ?? 0;
          const outOfStock = available === 0;

          const cardInner = (
            <>
              <div className="relative aspect-[1.7/1] flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-[#3a0e12] to-[#150608]">
                {p.featured && !outOfStock && (
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
                <span className="text-sm font-black text-[#ff9ca6]">{p.category_face_value} ج.م</span>
              </div>
              <div className="p-2.5 flex flex-col gap-1.5">
                <div className="text-center font-extrabold text-sm">{p.price} ج.م</div>
                {outOfStock ? (
                  <div className="bg-line text-dim text-[11px] font-extrabold text-center py-1.5 rounded-lg">
                    غير متاح حاليًا
                  </div>
                ) : (
                  <div className="bg-mint text-[#0d0018] text-[11px] font-extrabold text-center py-1.5 rounded-lg">
                    🛒 اشتري الآن
                  </div>
                )}
              </div>
            </>
          );

          if (outOfStock) {
            return (
              <div
                key={p.id}
                className="block rounded-2xl border border-line bg-panel overflow-hidden opacity-60"
              >
                {cardInner}
              </div>
            );
          }

          return (
            <Link
              key={p.id}
              href={`/checkout?productId=${p.id}`}
              className="block rounded-2xl border border-line bg-panel overflow-hidden hover:border-mint/40 transition"
            >
              {cardInner}
            </Link>
          );
        })}
      </div>

      {(!products || products.length === 0) && (
        <p className="text-dim text-sm text-center mt-10">مفيش فئات متاحة دلوقتي.</p>
      )}
    </main>
  );
}
