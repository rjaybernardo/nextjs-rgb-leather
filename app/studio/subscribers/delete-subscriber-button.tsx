"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { deleteSubscriber } from "@/lib/actions/studio.actions";

export default function DeleteSubscriberButton({ id, email }: { id: string; email: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      // Names include the visible words plus the email, so screen readers can
      // tell the rows apart and voice control can still say what it sees
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={`Remove ${email}`}
        onClick={() => setConfirming(true)}
      >
        Remove
      </Button>
    );
  }

  return (
    <span className="flex justify-end gap-1">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={isPending}
        aria-label={`Yes, remove ${email}`}
        onClick={() =>
          startTransition(async () => {
            const result = await deleteSubscriber(id);
            toast.add({ type: result.success ? "success" : "error", description: result.message });
            if (result.success) router.refresh();
          })
        }
      >
        Yes, remove
      </Button>
      <Button type="button" variant="ghost" size="sm" aria-label={`Keep ${email}`} onClick={() => setConfirming(false)}>
        Keep
      </Button>
    </span>
  );
}
