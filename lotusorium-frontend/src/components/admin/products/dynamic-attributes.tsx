"use client";

import { Field, Input, Select, CheckboxField } from "../form-fields";
import type { AdminAttributeDefinition } from "@/lib/api/types";

export type AttributeValues = Record<string, unknown>;

/**
 * Renders form controls for a category's dynamic attribute definitions and
 * keeps a typed value map in sync. Mirrors the API's strict validator: numbers
 * stay numbers, booleans booleans, multi_enum an array of allowed strings.
 */
export function DynamicAttributes({
  definitions,
  values,
  onChange,
}: {
  definitions: AdminAttributeDefinition[];
  values: AttributeValues;
  onChange: (next: AttributeValues) => void;
}) {
  if (definitions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground">
        Bu kategoride tanımlı özellik yok. Özellik eklemek için kategoriyi
        düzenleyin.
      </p>
    );
  }

  const setValue = (key: string, value: unknown) => {
    const next = { ...values };
    if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
      delete next[key];
    } else {
      next[key] = value;
    }
    onChange(next);
  };

  const sorted = [...definitions].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-4">
      {sorted.map((def) => {
        const value = values[def.key];
        const label = def.unit ? `${def.label} (${def.unit})` : def.label;

        switch (def.dataType) {
          case "boolean":
            return (
              <CheckboxField
                key={def.id}
                label={label}
                checked={value === true}
                onChange={(e) => setValue(def.key, e.target.checked)}
              />
            );

          case "number":
            return (
              <Field key={def.id} label={label} required={def.isRequired}>
                <Input
                  type="number"
                  step="any"
                  value={value === undefined || value === null ? "" : String(value)}
                  onChange={(e) =>
                    setValue(
                      def.key,
                      e.target.value === "" ? undefined : Number(e.target.value),
                    )
                  }
                />
              </Field>
            );

          case "enum":
            return (
              <Field key={def.id} label={label} required={def.isRequired}>
                <Select
                  value={typeof value === "string" ? value : ""}
                  onChange={(e) => setValue(def.key, e.target.value || undefined)}
                >
                  <option value="">— Seçin —</option>
                  {(def.options ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </Select>
              </Field>
            );

          case "multi_enum": {
            const selected = Array.isArray(value) ? (value as string[]) : [];
            return (
              <Field key={def.id} label={label} required={def.isRequired}>
                <div className="flex flex-wrap gap-2">
                  {(def.options ?? []).map((opt) => {
                    const active = selected.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setValue(
                            def.key,
                            active
                              ? selected.filter((s) => s !== opt)
                              : [...selected, opt],
                          )
                        }
                        className={
                          "rounded-full border px-3 py-1.5 text-sm transition-colors " +
                          (active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card hover:bg-secondary")
                        }
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </Field>
            );
          }

          case "text":
          default:
            return (
              <Field key={def.id} label={label} required={def.isRequired}>
                <Input
                  value={typeof value === "string" ? value : ""}
                  onChange={(e) => setValue(def.key, e.target.value)}
                />
              </Field>
            );
        }
      })}
    </div>
  );
}
