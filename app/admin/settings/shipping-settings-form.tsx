"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateShippingSettings } from "@/lib/actions/settings.actions";
import type { ShippingSettings } from "@/lib/store-settings";
import { cn } from "@/lib/utils";

const initialState = {
  success: false,
  message: "",
};

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save shipping settings"}
    </Button>
  );
}

const ShippingSettingsForm = ({ settings }: { settings: ShippingSettings }) => {
  const [state, action] = useActionState(updateShippingSettings, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="shippingFee">Shipping fee (₱)</Label>

        <Input
          id="shippingFee"
          name="shippingFee"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          required
          defaultValue={settings.shippingFee}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="freeShippingMin">Free shipping from (₱)</Label>

        <Input
          id="freeShippingMin"
          name="freeShippingMin"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          required
          defaultValue={settings.freeShippingMin}
        />

        <p className="text-xs text-muted-foreground">
          Orders at or above this amount ship free. Enter 0 to always charge
          shipping.
        </p>
      </div>

      <SaveButton />

      {state.message && (
        <p
          role="status"
          className={cn(
            "text-sm",
            state.success ? "text-muted-foreground" : "text-destructive",
          )}
        >
          {state.message}
        </p>
      )}
    </form>
  );
};

export default ShippingSettingsForm;
