import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sector Rotation Monitor | Market Intelligence",
  description: "Track sector and thematic ETF leadership, rotation and constituent relative strength.",
  openGraph: {
    title: "Sector Rotation Monitor | Market Intelligence",
    description: "Track ETF leadership and the constituent strength beneath each market theme.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Sector Rotation Monitor market dashboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sector Rotation Monitor | Market Intelligence",
    description: "Track ETF leadership and constituent relative strength.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
