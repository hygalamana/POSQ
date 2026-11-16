import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Product } from '../stores/cartStore';
import { offlineStorage } from '../lib/offlineStorage';

export const useProducts = (categoryId?: string, search?: string) => {
  return useQuery({
    queryKey: ['products', categoryId, search],
    queryFn: async () => {
      // If offline, read directly from local cache
      if (typeof window !== 'undefined' && !navigator.onLine) {
        let cached = offlineStorage.getProducts();
        if (categoryId) {
          cached = cached.filter((p) => p.categoryId === categoryId);
        }
        if (search && search.trim()) {
          const q = search.toLowerCase();
          cached = cached.filter((p) => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
        }
        return cached as Product[];
      }

      try {
        const params = new URLSearchParams();
        if (categoryId) params.append('categoryId', categoryId);
        if (search) params.append('search', search);
        
        const res = await api.get(`/products?${params.toString()}`);
        const products = res.data.data as Product[];

        // Cache all products when fetching without category/search filter
        if (!categoryId && !search && Array.isArray(products)) {
          offlineStorage.saveProducts(products);
        }

        return products;
      } catch (err) {
        console.warn('Failed to fetch products from server, using offline cache:', err);
        let cached = offlineStorage.getProducts();
        if (categoryId) {
          cached = cached.filter((p) => p.categoryId === categoryId);
        }
        if (search && search.trim()) {
          const q = search.toLowerCase();
          cached = cached.filter((p) => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
        }
        return cached as Product[];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 mins cache
  });
};
