import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";

const grotesk = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
});

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

export const metadata: Metadata = {
  title: "Y",
  description: "New Haven, tonight. One wall for listservs, YaleConnect, and Fizz.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070708",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${bebas.variable}`}>
      <body className="min-h-dvh bg-[#070708] font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
