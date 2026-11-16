const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'prisma/dev.db');
const db = new Database(dbPath);

async function main() {
  const args = process.argv.slice(2);
  const target = args[0];
  const newRoleRaw = args[1];

  if (!target || !newRoleRaw) {
    console.log('⚠️  Cara penggunaan: node backend/user-role.js "email_atau_nama_akun" "ROLE_BARU"');
    console.log('💡 Pilihan Role  : OWNER | MANAGER | CASHIER');
    console.log('💡 Contoh        : node backend/user-role.js "kasir@demo.com" "MANAGER"');
    return;
  }

  const newRole = newRoleRaw.toUpperCase();
  if (!['OWNER', 'MANAGER', 'CASHIER'].includes(newRole)) {
    console.log(`❌ Role "${newRoleRaw}" tidak valid. Pilih antara: OWNER, MANAGER, atau CASHIER.`);
    return;
  }

  console.log(`🔍 Mencari akun dengan email/ID/nama: "${target}"...`);

  try {
    const user = db.prepare('SELECT u.*, o.name as outletName FROM User u LEFT JOIN Outlet o ON u.outletId = o.id WHERE u.email = ? OR u.id = ? OR u.name = ?').get(target, target, target);

    if (!user) {
      console.log(`❌ Akun "${target}" tidak ditemukan di sistem.`);
      return;
    }

    const oldRole = user.role;
    if (oldRole === newRole) {
      console.log(`ℹ️  Akun "${user.email}" sudah memiliki role [${newRole}]. Tidak ada perubahan.`);
      return;
    }

    const now = Date.now();
    db.prepare('UPDATE User SET role = ?, updatedAt = ? WHERE id = ?').run(newRole, now, user.id);

    console.log('================================================================================');
    console.log('👑  HAK AKSES (ROLE) AKUN BERHASIL DIUBAH!');
    console.log('================================================================================');
    console.log(`👤 Nama Akun   : ${user.name}`);
    console.log(`📧 Email Login : ${user.email}`);
    console.log(`🏬 Nama Toko   : ${user.outletName || '-'}`);
    console.log('--------------------------------------------------------------------------------');
    console.log(`🔄 Role Lama   : [${oldRole}] ➔ Role Baru: [${newRole}]`);
    console.log('================================================================================');
    console.log('🎉 Selesai! Hak akses pengguna langsung berlaku pada login berikutnya.');
  } catch (error) {
    console.error('❌ Terjadi kesalahan:', error.message || error);
  } finally {
    db.close();
  }
}

main();
