import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin", "cyrillic"],
  weight: ["700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});
import { TelegramWebApp } from "@/components/TelegramWebApp";
import { SplashScreen } from "@/components/SplashScreen";
import { AppsProvider } from "@/context/AppsContext";
import { MyAppsProvider } from "@/context/MyAppsContext";
import { ThemeProvider } from "@/context/ThemeContext";

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
    <html lang="ru" className={nunito.variable}>
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="antialiased">
        <TelegramWebApp />
        <ThemeProvider>
          <AppsProvider>
            <MyAppsProvider>
              <SplashScreen>{children}</SplashScreen>
            </MyAppsProvider>
          </AppsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
