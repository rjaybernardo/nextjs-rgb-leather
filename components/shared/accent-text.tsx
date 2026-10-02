import { Fragment } from "react";

// Renders "What do you *carry?*" with the starred words in the italic serif
// accent, as in the storefront design. Text without asterisks is unchanged.
export default function AccentText({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);

  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
          <span key={index} className="font-accent">
            {part.slice(1, -1)}
          </span>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}

// Plain text for places that can't show the accent (titles, alt text)
export const stripAccents = (text: string) => text.replace(/\*([^*]+)\*/g, "$1");
