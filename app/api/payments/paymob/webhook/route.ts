import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { paymobProvider } from "@/lib/payments/paymob";
import { sendCodeEmail } from "@/lib/email/resend";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();

  try {
    const payload = await req.json();
    const verification = await paymobProvider.verifyWebhook(
      payload,
      Object.fromEntries(req.headers.entries())
    );

    if (!verification.valid) {
      console.error("Webhook HMAC verification failed");
      return NextResponse.json({ error: "invalid signature" }, { status: 400 });
    }

    const { orderNumber, providerReference, status } = verification;
    const amountEGP = verification.amountEGP ?? 0;

    if (!verification.amountEGP) {
      console.error("Webhook: amountEGP missing from verification result");
      return NextResponse.json({ error: "invalid amount" }, { status: 400 });
    }

    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("provider", "paymob")
      .eq("provider_reference", providerReference)
      .maybeSingle();

    if (existingPayment) {
      return NextResponse.json({ ok: true, note: "already processed" });
    }

    const { data: order, error: orderFetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .single();

    if (orderFetchError || !order) {
      console.error("Webhook: order not found", orderNumber);
      return NextResponse.json({ error: "order not found" }, { status: 404 });
    }

    if (Math.round(order.total_price * 100) !== Math.round(amountEGP * 100)) {
      console.error("Webhook: amount mismatch", order.total_price, amountEGP);
      return NextResponse.json({ error: "amount mismatch" }, { status: 400 });
    }

    await supabase.from("payments").insert({
      order_id: order.id,
      provider: "paymob",
      provider_reference: providerReference,
      amount: amountEGP,
      status,
    });

    if (status !== "success") {
      await supabase
        .from("orders")
        .update({ payment_status: "failed", order_status: "failed" })
        .eq("id", order.id);
      return NextResponse.json({ ok: true });
    }

    const { data: itemRow } = await supabase
      .from("order_items")
      .select("category_face_value, product_name")
      .eq("order_id", order.id)
      .single();

    const category = String(itemRow?.category_face_value ?? "");

    const { data: claimedCode, error: claimError } = await supabase.rpc(
      "claim_itunes_code",
      { p_category: category, p_order_number: order.order_number }
    );

    if (claimError) {
      console.error("claim_itunes_code error:", JSON.stringify(claimError));
    }

    if (!claimedCode) {
      console.error(
        `Payment succeeded for order ${order.order_number} but no stock available (category ${category})`
      );
      await supabase
        .from("orders")
        .update({ payment_status: "paid", order_status: "paid_no_stock" })
        .eq("id", order.id);
      return NextResponse.json({ ok: true, warning: "paid_no_stock" });
    }

    await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        order_status: "paid",
        itunes_code: claimedCode,
      })
      .eq("id", order.id);

    if (order.customer_email) {
      const { sent } = await sendCodeEmail({
        to: order.customer_email,
        customerName: order.customer_name,
        orderNumber: order.order_number,
        productName: itemRow?.product_name ?? `بطاقة ${category} ج.م`,
        code: claimedCode,
      });
      if (!sent) {
        console.error(`Failed to email code for order ${order.order_number}`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
