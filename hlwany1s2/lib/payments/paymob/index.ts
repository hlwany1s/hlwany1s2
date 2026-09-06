import crypto from "crypto";
import type {
  PaymentProvider,
  CreatePaymentInput,
  CreatePaymentResult,
  WebhookVerificationResult,
} from "../types";

/**
 * ترتيب الحقول ده محدد من بايموب نفسها لحساب الـ HMAC بتاع الـ webhook
 * الخاص بـ "Transaction Processed Callback". لو بايموب غيّرت الترتيب ده
 * في التوثيق بتاعها مستقبلاً، لازم يتحدث هنا بالظبط بنفس الترتيب الجديد.
 * المرجع: Paymob Accept docs → HMAC Calculation
 */
const HMAC_FIELDS_ORDER = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order.id",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success",
] as const;

function getByPath(obj: any, path: string): string {
  const value = path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
  return value === undefined || value === null ? "" : String(value);
}

function calculateHmac(txn: any, hmacSecret: string): string {
  const concatenated = HMAC_FIELDS_ORDER.map((field) => getByPath(txn, field)).join("");
  return crypto.createHmac("sha512", hmacSecret).update(concatenated).digest("hex");
}

async function getAuthToken(): Promise<{ mode: "intention"; secretKey: string }> {
  const secretKey = process.env.PAYMOB_SECRET_KEY;
  if (!secretKey) throw new Error("PAYMOB_SECRET_KEY is missing");
  return { mode: "intention", secretKey };
}

export const paymobProvider: PaymentProvider = {
  name: "paymob",

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const { secretKey } = await getAuthToken();
    const integrationId = process.env.PAYMOB_INTEGRATION_ID;
    const publicKey = process.env.PAYMOB_PUBLIC_KEY;

    if (!integrationId || !publicKey) {
      throw new Error("PAYMOB_INTEGRATION_ID / PAYMOB_PUBLIC_KEY missing from environment");
    }

    const amountCents = Math.round(input.amountEGP * 100);

    const res = await fetch("https://accept.paymob.com/v1/intention/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${secretKey}`,
      },
      body: JSON.stringify({
        amount: amountCents,
        currency: "EGP",
        payment_methods: [Number(integrationId)],
        items: [
          {
            name: `طلب ${input.orderNumber}`,
            amount: amountCents,
            quantity: 1,
          },
        ],
        billing_data: {
          first_name: input.customerName || "عميل",
          last_name: "-",
          phone_number: input.customerPhone,
          email: input.customerEmail || "customer@7lwany.store",
          // باقي حقول العنوان مطلوبة شكليًا من بايموب لمنتجات رقمية، بنبعتها NA
          street: "NA",
          building: "NA",
          floor: "NA",
          apartment: "NA",
          city: "NA",
          country: "EG",
        },
        extras: {
          order_number: input.orderNumber,
          order_id: input.orderId,
        },
        notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/paymob/webhook`,
        redirection_url: input.redirectUrl,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Paymob intention request failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    const clientSecret = data.client_secret;

    return {
      redirectUrl: `https://accept.paymob.com/unifiedcheckout/?publicKey=${publicKey}&clientSecret=${clientSecret}`,
      providerReference: String(data.id ?? clientSecret),
    };
  },

  async verifyWebhook(payload: unknown, _headers: Record<string, string>): Promise<WebhookVerificationResult> {
    const hmacSecret = process.env.PAYMOB_WEBHOOK_SECRET;
    if (!hmacSecret) throw new Error("PAYMOB_WEBHOOK_SECRET is missing");

    const body = payload as any;
    const txn = body?.obj;
    const receivedHmac = body?.hmac as string | undefined;

    if (!txn || !receivedHmac) {
      return { valid: false, providerReference: null, amountEGP: null, currency: null, status: null, orderNumber: null, raw: payload };
    }

    const computedHmac = calculateHmac(txn, hmacSecret);
    const valid = crypto.timingSafeEqual(Buffer.from(computedHmac), Buffer.from(receivedHmac));

    if (!valid) {
      return { valid: false, providerReference: null, amountEGP: null, currency: null, status: null, orderNumber: null, raw: payload };
    }

    const success = txn.success === true || txn.success === "true";
    const orderNumber = txn?.order?.extras?.order_number ?? txn?.payment_key_claims?.extra?.order_number ?? null;

    return {
      valid: true,
      providerReference: String(txn.id),
      amountEGP: Number(txn.amount_cents) / 100,
      currency: txn.currency ?? "EGP",
      status: success ? "paid" : "failed",
      orderNumber,
      raw: payload,
    };
  },
};
