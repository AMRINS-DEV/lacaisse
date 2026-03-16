import { Skeleton } from "@/components/ui/skeleton";

export function RootLoadingScreen() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(160deg,#dbeafe_0%,#eff6ff_35%,#ecfeff_70%,#f8fafc_100%)] dark:bg-[linear-gradient(160deg,#020617_0%,#0f172a_52%,#082f49_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-[var(--logo-secondary)]/18 blur-3xl" />
        <div className="absolute right-[-4rem] top-1/4 h-72 w-72 rounded-full bg-[var(--logo-primary)]/15 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-1/3 h-80 w-80 rounded-full bg-[var(--logo-variation)]/12 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8">
        <div className="grid w-full gap-5 rounded-3xl border border-slate-200/70 bg-white/82 p-5 backdrop-blur-2xl md:grid-cols-[1.08fr_0.92fr] md:p-8 dark:border-white/10 dark:bg-slate-900/68">
          <section className="hidden md:flex md:flex-col md:justify-between">
            <div className="space-y-6">
              <Skeleton className="h-8 w-40 rounded-full" />
              <div className="space-y-3">
                <Skeleton className="h-12 w-4/5" />
                <Skeleton className="h-12 w-3/5" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200/75 bg-white/72 p-5 dark:border-white/10 dark:bg-slate-800/55">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </section>

          <section className="flex items-center justify-center">
            <div className="w-full max-w-md space-y-6">
              <div className="space-y-4">
                <div className="inline-flex rounded-2xl border border-slate-200/70 bg-white/85 p-3 dark:border-white/15 dark:bg-slate-800/75">
                  <Skeleton className="h-10 w-36" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-8 w-44" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-white/10 dark:bg-slate-900/70">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            </div>
          </section>
        </div>
      </div>

      <span className="sr-only">Chargement de l&apos;application</span>
    </div>
  );
}

export function AuthLoadingShell() {
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
            <Skeleton className="h-8 w-40 rounded-full" />
            <div className="space-y-3">
              <Skeleton className="h-12 w-4/5" />
              <Skeleton className="h-12 w-3/5" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white/70 p-5 dark:border-white/10 dark:bg-slate-800/55">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
          </div>
        </section>

        <section className="flex items-center justify-center p-5 sm:p-8 md:p-10">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-4 text-center md:text-left">
              <div className="inline-flex rounded-2xl border border-slate-200/70 bg-white/85 p-3 dark:border-white/15 dark:bg-slate-800/75">
                <Skeleton className="h-10 w-36" />
              </div>
              <div className="space-y-2">
                <Skeleton className="mx-auto h-8 w-40 md:mx-0" />
                <Skeleton className="mx-auto h-4 w-60 md:mx-0" />
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/90 p-5 sm:p-6 dark:border-white/10 dark:bg-slate-900/70">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </div>
        </section>
      </div>

      <span className="sr-only">Chargement de la page de connexion</span>
    </div>
  );
}

export function DashboardLoadingShell() {
  return (
    <div className="min-h-screen bg-[linear-gradient(165deg,#e2e8f0_0%,#f8fafc_35%,#e0f2fe_100%)] dark:bg-[linear-gradient(165deg,#020617_0%,#0f172a_55%,#111827_100%)]">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 w-full px-4 pt-4 lg:px-6">
          <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,78,238,0.20),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(39,189,251,0.12),transparent_40%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(39,189,251,0.22),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.14),transparent_42%)]" />
            <div className="relative flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl lg:hidden" />
                <Skeleton className="h-10 w-34 rounded-xl" />
                <div className="ml-3 hidden items-center gap-2 lg:flex">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Skeleton key={index} className="h-9 w-24 rounded-xl" />
                  ))}
                </div>
              </div>

              <div className="order-3 w-full md:order-2 md:max-w-md md:flex-1">
                <Skeleton className="h-10 w-full rounded-full" />
              </div>

              <div className="order-2 ml-auto flex items-center gap-2 md:order-3">
                <Skeleton className="h-10 w-40 rounded-full" />
                <Skeleton className="h-10 w-12 rounded-full" />
                <Skeleton className="h-10 w-28 rounded-full" />
              </div>
            </div>
          </div>
        </header>

        <main className="relative flex-1 overflow-auto px-4 py-6 lg:px-6">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_8%_0%,rgba(15,23,42,0.12),transparent_32%),radial-gradient(circle_at_100%_100%,rgba(14,116,144,0.14),transparent_38%)] dark:bg-[radial-gradient(circle_at_12%_0%,rgba(56,189,248,0.20),transparent_30%),radial-gradient(circle_at_100%_100%,rgba(147,51,234,0.18),transparent_35%)]" />
          <div className="mx-auto w-full max-w-[1500px] space-y-6">
            <section className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-80 max-w-[80vw]" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-28 rounded-full" />
                  <Skeleton className="h-8 w-32 rounded-full" />
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-800/70"
                  >
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="mt-3 h-7 w-28" />
                    <Skeleton className="mt-2 h-3 w-16" />
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
              <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
                <Skeleton className="h-5 w-36" />
                <div className="mt-4 space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-11 w-full rounded-xl" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Skeleton className="h-6 w-32 rounded-full" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                  </div>
                  <div className="mt-4 grid gap-3 lg:grid-cols-12">
                    <Skeleton className="h-10 lg:col-span-8" />
                    <Skeleton className="h-10 lg:col-span-2" />
                    <Skeleton className="h-10 lg:col-span-2" />
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
                  <div className="grid grid-cols-7 gap-3 border-b border-slate-200/80 px-4 py-3 dark:border-white/10">
                    {Array.from({ length: 7 }, (_, index) => (
                      <Skeleton key={index} className="h-3 w-full" />
                    ))}
                  </div>
                  <div className="space-y-3 p-4">
                    {Array.from({ length: 6 }, (_, index) => (
                      <div key={index} className="grid grid-cols-7 gap-3">
                        {Array.from({ length: 7 }, (_, cellIndex) => (
                          <Skeleton key={cellIndex} className="h-10 w-full" />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      <span className="sr-only">Chargement de l&apos;espace de travail</span>
    </div>
  );
}
