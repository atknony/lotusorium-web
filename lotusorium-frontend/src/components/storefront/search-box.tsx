"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function SearchBox({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/ara?q=${encodeURIComponent(q)}` : "/ara");
  }

  return (
    <form onSubmit={onSubmit} className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ürün ara…"
        autoComplete="off"
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        className="h-14 w-full rounded-full border border-border bg-card py-3.5 pl-12 pr-24 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/40"
      />
      <button
        type="submit"
        className="absolute right-1.5 top-1/2 h-10 -translate-y-1/2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-clay-soft"
      >
        Ara
      </button>
    </form>
  );
}
