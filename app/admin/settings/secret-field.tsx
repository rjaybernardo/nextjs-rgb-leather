"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { removeSecret, saveSecret } from "@/lib/actions/settings.actions";
import { SECRET_KEYS, type SecretStatus } from "@/lib/integration-config";
import { cn } from "@/lib/utils";

const initialState = { success: false, message: "" };

const dateFormat = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });

function SaveButton({ replacing }: { replacing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : replacing ? "Replace" : "Save"}
    </Button>
  );
}

function StatusLine({ status }: { status: SecretStatus }) {
  if (status.unreadable) {
    return (
      <p className="text-sm text-destructive">
        A saved key can&apos;t be read (the site&apos;s AUTH_SECRET changed). Enter it again.
      </p>
    );
  }

  if (status.source === "none") {
    return <p className="text-sm text-muted-foreground">Not set</p>;
  }

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
      <span className="font-mono text-foreground">••••{status.hint}</span>
      <span>
        {status.source === "admin"
          ? `saved here${status.updatedAt ? ` · ${dateFormat.format(new Date(status.updatedAt))}` : ""}`
          : "from the hosting environment variable"}
      </span>
      {status.mode && (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            status.mode === "live"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
          )}
        >
          {status.mode === "live" ? "Live mode" : "Test mode"}
        </span>
      )}
    </p>
  );
}

/*
 * One API key: write-only. Shows where the key in use comes from and its
 * last 4 characters; the value itself never reaches the browser.
 */
export default function SecretField({ status }: { status: SecretStatus }) {
  const key = SECRET_KEYS[status.name];
  const inputId = `secret-${status.name}`;

  const [state, action] = useActionState(saveSecret, initialState);
  const [removeState, setRemoveState] = useState(initialState);
  const [confirming, setConfirming] = useState(false);
  // Which action's message to show: the one used last
  const [last, setLast] = useState<"save" | "remove">("save");
  const [isRemoving, startRemove] = useTransition();
  const form = useRef<HTMLFormElement>(null);

  // Don't leave a saved key sitting in the input
  useEffect(() => {
    if (state.success) form.current?.reset();
  }, [state]);

  const message = last === "remove" ? removeState : state;

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{key.label}</Label>
      <StatusLine status={status} />

      <form ref={form} action={action} onSubmit={() => setLast("save")} className="flex gap-2">
        <input type="hidden" name="name" value={status.name} />
        <Input
          id={inputId}
          name="value"
          type="password"
          autoComplete="off"
          spellCheck={false}
          required
          placeholder={status.source === "none" ? "Paste the key" : "Paste a new key to replace it"}
          className="font-mono"
          aria-describedby={`${inputId}-help`}
        />
        <SaveButton replacing={status.source !== "none"} />
      </form>

      <p id={`${inputId}-help`} className="text-xs text-muted-foreground">
        {key.help}
      </p>

      {status.source === "admin" &&
        (confirming ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>
              Remove this key?{" "}
              {`The ${status.name} environment variable will be used instead, if it's set.`}
            </span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isRemoving}
              onClick={() =>
                startRemove(async () => {
                  setLast("remove");
                  setRemoveState(await removeSecret(status.name));
                  setConfirming(false);
                })
              }
            >
              {isRemoving ? "Removing..." : "Yes, remove"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={() => setConfirming(true)}>
            Remove saved key
          </Button>
        ))}

      {message.message && (
        <p role="status" className={cn("text-sm", message.success ? "text-muted-foreground" : "text-destructive")}>
          {message.message}
        </p>
      )}
    </div>
  );
}
