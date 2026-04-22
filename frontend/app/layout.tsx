import type { Metadata } from "next";
import localFont from "next/font/local";
import { Instrument_Serif, Inter } from "next/font/google";
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
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-instrument-serif",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-inter",
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
      <body className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${inter.variable} antialiased min-h-screen`} style={{ background: "#07060A", color: "#F5F5F7" }}>
        <Nav />
        <main className="pt-14">{children}</main>
      </body>
    </html>
  );
}
