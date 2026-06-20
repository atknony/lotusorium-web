"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Container } from "@/components/storefront/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Storefront segment error boundary. */
export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface for observability; replace with a real reporter in production.
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="tracking-luxe text-xs font-medium uppercase text-accent">
        Bir hata oluştu
      </p>
      <h1 className="mt-4 max-w-md text-balance text-2xl sm:text-3xl">
        Üzgünüz, bir şeyler ters gitti
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
        Sayfa yüklenirken beklenmeyen bir sorun oluştu. Lütfen tekrar deneyin.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <button type="button" onClick={reset} className={buttonVariants()}>
          <RotateCcw className="h-4 w-4" />
          Tekrar Dene
        </button>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Ana Sayfa
        </Link>
      </div>
    </Container>
  );
}
