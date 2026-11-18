import type { Session } from "next-auth";
import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import { SiteHeader, SiteNav } from "@/components/SiteNav";
import { getSession } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Y",
  description: "The Yale campus feed for posts, events, and campus info.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f7fb",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = (await getSession()) as Session | null;
  return (
    <html lang="en">
      <body className="min-h-dvh font-sans text-ink antialiased">
        <AuthProvider session={session}>
          <SiteHeader />
          <div className="app-frame">
            <SiteNav />
            <div className="min-w-0">{children}</div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
