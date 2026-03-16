import { LoginForm } from "./LoginForm";
import { LoginBrand } from "./LoginBrand";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(160deg,#dbeafe_0%,#eff6ff_30%,#ecfeff_65%,#f8fafc_100%)] px-4 py-8 dark:bg-[linear-gradient(160deg,#020617_0%,#0f172a_48%,#082f49_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-8 h-64 w-64 rounded-full bg-[var(--logo-secondary)]/18 blur-3xl" />
        <div className="absolute right-[-5rem] top-1/3 h-72 w-72 rounded-full bg-[var(--logo-primary)]/15 blur-3xl" />
        <div className="absolute bottom-[-7rem] left-1/3 h-80 w-80 rounded-full bg-[var(--logo-variation)]/12 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur-2xl md:min-h-[670px] md:grid-cols-[1.05fr_0.95fr] dark:border-white/10 dark:bg-slate-900/65">
        <section className="relative hidden p-10 md:flex md:flex-col md:justify-between">
          <div className="space-y-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-300/70 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/15 dark:bg-slate-800/70 dark:text-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Finance Workspace
            </div>
            <div className="space-y-4">
              <h1 className="max-w-md text-4xl font-bold leading-tight text-slate-900 dark:text-white">
                Pilotage financier moderne pour vos services
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Centralisez recettes, charges et rapports dans une interface
                fluide, claire et orientee productivite.
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white/70 p-5 dark:border-white/10 dark:bg-slate-800/55">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Why teams choose Caisse
            </p>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>Multi-service switching in one workspace</li>
              <li>Live monthly reporting and exports</li>
              <li>Role-based access and audit-ready actions</li>
            </ul>
          </div>
        </section>

        <section className="flex items-center justify-center p-5 sm:p-8 md:p-10">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-4 text-center md:text-left">
              <div className="inline-flex items-center justify-center rounded-2xl border border-slate-200/70 bg-white/85 p-3 shadow-none dark:border-white/15 dark:bg-slate-800/75">
                <LoginBrand />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Welcome back
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Sign in to continue managing your operations.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-none sm:p-6 dark:border-white/10 dark:bg-slate-900/70">
              <LoginForm />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
