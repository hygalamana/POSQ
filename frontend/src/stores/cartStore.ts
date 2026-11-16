import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Product {
  id: string;
  name: string;
  price: number;
  emoji: string;
  stock: number | null;
  imageUrl?: string;
  categoryId: string;
  variants?: { name: string; price: number }[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  variantName?: string;
}

interface CartState {
  items: Record<string, CartItem>;
  totalItems: number;
  subtotal: number;
  discountType: 'nominal' | 'percentage';
  discountValue: number;
  discountAmount: number;
  tax: number;
  total: number;
  
  addItem: (product: Product, variantName?: string) => void;
  removeItem: (itemId: string) => void;
  updateQty: (itemId: string, qty: number) => void;
  updateItemVariant: (oldItemId: string, newVariantName: string) => void;
  clearCart: () => void;
  setDiscount: (type: 'nominal' | 'percentage', value: number) => void;
  recalculate: () => void;
}

import { useAuthStore } from './authStore';

const calculateTotals = (
  items: Record<string, CartItem>, 
  discountType: 'nominal' | 'percentage', 
  discountValue: number
) => {
  const user = useAuthStore.getState().user;
  const hasTax = user?.outlet?.hasTax ?? true;
  const taxRate = hasTax ? (user?.outlet?.taxRate ?? parseFloat(process.env.NEXT_PUBLIC_DEFAULT_TAX_RATE || '0.1')) : 0;
  let totalItems = 0;
  let subtotal = 0;

  for (const item of Object.values(items)) {
    totalItems += item.quantity;
    
    let price = item.product.price;
    if (item.variantName && item.product.variants) {
      const variant = item.product.variants.find(v => v.name === item.variantName);
      if (variant) price = variant.price;
    }
    
    subtotal += price * item.quantity;
  }

  const discountAmount = discountType === 'percentage' 
    ? (subtotal * (discountValue / 100)) 
    : discountValue;
    
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = discountedSubtotal * taxRate;
  const total = discountedSubtotal + tax;

  return { totalItems, subtotal, discountType, discountValue, discountAmount, tax, total };
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: {},
      totalItems: 0,
      subtotal: 0,
      discountType: 'nominal',
      discountValue: 0,
      discountAmount: 0,
      tax: 0,
      total: 0,

      addItem: (product, variantName) => {
        const items = { ...get().items };
        const key = variantName ? `${product.id}-${variantName}` : product.id;
        
        if (items[key]) {
          items[key].quantity += 1;
        } else {
          items[key] = { product, quantity: 1, variantName };
        }
        set({ items, ...calculateTotals(items, get().discountType, get().discountValue) });
      },
      
      removeItem: (itemId) => {
        const items = { ...get().items };
        delete items[itemId];
        set({ items, ...calculateTotals(items, get().discountType, get().discountValue) });
      },
      
      updateQty: (itemId, qty) => {
        const items = { ...get().items };
        if (items[itemId]) {
          if (qty <= 0) {
            delete items[itemId];
          } else {
            items[itemId].quantity = qty;
          }
        }
        set({ items, ...calculateTotals(items, get().discountType, get().discountValue) });
      },
      
      updateItemVariant: (oldItemId, newVariantName) => {
        const items = { ...get().items };
        const oldItem = items[oldItemId];
        if (!oldItem) return;

        const newKey = newVariantName ? `${oldItem.product.id}-${newVariantName}` : oldItem.product.id;
        
        if (items[newKey] && newKey !== oldItemId) {
          items[newKey].quantity += oldItem.quantity;
          delete items[oldItemId];
        } else if (newKey !== oldItemId) {
          items[newKey] = { ...oldItem, variantName: newVariantName };
          delete items[oldItemId];
        }
        
        set({ items, ...calculateTotals(items, get().discountType, get().discountValue) });
      },
      
      clearCart: () => {
        set({ items: {}, totalItems: 0, subtotal: 0, discountType: 'nominal', discountValue: 0, discountAmount: 0, tax: 0, total: 0 });
      },
      setDiscount: (type, value) => {
        set({ ...calculateTotals(get().items, type, value) });
      },
      recalculate: () => {
        const items = get().items;
        set({ ...calculateTotals(items, get().discountType, get().discountValue) });
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
