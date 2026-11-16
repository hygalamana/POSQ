const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const { createId } = require('@paralleldrive/cuid2');

const dbPath = path.resolve(__dirname, 'prisma/dev.db');
const db = new Database(dbPath);

async function main() {
  const args = process.argv.slice(2);
  
  let outletName = 'Toko Cabang 2';
  let ownerEmail = 'toko2@demo.com';
  let ownerPassword = 'toko123';

  if (args.length >= 3) {
    ownerPassword = args[args.length - 1];
    ownerEmail = args[args.length - 2];
    outletName = args.slice(0, args.length - 2).join(' ');
  } else if (args.length === 2) {
    ownerEmail = args[0];
    ownerPassword = args[1];
    outletName = `Toko ${ownerEmail.split('@')[0]}`;
  } else if (args.length === 1) {
    ownerEmail = args[0];
    outletName = `Toko ${ownerEmail.split('@')[0]}`;
  }

  console.log('--------------------------------------------------');
  console.log('🏗️  Membuat Toko Baru (Save Data Terpisah)...');
  console.log('--------------------------------------------------');

  try {
    const existingUser = db.prepare('SELECT id FROM User WHERE email = ?').get(ownerEmail);
    if (existingUser) {
      console.log(`❌ Gagal: Email "${ownerEmail}" sudah terdaftar di sistem. Silakan gunakan email lain.`);
      return;
    }

    const outletId = createId();
    const now = Date.now();

    db.prepare(`
      INSERT INTO Outlet (id, name, address, phone, taxRate, hasTax, receiptPrintTax, currency, pointsRate, pointsEnabled, createdAt)
      VALUES (?, ?, ?, ?, ?, 1, 1, 'IDR', 0, 0, ?)
    `).run(outletId, outletName, 'Alamat Toko / Cabang', '081234567890', 0.10, now);

    console.log(`✅ Toko berhasil dibuat: "${outletName}" (ID: ${outletId})`);

    const passwordHash = await bcrypt.hash(ownerPassword, 10);
    const userId = createId();

    db.prepare(`
      INSERT INTO User (id, name, email, passwordHash, role, outletId, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, 'OWNER', ?, 1, ?, ?)
    `).run(userId, `Owner ${outletName}`, ownerEmail, passwordHash, outletId, now, now);

    console.log(`✅ Akun Owner berhasil dibuat!`);
    console.log('--------------------------------------------------');
    console.log(`📧 Email Login    : ${ownerEmail}`);
    console.log(`🔑 Password Login : ${ownerPassword}`);
    console.log(`🏬 Nama Toko      : ${outletName}`);
    console.log('--------------------------------------------------');
    console.log('🎉 Selesai! Anda sudah bisa login menggunakan akun di atas dengan data toko yang 100% kosong & terpisah.');
  } catch (error) {
    console.error('❌ Terjadi kesalahan:', error.message || error);
  } finally {
    db.close();
  }
}

main();
