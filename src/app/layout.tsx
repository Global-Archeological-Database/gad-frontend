import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/lib/providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/layout/Header";
import AuthProvider from "@/components/auth/AuthProvider";
import ChatbotWidget from "@/components/ai/ChatbotWidget";
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
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          <Providers>
            <AuthProvider>
              <Header />
              {children}
              <ChatbotWidget />
            </AuthProvider>
          </Providers>
        </TooltipProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#FDFAF5',
              border: '1px solid #D4C5A9',
              color: '#1A1208',
            },
          }}
        />
      </body>
    </html>
  );
}
