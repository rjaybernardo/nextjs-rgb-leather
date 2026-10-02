import "server-only";

import { revalidateTag } from "next/cache";

/*
 * Storefront catalog reads (categories, product lists, product pages) are
 * cached because every page shows the category menu and the database is a
 * ~300 ms round trip away. Anything that changes products, stock, ratings or
 * categories must call invalidateCatalog().
 */
export const CATALOG_TAG = "catalog";

// Safety net: cached entries refresh at least this often (seconds)
export const CATALOG_REVALIDATE_SECONDS = 300;

export function invalidateCatalog() {
  // expire: 0 so the next request reads fresh data instead of a stale copy
  revalidateTag(CATALOG_TAG, { expire: 0 });
}
