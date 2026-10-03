import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getUserById } from "@/lib/actions/user.actions";
import { getCheckoutPaymentMethods } from "@/lib/integrations";

import PaymentMethodForm from "./payment-method-form";

export const metadata: Metadata = {
  title: "Payment Method",
};

const PaymentMethodPage = async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/sign-in");
  }

  const [user, { methods, defaultMethod }] = await Promise.all([
    getUserById(userId),
    getCheckoutPaymentMethods(),
  ]);

  return (
    <PaymentMethodForm
      preferredPaymentMethod={user.paymentMethod}
      methods={methods}
      defaultMethod={defaultMethod}
    />
  );
};

export default PaymentMethodPage;
