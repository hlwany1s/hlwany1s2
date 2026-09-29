import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart/CartContext";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SupportButton } from "@/components/SupportButton";

export const metadata: Metadata = {
  title: "7lwany Store — بطاقات آيتونز مصر",
  description: "بطاقات آيتونز مصر بأسعار مميزة، تسليم فوري أوتوماتيك بعد الدفع.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-cairo min-h-screen flex flex-col">
        <CartProvider>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
          <SupportButton />
        </CartProvider>
      </body>
    </html>
  );
}
