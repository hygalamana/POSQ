const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'prisma/dev.db');
const db = new Database(dbPath);

async function main() {
  console.log('================================================================================');
  console.log('📋  DAFTAR SEMUA TOKO / CABANG & AKUN PENGGUNA');
  console.log('================================================================================');

  try {
    const outlets = db.prepare('SELECT * FROM Outlet ORDER BY createdAt DESC').all();

    if (outlets.length === 0) {
      console.log('Belum ada data toko di sistem.');
      return;
    }

    outlets.forEach((outlet, index) => {
      const users = db.prepare('SELECT id, name, email, role, isActive FROM User WHERE outletId = ? ORDER BY role DESC').all(outlet.id);
      console.log(`\n🏬 [Toko #${index + 1}] "${outlet.name}"`);
      console.log(`   ID Toko : ${outlet.id}`);
      console.log(`   Alamat  : ${outlet.address || '-'} | Telp: ${outlet.phone || '-'}`);
      console.log('   -----------------------------------------------------------------------------');
      if (users.length === 0) {
        console.log('   ⚠️  Belum ada akun di toko ini.');
      } else {
        users.forEach((u, uIndex) => {
          const status = u.isActive ? '✅ Aktif' : '❌ Non-Aktif';
          console.log(`   ${uIndex + 1}. [${u.role.padEnd(7)}] ${u.name.padEnd(20)} | Email: ${u.email.padEnd(25)} | ${status}`);
        });
      }
      console.log('   -----------------------------------------------------------------------------');
    });
    console.log('\n💡 Perintah Manajemen Akun yang Tersedia:');
    console.log('   🔸 node backend/daftar-akun.js');
    console.log('   🔸 node backend/buat-toko.js');
    console.log('   🔸 node backend/reset-password.js');
    console.log('   🔸 node backend/user-role.js');
    console.log('   🔸 node backend/hapus-akun.js');
  } catch (error) {
    console.error('❌ Terjadi kesalahan:', error.message || error);
  } finally {
    db.close();
  }
}

main();
