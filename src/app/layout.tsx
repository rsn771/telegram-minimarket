import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { TelegramWebApp } from "@/components/TelegramWebApp";
import { SplashScreen } from "@/components/SplashScreen";
import { MyAppsProvider } from "@/context/MyAppsContext";

export const metadata: Metadata = {
  title: "Telegram Mini Market",
  description: "App Store для Telegram Mini Apps",
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="antialiased">
        <TelegramWebApp />
        <MyAppsProvider>
          <SplashScreen>{children}</SplashScreen>
        </MyAppsProvider>
      </body>
    </html>
  );
}
