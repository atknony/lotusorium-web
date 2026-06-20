"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Ana Sayfa", icon: Home, exact: true },
  { href: "/urunler", label: "Ürünler", icon: ShoppingBag },
  { href: "/kategoriler", label: "Kategoriler", icon: LayoutGrid },
  { href: "/ara", label: "Ara", icon: Search },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/90 backdrop-blur-md lg:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  active ? "text-clay" : "text-muted-foreground",
                )}
              >
                <Icon
                  className="h-[22px] w-[22px]"
                  strokeWidth={active ? 2.2 : 1.8}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
