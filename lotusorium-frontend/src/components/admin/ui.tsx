"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Page title + optional description and a right-aligned action slot. */
export function PageHeader({
  title,
  description,
  backHref,
  children,
}: {
  title: string;
  description?: string;
  backHref?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="mb-1 inline-block text-xs text-muted-foreground hover:text-foreground"
          >
            ← Geri
          </Link>
        )}
        <h1 className="font-serif text-2xl sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn("size-5 animate-spin text-muted-foreground", className)} aria-hidden />
  );
}

export function LoadingBlock({ label = "Yükleniyor…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
      <Spinner />
      {label}
    </div>
  );
}

export function ErrorBlock({ message }: { message?: string }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      {message ?? "Bir hata oluştu."}
    </div>
  );
}

export function AccessDenied() {
  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-xl border border-border bg-card px-6 py-14 text-center">
        <p className="font-serif text-2xl">Erişim Yok</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Bu sayfa yalnızca süper yöneticilere açıktır. Bir hata olduğunu
          düşünüyorsanız yöneticinizle iletişime geçin.
        </p>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      <p className="font-medium">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {children && <div className="mt-5 flex justify-center">{children}</div>}
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  published: "bg-accent/15 text-accent-foreground border-accent/30",
  draft: "bg-muted text-muted-foreground border-border",
  archived: "bg-destructive/10 text-destructive border-destructive/20",
};

export function Badge({
  children,
  tone = "draft",
}: {
  children: React.ReactNode;
  tone?: keyof typeof STATUS_BADGE | "neutral";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        STATUS_BADGE[tone] ?? "border-border bg-secondary text-secondary-foreground",
      )}
    >
      {children}
    </span>
  );
}

/** Lightweight confirmation modal (used for destructive actions). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Onayla",
  cancelLabel = "Vazgeç",
  destructive = true,
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={cancelLabel}
        onClick={onCancel}
        className="absolute inset-0 bg-foreground/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label={cancelLabel}
          className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-lg hover:bg-secondary"
        >
          <X className="size-4" aria-hidden />
        </button>
        <h2 className="text-lg font-medium">{title}</h2>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
          >
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
