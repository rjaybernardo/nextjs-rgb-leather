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
      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(true)}>
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
        aria-label={`Remove ${email}`}
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
      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Keep
      </Button>
    </span>
  );
}
