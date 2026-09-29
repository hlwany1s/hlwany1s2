import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { generateOrderNumber, getAuthoritativeProduct } from "@/lib/orders";
import { paymobProvider } from "@/lib/payments/paymob";

export const dynamic = "force-dynamic";

const checkoutSchema = z.object({
  productId: z.string().uuid(),
  customerName: z.string().min(2, "اكتب اسمك بالكامل"),
  customerPhone: z
    .string()
    .regex(/^01[0-2,5]{1}[0-9]{8}$/, "رقم الموبايل غلط"),
  // الإيميل بقى إجباري عشان الكود هيتبعت عليه
  customerEmail: z
    .string()
    .min(1, "الإيميل مطلوب")
    .email("اكتب إيميل صحيح"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "بيانات غير صحيحة" },
        { status: 400 }
      );
    }

    const { productId, customerName, customerPhone, customerEmail } = parsed.data;

    const supabase = createServerSupabase();

    const product = await getAuthoritativeProduct(productId);
    if (!product) {
      return NextResponse.json(
        { error: "المنتج غير متاح حاليًا" },
        { status: 400 }
      );
    }

    const category = String(product.category_face_value);
    const { count: availableCount, error: stockError } = await supabase
      .from("itunes_stock")
      .select("*", { count: "exact", head: true })
      .eq("category", category)
      .eq("available", true);

    if (stockError) {
      console.error("Stock check error:", JSON.stringify(stockError));
      return NextResponse.json(
        { error: "حصل خطأ أثناء التحقق من المخزون، حاول تاني" },
        { status: 500 }
      );
    }

    if (!availableCount || availableCount === 0) {
      return NextResponse.json(
        {
          error:
            "عذرًا، فئة البطاقة دي خلصت من المخزون دلوقتي. جرب فئة تانية أو تواصل معانا.",
        },
        { status: 400 }
      );
    }

    const orderNumber = generateOrderNumber();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        total_price: product.price,
        payment_status: "pending",
        order_status: "pending",
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Order creation error:", JSON.stringify(orderError));
      return NextResponse.json(
        { error: "حصل خطأ أثناء إنشاء الطلب، حاول تاني" },
        { status: 500 }
      );
    }

    const { error: itemError } = await supabase.from("order_items").insert({
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      category_face_value: product.category_face_value,
      unit_price: product.price,
      quantity: 1,
    });

    if (itemError) {
      console.error("Order item creation error:", JSON.stringify(itemError));
      return NextResponse.json(
        { error: "حصل خطأ أثناء إنشاء الطلب، حاول تاني" },
        { status: 500 }
      );
    }

    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/order/${orderNumber}?t=${order.access_token}`;

    const payment = await paymobProvider.createPayment({
      amountEGP: product.price,
      orderId: order.id,
      orderNumber: order.order_number,
      customerName,
      customerPhone,
      customerEmail,
      redirectUrl,
    });

    await supabase
      .from("orders")
      .update({
        payment_provider: "paymob",
        payment_transaction_id: payment.providerReference,
      })
      .eq("id", order.id);

    return NextResponse.json({
      orderNumber: order.order_number,
      accessToken: order.access_token,
      paymentUrl: payment.redirectUrl,
    });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "حصل خطأ غير متوقع، حاول تاني" },
      { status: 500 }
    );
  }
}
