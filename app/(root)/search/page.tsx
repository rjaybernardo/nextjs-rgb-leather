import type { Metadata } from "next";
import Link from "next/link";

import Pagination from "@/components/shared/pagination";
import SearchBox from "@/components/shared/header/search-box";
import ProductCard from "@/components/shared/product/product-card";
import { buttonVariants } from "@/components/ui/button";
import {
  getAllCategories,
  getAllProducts,
} from "@/lib/actions/product.actions";
import { getMyWishlistIds } from "@/lib/actions/wishlist.actions";
import { cn } from "@/lib/utils";

type SearchParams = {
  q?: string;
  category?: string;
  price?: string;
  rating?: string;
  sort?: string;
  page?: string;
};

type SearchPageProps = {
  searchParams: Promise<SearchParams>;
};

const PRICE_RANGES = [
  { label: "Under ₱1,000", value: "0-1000" },
  { label: "₱1,000 to ₱2,500", value: "1000-2500" },
  { label: "₱2,500 to ₱5,000", value: "2500-5000" },
  { label: "₱5,000 and up", value: "5000-" },
];

const RATINGS = [4, 3, 2, 1];

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: low to high", value: "lowest" },
  { label: "Price: high to low", value: "highest" },
  { label: "Top rated", value: "rating" },
];

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q, category } = await searchParams;

  const categoryName =
    category && category !== "all" ? category.replace(/-/g, " ") : undefined;

  const title = [q && `"${q}"`, categoryName].filter(Boolean).join(" in ");

  return {
    title: title ? `Search ${title}` : "Search Products",
  };
}

const SearchPage = async ({ searchParams }: SearchPageProps) => {
  const params = await searchParams;

  const {
    q = "",
    category = "all",
    price = "all",
    rating = "all",
    sort = "newest",
  } = params;

  const page = Number(params.page) || 1;

  const [products, categories, wishlistIds] = await Promise.all([
    getAllProducts({
      query: q,
      category,
      price,
      rating,
      sort,
      page,
    }),
    getAllCategories(),
    getMyWishlistIds(),
  ]);

  const wishlisted = new Set(wishlistIds);

  // Build a link that changes one filter and resets to the first page
  const filterUrl = (changes: Partial<SearchParams>) => {
    const next = { q, category, price, rating, sort, ...changes };

    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(next)) {
      if (value && value !== "all" && !(key === "sort" && value === "newest")) {
        query.set(key, value);
      }
    }

    const queryString = query.toString();

    return queryString ? `/search?${queryString}` : "/search";
  };

  const linkClass = (active: boolean) =>
    cn(
      "block rounded-md px-2 py-1 text-sm hover:bg-muted",
      active && "bg-muted font-semibold",
    );

  const activeFilters = [
    q && { label: `"${q}"`, clear: filterUrl({ q: "" }) },
    category !== "all" && {
      label: categories.find((item) => item.slug === category)?.name ?? category,
      clear: filterUrl({ category: "all" }),
    },
    price !== "all" && {
      label:
        PRICE_RANGES.find((range) => range.value === price)?.label ?? price,
      clear: filterUrl({ price: "all" }),
    },
    rating !== "all" && {
      label: `${rating}★ & up`,
      clear: filterUrl({ rating: "all" }),
    },
  ].filter(Boolean) as { label: string; clear: string }[];

  return (
    <div className="grid gap-8 py-6 md:grid-cols-5">
      <aside className="space-y-6 md:col-span-1">
        <div>
          <h2 className="mb-2 font-semibold">Category</h2>

          <ul className="space-y-1">
            <li>
              <Link
                href={filterUrl({ category: "all" })}
                className={linkClass(category === "all")}
              >
                All categories
              </Link>
            </li>

            {categories.map((item) => (
              <li key={item.slug}>
                <Link
                  href={filterUrl({ category: item.slug })}
                  className={linkClass(category === item.slug)}
                >
                  {item.name}{" "}
                  <span className="text-muted-foreground">({item.count})</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-2 font-semibold">Price</h2>

          <ul className="space-y-1">
            <li>
              <Link
                href={filterUrl({ price: "all" })}
                className={linkClass(price === "all")}
              >
                Any price
              </Link>
            </li>

            {PRICE_RANGES.map((range) => (
              <li key={range.value}>
                <Link
                  href={filterUrl({ price: range.value })}
                  className={linkClass(price === range.value)}
                >
                  {range.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-2 font-semibold">Customer rating</h2>

          <ul className="space-y-1">
            <li>
              <Link
                href={filterUrl({ rating: "all" })}
                className={linkClass(rating === "all")}
              >
                Any rating
              </Link>
            </li>

            {RATINGS.map((value) => (
              <li key={value}>
                <Link
                  href={filterUrl({ rating: String(value) })}
                  className={linkClass(rating === String(value))}
                >
                  {value}★ &amp; up
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="space-y-4 md:col-span-4">
        <SearchBox className="max-w-xl" defaultValue={q} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {products.totalCount}{" "}
              {products.totalCount === 1 ? "product" : "products"}
            </p>

            {activeFilters.map((filter) => (
              <Link
                key={filter.label}
                href={filter.clear}
                className={buttonVariants({ variant: "outline", size: "sm" })}
                aria-label={`Remove filter ${filter.label}`}
              >
                {filter.label} ✕
              </Link>
            ))}

            {activeFilters.length > 0 && (
              <Link href="/search" className="link text-sm">
                Clear all
              </Link>
            )}
          </div>

          <nav aria-label="Sort products" className="flex flex-wrap gap-1">
            {SORT_OPTIONS.map((option) => (
              <Link
                key={option.value}
                href={filterUrl({ sort: option.value })}
                className={buttonVariants({
                  variant: sort === option.value ? "secondary" : "ghost",
                  size: "sm",
                })}
                aria-current={sort === option.value ? "true" : undefined}
              >
                {option.label}
              </Link>
            ))}
          </nav>
        </div>

        {products.data.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-3">
            {products.data.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                wishlisted={wishlisted.has(product.id)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border p-8 text-center">
            <p className="font-medium">No products match your search.</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Try fewer filters or a different word.
            </p>
          </div>
        )}

        {products.totalPages > 1 && (
          <Pagination page={page} totalPages={products.totalPages} />
        )}
      </section>
    </div>
  );
};

export default SearchPage;
