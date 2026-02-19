import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "♦️ VIP Blackjack",
  description: "Online multiplayer blackjack game.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script id="umami-custom-tracker" strategy="afterInteractive">
          {`
            window.umamiBeforeSend = function (type, payload) {
              if (payload && payload.url && payload.url.startsWith("/game/")) {
                return { ...payload, url: "/game/[id]" };
              }

              return payload;
            };
          `}
        </Script>
        
        <Script
          src="https://analytics.loudsheep.dev/script.js"
          data-website-id="29a5f604-ee9d-49c2-ab9b-d574ee7e9e30"
          data-auto-track="true"
          data-before-send="umamiBeforeSend"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}