import type { Session } from "next-auth";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { UiPrefsProvider } from "@/components/UiPrefs";
import { getSession } from "@/lib/auth";
import "./globals.css";

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Y",
  description: "New Haven, tonight. One place for the wall, events, campus info, and Fixx.",
  icons: {
    icon: [{ url: "/y-logo.png", type: "image/png" }],
    apple: [{ url: "/y-logo.png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = (await getSession()) as Session | null;
  return (
    <html lang="en" data-theme="dark" className={body.variable} suppressHydrationWarning>
      <body className="min-h-dvh bg-[var(--bg)] font-sans text-[var(--text)] antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('y-theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;}}catch(e){}})();`,
          }}
        />
        <AuthProvider session={session}>
          <UiPrefsProvider>{children}</UiPrefsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
