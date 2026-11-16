const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'prisma/dev.db');
const db = new Database(dbPath);

function deleteUserSafely(userId) {
  const userSales = db.prepare('SELECT id FROM Sale WHERE cashierId = ?').all(userId);
  const saleIds = userSales.map(s => s.id);

  if (saleIds.length > 0) {
    const placeholders = saleIds.map(() => '?').join(',');
    db.prepare(`DELETE FROM Receipt WHERE saleId IN (${placeholders})`).run(...saleIds);
    db.prepare(`DELETE FROM SaleItem WHERE saleId IN (${placeholders})`).run(...saleIds);
    db.prepare(`DELETE FROM Sale WHERE id IN (${placeholders})`).run(...saleIds);
  }

  db.prepare('DELETE FROM Cashflow WHERE userId = ?').run(userId);
  db.prepare('DELETE FROM StockMovement WHERE userId = ?').run(userId);
  db.prepare('DELETE FROM Shift WHERE cashierId = ?').run(userId);
  db.prepare('DELETE FROM User WHERE id = ?').run(userId);
}

function deleteOutletSafely(outletId) {
  const outletSales = db.prepare('SELECT id FROM Sale WHERE outletId = ?').all(outletId);
  const saleIds = outletSales.map(s => s.id);

  if (saleIds.length > 0) {
    const placeholders = saleIds.map(() => '?').join(',');
    db.prepare(`DELETE FROM Receipt WHERE saleId IN (${placeholders})`).run(...saleIds);
    db.prepare(`DELETE FROM SaleItem WHERE saleId IN (${placeholders})`).run(...saleIds);
    db.prepare(`DELETE FROM Sale WHERE id IN (${placeholders})`).run(...saleIds);
  }

  const outletProducts = db.prepare('SELECT id FROM Product WHERE outletId = ?').all(outletId);
  const productIds = outletProducts.map(p => p.id);

  if (productIds.length > 0) {
    const placeholders = productIds.map(() => '?').join(',');
    db.prepare(`DELETE FROM ProductVariant WHERE productId IN (${placeholders})`).run(...productIds);
  }

  db.prepare('DELETE FROM Cashflow WHERE outletId = ?').run(outletId);
  db.prepare('DELETE FROM StockMovement WHERE outletId = ?').run(outletId);
  db.prepare('DELETE FROM Shift WHERE outletId = ?').run(outletId);
  db.prepare('DELETE FROM Product WHERE outletId = ?').run(outletId);
  db.prepare('DELETE FROM Category WHERE outletId = ?').run(outletId);
  db.prepare('DELETE FROM Member WHERE outletId = ?').run(outletId);
  db.prepare('DELETE FROM User WHERE outletId = ?').run(outletId);
  db.prepare('DELETE FROM Outlet WHERE id = ?').run(outletId);
}

async function main() {
  const args = process.argv.slice(2);
  const target = args[0];

  if (!target) {
    console.log('⚠️  Cara penggunaan: node backend/hapus-akun.js "email_atau_id_pengguna"');
    console.log('💡 Contoh: node backend/hapus-akun.js "heylirabakery@gmail.com"');
    return;
  }

  console.log(`🔍 Mencari akun atau toko dengan email/ID/nama: "${target}"...`);

  try {
    const user = db.prepare('SELECT u.*, o.name as outletName FROM User u LEFT JOIN Outlet o ON u.outletId = o.id WHERE u.email = ? OR u.id = ? OR u.name = ?').get(target, target, target);

    if (!user) {
      const outlet = db.prepare('SELECT * FROM Outlet WHERE id = ? OR name = ?').get(target, target);
      if (outlet) {
        console.log(`🧹 Toko "${outlet.name}" (ID: ${outlet.id}) ditemukan. Menghapus toko dan seluruh datanya...`);
        deleteOutletSafely(outlet.id);
        console.log(`✅ Toko beserta seluruh datanya berhasil dibersihkan!`);
        return;
      }

      console.log(`❌ Akun atau toko "${target}" tidak ditemukan di sistem.`);
      return;
    }

    console.log(`🗑️  Menghapus akun "${user.name}" (${user.email}) dari toko "${user.outletName || '-'}"...`);
    deleteUserSafely(user.id);
    console.log(`✅ Akun "${user.email}" beserta riwayatnya berhasil dihapus secara permanen!`);

    const remaining = db.prepare('SELECT COUNT(*) as count FROM User WHERE outletId = ?').get(user.outletId);
    if (remaining.count === 0) {
      console.log(`🧹 Toko "${user.outletName}" tidak lagi memiliki akun. Menghapus toko kosong...`);
      deleteOutletSafely(user.outletId);
      console.log(`✅ Toko kosong berhasil dibersihkan.`);
    }

  } catch (error) {
    console.error('❌ Terjadi kesalahan:', error.message || error);
  } finally {
    db.close();
  }
}

main();
