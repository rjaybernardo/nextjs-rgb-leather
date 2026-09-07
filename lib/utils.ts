import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertToPlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

// Format number with two decimal places
export function formatNumberWithDecimal(num: number): string {
  const [int, decimal] = num.toString().split(".");

  return decimal ? `${int}.${decimal.padEnd(2, "0")}` : `${int}.00`;
}

// Round to 2 decimal places
export const round2 = (value: number | string) => {
  if (typeof value === "number") {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  if (typeof value === "string") {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  throw new Error("Value is not a number or string");
};
