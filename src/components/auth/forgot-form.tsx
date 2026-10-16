"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { MailCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { spring } from "@/design/motion";
import { applyServiceErrors } from "@/lib/form";
import { resetSchema } from "@/services/inputs";
import { useRequestReset } from "@/queries/session";
import { features } from "@/config/features";
import { GoogleButton } from "./google-button";

type Values = z.input<typeof resetSchema>;

export function ForgotForm() {
  const reset = useRequestReset();
  const form = useForm<Values>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: "" },
  });
  const onSubmit = form.handleSubmit((v) =>
    reset.mutateAsync(v.email).catch((e) => applyServiceErrors(e, form.setError, ["email"])),
  );
  const sent = reset.isSuccess;

  if (!features.passwordResetEmail) {
    return (
      <div className="w-full max-w-md">
        <span className="flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent">
          <MailCheck className="size-7" />
        </span>
        <h1 className="mt-6 font-display text-display-md">Forgot your password?</h1>
        <p className="mt-3 text-body text-muted">
          No stress. If your Kamplug account uses a Gmail or Google address, continue with Google
          below and you&apos;re straight back in. No password needed.
        </p>
        <div className="mt-6">
          <GoogleButton next="/home" />
        </div>
        <p className="mt-6 text-small text-muted">
          Reset links by email are coming soon. Until then, Google is the quickest way back in.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          <ButtonLink href="/login" size="lg">
            Back to log in
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.smooth}
            role="status"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
              <MailCheck className="size-7" />
            </span>
            <h1 className="mt-6 font-display text-display-md">Check your inbox</h1>
            <p className="mt-3 text-body text-muted">
              If an account exists for{" "}
              <strong className="font-medium text-ink">{form.getValues("email")}</strong>, a reset
              link is on its way.
            </p>
            <ButtonLink href="/login" className="mt-8" size="lg">
              Back to log in
            </ButtonLink>
          </motion.div>
        ) : (
          <motion.div key="form" exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
            <h1 className="font-display text-display-md">Reset your password</h1>
            <p className="mt-2 text-body text-muted">
              Enter the email you signed up with and we&apos;ll send you a reset link.
            </p>
            <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5">
              <Field label="Email" error={form.formState.errors.email?.message}>
                <Input
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  {...form.register("email")}
                />
              </Field>
              <Button type="submit" size="lg" loading={form.formState.isSubmitting}>
                Send reset link
              </Button>
              <Link
                href="/login"
                className="text-center text-small text-muted underline-offset-4 hover:text-ink hover:underline"
              >
                Remembered it? Log in
              </Link>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
