"use client";

import { cn } from "@/lib/utils";

type CheckoutStepsProps = {
  current?: number;
};

const steps = [
  "User Login",
  "Shipping Address",
  "Payment Method",
  "Place Order",
] as const;

const CheckoutSteps = ({ current = 0 }: CheckoutStepsProps) => {
  return (
    <div className="mb-10 flex flex-col items-center justify-between gap-2 md:flex-row md:gap-0">
      {steps.map((step, index) => (
        <div key={step} className="flex w-full items-center md:w-auto">
          <div
            className={cn(
              "w-full rounded-full p-2 text-center text-sm md:w-56",
              index === current && "bg-secondary",
            )}
          >
            {step}
          </div>

          {index < steps.length - 1 && (
            <hr className="mx-2 hidden w-16 border-t border-gray-300 md:block" />
          )}
        </div>
      ))}
    </div>
  );
};

export default CheckoutSteps;
