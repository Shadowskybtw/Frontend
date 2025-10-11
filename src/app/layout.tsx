import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Telegram WebApp",
  description: "Telegram WebApp для управления акциями и кальянами",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Инициализация Telegram WebApp после загрузки
              window.addEventListener('DOMContentLoaded', function() {
                if (window.Telegram?.WebApp) {
                  console.log('🚀 Initializing Telegram WebApp');
                  window.Telegram.WebApp.ready();
                  window.Telegram.WebApp.expand();
                  console.log('✅ Telegram WebApp initialized');
                } else {
                  console.log('❌ Telegram WebApp not available');
                }
              });
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
