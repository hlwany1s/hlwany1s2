import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: { orderNumber: string } }) {
  const token = req.nextUrl.searchParams.get("t");

  if (!token) {
    return NextResponse.json({ error: "missing access token" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, payment_status, order_status, total, access_token")
    .eq("order_number", params.orderNumber)
    .single();

  if (!order || order.access_token !== token) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("product_name_snapshot, quantity, codes")
    .eq("order_id", order.id);

  return NextResponse.json({
    orderNumber: order.order_number,
    paymentStatus: order.payment_status,
    orderStatus: order.order_status,
    total: order.total,
    // الأكواد ميترجعوش إلا لو الدفع اتأكد فعليًا سيرفر-سايد
    items:
      order.payment_status === "paid"
        ? (items ?? []).map((i) => ({
            productName: i.product_name_snapshot,
            quantity: i.quantity,
            codes: i.codes ?? [],
          }))
        : [],
  });
}
