"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "../form-fields";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader } from "../ui";
import { adminKeys, getAuditLogs } from "@/lib/api/admin";

const LIMIT = 50;

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function statusTone(code: number): string {
  if (code >= 500) return "text-destructive";
  if (code >= 400) return "text-clay";
  return "text-accent";
}

export function AuditLogView() {
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const filters = {
    action: action.trim() || undefined,
    from: from ? `${from}T00:00:00.000Z` : undefined,
    to: to ? `${to}T23:59:59.999Z` : undefined,
    page,
    limit: LIMIT,
  };

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: adminKeys.auditLogs(filters),
    queryFn: () => getAuditLogs(filters),
    placeholderData: keepPreviousData,
  });

  // Reset to page 1 whenever a filter changes.
  function onFilterChange(setter: (v: string) => void) {
    return (v: string) => {
      setPage(1);
      setter(v);
    };
  }

  const meta = data?.meta;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Denetim Kayıtları"
        description="Yönetici işlemlerinin değiştirilemez günlüğü."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Field label="İşlem" htmlFor="action">
          <Input
            id="action"
            placeholder="örn. product.create"
            value={action}
            onChange={(e) => onFilterChange(setAction)(e.target.value)}
          />
        </Field>
        <Field label="Başlangıç" htmlFor="af">
          <Input id="af" type="date" value={from} onChange={(e) => onFilterChange(setFrom)(e.target.value)} />
        </Field>
        <Field label="Bitiş" htmlFor="at">
          <Input id="at" type="date" value={to} onChange={(e) => onFilterChange(setTo)(e.target.value)} />
        </Field>
      </div>

      {isLoading && <LoadingBlock />}
      {isError && <ErrorBlock message={error instanceof Error ? error.message : undefined} />}

      {data && data.data.length === 0 && (
        <EmptyState title="Kayıt bulunamadı" description="Filtrelerle eşleşen denetim kaydı yok." />
      )}

      {data && data.data.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">Zaman</th>
                  <th className="px-4 py-2.5 font-medium">Aktör</th>
                  <th className="px-4 py-2.5 font-medium">İşlem</th>
                  <th className="px-4 py-2.5 font-medium">Yol</th>
                  <th className="px-4 py-2.5 text-right font-medium">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.data.map((log) => (
                  <tr key={log.id} className="bg-card align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {dateFmt.format(new Date(log.createdAt))}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {log.actorEmail ?? <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{log.action}</code>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{log.method}</span> {log.path}
                    </td>
                    <td className={"px-4 py-3 text-right font-medium " + statusTone(log.statusCode)}>
                      {log.statusCode}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {meta.total.toLocaleString("tr-TR")} kayıt · sayfa {meta.page} / {meta.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" aria-hidden />
                  Önceki
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sonraki
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
