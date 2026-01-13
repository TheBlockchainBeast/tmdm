import type { Metadata, Viewport } from "next";
import "./globals.css";
import TonConnectProvider from "@/components/TonConnectProvider";

export const metadata: Metadata = {
  title: "TMD Markets",
  description: "TMD Markets - Memes on TON",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <script
          src="https://telegram.org/js/telegram-web-app.js"
          async
        />
      </head>
      <body className="bg-background-light dark:bg-background-dark min-h-screen text-[#0d131b] dark:text-slate-100 antialiased">
        <TonConnectProvider>
          {children}
        </TonConnectProvider>
      </body>
    </html>
  );
}
