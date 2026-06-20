"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    try {
      await fetch("/api/bff/auth/logout", { method: "POST" });
    } catch {
      // Local session is cleared server-side regardless; proceed.
    }
    toast.success("Çıkış yapıldı");
    router.replace("/yonetim/giris");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50",
        className,
      )}
    >
      <LogOut className="size-4" aria-hidden />
      Çıkış Yap
    </button>
  );
}
