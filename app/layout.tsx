import type { Metadata } from "next";
import localFont from "next/font/local";
import { Caveat, Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const rougeScript = localFont({
  src: "../public/fonts/RougeScript-Regular.ttf",
  variable: "--font-rouge-script",
  display: "swap",
});

const fontDisplay = Caveat({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fontHeading = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "YourVideoLog",
  description: "Record a 5-minute video log entry every evening. Automatically transcribed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${rougeScript.variable} ${fontDisplay.variable} ${fontHeading.variable} ${fontSans.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
