"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MousePointerClick, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "../form-fields";
import {
  Badge,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
} from "../ui";
import { adminKeys, getAnalyticsClicks, refreshAnalytics } from "@/lib/api/admin";

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dateFmt.format(d);
}

export function AnalyticsView() {
  const qc = useQueryClient();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Expand the date-only inputs to a full-day ISO range (inclusive `to`).
  const fromIso = from ? `${from}T00:00:00.000Z` : undefined;
  const toIso = to ? `${to}T23:59:59.999Z` : undefined;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: adminKeys.analytics(fromIso, toIso),
    queryFn: () => getAnalyticsClicks(fromIso, toIso),
  });

  const refreshMut = useMutation({
    mutationFn: refreshAnalytics,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["admin", "analytics"] });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
      toast.success(`Veriler güncellendi (${res.refreshed} ürün)`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Güncellenemedi"),
  });

  const totalClicks = (data?.items ?? []).reduce((sum, i) => sum + i.clicks, 0);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Analitik"
        description="Trendyol yönlendirme tıklamaları."
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => refreshMut.mutate()}
          disabled={refreshMut.isPending}
        >
          <RefreshCw
            className={"size-4" + (refreshMut.isPending ? " animate-spin" : "")}
            aria-hidden
          />
          Sayaçları Yenile
        </Button>
      </PageHeader>

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <Field label="Başlangıç" htmlFor="from" className="w-40">
          <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="Bitiş" htmlFor="to" className="w-40">
          <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
        {(from || to) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setFrom("");
              setTo("");
            }}
          >
            Temizle
          </Button>
        )}
      </div>

      {isLoading && <LoadingBlock />}
      {isError && <ErrorBlock message={error instanceof Error ? error.message : undefined} />}

      {data && (
        <>
          <div className="mb-5 inline-flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3">
            <MousePointerClick className="size-5 text-primary" aria-hidden />
            <div>
              <p className="font-serif text-2xl leading-none">
                {totalClicks.toLocaleString("tr-TR")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {from || to ? "Seçilen aralıkta tıklama" : "Tüm zamanlar tıklama"}
              </p>
            </div>
          </div>

          {data.items.length === 0 ? (
            <EmptyState
              title="Tıklama verisi yok"
              description="Seçilen aralıkta kayıtlı yönlendirme tıklaması bulunmuyor."
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Ürün</th>
                    <th className="px-4 py-2.5 text-right font-medium">Tıklama</th>
                    <th className="hidden px-4 py-2.5 font-medium sm:table-cell">
                      Son Tıklama
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map((item) => (
                    <tr key={item.productId} className="bg-card">
                      <td className="px-4 py-3">
                        <span className="flex flex-wrap items-center gap-2">
                          {item.name ?? "(bilinmeyen ürün)"}
                          {item.isDeleted && <Badge tone="archived">Silinmiş</Badge>}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {item.clicks.toLocaleString("tr-TR")}
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                        {formatDate(item.lastClickedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
