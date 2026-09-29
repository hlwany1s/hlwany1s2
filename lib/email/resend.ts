import "server-only";

type EmailItem = {
  productName: string;
  codes: string[];
};

type SendCodeEmailInput = {
  to: string;
  customerName?: string | null;
  orderNumber: string;
  items: EmailItem[];
};

export async function sendCodeEmail(input: SendCodeEmailInput): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.error("Resend env vars missing (RESEND_API_KEY / RESEND_FROM_EMAIL) — skipping email send");
    return { sent: false };
  }

  const name = input.customerName?.trim() || "عميلنا العزيز";

  const itemsHtml = input.items
    .map(
      (item) => `
        <div style="margin-bottom:14px;">
          <div style="font-size:13px;color:#374151;margin-bottom:6px;">${item.productName}</div>
          ${item.codes
            .map(
              (code) => `
            <div style="background:#f0f9f6;border:2px dashed #2f5d50;border-radius:10px;padding:12px;text-align:center;margin-bottom:6px;">
              <span style="font-size:20px;font-weight:bold;letter-spacing:1px;color:#1f4438;">${code}</span>
            </div>`
            )
            .join("")}
        </div>`
    )
    .join("");

  const html = `
  <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; background:#f4f6f5; padding:24px;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:#2f5d50;padding:20px 24px;">
        <h1 style="color:#ffffff;margin:0;font-size:20px;">7lwany Store</h1>
      </div>
      <div style="padding:24px;">
        <p style="font-size:15px;color:#111827;margin:0 0 12px;">مرحبًا ${name}،</p>
        <p style="font-size:14px;color:#374151;margin:0 0 16px;">تم تأكيد الدفع لطلبك رقم <strong>${input.orderNumber}</strong> بنجاح. أكوادك جاهزة:</p>
        ${itemsHtml}
        <p style="font-size:13px;color:#6b7280;margin:12px 0 0;">احتفظ بالأكواد دي في مكان آمن. لو حصل أي مشكلة تواصل معانا.</p>
      </div>
    </div>
  </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: `أكواد طلبك جاهزة - طلب ${input.orderNumber}`,
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Resend send failed:", res.status, text);
      return { sent: false };
    }

    return { sent: true };
  } catch (err) {
    console.error("Resend send error:", err);
    return { sent: false };
  }
}
