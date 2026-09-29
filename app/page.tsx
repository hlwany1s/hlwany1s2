import { createServerSupabase } from "@/lib/supabase/server";
import { ProductCard } from "@/components/ProductCard";

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
      <section className="my-6 rounded-2xl border border-line bg-panel px-6 py-5">
        <span className="text-gold text-[11px] font-extrabold">شحن فوري · موثوق من ٢٠١٩</span>
        <h1 className="text-xl font-extrabold mt-1">اختار فئة الكارت وادفع — الكود يوصلك أوتوماتيك</h1>
      </section>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {(products ?? []).map((p) => {
          const available = stockMap.get(String(p.category_face_value)) ?? 0;
          return (
            <ProductCard
              key={p.id}
              product={{
                id: p.id,
                name: p.name,
                price: p.price,
                categoryFaceValue: p.category_face_value,
                featured: p.featured,
              }}
              outOfStock={available === 0}
            />
          );
        })}
      </div>

      {(!products || products.length === 0) && (
        <p className="text-dim text-sm text-center mt-10">مفيش فئات متاحة دلوقتي.</p>
      )}
    </main>
  );
}
