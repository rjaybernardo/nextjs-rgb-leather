"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COURIERS } from "@/lib/constants";

type Shipment = {
  courier: (typeof COURIERS)[number];
  trackingNumber?: string;
};

type ShipmentFormProps = {
  submitLabel: string;
  defaultCourier?: string | null;
  defaultTrackingNumber?: string | null;
  disabled?: boolean;
  onSubmit: (shipment: Shipment) => void;
  onCancel?: () => void;
};

const ShipmentForm = ({
  submitLabel,
  defaultCourier,
  defaultTrackingNumber,
  disabled,
  onSubmit,
  onCancel,
}: ShipmentFormProps) => {
  const [courier, setCourier] = useState(defaultCourier ?? "");
  const [trackingNumber, setTrackingNumber] = useState(
    defaultTrackingNumber ?? "",
  );

  return (
    <form
      className="w-full space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          courier: courier as Shipment["courier"],
          trackingNumber,
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="ship-courier">Courier</Label>

          <select
            id="ship-courier"
            value={courier}
            onChange={(event) => setCourier(event.target.value)}
            required
            disabled={disabled}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="" disabled>
              Choose a courier
            </option>

            {COURIERS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="ship-tracking">Tracking number (optional)</Label>

          <Input
            id="ship-tracking"
            value={trackingNumber}
            onChange={(event) => setTrackingNumber(event.target.value)}
            maxLength={60}
            disabled={disabled}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={disabled || !courier}>
          {submitLabel}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={disabled}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

export default ShipmentForm;
