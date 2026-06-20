"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Returns a safe same-origin path from `?next=`, defaulting to /yonetim. */
function resolveNext(): string {
  if (typeof window === "undefined") return "/yonetim";
  const next = new URLSearchParams(window.location.search).get("next");
  // Only allow internal admin paths — never an open redirect.
  if (next && next.startsWith("/yonetim")) return next;
  return "/yonetim";
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const res = await fetch("/api/bff/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        const message = body?.error ?? "Giriş başarısız oldu";
        setError(message);
        toast.error(message);
        return;
      }

      toast.success("Giriş başarılı");
      router.replace(resolveNext());
      router.refresh();
    } catch {
      const message = "Sunucuya ulaşılamadı";
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium">
          E-posta
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
          placeholder="ornek@lotusorium.com"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium">
          Şifre
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Lock className="size-4" aria-hidden />
        )}
        {pending ? "Giriş yapılıyor…" : "Giriş Yap"}
      </Button>
    </form>
  );
}
