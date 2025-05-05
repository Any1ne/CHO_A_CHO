import { useQuery } from "@tanstack/react-query";
import { fetchProductById, fetchFlavoursByCategory } from "@/lib/api";

export function useProduct(productId: string | null) {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProductById(productId!),
    enabled: !!productId,
  });
}

export function useFlavours(category: string | null) {
  return useQuery({
    queryKey: ["flavours", category],
    queryFn: () => fetchFlavoursByCategory(category!),
    enabled: !!category,
  });
}
