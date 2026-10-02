"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FieldDef } from "@/lib/site-config";

import ImageField from "./image-field";

// Read and write values by dotted key, e.g. "contact.email"
export const getPath = (object: Record<string, unknown>, path: string): unknown =>
  path.split(".").reduce<unknown>(
    (value, key) => (value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined),
    object,
  );

export const setPath = (
  object: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> => {
  const [key, ...rest] = path.split(".");

  if (rest.length === 0) return { ...object, [key]: value };

  const child = (object[key] && typeof object[key] === "object" ? object[key] : {}) as Record<string, unknown>;

  return { ...object, [key]: setPath(child, rest.join("."), value) };
};

const selectClass = "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm";

type FieldEditorProps = {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  idPrefix: string;
};

// One input for a field definition from lib/site-config.ts
export function FieldEditor({ field, value, onChange, idPrefix }: FieldEditorProps) {
  const id = `${idPrefix}-${field.key.replace(/\./g, "-")}`;

  if (field.type === "list") {
    return <ListEditor field={field} value={value} onChange={onChange} idPrefix={id} />;
  }

  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{field.label}</Label>

      {field.type === "textarea" ? (
        <Textarea
          id={id}
          value={String(value ?? "")}
          maxLength={field.max}
          rows={4}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : field.type === "image" ? (
        <ImageField id={id} value={String(value ?? "")} onChange={onChange} />
      ) : field.type === "select" ? (
        <select
          id={id}
          // Boolean settings are stored as true/false but edited as text
          value={String(value ?? "")}
          onChange={(event) =>
            onChange(
              typeof value === "boolean" ? event.target.value === "true" : event.target.value,
            )
          }
          className={selectClass}
        >
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === "number" ? (
        <Input
          id={id}
          type="number"
          min={field.min}
          max={field.max}
          value={Number(value ?? field.min)}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      ) : (
        <Input
          id={id}
          type={field.type === "datetime" ? "datetime-local" : "text"}
          inputMode={field.type === "url" ? "url" : undefined}
          value={String(value ?? "")}
          maxLength={"max" in field ? field.max : undefined}
          placeholder={field.type === "url" ? "/search or https://..." : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      )}

      {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
    </div>
  );
}

type ListField = Extract<FieldDef, { type: "list" }>;

function ListEditor({
  field,
  value,
  onChange,
  idPrefix,
}: {
  field: ListField;
  value: unknown;
  onChange: (value: unknown) => void;
  idPrefix: string;
}) {
  const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];

  const update = (next: Record<string, unknown>[]) => onChange(next);

  const blankItem = () =>
    Object.fromEntries(
      field.fields.map((sub) => [
        sub.key,
        sub.type === "select" ? sub.options[0]?.value ?? "" : sub.type === "number" ? sub.min : "",
      ]),
    );

  const move = (index: number, offset: number) => {
    const next = [...items];
    const target = index + offset;
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  };

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">{field.label}</legend>

      {items.map((item, index) => (
        <div key={index} className="space-y-3 rounded-md border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              {field.itemLabel} {index + 1}
            </span>

            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                aria-label={`Move ${field.itemLabel} ${index + 1} up`}
              >
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={index === items.length - 1}
                onClick={() => move(index, 1)}
                aria-label={`Move ${field.itemLabel} ${index + 1} down`}
              >
                <ArrowDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => update(items.filter((_, i) => i !== index))}
                aria-label={`Remove ${field.itemLabel} ${index + 1}`}
              >
                <Trash2 />
              </Button>
            </div>
          </div>

          {field.fields.map((sub) => (
            <FieldEditor
              key={sub.key}
              field={sub}
              value={item[sub.key]}
              idPrefix={`${idPrefix}-${index}`}
              onChange={(subValue) =>
                update(items.map((current, i) => (i === index ? { ...current, [sub.key]: subValue } : current)))
              }
            />
          ))}
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={() => update([...items, blankItem()])}>
        <Plus />
        Add {field.itemLabel.toLowerCase()}
      </Button>
    </fieldset>
  );
}
