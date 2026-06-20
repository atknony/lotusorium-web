import type { Metadata } from "next";
import { Toaster } from "sonner";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Yönetim Girişi",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <Toaster position="top-center" richColors />
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl tracking-tight">Lotusorium</h1>
          <p className="mt-1 text-xs uppercase tracking-luxe text-muted-foreground">
            Yönetim Paneli
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="mb-1 text-lg font-medium">Giriş Yap</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Devam etmek için hesabınıza giriş yapın.
          </p>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Yalnızca yetkili yöneticiler içindir.
        </p>
      </div>
    </main>
  );
}
