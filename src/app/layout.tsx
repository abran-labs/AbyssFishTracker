import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Abyss-Fish-Tracker",
  description: "Fish value calculator and pond optimizer for ABYSS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${quicksand.variable} font-sans antialiased select-none relative bg-black text-white`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
