import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { paymobProvider } from "@/lib/payments/paymob";

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();

  try {
    const payload = await req.json();
    const headers = Object.fromEntries(req.headers.entries());

    const verification = await paymobProvider.verifyWebhook(payload, headers);

    if (!verification.valid) {
      console.warn("Paymob webhook: invalid HMAC — rejected");
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }

    if (!verification.orderNumber) {
      console.warn("Paymob webhook: no order_number in payload extras");
      return NextResponse.json({ error: "order not identified" }, { status: 400 });
    }

    // Idempotency: لو المعاملة دي اتسجلت قبل كدا، منعالجهاش تاني
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("provider", "paymob")
      .eq("provider_reference", verification.providerReference)
      .maybeSingle();

    if (existingPayment) {
      return NextResponse.json({ ok: true, note: "already processed" });
    }

    const { data: order } = await supabase
      .from("orders")
      .select("id, order_number, total, payment_status, order_status")
      .eq("order_number", verification.orderNumber)
      .single();

    if (!order) {
      return NextResponse.json({ error: "order not found" }, { status: 404 });
    }

    // تحقق من تطابق المبلغ — مش بس نصدق حالة النجاح المرسلة
    const amountMatches = verification.amountEGP !== null && Math.abs(verification.amountEGP - Number(order.total)) < 0.01;

    await supabase.from("payments").insert({
      order_id: order.id,
      provider: "paymob",
      provider_reference: verification.providerReference,
      amount: verification.amountEGP ?? 0,
      currency: verification.currency ?? "EGP",
      status: verification.status ?? "failed",
      raw_response: verification.raw as any,
    });

    if (verification.status !== "paid" || !amountMatches) {
      await supabase
        .from("orders")
        .update({ payment_status: "failed" })
        .eq("id", order.id);
      return NextResponse.json({ ok: true, note: "payment not successful or amount mismatch" });
    }

    if (order.payment_status === "paid") {
      // اتعالج قبل كدا فعلاً (احتياط إضافي فوق الـ idempotency الأساسية)
      return NextResponse.json({ ok: true, note: "already paid" });
    }

    // ==== الدفع اتأكد فعليًا هنا بس — دلوقتي نسحب كود آيتونز حقيقي ====
    const { data: item } = await supabase
      .from("order_items")
      .select("product_id, products(category_face_value)")
      .eq("order_id", order.id)
      .single();

    const category = String((item as any)?.products?.category_face_value ?? "");

    const { data: code, error: claimError } = await supabase.rpc("claim_itunes_code", {
      p_category: category,
      p_order_number: order.order_number,
    });

    if (claimError || !code) {
      // المخزون خلص للفئة دي — الطلب يتحدد "paid" لكن يفضل بدون كود،
      // ولازم تتنبه فورًا (TODO: إشعار أدمن هنا في مرحلة الإيميلات)
      await supabase
        .from("orders")
        .update({ payment_status: "paid", order_status: "paid" })
        .eq("id", order.id);
      console.error(`Stock empty for category ${category} — order ${order.order_number} paid without code`);
      return NextResponse.json({ ok: true, note: "paid but out of stock" });
    }

    await supabase
      .from("orders")
      .update({ payment_status: "paid", order_status: "completed", itunes_code: code })
      .eq("id", order.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Paymob webhook error:", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
