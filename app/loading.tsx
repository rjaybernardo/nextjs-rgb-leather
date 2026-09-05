import { Loader2 } from "lucide-react";

const Loading = () => {
  return (
    <div
      className="flex min-h-[50vh] items-center justify-center"
      role="status"
      aria-label="Loading"
    >
      <Loader2 className="size-10 animate-spin" aria-hidden="true" />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Loading;
