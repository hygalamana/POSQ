import { db, sqlite, outlets, users, categories, products, sales, saleItems } from '../config/database';
import { Role, SaleStatus, PaymentMethod } from '../utils/enums';
import bcrypt from 'bcryptjs';
import { createId } from '@paralleldrive/cuid2';

async function main() {
  console.log('🌱 Seeding database with Drizzle ORM...');

  // 1. Create Outlet
  const outletId = createId();
  const now = new Date();
  await db.insert(outlets).values({
    id: outletId,
    name: 'Demo Resto',
    address: 'Jl. Sudirman No. 1, Jakarta',
    phone: '081234567890',
    taxRate: 0.10,
    hasTax: true,
    receiptPrintTax: true,
    currency: 'IDR',
    createdAt: now,
  });

  // 2. Create Users
  const passwordHash = await bcrypt.hash('demo123', 10);

  const ownerId = createId();
  await db.insert(users).values({
    id: ownerId,
    name: 'Owner',
    email: 'owner@demo.com',
    passwordHash,
    role: Role.OWNER,
    outletId,
    createdAt: now,
    updatedAt: now,
  });

  const managerId = createId();
  await db.insert(users).values({
    id: managerId,
    name: 'Manager',
    email: 'manager@demo.com',
    passwordHash,
    role: Role.MANAGER,
    outletId,
    createdAt: now,
    updatedAt: now,
  });

  const cashierId = createId();
  await db.insert(users).values({
    id: cashierId,
    name: 'Kasir',
    email: 'kasir@demo.com',
    passwordHash,
    role: Role.CASHIER,
    outletId,
    createdAt: now,
    updatedAt: now,
  });

  // 3. Create Categories
  const categoryDefs = [
    { name: 'Snack', icon: '🍟' },
    { name: 'Minuman', icon: '🥤' },
    { name: 'Makanan', icon: '🍛' },
    { name: 'Seafood', icon: '🦐' },
    { name: 'Dessert', icon: '🍰' },
    { name: 'Paket', icon: '🍱' },
  ];

  const createdCategories: { id: string; name: string }[] = [];
  for (let i = 0; i < categoryDefs.length; i++) {
    const cat = categoryDefs[i];
    const catId = createId();
    await db.insert(categories).values({
      id: catId,
      name: cat.name,
      icon: cat.icon,
      sortOrder: i,
      outletId,
    });
    createdCategories.push({ id: catId, name: cat.name });
  }

  // 4. Create Products
  const productsData = [
    { name: 'French Fries', price: 20000, hpp: 10000, emoji: '🍟', catIndex: 0 },
    { name: 'Onion Rings', price: 25000, hpp: 12000, emoji: '🧅', catIndex: 0 },
    { name: 'Nachos', price: 35000, hpp: 18000, emoji: '🌮', catIndex: 0 },

    { name: 'Iced Tea', price: 10000, hpp: 3000, emoji: '🥤', catIndex: 1 },
    { name: 'Lemon Tea', price: 15000, hpp: 5000, emoji: '🍋', catIndex: 1 },
    { name: 'Americano', price: 25000, hpp: 8000, emoji: '☕', catIndex: 1 },
    { name: 'Latte', price: 30000, hpp: 12000, emoji: '☕', catIndex: 1 },

    { name: 'Nasi Goreng', price: 40000, hpp: 20000, emoji: '🍛', catIndex: 2 },
    { name: 'Mie Goreng', price: 35000, hpp: 18000, emoji: '🍜', catIndex: 2 },
    { name: 'Ayam Bakar', price: 45000, hpp: 25000, emoji: '🍗', catIndex: 2 },

    { name: 'Udang Saus Tiram', price: 65000, hpp: 38000, emoji: '🦐', catIndex: 3 },
    { name: 'Cumi Goreng Tepung', price: 55000, hpp: 30000, emoji: '🦑', catIndex: 3 },
    { name: 'Ikan Bakar', price: 80000, hpp: 45000, emoji: '🐟', catIndex: 3 },

    { name: 'Cheesecake', price: 35000, hpp: 18000, emoji: '🍰', catIndex: 4 },
    { name: 'Pudding', price: 20000, hpp: 8000, emoji: '🍮', catIndex: 4 },
    { name: 'Ice Cream', price: 25000, hpp: 10000, emoji: '🍦', catIndex: 4 },

    { name: 'Paket Ayam', price: 55000, hpp: 30000, emoji: '🍱', catIndex: 5 },
    { name: 'Paket Seafood', price: 85000, hpp: 48000, emoji: '🍱', catIndex: 5 },
    { name: 'Paket Hemat', price: 40000, hpp: 22000, emoji: '🍱', catIndex: 5 },
    { name: 'Paket Keluarga', price: 150000, hpp: 80000, emoji: '👨‍👩‍👧‍👦', catIndex: 5 },
  ];

  const createdProducts: { id: string; name: string; price: number; hpp: number }[] = [];
  for (const p of productsData) {
    const prodId = createId();
    await db.insert(products).values({
      id: prodId,
      name: p.name,
      price: p.price,
      hpp: p.hpp,
      emoji: p.emoji,
      categoryId: createdCategories[p.catIndex].id,
      outletId,
      createdAt: now,
      updatedAt: now,
    });
    createdProducts.push({ id: prodId, name: p.name, price: p.price, hpp: p.hpp });
  }

  // 5. Create Sample Transactions
  console.log('📦 Generating sample transactions...');
  const today = new Date();

  for (let i = 1; i <= 15; i++) {
    const txDate = new Date(today);
    txDate.setDate(today.getDate() - Math.floor(Math.random() * 10));

    const p1 = createdProducts[Math.floor(Math.random() * createdProducts.length)];
    const p2 = createdProducts[Math.floor(Math.random() * createdProducts.length)];

    const qty1 = Math.floor(Math.random() * 3) + 1;
    const qty2 = Math.floor(Math.random() * 2) + 1;

    const subtotal = p1.price * qty1 + p2.price * qty2;
    const taxAmount = Math.round(subtotal * 0.10);
    const total = subtotal + taxAmount;
    const saleId = createId();

    const invDateStr = txDate.toISOString().split('T')[0].replace(/-/g, '');
    const invoiceNumber = `INV-${invDateStr}-${String(i).padStart(4, '0')}`;

    await db.insert(sales).values({
      id: saleId,
      invoiceNumber,
      status: SaleStatus.PAID,
      paymentMethod: PaymentMethod.CASH,
      subtotal,
      taxAmount,
      total,
      amountPaid: total,
      changeAmount: 0,
      createdAt: txDate,
      updatedAt: txDate,
      cashierId,
      outletId,
    });

    await db.insert(saleItems).values([
      {
        id: createId(),
        saleId,
        productId: p1.id,
        quantity: qty1,
        unitPrice: p1.price,
        unitHpp: p1.hpp,
        subtotal: p1.price * qty1,
      },
      {
        id: createId(),
        saleId,
        productId: p2.id,
        quantity: qty2,
        unitPrice: p2.price,
        unitHpp: p2.hpp,
        subtotal: p2.price * qty2,
      },
    ]);
  }

  console.log('✅ Database seeded successfully!');
  sqlite.close();
}

main().catch((e) => {
  console.error('❌ Seeding failed:', e);
  process.exit(1);
});
