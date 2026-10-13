import { KeyRound, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

const steps = [
  {
    icon: UserPlus,
    title: "Ask for a login",
    body: "Someone running Kiosk on your campus creates one for you.",
  },
  {
    icon: KeyRound,
    title: "Get your email and password",
    body: "They send them to you privately.",
  },
  { icon: LogIn, title: "Log in", body: "Pick your campus and you're in, buying or selling." },
];

/** Sign-up is closed while Kiosk is invite-only. */
export function InviteOnly() {
  return (
    <div className="w-full max-w-md">
      <span className="grid size-14 place-items-center rounded-2xl bg-[linear-gradient(140deg,var(--chart-blue),var(--chart-violet))] text-white shadow-lg">
        <ShieldCheck className="size-7" />
      </span>
      <h1 className="mt-6 text-[30px] leading-tight font-bold tracking-[-0.03em]">
        Kiosk is invite-only for now
      </h1>
      <p className="mt-2 text-body text-muted">
        We&apos;re opening campus by campus, so every account is created by the Kiosk team.
      </p>
      <ol className="mt-8 flex flex-col gap-3">
        {steps.map((s, i) => (
          <li key={s.title} className="card flex items-start gap-3.5 p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
              <s.icon className="size-5" />
            </span>
            <span>
              <span className="block text-[15px] font-semibold">
                {i + 1}. {s.title}
              </span>
              <span className="block text-small text-muted">{s.body}</span>
            </span>
          </li>
        ))}
      </ol>
      <ButtonLink
        href="/login"
        size="lg"
        className="mt-8 w-full"
        leadingIcon={<LogIn className="size-4" />}
      >
        I have a login
      </ButtonLink>
    </div>
  );
}
