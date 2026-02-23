import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SplitApp - Split Expenses with Friends",
    template: "%s | SplitApp",
  },
  description: "Easily split expenses with friends and family. Track who owes what, settle up with Venmo, and keep your shared expenses organized.",
  keywords: ["expense splitting", "bill splitting", "shared expenses", "Venmo", "group expenses"],
  authors: [{ name: "SplitApp" }],
  creator: "SplitApp",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "SplitApp",
    title: "SplitApp - Split Expenses with Friends",
    description: "Easily split expenses with friends and family. Track who owes what and settle up quickly.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SplitApp - Split Expenses with Friends",
    description: "Easily split expenses with friends and family.",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SplitApp",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
