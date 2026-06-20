"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, CheckboxField } from "../form-fields";
import { Badge, ConfirmDialog } from "../ui";
import {
  adminKeys,
  createAttribute,
  deleteAttribute,
  updateAttribute,
} from "@/lib/api/admin";
import type {
  AdminAttributeDefinition,
  AttributeDataType,
  AttributeDefinitionWritePayload,
} from "@/lib/api/types";

const TYPE_LABELS: Record<AttributeDataType, string> = {
  text: "Metin",
  number: "Sayı",
  boolean: "Evet/Hayır",
  enum: "Tekli Seçim",
  multi_enum: "Çoklu Seçim",
};

const ENUM_TYPES: AttributeDataType[] = ["enum", "multi_enum"];
const KEY_RE = /^[a-z][a-z0-9_]*$/;

interface DraftState {
  key: string;
  label: string;
  dataType: AttributeDataType;
  unit: string;
  options: string;
  isRequired: boolean;
  isFilterable: boolean;
}

function toDraft(def?: AdminAttributeDefinition): DraftState {
  return {
    key: def?.key ?? "",
    label: def?.label ?? "",
    dataType: def?.dataType ?? "text",
    unit: def?.unit ?? "",
    options: (def?.options ?? []).join(", "),
    isRequired: def?.isRequired ?? false,
    isFilterable: def?.isFilterable ?? false,
  };
}

function parseOptions(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Inline create/edit row for one attribute definition. */
function AttributeRowForm({
  initial,
  sortOrder,
  onSave,
  onCancel,
  pending,
}: {
  initial?: AdminAttributeDefinition;
  sortOrder: number;
  onSave: (payload: AttributeDefinitionWritePayload) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [draft, setDraft] = useState<DraftState>(() => toDraft(initial));
  const [error, setError] = useState<string | null>(null);
  const isEnum = ENUM_TYPES.includes(draft.dataType);

  function submit() {
    setError(null);
    if (!KEY_RE.test(draft.key)) {
      setError("Anahtar küçük harf/rakam/alt çizgi olmalı (harfle başlamalı).");
      return;
    }
    if (!draft.label.trim()) {
      setError("Etiket gerekli.");
      return;
    }
    const options = parseOptions(draft.options);
    if (isEnum && options.length === 0) {
      setError("Seçim tipleri için en az bir seçenek girin.");
      return;
    }
    onSave({
      key: draft.key.trim(),
      label: draft.label.trim(),
      dataType: draft.dataType,
      unit: draft.unit.trim() || undefined,
      options: isEnum ? options : undefined,
      isRequired: draft.isRequired,
      isFilterable: draft.isFilterable,
      sortOrder,
    });
  }

  return (
    <div className="space-y-4 rounded-lg border border-primary/30 bg-card p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Anahtar" required hint="örn. burn_time">
          <Input
            value={draft.key}
            onChange={(e) => setDraft({ ...draft, key: e.target.value })}
            placeholder="burn_time"
            disabled={Boolean(initial)}
          />
        </Field>
        <Field label="Etiket" required hint="örn. Yanma Süresi">
          <Input
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            placeholder="Yanma Süresi"
          />
        </Field>
        <Field label="Tip">
          <Select
            value={draft.dataType}
            onChange={(e) =>
              setDraft({ ...draft, dataType: e.target.value as AttributeDataType })
            }
          >
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Birim" hint="örn. saat (isteğe bağlı)">
          <Input
            value={draft.unit}
            onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
            placeholder="saat"
          />
        </Field>
      </div>

      {isEnum && (
        <Field label="Seçenekler" required hint="Virgülle ayırın: Lavanta, Vanilya, Gül">
          <Input
            value={draft.options}
            onChange={(e) => setDraft({ ...draft, options: e.target.value })}
            placeholder="Lavanta, Vanilya, Gül"
          />
        </Field>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <CheckboxField
          label="Zorunlu"
          checked={draft.isRequired}
          onChange={(e) => setDraft({ ...draft, isRequired: e.target.checked })}
        />
        <CheckboxField
          label="Filtrelenebilir"
          hint="Mağazada filtre olarak görünür."
          checked={draft.isFilterable}
          onChange={(e) => setDraft({ ...draft, isFilterable: e.target.checked })}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex items-center gap-2">
        <Button type="button" size="sm" onClick={submit} disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Check className="size-4" aria-hidden />
          )}
          Kaydet
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={pending}>
          <X className="size-4" aria-hidden />
          Vazgeç
        </Button>
      </div>
    </div>
  );
}

export function AttributeEditor({
  categoryId,
  attributes,
}: {
  categoryId: string;
  attributes: AdminAttributeDefinition[];
}) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminAttributeDefinition | null>(null);

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: adminKeys.category(categoryId) });

  const createMut = useMutation({
    mutationFn: (payload: AttributeDefinitionWritePayload) =>
      createAttribute(categoryId, payload),
    onSuccess: () => {
      invalidate();
      setAdding(false);
      toast.success("Özellik eklendi");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Eklenemedi"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AttributeDefinitionWritePayload }) =>
      updateAttribute(categoryId, id, payload),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
      toast.success("Özellik güncellendi");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Güncellenemedi"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAttribute(categoryId, id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast.success("Özellik silindi");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Silinemedi"),
  });

  const sorted = [...attributes].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Özellik Tanımları</h2>
          <p className="text-sm text-muted-foreground">
            Bu kategorideki ürünlerin sahip olabileceği dinamik özellikler.
          </p>
        </div>
        {!adding && (
          <Button type="button" size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="size-4" aria-hidden />
            Ekle
          </Button>
        )}
      </div>

      {adding && (
        <AttributeRowForm
          sortOrder={sorted.length}
          onSave={(payload) => createMut.mutate(payload)}
          onCancel={() => setAdding(false)}
          pending={createMut.isPending}
        />
      )}

      {sorted.length === 0 && !adding ? (
        <p className="rounded-lg border border-dashed border-border bg-card/50 px-4 py-8 text-center text-sm text-muted-foreground">
          Henüz özellik tanımı yok.
        </p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((def) =>
            editingId === def.id ? (
              <li key={def.id}>
                <AttributeRowForm
                  initial={def}
                  sortOrder={def.sortOrder}
                  onSave={(payload) => updateMut.mutate({ id: def.id, payload })}
                  onCancel={() => setEditingId(null)}
                  pending={updateMut.isPending}
                />
              </li>
            ) : (
              <li
                key={def.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{def.label}</span>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {def.key}
                    </code>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge tone="neutral">{TYPE_LABELS[def.dataType]}</Badge>
                    {def.unit && <Badge tone="neutral">{def.unit}</Badge>}
                    {def.isRequired && <Badge tone="neutral">Zorunlu</Badge>}
                    {def.isFilterable && <Badge tone="neutral">Filtre</Badge>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingId(def.id)}
                    aria-label="Düzenle"
                    className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <Pencil className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(def)}
                    aria-label="Sil"
                    className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Özelliği sil"
        description={`"${deleteTarget?.label}" tanımı silinecek. Bu işlem geri alınamaz.`}
        confirmLabel="Sil"
        pending={deleteMut.isPending}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}
