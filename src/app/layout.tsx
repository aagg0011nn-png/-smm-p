import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: process.env.NEXT_PUBLIC_SITE_NAME ?? "SMM Panel",
    template: `%s | ${process.env.NEXT_PUBLIC_SITE_NAME ?? "SMM Panel"}`,
  },
  description: "أفضل لوحة خدمات سوشيال ميديا - متابعين، لايكات، مشاهدات بأسعار تنافسية ودعم فني على مدار الساعة.",
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
  openGraph: {
    type: "website",
    locale: "ar_AR",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
