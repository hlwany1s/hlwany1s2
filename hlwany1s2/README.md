# 7lwany Store — متجر آيتونز

متجر عام (بدون تسجيل دخول) لبيع بطاقات آيتونز مصر، بتسليم أوتوماتيك للكود بعد
تأكيد الدفع عبر بايموب. مبني بـ Next.js + Supabase (نفس مشروعك الحالي).

## 1. تشغيله محليًا

```bash
npm install
cp .env.example .env.local   # واملأ القيم (تحت)
npm run dev
```

الموقع هيفتح على http://localhost:3000

## 2. تطبيق الـ migrations على Supabase

في لوحة تحكم Supabase → SQL Editor، شغّل الملفات دي بالترتيب:

1. `supabase/migrations/0001_init.sql` — الجداول الجديدة (products, orders, order_items, payments, customers, settings)
2. `supabase/migrations/0002_seed_products.sql` — فئات آيتونز الـ12 بأسعارها الحقيقية
3. `supabase/migrations/0003_claim_code_function.sql` — دالة سحب الكود الآمنة

**ملحوظة:** الملفات دي بتضيف جداول جديدة بس، مش بتلمس `itunes_stock` أو
`operations` أو أي جدول من نظام الإدارة الحالي.

## 3. متغيرات البيئة المطلوبة

| المتغير | منين تجيبه |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API (anon/public key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (service_role — سري، سيرفر بس) |
| `PAYMOB_SECRET_KEY` | Paymob → API Keys → Secret key |
| `PAYMOB_PUBLIC_KEY` | Paymob → API Keys → Public key |
| `PAYMOB_INTEGRATION_ID` | Paymob → Payment Integrations (رقم وسيلة الدفع اللي فعّلتها) |
| `PAYMOB_WEBHOOK_SECRET` | Paymob → API Keys → HMAC |
| `NEXT_PUBLIC_SITE_URL` | دومين الموقع بعد ما ينشر (مثلاً `https://hlwany-store.vercel.app`) |

**متحطش القيم دي في أي مكان في الكود أو تبعتها في شات — تتحط في Vercel
(Project → Settings → Environment Variables) بس.**

## 4. النشر على Vercel

1. Vercel → New Project → اختار الـ repo ده
2. أضف كل الـ environment variables اللي فوق
3. Deploy
4. بعد النشر، ارجع حدّث `NEXT_PUBLIC_SITE_URL` بالدومين الحقيقي وأعد الـ deploy

## 5. ضبط webhook بايموب

في لوحة تحكم Paymob → الـ Integration بتاعتك → حط الـ Callback/Webhook URL:

```
https://YOUR-DOMAIN/api/payments/paymob/webhook
```

## هيكل المشروع

```
app/
  page.tsx                          الصفحة الرئيسية (كتالوج المنتجات)
  checkout/page.tsx                 صفحة الدفع (بيانات العميل)
  order/[orderNumber]/page.tsx      صفحة النجاح/الحالة
  api/checkout/route.ts             إنشاء الطلب + طلب الدفع من بايموب
  api/payments/paymob/webhook/route.ts   تأكيد الدفع + سحب الكود
  api/orders/[orderNumber]/route.ts      حالة الطلب (بتوكن وصول)
lib/
  supabase/server.ts / client.ts    عملاء Supabase (سيرفر/متصفح)
  payments/types.ts                 واجهة عامة لأي بوابة دفع
  payments/paymob/index.ts          تنفيذ بايموب
  orders.ts                         رقم الطلب + قراءة السعر الحقيقي
supabase/migrations/                ملفات SQL بالترتيب
```

## لسه ناقص (المرحلة الجاية)

- لوحة تحكم أدمن لإدارة الطلبات والمنتجات (`/admin`)
- إيميلات تأكيد عبر Resend
- SEO metadata كاملة + sitemap
