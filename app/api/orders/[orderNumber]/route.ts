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
    .select("order_number, payment_status, order_status, total, itunes_code, access_token")
    .eq("order_number", params.orderNumber)
    .single();

  if (!order || order.access_token !== token) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    orderNumber: order.order_number,
    paymentStatus: order.payment_status,
    orderStatus: order.order_status,
    total: order.total,
    // الكود ميترجعش إلا لو الدفع اتأكد فعليًا سيرفر-سايد
    itunesCode: order.payment_status === "paid" ? order.itunes_code : null,
  });
}
