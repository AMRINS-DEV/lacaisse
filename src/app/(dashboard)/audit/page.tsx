import { requireRole } from "@/lib/auth/permissions";
import { getAuditLogs } from "@/features/audit/queries";
import { Badge } from "@/components/ui/badge";

const ACTION_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  create: "default",
  update: "secondary",
  delete: "destructive",
};

const ACTION_LABELS: Record<string, string> = {
  create: "Création",
  update: "Modification",
  delete: "Suppression",
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  await requireRole("admin");

  const params = await searchParams;

  const result = await getAuditLogs({
    table_name: params.table_name || undefined,
    action: params.action || undefined,
    date_from: params.date_from || undefined,
    date_to: params.date_to || undefined,
    page: params.page ? parseInt(params.page) : 1,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Journal d&apos;audit</h1>
        <span className="text-sm text-muted-foreground">
          {result.total} entrée(s)
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Utilisateur</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Table</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {result.data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Aucune entrée d&apos;audit
                </td>
              </tr>
            ) : (
              result.data.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString("fr-MA")}
                  </td>
                  <td className="px-4 py-3 font-medium">{log.user_name}</td>
                  <td className="px-4 py-3">
                    <Badge variant={ACTION_VARIANTS[log.action] ?? "outline"}>
                      {ACTION_LABELS[log.action] ?? log.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {log.table_name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {log.record_id ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {log.ip_address ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {result.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {result.page} sur {result.total_pages} — {result.total} entrées
          </span>
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: result.total_pages }, (_, i) => i + 1).map((p) => (
              <a
                key={p}
                href={`/audit?${new URLSearchParams({ ...params, page: String(p) }).toString()}`}
                className={`px-3 py-1 rounded border text-xs ${
                  p === result.page
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                {p}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
