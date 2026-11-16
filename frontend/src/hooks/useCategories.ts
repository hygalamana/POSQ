import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { offlineStorage } from '../lib/offlineStorage';

export interface Category {
  id: string;
  name: string;
  icon?: string;
  sortOrder: number;
}

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      if (typeof window !== 'undefined' && !navigator.onLine) {
        return offlineStorage.getCategories() as Category[];
      }

      try {
        const res = await api.get('/categories');
        const categories = res.data.data as Category[];
        if (Array.isArray(categories)) {
          offlineStorage.saveCategories(categories);
        }
        return categories;
      } catch (err) {
        console.warn('Failed to fetch categories from server, using offline cache:', err);
        return offlineStorage.getCategories() as Category[];
      }
    },
    staleTime: 1000 * 60 * 10,
  });
};
