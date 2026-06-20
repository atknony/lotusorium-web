"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { FilterableAttribute } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export interface FilterSelection {
  category?: string;
  attrs: Record<string, string>;
}

interface ProductFiltersProps {
  /** When provided, renders selectable category pills (the /urunler page). */
  categories?: { slug: string; name: string }[];
  /** Filterable attribute definitions for the active category. */
  attributes?: FilterableAttribute[];
  /** Current selection parsed from the URL on the server. */
  selected: FilterSelection;
  /** Base path to push updates to (e.g. "/urunler" or "/kategoriler/x"). */
  basePath: string;
  /** Preserve a free-text search term across filter changes. */
  search?: string;
}

function enumOptions(attr: FilterableAttribute): string[] {
  return Array.isArray(attr.options)
    ? (attr.options as unknown[]).map(String)
    : [];
}

export function ProductFilters({
  categories,
  attributes = [],
  selected,
  basePath,
  search,
}: ProductFiltersProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  const facetable = attributes.filter(
    (a) => a.dataType === "enum" || a.dataType === "multi_enum",
  );
  const activeAttrCount = Object.keys(selected.attrs).length;

  function push(next: FilterSelection) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (next.category) params.set("category", next.category);
    for (const [key, value] of Object.entries(next.attrs)) {
      if (value) params.set(`attr[${key}]`, value);
    }
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  }

  function selectCategory(slug?: string) {
    // Changing category invalidates category-specific attribute filters.
    push({ category: slug, attrs: {} });
  }

  function toggleAttr(key: string, value: string) {
    const attrs = { ...selected.attrs };
    if (attrs[key] === value) delete attrs[key];
    else attrs[key] = value;
    push({ category: selected.category, attrs });
  }

  function clearAll() {
    push({ category: selected.category, attrs: {} });
  }

  const facetControls = (
    <div className="space-y-5">
      {facetable.map((attr) => {
        const options = enumOptions(attr);
        return (
          <div key={attr.key}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-luxe text-muted-foreground">
              {attr.label}
              {attr.unit ? ` (${attr.unit})` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {options.map((opt) => {
                const active = selected.attrs[attr.key] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleAttr(attr.key, opt)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-sm capitalize transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:bg-secondary",
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Category pills */}
      {categories && categories.length > 0 && (
        <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <CategoryPill
            label="Tümü"
            active={!selected.category}
            onClick={() => selectCategory(undefined)}
          />
          {categories.map((c) => (
            <CategoryPill
              key={c.slug}
              label={c.name}
              active={selected.category === c.slug}
              onClick={() => selectCategory(c.slug)}
            />
          ))}
        </div>
      )}

      {facetable.length > 0 && (
        <>
          {/* Mobile: trigger a bottom sheet */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtrele
              {activeAttrCount > 0 && (
                <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                  {activeAttrCount}
                </span>
              )}
            </button>
            {activeAttrCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-sm text-muted-foreground underline-offset-2 hover:underline"
              >
                Temizle
              </button>
            )}
          </div>

          {/* Desktop: inline facets */}
          <div className="hidden lg:block">{facetControls}</div>

          {/* Mobile bottom sheet */}
          {sheetOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <button
                type="button"
                aria-label="Kapat"
                onClick={() => setSheetOpen(false)}
                className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
              />
              <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-background p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-medium">Filtrele</h2>
                  <button
                    type="button"
                    onClick={() => setSheetOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {facetControls}
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={clearAll}
                    className="h-11 flex-1 rounded-lg border border-border text-sm font-medium"
                  >
                    Temizle
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheetOpen(false)}
                    className="h-11 flex-1 rounded-lg bg-primary text-sm font-medium text-primary-foreground"
                  >
                    Uygula
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 snap-start rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card text-foreground hover:bg-secondary",
      )}
    >
      {label}
    </button>
  );
}
