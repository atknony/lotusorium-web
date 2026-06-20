"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminRole } from "@/lib/api/types";
import { ADMIN_NAV } from "./nav-config";
import { LogoutButton } from "./logout-button";

interface AdminShellProps {
  user: { email: string; role: AdminRole };
  children: React.ReactNode;
}

const ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: "Süper Yönetici",
  editor: "Editör",
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/yonetim") return pathname === "/yonetim";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  role,
  pathname,
  onNavigate,
}: {
  role: AdminRole;
  pathname: string;
  onNavigate?: () => void;
}) {
  const items = ADMIN_NAV.filter(
    (item) => !item.superAdminOnly || role === "super_admin",
  );

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/yonetim" className="flex flex-col leading-none">
      <span className="font-serif text-xl tracking-tight">Lotusorium</span>
      <span className="text-[0.7rem] uppercase tracking-luxe text-muted-foreground">
        Yönetim
      </span>
    </Link>
  );
}

function UserBadge({ user }: { user: AdminShellProps["user"] }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-medium">{user.email}</p>
      <p className="text-xs text-muted-foreground">{ROLE_LABEL[user.role]}</p>
    </div>
  );
}

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-card px-4 py-6 lg:flex">
        <div className="px-2">
          <Brand />
        </div>
        <div className="mt-8 flex-1 overflow-y-auto">
          <NavLinks role={user.role} pathname={pathname} />
        </div>
        <div className="mt-4 border-t border-border pt-4">
          <div className="px-2 pb-3">
            <UserBadge user={user} />
          </div>
          <LogoutButton className="w-full justify-start" />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Menüyü aç"
          className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-secondary"
        >
          <Menu className="size-5" aria-hidden />
        </button>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Menüyü kapat"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-foreground/40"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-card px-4 py-6 shadow-xl">
            <div className="flex items-center justify-between px-2">
              <Brand />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Menüyü kapat"
                className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-secondary"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="mt-8 flex-1 overflow-y-auto">
              <NavLinks
                role={user.role}
                pathname={pathname}
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <div className="px-2 pb-3">
                <UserBadge user={user} />
              </div>
              <LogoutButton className="w-full justify-start" />
            </div>
          </div>
        </div>
      )}

      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
