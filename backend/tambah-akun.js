const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const { createId } = require('@paralleldrive/cuid2');

const dbPath = path.resolve(__dirname, 'prisma/dev.db');
const db = new Database(dbPath);

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('⚠️  Cara penggunaan: node backend/tambah-akun.js "Nama/ID_Toko" "email_baru@toko.com" "password" [ROLE]');
    console.log('💡 Contoh: node backend/tambah-akun.js "Heylira Bakery" "kasir1@gmail.com" "rahasia123" CASHIER');
    console.log('💡 Pilihan Role: OWNER | MANAGER | CASHIER (Default: CASHIER)');
    return;
  }

  const outletTarget = args[0];
  const email = args[1];
  const password = args[2];
  const role = (args[3] || 'CASHIER').toUpperCase();

  console.log(`🔍 Menambahkan akun "${email}" ke toko "${outletTarget}"...`);

  try {
    const existingUser = db.prepare('SELECT id FROM User WHERE email = ?').get(email);
    if (existingUser) {
      console.log(`❌ Gagal: Email "${email}" sudah terdaftar di sistem. Gunakan email lain.`);
      return;
    }

    const outlet = db.prepare('SELECT * FROM Outlet WHERE id = ? OR name LIKE ?').get(outletTarget, `%${outletTarget}%`);
    if (!outlet) {
      console.log(`❌ Gagal: Toko/Cabang "${outletTarget}" tidak ditemukan di sistem.`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = createId();
    const name = `${role === 'OWNER' ? 'Owner' : role === 'MANAGER' ? 'Manajer' : 'Kasir'} ${outlet.name}`;
    const now = Date.now();

    db.prepare(`
      INSERT INTO User (id, name, email, passwordHash, role, outletId, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(userId, name, email, passwordHash, role, outlet.id, now, now);

    console.log('--------------------------------------------------');
    console.log(`✅ Akun Baru Berhasil Ditambahkan ke Toko "${outlet.name}"!`);
    console.log('--------------------------------------------------');
    console.log(`📧 Email Login    : ${email}`);
    console.log(`🔑 Password Login : ${password}`);
    console.log(`👑 Hak Akses/Role : ${role}`);
    console.log(`🏬 Nama Toko      : ${outlet.name}`);
    console.log('--------------------------------------------------');
  } catch (err) {
    console.log('❌ Terjadi kesalahan:', err.message);
  } finally {
    db.close();
  }
}

main();
