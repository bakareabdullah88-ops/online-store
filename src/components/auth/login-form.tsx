"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input, PasswordInput } from "@/components/ui/input";
import { applyServiceErrors } from "@/lib/form";
import { safeNext } from "@/lib/safe-next";
import { signInSchema } from "@/services/inputs";
import { useSignIn } from "@/queries/session";
import { toast } from "@/stores/toast";
import { GoogleButton, SignInError } from "./google-button";

type Values = z.input<typeof signInSchema>;

export function LoginForm() {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const router = useRouter();
  const signIn = useSignIn();
  const form = useForm<Values>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit((v) =>
    signIn.mutateAsync(v).then(
      (u) => {
        toast.success(`Welcome back, ${u.name.split(" ")[0]}`);
        router.push(
          u.onboarded
            ? (next ?? "/home")
            : `/welcome${next ? `?next=${encodeURIComponent(next)}` : ""}`,
        );
      },
      (e) => applyServiceErrors(e, form.setError, ["email", "password"]),
    ),
  );

  return (
    <div className="w-full max-w-md">
      <h1 className="font-display text-display-md">Welcome back</h1>
      <p className="mt-2 text-body text-muted">
        New here?{" "}
        <Link
          href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-medium text-ink underline underline-offset-4"
        >
          Create an account
        </Link>
      </p>
      <SignInError code={params.get("error")} />
      <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5">
        <GoogleButton next={next} />
        <Field label="Email" error={form.formState.errors.email?.message}>
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
          aside={
            <Link
              href="/forgot-password"
              className="tap-area text-small text-muted underline-offset-4 hover:text-ink hover:underline"
            >
              Forgot password?
            </Link>
          }
        >
          <PasswordInput autoComplete="current-password" {...form.register("password")} />
        </Field>
        <Button type="submit" size="lg" loading={form.formState.isSubmitting}>
          Log in
        </Button>
      </form>
    </div>
  );
}
