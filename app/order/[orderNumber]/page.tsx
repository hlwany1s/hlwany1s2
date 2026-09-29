"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type OrderItem = {
  productName: string;
  quantity: number;
  codes: string[];
};

type OrderState = {
  paymentStatus: string;
  orderStatus: string;
  total: number;
  items: OrderItem[];
} | null;

function OrderStatusInner() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const token = useSearchParams().get("t");
  const [order, setOrder] = useState<OrderState>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function poll() {
      const res = await fetch(`/api/orders/${orderNumber}?t=${token}`);
      if (!res.ok) {
        if (!cancelled) setNotFound(true);
        return;
      }
      const data = await res.json();
      if (!cancelled) setOrder(data);

      if (!cancelled && data.paymentStatus === "pending") {
        setTimeout(poll, 3000);
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [orderNumber, token]);

  if (notFound) {
    return <main className="max-w-md mx-auto px-5 py-16 text-center text-dim">الطلب غير موجود.</main>;
  }

  if (!order) {
    return <main className="max-w-md mx-auto px-5 py-16 text-center text-dim">جاري التحميل...</main>;
  }

  if (order.paymentStatus === "pending") {
    return (
      <main className="max-w-md mx-auto px-5 py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-mint/10 border border-mint/40 flex items-center justify-center mx-auto mb-4 text-2xl animate-pulse">
          ⏳
        </div>
        <h1 className="font-extrabold text-lg mb-2">جاري تأكيد الدفع...</h1>
        <p className="text-dim text-sm">من فضلك متقفلش الصفحة دي</p>
      </main>
    );
  }

  if (order.paymentStatus === "failed") {
    return (
      <main className="max-w-md mx-auto px-5 py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-coral/10 border border-coral/40 flex items-center justify-center mx-auto mb-4 text-2xl">
          ❌
        </div>
        <h1 className="font-extrabold text-lg mb-2">الدفع لم يكتمل</h1>
        <p className="text-dim text-sm">حاول تاني، أو تواصل معنا لو الفلوس اتخصمت.</p>
      </main>
    );
  }

  const hasCodes = order.items.some((i) => i.codes.length > 0);

  return (
    <main className="max-w-md mx-auto px-5 py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-mint/10 border border-mint/40 flex items-center justify-center mx-auto mb-4 text-2xl">
        ✅
      </div>
      <h1 className="font-extrabold text-lg mb-2">تم الدفع بنجاح 🎉</h1>
      <div className="inline-block text-xs text-dim bg-panel border border-line px-4 py-1.5 rounded-full mb-6">
        {orderNumber}
      </div>

      {hasCodes ? (
        <div className="flex flex-col gap-3 text-right">
          {order.items.map((item, idx) => (
            <div key={idx} className="bg-[#150409] border border-coral/40 rounded-2xl p-4">
              <div className="text-xs text-dim mb-2">{item.productName}</div>
              <div className="flex flex-col gap-2">
                {item.codes.map((code, cIdx) => (
                  <div
                    key={cIdx}
                    className="font-black text-base tracking-widest text-coral break-all text-center"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-panel border border-line rounded-2xl p-5 text-sm text-dim">
          طلبك اتأكد والدفع تم بنجاح، وكودك بيتجهز دلوقتي — هيوصلك خلال دقايق، وممكن تتواصل معانا لو استنيت أكتر من كدا.
        </div>
      )}
    </main>
  );
}

export default function OrderStatusPage() {
  return (
    <Suspense fallback={<main className="max-w-md mx-auto px-5 py-16 text-center text-dim">جاري التحميل...</main>}>
      <OrderStatusInner />
    </Suspense>
  );
}
