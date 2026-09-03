import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { Toaster } from 'react-hot-toast'
import { Analytics } from "@vercel/analytics/react";

// Vercel Web Analytics enabled
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WebPay - Secure Authentication",
  description: "A secure authentication system with Google and Email sign-in",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Analytics />
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
        <Toaster />
      </body>
    </html>
  );
}
