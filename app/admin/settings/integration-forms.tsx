"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  sendTestEmail,
  updateEmailSettings,
  updateGoogleSettings,
  updatePaymentSettings,
} from "@/lib/actions/settings.actions";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  PAYMONGO_METHODS,
  type PaymentMethod,
  type PayMongoMethod,
} from "@/lib/integration-config";
import { cn } from "@/lib/utils";

type Result = { success: boolean; message: string };

const initialState: Result = { success: false, message: "" };

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

function Status({ result }: { result: Result }) {
  if (!result.message) return null;

  return (
    <p role="status" className={cn("text-sm", result.success ? "text-muted-foreground" : "text-destructive")}>
      {result.message}
    </p>
  );
}

const checkbox = "size-4 accent-primary";

// ------------------------------------------------------------- payments

export function PaymentSettingsForm({
  settings,
  hasPayMongoKey,
}: {
  settings: { paymentMethods: PaymentMethod[]; defaultPaymentMethod: PaymentMethod; paymongoMethods: PayMongoMethod[] };
  hasPayMongoKey: boolean;
}) {
  const [state, action] = useActionState(updatePaymentSettings, initialState);
  const [enabled, setEnabled] = useState<PaymentMethod[]>(settings.paymentMethods);

  return (
    <form action={action} className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Payment methods customers can choose</legend>
        {PAYMENT_METHODS.map((method) => (
          <label key={method} className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              name="paymentMethods"
              value={method}
              checked={enabled.includes(method)}
              onChange={(event) =>
                setEnabled((current) =>
                  event.target.checked ? [...current, method] : current.filter((item) => item !== method),
                )
              }
              className={checkbox}
            />
            {method === "PayMongo" ? "Online payment through PayMongo" : PAYMENT_METHOD_LABELS[method]}
          </label>
        ))}
        {enabled.includes("PayMongo") && !hasPayMongoKey && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Customers won&apos;t see online payment until a PayMongo secret key is saved above.
          </p>
        )}
      </fieldset>

      <div className="space-y-1">
        <Label htmlFor="defaultPaymentMethod">Preselected at checkout</Label>
        <select
          id="defaultPaymentMethod"
          name="defaultPaymentMethod"
          defaultValue={settings.defaultPaymentMethod}
          className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm"
        >
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {PAYMENT_METHOD_LABELS[method]}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Offered in PayMongo&apos;s checkout</legend>
        <div className="grid grid-cols-2 gap-2">
          {PAYMONGO_METHODS.map((method) => (
            <label key={method.value} className="flex items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                name="paymongoMethods"
                value={method.value}
                defaultChecked={settings.paymongoMethods.includes(method.value)}
                className={checkbox}
              />
              {method.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Each one must be activated on your PayMongo account, or checkout will fail.
        </p>
      </fieldset>

      <SaveButton label="Save payment settings" />
      <Status result={state} />
    </form>
  );
}

// ---------------------------------------------------------------- email

export function EmailSettingsForm({ settings }: { settings: { from: string; replyTo: string } }) {
  const [state, action] = useActionState(updateEmailSettings, initialState);
  const [test, setTest] = useState(initialState);
  const [isTesting, startTest] = useTransition();

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="emailFrom">Send emails from</Label>
          <Input
            id="emailFrom"
            name="emailFrom"
            defaultValue={settings.from}
            placeholder="Your Store <orders@yourstore.ph>"
            aria-describedby="emailFrom-help"
          />
          <p id="emailFrom-help" className="text-xs text-muted-foreground">
            Must use a domain verified in Resend. Leave empty to use Resend&apos;s test sender, which only
            delivers to your own Resend account.
          </p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="emailReplyTo">Customer replies go to (optional)</Label>
          <Input id="emailReplyTo" name="emailReplyTo" type="email" defaultValue={settings.replyTo} placeholder="help@yourstore.ph" />
        </div>

        <SaveButton label="Save email settings" />
        <Status result={state} />
      </form>

      <div className="space-y-2 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          disabled={isTesting}
          onClick={() => startTest(async () => setTest(await sendTestEmail()))}
        >
          {isTesting ? "Sending..." : "Send me a test email"}
        </Button>
        <Status result={test} />
      </div>
    </div>
  );
}

// --------------------------------------------------------------- google

export function GoogleSettingsForm({ clientId, redirectUri }: { clientId: string; redirectUri: string }) {
  const [state, action] = useActionState(updateGoogleSettings, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="googleClientId">Google client ID</Label>
        <Input
          id="googleClientId"
          name="googleClientId"
          defaultValue={clientId}
          placeholder="1234567890-abc.apps.googleusercontent.com"
          className="font-mono"
          spellCheck={false}
        />
        <p className="text-xs text-muted-foreground">
          In the OAuth client, add this authorized redirect URI:{" "}
          <code className="break-all rounded bg-muted px-1 py-0.5">{redirectUri}</code>
        </p>
      </div>

      <SaveButton label="Save client ID" />
      <Status result={state} />
    </form>
  );
}
