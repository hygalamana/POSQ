const Database = require('better-sqlite3');
const readline = require('readline');
const bcrypt = require('bcryptjs');
const path = require('path');
const { createId } = require('@paralleldrive/cuid2');

const dbPath = path.resolve(__dirname, 'prisma/dev.db');
const db = new Database(dbPath);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function clearScreen() {
  console.clear();
}

async function mainMenu() {
  clearScreen();
  console.log('================================================================================');
  console.log('👑  MENU MANAJEMEN AKUN & TOKO INTERAKTIF (POSQ KASIR)');
  console.log('================================================================================');
  
  try {
    const outlets = db.prepare('SELECT * FROM Outlet ORDER BY createdAt ASC').all();

    console.log('📋 DAFTAR TOKO / CABANG:');
    if (outlets.length === 0) {
      console.log('   (Belum ada toko yang terdaftar)');
    } else {
      outlets.forEach((o, idx) => {
        const userCount = db.prepare('SELECT COUNT(*) as count FROM User WHERE outletId = ?').get(o.id).count;
        console.log(`   [${idx + 1}] 🏬 ${o.name} (${userCount} akun terdaftar)`);
      });
    }
    console.log('--------------------------------------------------------------------------------');
    console.log('   [+] ➕ Buat Toko / Cabang Baru & Akun Owner');
    console.log('   [0] ❌ Keluar dari Program');
    console.log('================================================================================');

    const ans = (await question('👉 Pilih nomor toko [1-' + outlets.length + '] atau aksi [+ / 0]: ')).trim();

    if (ans === '0' || ans === 'exit') {
      console.log('\n👋 Terima kasih telah menggunakan PosQ Kasir!');
      rl.close();
      db.close();
      process.exit(0);
    } else if (ans === '+') {
      await createStoreMenu();
    } else {
      const idx = parseInt(ans, 10) - 1;
      if (!isNaN(idx) && outlets[idx]) {
        await storeMenu(outlets[idx].id);
      } else {
        console.log('⚠️  Pilihan tidak valid!');
        await question('Tekan Enter untuk melanjutkan...');
        await mainMenu();
      }
    }
  } catch (err) {
    console.error('❌ Terjadi kesalahan pada database:', err.message || err);
    await question('Tekan Enter untuk keluar...');
    rl.close();
    db.close();
    process.exit(1);
  }
}

async function createStoreMenu() {
  clearScreen();
  console.log('================================================================================');
  console.log('➕  BUAT TOKO / CABANG BARU & AKUN OWNER');
  console.log('================================================================================');
  
  const name = (await question('🏬 Nama Toko / Cabang Baru : ')).trim();
  if (!name) return await mainMenu();
  
  const email = (await question('📧 Email Login Owner       : ')).trim();
  if (!email) return await mainMenu();
  
  const password = (await question('🔑 Password Login Owner    : ')).trim();
  if (!password) return await mainMenu();

  console.log('\n⏳ Sedang memeriksa dan membuat toko...');
  try {
    const existingUser = db.prepare('SELECT id FROM User WHERE email = ?').get(email);
    if (existingUser) {
      console.log(`\n❌ Gagal: Email "${email}" sudah terdaftar di sistem. Silakan gunakan email lain.`);
      await question('\nTekan Enter untuk kembali ke menu utama...');
      return await mainMenu();
    }

    const outletId = createId();
    const now = Date.now();

    db.prepare(`
      INSERT INTO Outlet (id, name, address, phone, taxRate, hasTax, receiptPrintTax, currency, pointsRate, pointsEnabled, createdAt)
      VALUES (?, ?, ?, ?, ?, 1, 1, 'IDR', 0, 0, ?)
    `).run(outletId, name, 'Alamat Toko / Cabang', '081234567890', 0.10, now);

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = createId();

    db.prepare(`
      INSERT INTO User (id, name, email, passwordHash, role, outletId, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, 'OWNER', ?, 1, ?, ?)
    `).run(userId, `Owner ${name}`, email, hashedPassword, outletId, now, now);

    console.log('\n✅ BERHASIL! Toko dan Akun Owner siap digunakan:');
    console.log(`   🏬 Nama Toko : ${name}`);
    console.log(`   📧 Email     : ${email}`);
    console.log(`   🔑 Password  : ${password}`);
  } catch (err) {
    console.log('\n❌ Gagal membuat toko/akun:', err.message);
  }

  await question('\nTekan Enter untuk kembali ke menu utama...');
  await mainMenu();
}

async function storeMenu(outletId) {
  clearScreen();
  const outlet = db.prepare('SELECT * FROM Outlet WHERE id = ?').get(outletId);
  if (!outlet) return await mainMenu();

  const users = db.prepare('SELECT * FROM User WHERE outletId = ? ORDER BY role DESC').all(outletId);
  outlet.users = users;

  console.log('================================================================================');
  console.log(`🏬  MENGELOLA TOKO: "${outlet.name}"`);
  console.log('================================================================================');
  console.log('📋 DAFTAR AKUN DI TOKO INI:');
  
  if (outlet.users.length === 0) {
    console.log('   ⚠️  Tidak ada akun di toko ini.');
  } else {
    outlet.users.forEach((u, idx) => {
      const status = u.isActive ? '✅ Aktif' : '❌ Non-Aktif';
      console.log(`   [${idx + 1}] [${u.role.padEnd(7)}] ${u.name.padEnd(20)} | Email: ${u.email.padEnd(25)} | ${status}`);
    });
  }
  
  console.log('--------------------------------------------------------------------------------');
  console.log('   [1] 🔑 Reset Password Akun di Toko Ini');
  console.log('   [2] 👑 Ubah Role / Hak Akses Akun (OWNER / MANAGER / CASHIER)');
  console.log('   [3] 🗑️  Hapus Akun dari Toko Ini');
  console.log('   [4] 💥 Hapus Toko Ini Beserta Seluruh Akunnya');
  console.log('   [5] ➕ Tambah Akun Pegawai Baru ke Toko Ini');
  console.log('   [9] 🔙 Kembali ke Daftar Toko');
  console.log('   [0] ❌ Keluar dari Program');
  console.log('================================================================================');

  const ans = (await question('👉 Pilih aksi [1-5 / 9 / 0]: ')).trim();

  if (ans === '0') {
    console.log('\n👋 Terima kasih telah menggunakan PosQ Kasir!');
    rl.close();
    db.close();
    process.exit(0);
  } else if (ans === '9') {
    await mainMenu();
  } else if (ans === '1') {
    await resetPasswordMenu(outlet);
  } else if (ans === '2') {
    await changeRoleMenu(outlet);
  } else if (ans === '3') {
    await deleteAccountMenu(outlet);
  } else if (ans === '4') {
    await deleteStoreMenu(outlet);
  } else if (ans === '5') {
    await addAccountToStoreMenu(outlet);
  } else {
    console.log('⚠️  Pilihan tidak valid!');
    await question('Tekan Enter untuk melanjutkan...');
    await storeMenu(outletId);
  }
}

async function addAccountToStoreMenu(outlet) {
  clearScreen();
  console.log('================================================================================');
  console.log(`➕  TAMBAH AKUN PEGAWAI BARU KE TOKO "${outlet.name}"`);
  console.log('================================================================================');
  
  const email = (await question('📧 Email Login Pegawai     : ')).trim();
  if (!email) return await storeMenu(outlet.id);

  const existingUser = db.prepare('SELECT id FROM User WHERE email = ?').get(email);
  if (existingUser) {
    console.log(`\n❌ Gagal: Email "${email}" sudah terdaftar di sistem. Gunakan email lain.`);
    await question('\nTekan Enter untuk kembali...');
    return await storeMenu(outlet.id);
  }
  
  const password = (await question('🔑 Password Login Pegawai  : ')).trim();
  if (!password) return await storeMenu(outlet.id);

  console.log('Pilihan Role: [1] CASHIER (Kasir)  [2] MANAGER  [3] OWNER');
  const roleAns = (await question('👉 Pilih Role [1-3, default 1]: ')).trim();
  let role = 'CASHIER';
  if (roleAns === '2') role = 'MANAGER';
  else if (roleAns === '3') role = 'OWNER';

  console.log('\n⏳ Sedang membuat akun...');
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = createId();
    const now = Date.now();

    db.prepare(`
      INSERT INTO User (id, name, email, passwordHash, role, outletId, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(userId, `${role === 'OWNER' ? 'Owner' : role === 'MANAGER' ? 'Manajer' : 'Kasir'} ${outlet.name}`, email, hashedPassword, role, outlet.id, now, now);

    console.log('\n✅ BERHASIL! Akun pegawai siap digunakan:');
    console.log(`   🏬 Nama Toko : ${outlet.name}`);
    console.log(`   📧 Email     : ${email}`);
    console.log(`   🔑 Password  : ${password}`);
    console.log(`   👑 Role      : ${role}`);
  } catch (err) {
    console.log('\n❌ Gagal membuat akun:', err.message);
  }

  await question('\nTekan Enter untuk kembali ke menu toko...');
  await storeMenu(outlet.id);
}

async function selectUserFromOutlet(outlet, actionName) {
  if (outlet.users.length === 0) {
    console.log('⚠️  Tidak ada akun di toko ini.');
    return null;
  }
  if (outlet.users.length === 1) {
    return outlet.users[0];
  }
  const ans = (await question(`👉 Pilih nomor akun untuk ${actionName} [1-${outlet.users.length}]: `)).trim();
  const idx = parseInt(ans, 10) - 1;
  if (!isNaN(idx) && outlet.users[idx]) {
    return outlet.users[idx];
  }
  console.log('⚠️  Nomor akun tidak valid!');
  return null;
}

async function resetPasswordMenu(outlet) {
  console.log('\n--- 🔑 RESET PASSWORD ---');
  const user = await selectUserFromOutlet(outlet, 'Reset Password');
  if (!user) {
    await question('Tekan Enter untuk kembali...');
    return await storeMenu(outlet.id);
  }

  const pw = (await question(`Masukkan password baru untuk [${user.email}] (kosongkan jika ingin random): `)).trim();
  let newPassword = pw;
  if (!newPassword) {
    newPassword = Math.random().toString(36).slice(-8);
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const now = Date.now();
    db.prepare('UPDATE User SET passwordHash = ?, updatedAt = ? WHERE id = ?').run(hashedPassword, now, user.id);
    console.log('\n✅ PASSWORD BERHASIL DIRESET!');
    console.log(`   👤 Akun     : ${user.name}`);
    console.log(`   📧 Email    : ${user.email}`);
    console.log(`   🔑 PW Baru  : ${newPassword}`);
  } catch (err) {
    console.log('\n❌ Gagal mereset password:', err.message);
  }

  await question('\nTekan Enter untuk kembali...');
  await storeMenu(outlet.id);
}

async function changeRoleMenu(outlet) {
  console.log('\n--- 👑 UBAH ROLE / HAK AKSES ---');
  const user = await selectUserFromOutlet(outlet, 'Ubah Role');
  if (!user) {
    await question('Tekan Enter untuk kembali...');
    return await storeMenu(outlet.id);
  }

  console.log('Pilihan Role: [1] OWNER  [2] MANAGER  [3] CASHIER');
  const ans = (await question('👉 Pilih role baru [1-3]: ')).trim();
  let newRole = '';
  if (ans === '1') newRole = 'OWNER';
  else if (ans === '2') newRole = 'MANAGER';
  else if (ans === '3') newRole = 'CASHIER';
  else {
    console.log('⚠️  Pilihan role tidak valid!');
    await question('Tekan Enter untuk kembali...');
    return await storeMenu(outlet.id);
  }

  try {
    const now = Date.now();
    db.prepare('UPDATE User SET role = ?, updatedAt = ? WHERE id = ?').run(newRole, now, user.id);
    console.log('\n✅ ROLE BERHASIL DIUBAH!');
    console.log(`   📧 Email : ${user.email}`);
    console.log(`   🔄 Role  : [${user.role}] ➔ [${newRole}]`);
  } catch (err) {
    console.log('\n❌ Gagal mengubah role:', err.message);
  }

  await question('\nTekan Enter untuk kembali...');
  await storeMenu(outlet.id);
}

async function deleteAccountMenu(outlet) {
  console.log('\n--- 🗑️  HAPUS AKUN ---');
  const user = await selectUserFromOutlet(outlet, 'Dihapus');
  if (!user) {
    await question('Tekan Enter untuk kembali...');
    return await storeMenu(outlet.id);
  }

  const confirm = (await question(`⚠️  Yakin ingin menghapus akun "${user.email}" permanen? (y/n): `)).trim().toLowerCase();
  if (confirm === 'y' || confirm === 'yes') {
    try {
      deleteUserSafely(user.id);
      console.log(`\n✅ Akun "${user.email}" beserta riwayatnya berhasil dihapus!`);
    } catch (err) {
      console.log('\n❌ Gagal menghapus akun:', err.message);
    }
  } else {
    console.log('\nℹ️  Dibatalkan.');
  }

  await question('\nTekan Enter untuk kembali...');
  await storeMenu(outlet.id);
}

async function deleteStoreMenu(outlet) {
  console.log('\n--- 💥 HAPUS TOKO BESERTA AKUNNYA ---');
  const confirm = (await question(`⚠️  BAHAYA: Yakin ingin menghapus toko "${outlet.name}" dan SEMUA AKUN di dalamnya? (y/n): `)).trim().toLowerCase();
  if (confirm === 'y' || confirm === 'yes') {
    try {
      deleteOutletSafely(outlet.id);
      console.log(`\n✅ Toko "${outlet.name}" beserta seluruh akun dan datanya berhasil dihapus permanen!`);
      await question('\nTekan Enter untuk kembali ke daftar toko...');
      return await mainMenu();
    } catch (err) {
      console.log('\n❌ Gagal menghapus toko:', err.message);
    }
  } else {
    console.log('\nℹ️  Dibatalkan.');
  }

  await question('\nTekan Enter untuk kembali...');
  await storeMenu(outlet.id);
}

mainMenu();
