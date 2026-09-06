export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "cancelled";

export interface CreatePaymentInput {
  orderId: string;
  orderNumber: string;
  amountEGP: number; // المبلغ النهائي المحسوب سيرفر-سايد، مش من الفرونت-إند
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  redirectUrl: string; // فين يرجع العميل بعد الدفع (مش دليل نجاح، مجرد UI)
}

export interface CreatePaymentResult {
  redirectUrl: string; // اللينك اللي هنودي العميل عليه يدفع
  providerReference: string; // معرف العملية عند المزود (عشان نربطها بالـ order)
}

export interface WebhookVerificationResult {
  valid: boolean;
  providerReference: string | null;
  amountEGP: number | null;
  currency: string | null;
  status: PaymentStatus | null;
  orderNumber: string | null;
  raw: unknown;
}

/**
 * أي بوابة دفع جديدة (Fawry, InstaPay, ...) لازم تنفذ نفس الواجهة دي
 * عشان باقي النظام (checkout، webhook route) يفضل زي ما هو من غير تعديل.
 */
export interface PaymentProvider {
  name: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyWebhook(payload: unknown, headers: Record<string, string>): Promise<WebhookVerificationResult>;
}
