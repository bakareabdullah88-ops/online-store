"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, Crown, KeyRound, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { NavPageHeader } from "@/components/app/nav-header";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/overlay";
import { accessList, userIdFor, type AccessEntry, type Role } from "@/config/access";
import { features } from "@/config/features";
import { spring } from "@/design/motion";
import { emailHash, generatePassword, normaliseEmail } from "@/lib/access-hash";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { hashPassword, randomSalt } from "@/lib/hash";
import { useSession } from "@/queries/session";
import { toast } from "@/stores/toast";

type Created = { name: string; email: string; password: string; entry: AccessEntry };

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        void navigator.clipboard.writeText(text).then(
          () => {
            setDone(true);
            window.setTimeout(() => setDone(false), 1500);
          },
          () => toast.error("Couldn't copy. Select the text and copy it instead."),
        )
      }
      className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-surface px-3 text-[13px] font-medium ring-1 ring-line transition-colors hover:ring-line-strong"
    >
      {done ? <Check className="size-4 text-success" /> : <Copy className="size-4 text-muted" />}
      {done ? "Copied" : label}
    </button>
  );
}

function entryCode(e: AccessEntry) {
  return `  {\n${Object.entries(e)
    .map(([k, v]) => `    ${k}: ${JSON.stringify(v)},`)
    .join("\n")}\n  },`;
}

/** Admins create logins for people they approve. */
export function MembersView() {
  const { user } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);

  if (user && user.role !== "admin") {
    return (
      <>
        <NavPageHeader title="Members" description="Only admins can create logins." />
        <p className="card p-6 text-small text-muted">Ask an admin if someone needs access.</p>
      </>
    );
  }

  const create = async () => {
    setError(null);
    const n = name.trim();
    const e = normaliseEmail(email);
    if (n.length < 2) return setError("Enter their name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return setError("Enter a valid email");
    setBusy(true);
    try {
      const hash = await emailHash(e);
      if (accessList.some((x) => x.emailHash === hash)) {
        setError("This email already has a login");
        return;
      }
      const password = generatePassword();
      const salt = randomSalt();
      const bytes = new Uint8Array(6);
      crypto.getRandomValues(bytes);
      const entry: AccessEntry = {
        id: Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(""),
        name: n,
        role,
        emailHash: hash,
        salt,
        passwordHash: await hashPassword(password, salt),
        addedAt: new Date().toISOString().slice(0, 10),
      };
      setCreated({ name: n, email: e, password, entry });
      setName("");
      setEmail("");
      setRole("member");
    } finally {
      setBusy(false);
    }
  };

  const site = typeof window !== "undefined" ? window.location.origin : "";
  const message = created
    ? `Hi ${created.name.split(" ")[0]}, here's your Kiosk login.\n\n${site}/login\nEmail: ${created.email}\nPassword: ${created.password}\n\nPlease keep it private.`
    : "";

  return (
    <>
      <NavPageHeader
        title="Members"
        description={`${accessList.length} ${accessList.length === 1 ? "person has" : "people have"} a login. Only people on this list can sign in.`}
      />
      {!features.inviteOnly && (
        <p className="card mb-4 p-4 text-small text-warning">
          Sign-up is open on this build (NEXT_PUBLIC_OPEN_SIGNUP=1), so this list isn&apos;t
          enforced here.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="card p-5 md:p-6" aria-labelledby="new-login">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
              <UserPlus className="size-5" />
            </span>
            <div>
              <h2 id="new-login" className="text-[17px] font-semibold">
                Create a login
              </h2>
              <p className="text-small text-muted">
                We make a strong password for you to send them.
              </p>
            </div>
          </div>
          <form
            className="mt-5 flex flex-col gap-4"
            onSubmit={(ev) => {
              ev.preventDefault();
              void create();
            }}
          >
            <Field label="Their name">
              <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
            </Field>
            <Field label="Their email" error={error ?? undefined}>
              <Input
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
              />
            </Field>
            <Field label="Access">
              <Select<Role>
                label="Access"
                value={role}
                onValueChange={setRole}
                options={[
                  { value: "member", label: "Member: buy and sell" },
                  { value: "admin", label: "Admin: can also create logins" },
                ]}
              />
            </Field>
            <Button
              type="submit"
              loading={busy}
              leadingIcon={<KeyRound className="size-4" />}
              className="self-start"
            >
              Create login
            </Button>
          </form>
        </section>

        <AnimatePresence mode="wait">
          {created ? (
            <motion.section
              key={created.entry.id}
              initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0 }}
              transition={spring.smooth}
              className="card p-5 md:p-6"
              aria-labelledby="new-login-ready"
            >
              <h2
                id="new-login-ready"
                className="flex items-center gap-2 text-[17px] font-semibold"
              >
                <ShieldCheck className="size-5 text-success" /> Login for {created.name}
              </h2>
              <dl className="mt-4 grid grid-cols-[90px_1fr] gap-y-2 rounded-2xl bg-surface-2 p-4 text-[14px] ring-1 ring-line">
                <dt className="text-muted">Email</dt>
                <dd className="font-medium break-all">{created.email}</dd>
                <dt className="text-muted">Password</dt>
                <dd className="font-mono font-semibold tracking-wide">{created.password}</dd>
              </dl>
              <div className="mt-3 flex flex-wrap gap-2">
                <CopyButton text={message} label="Copy message to send" />
                <CopyButton text={created.password} label="Copy password" />
              </div>
              <h3 className="mt-6 text-[14px] font-semibold">Last step: switch it on</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-small text-muted">
                <li>Copy the entry below.</li>
                <li>
                  Send it to Claude, or paste it into{" "}
                  <code className="font-mono text-ink">src/config/access.ts</code> on GitHub, inside{" "}
                  <code className="font-mono text-ink">accessList</code>.
                </li>
                <li>The login works once the site redeploys, about a minute later.</li>
              </ol>
              <pre className="mt-3 max-h-48 overflow-auto rounded-2xl bg-[#0f1115] p-4 font-mono text-[11.5px] leading-relaxed text-[#d7dbe3]">
                {entryCode(created.entry)}
              </pre>
              <div className="mt-3">
                <CopyButton text={entryCode(created.entry)} label="Copy entry" />
              </div>
              <p className="mt-4 text-[12px] text-muted">
                This password is shown once. Only its hash goes into the code.
              </p>
            </motion.section>
          ) : (
            <motion.section
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card p-5 md:p-6"
              aria-labelledby="members-title"
            >
              <h2 id="members-title" className="flex items-center gap-2 text-[17px] font-semibold">
                <Users className="size-5 text-chart-violet" /> People with a login
              </h2>
              <ul className="mt-4 divide-y divide-line">
                {accessList.map((m) => {
                  const you = user?.id === userIdFor(m);
                  return (
                    <li key={m.id} className="flex items-center gap-3 py-3">
                      <span
                        className={cn(
                          "grid size-9 place-items-center rounded-full text-[12px] font-semibold",
                          m.role === "admin"
                            ? "bg-[#fff1df] text-[#b45309]"
                            : "bg-accent-soft text-accent",
                        )}
                      >
                        {m.name
                          .split(" ")
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium">
                          {m.name} {you && <span className="text-muted">(you)</span>}
                        </span>
                        <span className="block text-[12px] text-muted">
                          Added {formatDate(m.addedAt)}
                        </span>
                      </span>
                      {m.role === "admin" ? (
                        <span className="flex items-center gap-1 rounded-full bg-[#fff1df] px-2.5 py-1 text-[12px] font-medium text-[#b45309] dark:bg-[#3a2410] dark:text-[#ffb36b]">
                          <Crown className="size-3.5" /> Admin
                        </span>
                      ) : (
                        <span className="rounded-full bg-ink/[0.05] px-2.5 py-1 text-[12px] font-medium text-ink-2">
                          Member
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-[12px] text-muted">
                To remove someone, ask Claude to take them off the list in src/config/access.ts.
              </p>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
      {created && (
        <Button variant="secondary" className="mt-4" onClick={() => setCreated(null)}>
          Done, show the member list
        </Button>
      )}
    </>
  );
}
