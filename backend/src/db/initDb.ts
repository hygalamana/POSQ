import type Database from 'better-sqlite3';

export function initDatabase(sqlite: Database.Database): void {
  // Enable foreign keys
  sqlite.pragma('foreign_keys = ON');

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS Outlet (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      logo TEXT,
      taxRate REAL NOT NULL DEFAULT 0.10,
      hasTax INTEGER NOT NULL DEFAULT 1,
      receiptPrintTax INTEGER NOT NULL DEFAULT 1,
      currency TEXT NOT NULL DEFAULT 'IDR',
      qrisPayload TEXT,
      createdAt INTEGER NOT NULL,
      pointsRate REAL NOT NULL DEFAULT 0,
      pointsEnabled INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS User (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'CASHIER',
      avatar TEXT,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      outletId TEXT NOT NULL,
      FOREIGN KEY (outletId) REFERENCES Outlet(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Category (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      sortOrder INTEGER NOT NULL DEFAULT 0,
      isActive INTEGER NOT NULL DEFAULT 1,
      outletId TEXT NOT NULL,
      FOREIGN KEY (outletId) REFERENCES Outlet(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Product (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      hpp REAL NOT NULL DEFAULT 0,
      imageUrl TEXT,
      emoji TEXT NOT NULL DEFAULT '🍽️',
      sku TEXT,
      stock INTEGER,
      isActive INTEGER NOT NULL DEFAULT 1,
      sortOrder INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      categoryId TEXT NOT NULL,
      outletId TEXT NOT NULL,
      FOREIGN KEY (categoryId) REFERENCES Category(id) ON DELETE CASCADE,
      FOREIGN KEY (outletId) REFERENCES Outlet(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ProductVariant (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      hpp REAL NOT NULL DEFAULT 0,
      productId TEXT NOT NULL,
      FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Member (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      points INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      outletId TEXT NOT NULL,
      FOREIGN KEY (outletId) REFERENCES Outlet(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Shift (
      id TEXT PRIMARY KEY,
      startTime INTEGER NOT NULL,
      endTime INTEGER,
      startBalance REAL NOT NULL,
      endBalance REAL,
      actualBalance REAL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      cashierId TEXT NOT NULL,
      outletId TEXT NOT NULL,
      FOREIGN KEY (cashierId) REFERENCES User(id) ON DELETE CASCADE,
      FOREIGN KEY (outletId) REFERENCES Outlet(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Sale (
      id TEXT PRIMARY KEY,
      invoiceNumber TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'PENDING',
      paymentMethod TEXT NOT NULL,
      subtotal REAL NOT NULL,
      discountAmount REAL NOT NULL DEFAULT 0,
      taxAmount REAL NOT NULL,
      additionalFee REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL,
      amountPaid REAL,
      changeAmount REAL,
      notes TEXT,
      customerName TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      cashierId TEXT NOT NULL,
      outletId TEXT NOT NULL,
      memberId TEXT,
      pointsEarned INTEGER DEFAULT 0,
      shiftId TEXT,
      FOREIGN KEY (cashierId) REFERENCES User(id) ON DELETE CASCADE,
      FOREIGN KEY (outletId) REFERENCES Outlet(id) ON DELETE CASCADE,
      FOREIGN KEY (memberId) REFERENCES Member(id) ON DELETE SET NULL,
      FOREIGN KEY (shiftId) REFERENCES Shift(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS SaleItem (
      id TEXT PRIMARY KEY,
      quantity INTEGER NOT NULL,
      unitPrice REAL NOT NULL,
      unitHpp REAL NOT NULL DEFAULT 0,
      subtotal REAL NOT NULL,
      notes TEXT,
      variantName TEXT,
      saleId TEXT NOT NULL,
      productId TEXT NOT NULL,
      FOREIGN KEY (saleId) REFERENCES Sale(id) ON DELETE CASCADE,
      FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Receipt (
      id TEXT PRIMARY KEY,
      saleId TEXT NOT NULL UNIQUE,
      fileUrl TEXT,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (saleId) REFERENCES Sale(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Cashflow (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      date INTEGER NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      outletId TEXT NOT NULL,
      userId TEXT NOT NULL,
      FOREIGN KEY (outletId) REFERENCES Outlet(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS StockMovement (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      notes TEXT,
      createdAt INTEGER NOT NULL,
      productId TEXT NOT NULL,
      userId TEXT NOT NULL,
      outletId TEXT NOT NULL,
      FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
      FOREIGN KEY (outletId) REFERENCES Outlet(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_users_outletId ON User(outletId);
    CREATE INDEX IF NOT EXISTS idx_products_outletId ON Product(outletId);
    CREATE INDEX IF NOT EXISTS idx_products_categoryId ON Product(categoryId);
    CREATE INDEX IF NOT EXISTS idx_sales_outletId ON Sale(outletId);
    CREATE INDEX IF NOT EXISTS idx_sales_cashierId ON Sale(cashierId);
    CREATE INDEX IF NOT EXISTS idx_sales_invoiceNumber ON Sale(invoiceNumber);
    CREATE INDEX IF NOT EXISTS idx_saleItems_saleId ON SaleItem(saleId);
    CREATE INDEX IF NOT EXISTS idx_cashflow_outletId ON Cashflow(outletId);
    CREATE INDEX IF NOT EXISTS idx_shifts_outletId ON Shift(outletId);
  `);
}
