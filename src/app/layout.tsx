import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/layout/Header";
import AuthProvider from "@/components/auth/AuthProvider";
import ChatbotWidget from "@/components/ai/ChatbotWidget";
import PageTransition from "@/components/layout/PageTransition";
import Footer from "@/components/layout/Footer";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Global Archaeological Database",
  description: "A free global platform for cataloging archaeological artifacts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a href="#main-content"
           className="sr-only focus:not-sr-only focus:fixed focus:top-4
                      focus:left-4 focus:z-[100] focus:px-4 focus:py-2
                      focus:bg-primary focus:text-white focus:rounded-lg
                      focus:text-sm focus:font-medium focus:shadow-warm-lg">
          Skip to main content
        </a>
        <TooltipProvider>
          <Providers>
            <AuthProvider>
              <Header />
              <PageTransition>{children}</PageTransition>
              <ChatbotWidget />
            </AuthProvider>
          </Providers>
        </TooltipProvider>
        <Footer />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--background)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            },
            className: 'sonner-toast',
          }}
        />
      </body>
    </html>
  );
}
