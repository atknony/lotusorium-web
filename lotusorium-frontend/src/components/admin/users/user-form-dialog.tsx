"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, CheckboxField } from "../form-fields";
import { adminKeys, createUser, updateUser } from "@/lib/api/admin";
import type { AdminRole, AdminUser } from "@/lib/api/types";

export function UserFormDialog({
  user,
  onClose,
}: {
  user?: AdminUser;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = Boolean(user);

  const [email, setEmail] = useState(user?.email ?? "");
  const [name, setName] = useState(user?.name ?? "");
  const [role, setRole] = useState<AdminRole>(user?.role ?? "editor");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      if (isEdit) {
        return updateUser(user!.id, {
          email,
          name,
          role,
          isActive,
          ...(password ? { password } : {}),
        });
      }
      return createUser({ email, name, role, password });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.users });
      toast.success(isEdit ? "Kullanıcı güncellendi" : "Kullanıcı oluşturuldu");
      onClose();
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : "Kaydedilemedi";
      setError(msg);
      toast.error(msg);
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !name.trim()) {
      setError("E-posta ve ad gerekli.");
      return;
    }
    if (!isEdit && password.length < 8) {
      setError("Şifre en az 8 karakter olmalı.");
      return;
    }
    if (isEdit && password && password.length < 8) {
      setError("Yeni şifre en az 8 karakter olmalı.");
      return;
    }
    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Kapat"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40"
      />
      <form
        onSubmit={submit}
        className="relative w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-lg hover:bg-secondary"
        >
          <X className="size-4" aria-hidden />
        </button>

        <h2 className="text-lg font-medium">
          {isEdit ? "Kullanıcıyı Düzenle" : "Yeni Kullanıcı"}
        </h2>

        <Field label="Ad" htmlFor="u-name" required>
          <Input id="u-name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <Field label="E-posta" htmlFor="u-email" required>
          <Input
            id="u-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="Rol" htmlFor="u-role">
          <Select id="u-role" value={role} onChange={(e) => setRole(e.target.value as AdminRole)}>
            <option value="editor">Editör</option>
            <option value="super_admin">Süper Yönetici</option>
          </Select>
        </Field>

        <Field
          label={isEdit ? "Yeni Şifre" : "Şifre"}
          htmlFor="u-password"
          required={!isEdit}
          hint={isEdit ? "Değiştirmek istemiyorsanız boş bırakın." : "En az 8 karakter."}
        >
          <Input
            id="u-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {isEdit && (
          <CheckboxField
            label="Aktif"
            hint="Pasif kullanıcılar giriş yapamaz."
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
            İptal
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {isEdit ? "Kaydet" : "Oluştur"}
          </Button>
        </div>
      </form>
    </div>
  );
}
