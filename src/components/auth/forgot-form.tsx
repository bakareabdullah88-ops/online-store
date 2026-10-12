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

type Values = z.input<typeof resetSchema>;

export function ForgotForm() {
  const reset = useRequestReset();
  const form = useForm<Values>({ resolver: zodResolver(resetSchema), defaultValues: { email: "" } });
  const onSubmit = form.handleSubmit((v) => reset.mutateAsync(v.email).catch((e) => applyServiceErrors(e, form.setError, ["email"])));
  const sent = reset.isSuccess;

  return (
    <div className="w-full max-w-md">
      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <motion.div key="sent" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={spring.smooth} role="status">
            <span className="flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
              <MailCheck className="size-7" />
            </span>
            <h1 className="mt-6 font-display text-display-md">Check your inbox</h1>
            <p className="mt-3 text-body text-muted">
              If an account exists for <strong className="font-medium text-ink">{form.getValues("email")}</strong>, a reset link is on its way.
            </p>
            <p className="mt-4 rounded-md bg-warning-soft px-4 py-3 text-small text-warning">
              Demo: no email is actually sent. Use “Try the demo” on the login page, or create a new account.
            </p>
            <ButtonLink href="/login" className="mt-8" size="lg">
              Back to log in
            </ButtonLink>
          </motion.div>
        ) : (
          <motion.div key="form" exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
            <h1 className="font-display text-display-md">Reset your password</h1>
            <p className="mt-2 text-body text-muted">Enter the email you signed up with and we&apos;ll send you a reset link.</p>
            <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5">
              <Field label="Email" error={form.formState.errors.email?.message}>
                <Input type="email" autoComplete="email" inputMode="email" {...form.register("email")} />
              </Field>
              <Button type="submit" size="lg" loading={form.formState.isSubmitting}>
                Send reset link
              </Button>
              <Link href="/login" className="text-center text-small text-muted underline-offset-4 hover:text-ink hover:underline">
                Remembered it? Log in
              </Link>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
