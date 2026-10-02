"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { resendVerificationEmail } from "@/lib/actions/user.actions";

const EmailVerificationNotice = () => {
  const [isPending, startTransition] = useTransition();

  function handleResend() {
    startTransition(async () => {
      const result = await resendVerificationEmail();

      toast.add({
        type: result.success ? "success" : "error",
        description: result.message,
      });
    });
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm">
        Your email isn&apos;t confirmed yet. Confirm it so we can reach you
        about your orders.
      </p>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={handleResend}
      >
        {isPending ? "Sending..." : "Send confirmation link"}
      </Button>
    </div>
  );
};

export default EmailVerificationNotice;
