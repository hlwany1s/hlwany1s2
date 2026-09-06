"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type OrderState = {
  paymentStatus: string;
  orderStatus: string;
  total: number;
  itunesCode: string | null;
} | null;

export default function OrderStatusPage() {
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

      // لسه مستنيين تأكيد الـ webhook — نكمل نسأل كل 3 ثواني
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

  // paid
  return (
    <main className="max-w-md mx-auto px-5 py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-mint/10 border border-mint/40 flex items-center justify-center mx-auto mb-4 text-2xl">
        ✅
      </div>
      <h1 className="font-extrabold text-lg mb-2">تم الدفع بنجاح 🎉</h1>
      <div className="inline-block text-xs text-dim bg-panel border border-line px-4 py-1.5 rounded-full mb-6">
        {orderNumber}
      </div>

      {order.itunesCode ? (
        <div className="bg-[#150409] border border-coral/40 rounded-2xl p-5">
          <div className="text-xs text-dim mb-2">كودك جاهز</div>
          <div className="font-black text-lg tracking-widest text-coral break-all">{order.itunesCode}</div>
        </div>
      ) : (
        <div className="bg-panel border border-line rounded-2xl p-5 text-sm text-dim">
          طلبك اتأكد والدفع تم بنجاح، وكودك بيتجهز دلوقتي — هيوصلك خلال دقايق، وممكن تتواصل معانا لو استنيت أكتر من كدا.
        </div>
      )}
    </main>
  );
}
