import type { Metadata } from "next";

import { getIntegrationsForAdmin, getShippingSettingsForAdmin } from "@/lib/actions/settings.actions";
import type { SecretName } from "@/lib/integration-config";

import { EmailSettingsForm, GoogleSettingsForm, PaymentSettingsForm } from "./integration-forms";
import SecretField from "./secret-field";
import ShippingSettingsForm from "./shipping-settings-form";

export const metadata: Metadata = {
  title: "Settings",
};

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5 rounded-lg border p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default async function AdminSettingsPage() {
  const [shipping, integrations] = await Promise.all([getShippingSettingsForAdmin(), getIntegrationsForAdmin()]);

  const secret = (name: SecretName) => integrations.secrets.find((status) => status.name === name)!;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          API keys saved here are encrypted and can&apos;t be viewed again, only replaced. Anything left
          empty uses the hosting environment variable, if there is one.
        </p>
      </div>

      <SettingsSection
        title="Shipping"
        description="One flat fee for every order, with free shipping above a minimum order. Prices already include 12% VAT."
      >
        <ShippingSettingsForm settings={shipping} />
      </SettingsSection>

      <SettingsSection
        title="Payments"
        description={
          <>
            Online payment (GCash, Maya, card, QR Ph) goes through PayMongo. Create a webhook in PayMongo
            for the <code className="rounded bg-muted px-1 py-0.5">checkout_session.payment.paid</code> event
            pointing to{" "}
            <code className="break-all rounded bg-muted px-1 py-0.5">
              {integrations.serverUrl}/api/webhooks/paymongo
            </code>
            , so orders are marked paid.
          </>
        }
      >
        <SecretField status={secret("PAYMONGO_SECRET_KEY")} />
        <SecretField status={secret("PAYMONGO_WEBHOOK_SECRET")} />
        <div className="border-t pt-5">
          <PaymentSettingsForm
            settings={integrations.payments}
            hasPayMongoKey={secret("PAYMONGO_SECRET_KEY").source !== "none"}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Email"
        description="Order confirmations, shipping updates, password resets and email verification are sent through Resend."
      >
        <SecretField status={secret("RESEND_API_KEY")} />
        <div className="border-t pt-5">
          <EmailSettingsForm settings={integrations.email} />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Sign in with Google"
        description="Shows a “Continue with Google” button on the sign-in and sign-up pages once both the client ID and secret are set."
      >
        <GoogleSettingsForm
          clientId={integrations.googleClientId}
          redirectUri={`${integrations.serverUrl}/api/auth/callback/google`}
        />
        <SecretField status={secret("AUTH_GOOGLE_SECRET")} />
      </SettingsSection>
    </div>
  );
}
