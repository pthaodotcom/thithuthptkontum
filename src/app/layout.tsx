import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: "Hệ thống Thi thử Trực tuyến cấp Trường THPT",
  description: "Xem ke-hoach-trien-khai-webapp.md o thu muc du-an-thi-thu-thpt/ de biet toan bo pham vi.",
};

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${beVietnamPro.variable} font-sans`}>
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
