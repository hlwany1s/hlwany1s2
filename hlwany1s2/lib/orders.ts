import { createServerSupabase } from "./supabase/server";

export function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `HLW-${y}${m}${d}-${rand}`;
}

/**
 * بيقرا السعر الحقيقي من قاعدة البيانات — الفرونت-إند ممكن يبعت productId
 * بس، مش السعر. لو المنتج مش موجود أو مش نشط، بيرمي error.
 */
export async function getAuthoritativeProduct(productId: string) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, category_face_value, active")
    .eq("id", productId)
    .single();

  if (error || !data || !data.active) {
    throw new Error("Product not found or inactive");
  }

  return data;
}
