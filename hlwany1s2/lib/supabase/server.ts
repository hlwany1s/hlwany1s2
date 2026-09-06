import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * سيرفر فقط. بيستخدم service role key عشان يقدر يقرأ/يكتب في جداول
 * زي itunes_stock من غير قيود RLS.
 * ممنوع استيراد الملف ده في أي component عنده "use client".
 */
export function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase server env vars are missing (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
