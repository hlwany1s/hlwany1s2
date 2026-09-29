import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { generateOrderNumber, getAuthoritativeProduct } from "@/lib/orders";
import { paymobProvider } from "@/lib/payments/paymob";

export const dynamic = "force-dynamic";

const checkoutSchema = z.object({
  customerName: z.string().min(2, "اكتب اسمك بالكامل"),
  customerPhone: z
    .string()
    .regex(/^01[0-2,5]{1}[0-9]{8}$/, "رقم الموبايل غلط"),
  // الإيميل بقى إجباري عشان الكود هيتبعت عليه
  customerEmail: z
    .string()
    .min(1, "الإيميل مطلوب")
    .email("اكتب إيميل صحيح"),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(50),
      })
    )
    .min(1, "السلة فاضية"),
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

    const { customerName, customerPhone, customerEmail, items } = parsed.data;

    const supabase = createServerSupabase();

    // 1) نجيب السعر والحالة الحقيقية لكل منتج من الداتا بيز (مش من الكلاينت)،
    // ونتحقق إن كل فئة فيها ستوك كافي للكمية المطلوبة قبل ما نسمح بالدفع أصلاً
    const resolvedItems: {
      productId: string;
      name: string;
      price: number;
      category: string;
      quantity: number;
    }[] = [];

    // لو نفس المنتج اتكرر في السلة بأكتر من سطر، نجمع الكميات
    const neededByCategory = new Map<string, number>();

    for (const line of items) {
      const product = await getAuthoritativeProduct(line.productId);
      if (!product) {
        return NextResponse.json(
          { error: "أحد المنتجات في السلة غير متاح، حدّث الصفحة وحاول تاني" },
          { status: 400 }
        );
      }

      const category = String(product.category_face_value);
      resolvedItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        category,
        quantity: line.quantity,
      });

      neededByCategory.set(category, (neededByCategory.get(category) ?? 0) + line.quantity);
    }

    for (const [category, needed] of neededByCategory.entries()) {
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

      if (!availableCount || availableCount < needed) {
        return NextResponse.json(
          {
            error: `عذرًا، فئة ${category} ج.م مفيهاش ستوك كافي دلوقتي (متاح ${availableCount ?? 0} بس). قلل الكمية أو جرب فئة تانية.`,
          },
          { status: 400 }
        );
      }
    }

    const subtotal = resolvedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const orderNumber = generateOrderNumber();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        subtotal,
        discount: 0,
        total: subtotal,
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

    const itemsToInsert = resolvedItems.map((i) => ({
      order_id: order.id,
      product_id: i.productId,
      product_name_snapshot: i.name,
      unit_price: i.price,
      quantity: i.quantity,
      total: i.price * i.quantity,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(itemsToInsert);

    if (itemsError) {
      console.error("Order items creation error:", JSON.stringify(itemsError));
      return NextResponse.json(
        { error: "حصل خطأ أثناء إنشاء الطلب، حاول تاني" },
        { status: 500 }
      );
    }

    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/order/${orderNumber}?t=${order.access_token}`;

    const payment = await paymobProvider.createPayment({
      amountEGP: subtotal,
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
