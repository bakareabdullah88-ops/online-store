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
        <h1 className="mt-6 font-display text-display-md">Reset your password</h1>
        <p className="mt-3 text-body text-muted">
          Password reset by email isn&apos;t switched on yet. It arrives together with account email
          verification.
        </p>
        <p className="mt-3 text-body text-muted">
          Until then, if you can&apos;t log in, ask the person who gave you your login for a new
          password.
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
