import { applyPaidCheckoutSession } from "@/lib/order-payment";
import {
  retrieveCheckoutSession,
  verifyWebhookSignature,
} from "@/lib/paymongo";

type PayMongoEvent = {
  data?: {
    attributes?: {
      type?: string;
      livemode?: boolean;
      data?: {
        id?: string;
      };
    };
  };
};

export async function POST(request: Request) {
  const rawBody = await request.text();

  let event: PayMongoEvent;

  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const attributes = event.data?.attributes;

  const isValid = verifyWebhookSignature({
    rawBody,
    signatureHeader: request.headers.get("paymongo-signature"),
    livemode: attributes?.livemode === true,
  });

  if (!isValid) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (attributes?.type === "checkout_session.payment.paid") {
    const checkoutSessionId = attributes.data?.id;

    if (checkoutSessionId) {
      // Re-fetch from PayMongo rather than trusting the payload's amounts
      const session = await retrieveCheckoutSession(checkoutSessionId);

      await applyPaidCheckoutSession(session);
    }
  }

  return Response.json({ received: true });
}
