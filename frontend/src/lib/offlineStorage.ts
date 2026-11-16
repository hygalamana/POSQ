/**
 * POS Offline Storage & Transaction Queue Engine
 * Handles caching of catalog, members, and offline pending sales
 */

export interface OfflineSaleItem {
  productId: string;
  quantity: number;
  variantName?: string;
  unitPrice?: number;
  subtotal?: number;
  product?: {
    id: string;
    name: string;
    price: number;
    emoji?: string;
  };
}

export interface OfflineSale {
  offlineTempId: string;
  invoiceNumber: string;
  offlineCreatedAt: string;
  paymentMethod: string;
  amountPaid: number;
  discountAmount: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  changeAmount: number;
  usePoints?: boolean;
  memberId?: string;
  customerName?: string;
  notes?: string;
  items: OfflineSaleItem[];
  cashier?: {
    id: string;
    name: string;
  };
  outlet?: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
  };
  member?: {
    id: string;
    name: string;
    points?: number;
  };
  isOffline: true;
}

const STORAGE_KEYS = {
  PRODUCTS: "posq_offline_products",
  CATEGORIES: "posq_offline_categories",
  MEMBERS: "posq_offline_members",
  ACTIVE_SHIFT: "posq_offline_active_shift",
  SALES_QUEUE: "posq_offline_sales_queue",
};

// Safe localStorage access
const getItem = <T>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return defaultValue;
  }
};

const setItem = (key: string, value: any): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage:`, err);
  }
};

export const offlineStorage = {
  // PRODUCTS
  saveProducts: (products: any[]) => setItem(STORAGE_KEYS.PRODUCTS, products),
  getProducts: (): any[] => getItem<any[]>(STORAGE_KEYS.PRODUCTS, []),

  // CATEGORIES
  saveCategories: (categories: any[]) => setItem(STORAGE_KEYS.CATEGORIES, categories),
  getCategories: (): any[] => getItem<any[]>(STORAGE_KEYS.CATEGORIES, []),

  // MEMBERS
  saveMembers: (members: any[]) => setItem(STORAGE_KEYS.MEMBERS, members),
  getMembers: (): any[] => getItem<any[]>(STORAGE_KEYS.MEMBERS, []),

  // ACTIVE SHIFT
  saveActiveShift: (shift: any) => setItem(STORAGE_KEYS.ACTIVE_SHIFT, shift),
  getActiveShift: (): any => getItem<any>(STORAGE_KEYS.ACTIVE_SHIFT, null),

  // SALES QUEUE
  getSalesQueue: (): OfflineSale[] => getItem<OfflineSale[]>(STORAGE_KEYS.SALES_QUEUE, []),

  saveSaleToQueue: (sale: OfflineSale): void => {
    const queue = offlineStorage.getSalesQueue();
    queue.push(sale);
    setItem(STORAGE_KEYS.SALES_QUEUE, queue);
  },

  removeSaleFromQueue: (offlineTempId: string): void => {
    const queue = offlineStorage.getSalesQueue();
    const filtered = queue.filter((s) => s.offlineTempId !== offlineTempId);
    setItem(STORAGE_KEYS.SALES_QUEUE, filtered);
  },

  clearSalesQueue: (): void => {
    setItem(STORAGE_KEYS.SALES_QUEUE, []);
  },

  getSaleById: (id: string): OfflineSale | undefined => {
    const queue = offlineStorage.getSalesQueue();
    return queue.find((s) => s.offlineTempId === id || s.invoiceNumber === id);
  },

  // Generates offline invoice ID e.g. OFF-260827-XXXX
  generateOfflineInvoiceNumber: (): string => {
    const d = new Date();
    const year = String(d.getFullYear()).slice(-2);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `OFF-${year}${month}${date}-${rand}`;
  },
};
