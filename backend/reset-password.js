const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');

const dbPath = path.resolve(__dirname, 'prisma/dev.db');
const db = new Database(dbPath);

function generateRandomPassword(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let pass = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    pass += chars[randomIndex];
  }
  return pass;
}

async function main() {
  const args = process.argv.slice(2);
  const target = args[0];
  const customPassword = args[1];

  if (!target) {
    console.log('⚠️  Cara penggunaan: node backend/reset-password.js "email_atau_nama_akun" [password_baru_opsional]');
    console.log('💡 Contoh Random Password : node backend/reset-password.js "heylirabakery@gmail.com"');
    console.log('💡 Contoh Custom Password : node backend/reset-password.js "heylirabakery@gmail.com" "rahasiaBaru123"');
    return;
  }

  console.log(`🔍 Mencari akun dengan email/ID/nama: "${target}"...`);

  try {
    const user = db.prepare('SELECT u.*, o.name as outletName FROM User u LEFT JOIN Outlet o ON u.outletId = o.id WHERE u.email = ? OR u.id = ? OR u.name = ?').get(target, target, target);

    if (!user) {
      console.log(`❌ Akun "${target}" tidak ditemukan di sistem.`);
      return;
    }

    const newPassword = customPassword || generateRandomPassword(8);
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const now = Date.now();

    db.prepare('UPDATE User SET passwordHash = ?, updatedAt = ? WHERE id = ?').run(passwordHash, now, user.id);

    console.log('================================================================================');
    console.log('🔐  PASSWORD BERHASIL DIRESET!');
    console.log('================================================================================');
    console.log(`👤 Nama Akun      : ${user.name} (${user.role})`);
    console.log(`📧 Email Login    : ${user.email}`);
    console.log(`🏬 Nama Toko      : ${user.outletName || '-'}`);
    console.log('--------------------------------------------------------------------------------');
    console.log(`🔑 PASSWORD BARU  : ${newPassword}`);
    console.log('--------------------------------------------------------------------------------');
    console.log('💡 Segera catat atau infokan password baru ini kepada pemilik akun!');
  } catch (error) {
    console.error('❌ Terjadi kesalahan:', error.message || error);
  } finally {
    db.close();
  }
}

main();
