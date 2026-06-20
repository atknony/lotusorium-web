"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  FolderTree,
  MousePointerClick,
  Package,
  Star,
} from "lucide-react";
import { bffFetch } from "@/lib/api/bff-client";
import type { DashboardSummary } from "@/lib/api/types";

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dateFmt.format(d);
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number;
  hint?: string;
  icon: typeof Package;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </div>
      <p className="mt-2 font-serif text-3xl">{value.toLocaleString("tr-TR")}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="border-b border-border px-4 py-3 sm:px-5">
        <h2 className="text-sm font-medium">{title}</h2>
      </header>
      <div className="px-4 py-2 sm:px-5">{children}</div>
    </section>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-xl border border-border bg-secondary/40"
        />
      ))}
    </div>
  );
}

export function DashboardOverview() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => bffFetch<DashboardSummary>("/api/bff/admin/dashboard"),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl">Genel Bakış</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mağaza ve tıklanma istatistiklerinin özeti.
        </p>
      </div>

      {isLoading && <SkeletonGrid />}

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Panel verileri yüklenemedi
          {error instanceof Error ? `: ${error.message}` : "."}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              label="Ürünler"
              value={data.totals.products}
              hint={`${data.totals.publishedProducts} yayında`}
              icon={Package}
            />
            <StatCard
              label="Kategoriler"
              value={data.totals.categories}
              icon={FolderTree}
            />
            <StatCard
              label="Öne Çıkanlar"
              value={data.totals.featuredProducts}
              icon={Star}
            />
            <StatCard
              label="Toplam Tıklama"
              value={data.totals.totalClicks}
              hint={`${data.totals.clicks7d} son 7 gün · ${data.totals.clicks30d} son 30 gün`}
              icon={MousePointerClick}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="En Çok Tıklanan Ürünler">
              {data.topProducts.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Henüz tıklama verisi yok.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.topProducts.map((p) => (
                    <li
                      key={p.productId}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <span className="min-w-0 truncate text-sm">{p.name}</span>
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-primary">
                        <BarChart3 className="size-3.5" aria-hidden />
                        {p.totalClicks.toLocaleString("tr-TR")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Son Tıklamalar">
              {data.recentClicks.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Henüz tıklama yok.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.recentClicks.map((c, i) => (
                    <li
                      key={`${c.productId}-${i}`}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <span className="min-w-0 truncate text-sm">{c.name}</span>
                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(c.clickedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
