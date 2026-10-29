import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";

// Public storefront catalog — categories and products, no auth required.
// Patterns and examples: skills/app/references/web.md
export function useCategories() {
  return useQuery(orpc.catalog.categories.list.queryOptions({ staleTime: 60_000 }));
}

export function useProducts(input: { categorySlug?: string; q?: string; page?: number; pageSize?: number }) {
  return useQuery(
    orpc.catalog.products.list.queryOptions({
      input,
      staleTime: 30_000,
    }),
  );
}

export function useProduct(slug: string | undefined) {
  return useQuery(
    orpc.catalog.products.get.queryOptions({
      input: { slug: slug ?? "" },
      enabled: Boolean(slug),
      staleTime: 30_000,
      retry: false,
    }),
  );
}
