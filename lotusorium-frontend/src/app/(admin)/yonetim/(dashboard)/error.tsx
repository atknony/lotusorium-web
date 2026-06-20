"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Admin dashboard segment error boundary (rendered inside the shell). */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="font-serif text-2xl">Bir hata oluştu</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Bu bölüm yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.
      </p>
      <Button type="button" onClick={reset} className="mt-6">
        <RotateCcw className="size-4" aria-hidden />
        Tekrar Dene
      </Button>
    </div>
  );
}
