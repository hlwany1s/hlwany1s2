import { createClient } from "@supabase/supabase-js";

/**
 * آمن للاستخدام في المتصفح — بيستخدم الـ publishable key بس (مش service role).
 * الجداول اللي بيقرأها لازم يبقى عليها RLS policy تسمح بالقراءة العامة
 * لفئات المنتجات النشطة بس (active = true)، مفيش كتابة من هنا خالص.
 */
export function createBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key);
}
