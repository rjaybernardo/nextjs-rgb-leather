import "server-only";

import { unstable_cache } from "next/cache";

/*
 * unstable_cache in production; the plain function in development.
 *
 * Next compares cache timestamps (Date.now) with invalidation times
 * (performance clock). The performance clock stops while a laptop sleeps, so
 * after a suspend, saves can fail to expire entries in a long-running
 * `next dev` and edits seem not to show for up to the revalidate time.
 * Production servers don't suspend, so caching stays on there.
 */
export function cachedQuery<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  keyParts: string[],
  options: { tags: string[]; revalidate: number },
): (...args: Args) => Promise<Result> {
  if (process.env.NODE_ENV === "development") {
    return fn;
  }

  return unstable_cache(fn, keyParts, options);
}
