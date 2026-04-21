import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Nav from "@/components/Nav";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "The House — AI Reality Show",
  description: "Where every contestant is a token, and every token is alive.",
  openGraph: {
    title: "The House",
    description: "The first AI-native reality show where the cast is memecoins.",
    siteName: "The House",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-house-bg text-house-text min-h-screen`}>
        <Nav />
        <main className="pt-14">{children}</main>
      </body>
    </html>
  );
}
