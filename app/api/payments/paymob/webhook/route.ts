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

    if (Math.round(order.total * 100) !== Math.round(amountEGP * 100)) {
      console.error("Webhook: amount mismatch", order.total, amountEGP);
      return NextResponse.json({ error: "amount mismatch" }, { status: 400 });
    }

    await supabase.from("payments").insert({
      order_id: order.id,
      provider: "paymob",
      provider_reference: providerReference,
      amount: amountEGP,
      status,
    });

    if ((status as string) !== "success") {
      await supabase
        .from("orders")
        .update({ payment_status: "failed", order_status: "cancelled" })
        .eq("id", order.id);
      return NextResponse.json({ ok: true });
    }

    // نجيب كل سطور الأوردر (ممكن يبقى فيها أكتر من فئة وأكتر من كمية)
    const { data: orderItems, error: itemsFetchError } = await supabase
      .from("order_items")
      .select("id, product_name_snapshot, quantity, products(category_face_value)")
      .eq("order_id", order.id);

    if (itemsFetchError || !orderItems || orderItems.length === 0) {
      console.error("Webhook: order items not found", JSON.stringify(itemsFetchError));
      return NextResponse.json({ error: "order items not found" }, { status: 404 });
    }

    let anyMissingStock = false;
    const emailLines: { productName: string; codes: string[] }[] = [];

    for (const item of orderItems) {
      const productInfo = item.products as unknown as { category_face_value: number } | null;
      const category = String(productInfo?.category_face_value ?? "");
      const codes: string[] = [];

      // بنسحب كود لكل وحدة في الكمية المطلوبة، كل سحبة Race-safe لوحدها
      for (let i = 0; i < item.quantity; i++) {
        const { data: claimedCode, error: claimError } = await supabase.rpc(
          "claim_itunes_code",
          { p_category: category, p_order_number: order.order_number }
        );

        if (claimError) {
          console.error("claim_itunes_code error:", JSON.stringify(claimError));
        }

        if (!claimedCode) {
          anyMissingStock = true;
          console.error(
            `Payment succeeded for order ${order.order_number} but ran out of stock mid-fulfillment (category ${category})`
          );
          break;
        }

        codes.push(claimedCode as string);
      }

      if (codes.length > 0) {
        await supabase.from("order_items").update({ codes }).eq("id", item.id);
      }

      emailLines.push({
        productName: item.product_name_snapshot,
        codes,
      });
    }

    if (anyMissingStock) {
      await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          order_status: "paid",
          customer_notes:
            "الدفع تم بنجاح لكن بعض الأكواد مفيش لها ستوك كافي — محتاج متابعة يدوية فورية",
        })
        .eq("id", order.id);
      return NextResponse.json({ ok: true, warning: "paid_partial_stock" });
    }

    await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        order_status: "completed",
      })
      .eq("id", order.id);

    if (order.customer_email) {
      const { sent } = await sendCodeEmail({
        to: order.customer_email,
        customerName: order.customer_name,
        orderNumber: order.order_number,
        items: emailLines,
      });
      if (!sent) {
        console.error(`Failed to email codes for order ${order.order_number}`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
