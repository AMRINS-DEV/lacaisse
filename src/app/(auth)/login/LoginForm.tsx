"use client";

import { useActionState } from "react";
import { Loader2, LockKeyhole, Mail } from "lucide-react";

import { signIn } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signIn, null);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          Email
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="admin@caisse.ma"
            required
            autoFocus
            className="h-11 rounded-xl border-slate-300/80 bg-white/90 pl-10 shadow-none focus-visible:ring-[var(--logo-secondary)] dark:border-white/15 dark:bg-slate-800/85"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          Password
        </Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            required
            className="h-11 rounded-xl border-slate-300/80 bg-white/90 pl-10 shadow-none focus-visible:ring-[var(--logo-secondary)] dark:border-white/15 dark:bg-slate-800/85"
          />
        </div>
      </div>

      {state?.error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={isPending}
        className="h-11 w-full rounded-xl border border-transparent bg-[linear-gradient(135deg,var(--logo-primary),var(--logo-secondary))] font-semibold text-white transition hover:opacity-95 disabled:opacity-70"
      >
        {isPending ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in...
          </span>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
