import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Travel Planner — World-Class 3D AI Travel Intelligence",
  description:
    "Plan trips to any of the 196 countries worldwide with 3D spatial intelligence, 2-Opt route optimization, live weather adaptation, budget forecasts, and AI Copilot.",
};

/**
 * Inline script injected BEFORE React hydration to prevent the flash of
 * unstyled content when the user has a saved theme preference.
 * The script reads localStorage and applies the class immediately.
 */
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('tp-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = (t === 'light' || t === 'dark') ? t : (prefersDark ? 'dark' : 'dark');
    document.documentElement.classList.toggle('dark',  theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      {/* Flash-prevention: runs synchronously before paint */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} antialiased min-h-screen flex flex-col justify-between`}>
        <Providers>
          <div className="flex-1 flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
