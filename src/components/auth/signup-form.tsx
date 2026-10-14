"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input, PasswordInput } from "@/components/ui/input";
import { applyServiceErrors } from "@/lib/form";
import { safeNext } from "@/lib/safe-next";
import { signUpSchema } from "@/services/inputs";
import { useSignUp } from "@/queries/session";
import { GoogleButton } from "./google-button";
import { PasswordStrength } from "./password-strength";

type Values = z.input<typeof signUpSchema>;

export function SignupForm() {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const router = useRouter();
  const signUp = useSignUp();
  const form = useForm<Values>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
    mode: "onTouched",
  });
  const password = useWatch({ control: form.control, name: "password" });

  const onSubmit = form.handleSubmit((v) =>
    signUp.mutateAsync(v).then(
      () => router.push(`/welcome${next ? `?next=${encodeURIComponent(next)}` : ""}`),
      (e) => applyServiceErrors(e, form.setError, ["name", "email", "password"]),
    ),
  );

  return (
    <div className="w-full max-w-md">
      <h1 className="font-display text-display-md">Join your campus market</h1>
      <p className="mt-2 text-body text-muted">
        Already have an account?{" "}
        <Link
          href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-medium text-ink underline underline-offset-4"
        >
          Log in
        </Link>
      </p>
      <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5">
        <GoogleButton next={next} />
        <Field label="Your name" error={form.formState.errors.name?.message}>
          <Input autoComplete="name" placeholder="Ada Okafor" {...form.register("name")} />
        </Field>
        <Field
          label="Email"
          error={form.formState.errors.email?.message}
          hint="We'll never share it with sellers."
        >
          <Input
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@school.edu.ng"
            {...form.register("email")}
          />
        </Field>
        <Field
          label="Password"
          error={form.formState.errors.password?.message}
          hint="8+ characters with letters and a number."
        >
          <PasswordInput autoComplete="new-password" {...form.register("password")} />
        </Field>
        <PasswordStrength value={password ?? ""} />
        <Button type="submit" size="lg" loading={form.formState.isSubmitting}>
          Create account
        </Button>
        <p className="text-small text-muted">
          Everyone starts as a buyer. You can open your own shop any time, no separate account
          needed.
        </p>
      </form>
    </div>
  );
}
