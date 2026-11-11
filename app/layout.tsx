import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SRM Canteen Ordering Agent",
  description: "CampusBite plain-English ordering for the SRM canteen",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
