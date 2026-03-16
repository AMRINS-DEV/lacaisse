import { Header } from "@/components/layout/Header";
import { requireAuth } from "@/lib/auth/permissions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="min-h-screen bg-[linear-gradient(165deg,#e2e8f0_0%,#f8fafc_35%,#e0f2fe_100%)] dark:bg-[linear-gradient(165deg,#020617_0%,#0f172a_55%,#111827_100%)]">
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="relative flex-1 overflow-auto px-4 py-6 lg:px-6">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_8%_0%,rgba(15,23,42,0.12),transparent_32%),radial-gradient(circle_at_100%_100%,rgba(14,116,144,0.14),transparent_38%)] dark:bg-[radial-gradient(circle_at_12%_0%,rgba(56,189,248,0.20),transparent_30%),radial-gradient(circle_at_100%_100%,rgba(147,51,234,0.18),transparent_35%)]" />
          <div className="mx-auto w-full max-w-[1500px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
