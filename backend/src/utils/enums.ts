export const Role = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
} as const;

export const SaleStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

export const PaymentMethod = {
  CASH: 'CASH',
  CARD: 'CARD',
  QRIS: 'QRIS',
  TRANSFER: 'TRANSFER',
} as const;
