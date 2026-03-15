"use client";

import * as React from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/auth-context";

const EmailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const OtpSchema = z.object({
  code: z.string().min(6, "Please enter the full 6-digit code"),
});

type Step = "email" | "otp";

export function LoginModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = React.useState<Step>("email");
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const { refresh } = useAuth();

  const emailForm = useForm<z.infer<typeof EmailSchema>>({
    resolver: zodResolver(EmailSchema),
    defaultValues: { email: "" },
  });

  const otpForm = useForm<z.infer<typeof OtpSchema>>({
    resolver: zodResolver(OtpSchema),
    defaultValues: { code: "" },
  });

  const handleSendCode: SubmitHandler<z.infer<typeof EmailSchema>> = async (
    data
  ) => {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Failed to send code");
        return;
      }
      setEmail(data.email);
      setStep("otp");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode: SubmitHandler<z.infer<typeof OtpSchema>> = async (
    data
  ) => {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: data.code }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Invalid code");
        return;
      }
      await refresh();
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // Auto-submit when all 6 digits are entered
  const codeValue = otpForm.watch("code");
  React.useEffect(() => {
    if (codeValue?.length === 6 && !sending) {
      otpForm.handleSubmit(handleVerifyCode)();
    }
  }, [codeValue]);

  const handleResendCode = async () => {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const result = await res.json();
        setError(result.error || "Failed to resend code");
        return;
      }
      otpForm.reset();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card className="w-full max-w-[440px] shadow-none flex flex-col gap-6 p-5 md:p-8 border-border/60">
        {step === "email" ? (
          <>
            <CardHeader className="flex flex-col items-center gap-2 p-0">
              <div className="relative flex size-16 shrink-0 items-center justify-center rounded-full before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-b before:from-neutral-500 before:to-transparent before:opacity-10">
                <div className="relative z-10 flex size-12 items-center justify-center rounded-full bg-muted/80 shadow-xs ring-1 ring-inset ring-border">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    className="text-muted-foreground/80"
                  >
                    <path
                      fill="currentColor"
                      d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 4l-8 5l-8-5V6l8 5l8-5z"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex flex-col space-y-1.5 text-center">
                <CardTitle className="text-lg font-medium">Log in</CardTitle>
                <CardDescription className="tracking-[-0.006em]">
                  Enter your email and we&apos;ll send you a code.
                </CardDescription>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="p-0">
              <Form {...emailForm}>
                <form
                  className="flex flex-col gap-4"
                  onSubmit={emailForm.handleSubmit(handleSendCode)}
                >
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <input
                            type="email"
                            placeholder="you@example.com"
                            autoFocus
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}

                  <Button type="submit" className="w-full" disabled={sending}>
                    {sending ? "Sending..." : "Send Code"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="flex flex-col items-center gap-2 p-0">
              <div className="relative flex size-16 shrink-0 items-center justify-center rounded-full before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-b before:from-neutral-500 before:to-transparent before:opacity-10">
                <div className="relative z-10 flex size-12 items-center justify-center rounded-full bg-muted/80 shadow-xs ring-1 ring-inset ring-border">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    className="text-muted-foreground/80"
                  >
                    <path
                      fill="currentColor"
                      d="M13 19c0-3.31 2.69-6 6-6c1.1 0 2.12.3 3 .81V6a2 2 0 0 0-2-2H4c-1.11 0-2 .89-2 2v12a2 2 0 0 0 2 2h9.09c-.05-.33-.09-.66-.09-1M4 8V6l8 5l8-5v2l-8 5zm13.75 14.16l-2.75-3L16.16 18l1.59 1.59L21.34 16l1.16 1.41z"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex flex-col space-y-1.5 text-center">
                <CardTitle className="text-lg font-medium">
                  Enter your code
                </CardTitle>
                <CardDescription className="tracking-[-0.006em]">
                  We sent a 6-digit code to{" "}
                  <span className="text-foreground font-medium">{email}</span>
                </CardDescription>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="p-0">
              <Form {...otpForm}>
                <form
                  className="flex flex-col"
                  onSubmit={otpForm.handleSubmit(handleVerifyCode)}
                >
                  <div className="space-y-6">
                    <FormField
                      control={otpForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem className="gap-4">
                          <FormLabel className="sr-only">Code</FormLabel>
                          <FormControl>
                            <InputOTP maxLength={6} autoFocus {...field}>
                              <InputOTPGroup className="gap-3 w-full justify-center">
                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                  <InputOTPSlot
                                    key={i}
                                    index={i}
                                    className="size-12 text-lg border rounded-md"
                                  />
                                ))}
                              </InputOTPGroup>
                            </InputOTP>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={sending}
                    >
                      {sending ? "Verifying..." : "Verify"}
                    </Button>
                  </div>

                  <Separator className="mt-6 mb-2.5" />

                  <div className="text-sm flex items-center gap-1">
                    <p className="text-muted-foreground">Didn&apos;t get the code?</p>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="p-0 underline"
                      onClick={handleResendCode}
                      disabled={sending}
                    >
                      Resend
                    </Button>
                    <span className="text-muted-foreground mx-1">or</span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="p-0 underline"
                      onClick={() => {
                        setStep("email");
                        setError("");
                        otpForm.reset();
                      }}
                    >
                      Change email
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
