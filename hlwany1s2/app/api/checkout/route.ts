import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { generateOrderNumber, getAuthoritativeProduct } from "@/lib/orders";
import { paymobProvider } from "@/lib/payments/paymob";

const checkoutSchema = z.object({
  productId: z.string().uuid(),
  customerName: z.string().min(2).max(80),
  customerPhone: z.string().min(8).max(20),
  customerEmail: z.string().email().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صحيحة", details: parsed.error.flatten() }, { status: 400 });
    }

    const { productId, customerName, customerPhone, customerEmail } = parsed.data;

    // السعر بييجي من قاعدة البيانات، مش من الطلب — ده اللي بيمنع التلاعب بالسعر
    const product = await getAuthoritativeProduct(productId);

    const supabase = createServerSupabase();
    const orderNumber = generateOrderNumber();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        subtotal: product.price,
        total: product.price,
        payment_status: "pending",
        order_status: "pending",
      })
      .select()
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "تعذر إنشاء الطلب" }, { status: 500 });
    }

    await supabase.from("order_items").insert({
      order_id: order.id,
      product_id: product.id,
      product_name_snapshot: product.name,
      unit_price: product.price,
      quantity: 1,
      total: product.price,
    });

    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/order/${orderNumber}?t=${order.access_token}`;

    const payment = await paymobProvider.createPayment({
      orderId: order.id,
      orderNumber,
      amountEGP: product.price,
      customerName,
      customerPhone,
      customerEmail,
      redirectUrl,
    });

    await supabase
      .from("orders")
      .update({ payment_provider: "paymob", payment_transaction_id: payment.providerReference })
      .eq("id", order.id);

    return NextResponse.json({
      orderNumber,
      accessToken: order.access_token,
      paymentUrl: payment.redirectUrl,
    });
  } catch (err) {
    console.error("checkout error:", err);
    return NextResponse.json({ error: "حصل خطأ غير متوقع، حاول تاني" }, { status: 500 });
  }
}
