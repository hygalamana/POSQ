import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const users = sqliteTable('User', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('passwordHash').notNull(),
  role: text('role').notNull().default('CASHIER'),
  avatar: text('avatar'),
  isActive: integer('isActive', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  outletId: text('outletId').notNull(),
});

export const outlets = sqliteTable('Outlet', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  logo: text('logo'),
  taxRate: real('taxRate').notNull().default(0.10),
  hasTax: integer('hasTax', { mode: 'boolean' }).notNull().default(true),
  receiptPrintTax: integer('receiptPrintTax', { mode: 'boolean' }).notNull().default(true),
  currency: text('currency').notNull().default('IDR'),
  qrisPayload: text('qrisPayload'),
  createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  pointsRate: real('pointsRate').notNull().default(0),
  pointsEnabled: integer('pointsEnabled', { mode: 'boolean' }).notNull().default(false),
});

export const categories = sqliteTable('Category', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  icon: text('icon'),
  sortOrder: integer('sortOrder').notNull().default(0),
  isActive: integer('isActive', { mode: 'boolean' }).notNull().default(true),
  outletId: text('outletId').notNull(),
});

export const products = sqliteTable('Product', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  hpp: real('hpp').notNull().default(0),
  imageUrl: text('imageUrl'),
  emoji: text('emoji').notNull().default('🍽️'),
  sku: text('sku'),
  stock: integer('stock'),
  isActive: integer('isActive', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sortOrder').notNull().default(0),
  createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  categoryId: text('categoryId').notNull(),
  outletId: text('outletId').notNull(),
});

export const productVariants = sqliteTable('ProductVariant', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  price: real('price').notNull(),
  hpp: real('hpp').notNull().default(0),
  productId: text('productId').notNull(),
});

export const sales = sqliteTable('Sale', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  invoiceNumber: text('invoiceNumber').notNull().unique(),
  status: text('status').notNull().default('PENDING'),
  paymentMethod: text('paymentMethod').notNull(),
  subtotal: real('subtotal').notNull(),
  discountAmount: real('discountAmount').notNull().default(0),
  taxAmount: real('taxAmount').notNull(),
  additionalFee: real('additionalFee').notNull().default(0),
  total: real('total').notNull(),
  amountPaid: real('amountPaid'),
  changeAmount: real('changeAmount'),
  notes: text('notes'),
  customerName: text('customerName'),
  createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  cashierId: text('cashierId').notNull(),
  outletId: text('outletId').notNull(),
  memberId: text('memberId'),
  pointsEarned: integer('pointsEarned').default(0),
  shiftId: text('shiftId'),
});

export const saleItems = sqliteTable('SaleItem', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unitPrice').notNull(),
  unitHpp: real('unitHpp').notNull().default(0),
  subtotal: real('subtotal').notNull(),
  notes: text('notes'),
  variantName: text('variantName'),
  saleId: text('saleId').notNull(),
  productId: text('productId').notNull(),
});

export const receipts = sqliteTable('Receipt', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  saleId: text('saleId').notNull().unique(),
  fileUrl: text('fileUrl'),
  createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export const cashflows = sqliteTable('Cashflow', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  type: text('type').notNull(),
  amount: real('amount').notNull(),
  description: text('description').notNull(),
  date: integer('date', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  outletId: text('outletId').notNull(),
  userId: text('userId').notNull(),
});

export const members = sqliteTable('Member', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  points: integer('points').notNull().default(0),
  createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  outletId: text('outletId').notNull(),
});

export const stockMovements = sqliteTable('StockMovement', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  type: text('type').notNull(),
  quantity: integer('quantity').notNull(),
  notes: text('notes'),
  createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  productId: text('productId').notNull(),
  userId: text('userId').notNull(),
  outletId: text('outletId').notNull(),
});

export const shifts = sqliteTable('Shift', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  startTime: integer('startTime', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  endTime: integer('endTime', { mode: 'timestamp_ms' }),
  startBalance: real('startBalance').notNull(),
  endBalance: real('endBalance'),
  actualBalance: real('actualBalance'),
  status: text('status').notNull().default('OPEN'),
  cashierId: text('cashierId').notNull(),
  outletId: text('outletId').notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  outlet: one(outlets, {
    fields: [users.outletId],
    references: [outlets.id],
  }),
  sales: many(sales),
  cashflows: many(cashflows),
  stockMovements: many(stockMovements),
  shifts: many(shifts),
}));

export const outletsRelations = relations(outlets, ({ many }) => ({
  users: many(users),
  products: many(products),
  sales: many(sales),
  cashflows: many(cashflows),
  categories: many(categories),
  members: many(members),
  stockMovements: many(stockMovements),
  shifts: many(shifts),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  outlet: one(outlets, {
    fields: [categories.outletId],
    references: [outlets.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  outlet: one(outlets, {
    fields: [products.outletId],
    references: [outlets.id],
  }),
  variants: many(productVariants),
  saleItems: many(saleItems),
  stockMovements: many(stockMovements),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  cashier: one(users, {
    fields: [sales.cashierId],
    references: [users.id],
  }),
  outlet: one(outlets, {
    fields: [sales.outletId],
    references: [outlets.id],
  }),
  member: one(members, {
    fields: [sales.memberId],
    references: [members.id],
  }),
  shift: one(shifts, {
    fields: [sales.shiftId],
    references: [shifts.id],
  }),
  items: many(saleItems),
  receipt: one(receipts),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));

export const receiptsRelations = relations(receipts, ({ one }) => ({
  sale: one(sales, {
    fields: [receipts.saleId],
    references: [sales.id],
  }),
}));

export const cashflowsRelations = relations(cashflows, ({ one }) => ({
  outlet: one(outlets, {
    fields: [cashflows.outletId],
    references: [outlets.id],
  }),
  user: one(users, {
    fields: [cashflows.userId],
    references: [users.id],
  }),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  outlet: one(outlets, {
    fields: [members.outletId],
    references: [outlets.id],
  }),
  sales: many(sales),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  product: one(products, {
    fields: [stockMovements.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [stockMovements.userId],
    references: [users.id],
  }),
  outlet: one(outlets, {
    fields: [stockMovements.outletId],
    references: [outlets.id],
  }),
}));

export const shiftsRelations = relations(shifts, ({ one, many }) => ({
  cashier: one(users, {
    fields: [shifts.cashierId],
    references: [users.id],
  }),
  outlet: one(outlets, {
    fields: [shifts.outletId],
    references: [outlets.id],
  }),
  sales: many(sales),
}));
