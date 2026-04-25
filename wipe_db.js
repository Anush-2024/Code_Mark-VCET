import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'server', 'db', 'pocketpay.db');

console.log('🧹 Wiping all data from:', dbPath);

try {
    const db = new Database(dbPath);
    db.exec('PRAGMA foreign_keys = OFF;');
    db.exec('DELETE FROM transactions;');
    db.exec('DELETE FROM wallets;');
    db.exec('DELETE FROM users;');
    db.exec('DELETE FROM withdrawals;');
    db.exec('DELETE FROM notifications;');
    db.exec('DELETE FROM otp_sessions;');
    db.exec('DELETE FROM devices;');
    db.exec('PRAGMA foreign_keys = ON;');
    db.close();
    console.log('✅ All data wiped successfully. You can now start fresh.');
} catch (err) {
    console.error('❌ Failed to wipe database:', err.message);
}
