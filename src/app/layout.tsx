import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import { headers } from "next/headers";
import { Providers } from "@/components/providers";
import { BannedScreen } from "@/components/banned-screen";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Abyss-Fish-Tracker",
  description: "Fish value calculator and pond optimizer for ABYSS",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [headersList, session] = await Promise.all([headers(), getSession()]);

  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
    headersList.get("x-real-ip") ||
    null;

  const [ipRecord, userRecord] = await Promise.all([
    ip ? prisma.bannedIp.findUnique({ where: { ip } }) : null,
    session ? prisma.user.findUnique({ where: { id: session.userId }, select: { banned: true } }) : null,
  ]);

  const isBanned = !!ipRecord || (userRecord?.banned ?? false);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${quicksand.variable} font-sans antialiased select-none relative bg-black text-white`}
        suppressHydrationWarning
      >
        {isBanned ? <BannedScreen /> : <Providers>{children}</Providers>}
      </body>
    </html>
  );
}
