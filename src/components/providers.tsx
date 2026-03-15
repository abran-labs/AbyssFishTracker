"use client";

import { ThemeProvider } from "next-themes";
import { ToastProvider } from "@/components/ui/toast-context";
import { AuthProvider } from "@/components/auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" forcedTheme="dark" disableTransitionOnChange>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
