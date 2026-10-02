import type { Metadata } from "next";

import { getShippingSettingsForAdmin } from "@/lib/actions/settings.actions";

import ShippingSettingsForm from "./shipping-settings-form";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function AdminSettingsPage() {
  const settings = await getShippingSettingsForAdmin();

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <section className="space-y-4 rounded-lg border p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Shipping</h2>

          <p className="text-sm text-muted-foreground">
            One flat fee for every order, with free shipping above a minimum
            order. Prices already include 12% VAT.
          </p>
        </div>

        <ShippingSettingsForm settings={settings} />
      </section>
    </div>
  );
}
