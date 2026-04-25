import { getDB } from '../db.js';
import crypto from 'crypto';

const NONCE_WINDOW = 50;

/**
 * Verifies an Ed25519 signature in Node.js
 */
function verifyTxnSignature(payload, signature, pubKeyHex) {
  try {
    // Ed25519 SPKI prefix: 302a300506032b6570032100
    const spkiHeader = Buffer.from('302a300506032b6570032100', 'hex');
    const publicKey = crypto.createPublicKey({
      key: Buffer.concat([spkiHeader, Buffer.from(pubKeyHex, 'hex')]),
      format: 'der',
      type: 'spki'
    });
    
    return crypto.verify(
      null,
      Buffer.from(payload),
      publicKey,
      Buffer.from(signature, 'hex')
    );
  } catch (err) {
    console.error('Signature verification error:', err.message);
    return false;
  }
}

export function reconcileTransactions(userId, transactions) {
  const db = getDB();
  const results = [];

  for (const txn of transactions) {
    // 1. Already processed?
    const existing = db.prepare('SELECT status FROM transactions WHERE id = ?').get(txn.id);
    if (existing) { results.push({ id: txn.id, status: existing.status }); continue; }

    // 2. Fetch sender details
    const sender = db.prepare('SELECT id, pub_key FROM users WHERE id = ?').get(txn.from_user_id);
    const senderWallet = db.prepare('SELECT confirmed_bal, nonce_counter FROM wallets WHERE user_id = ?').get(txn.from_user_id);
    
    if (!sender || !senderWallet) {
      results.push({ id: txn.id, status: 'failed', fail_reason: 'SENDER_NOT_FOUND' });
      continue;
    }

    // 3. Verify Signature (Security)
    const payload = JSON.stringify({ 
      id: txn.id, 
      from: txn.from_pub || sender.pub_key, 
      to: txn.to_user_id || txn.to_pub, // Handle both ID and pub formats
      amount: txn.amount, 
      nonce: txn.nonce, 
      ts: txn.created_at 
    });
    
    if (!verifyTxnSignature(payload, txn.signature, sender.pub_key)) {
      results.push({ id: txn.id, status: 'failed', fail_reason: 'INVALID_SIGNATURE' });
      continue;
    }

    // 4. Check nonce window & replay
    const expectedMin = senderWallet.nonce_counter;
    if (txn.nonce <= expectedMin) {
      results.push({ id: txn.id, status: 'failed', fail_reason: 'NONCE_REPLAY_OR_OLD' });
      continue;
    }

    // 5. Check sufficient balance (from SENDER's wallet)
    if (senderWallet.confirmed_bal < txn.amount) {
      results.push({ id: txn.id, status: 'failed', fail_reason: 'INSUFFICIENT_BALANCE' });
      continue;
    }

    // 6. Confirm — atomic DB transaction
    try {
      const confirmTxn = db.transaction(() => {
        db.prepare('UPDATE wallets SET confirmed_bal = confirmed_bal - ?, nonce_counter = ? WHERE user_id = ?').run(txn.amount, txn.nonce, txn.from_user_id);
        if (txn.to_user_id) {
          db.prepare('UPDATE wallets SET confirmed_bal = confirmed_bal + ? WHERE user_id = ?').run(txn.amount, txn.to_user_id);
        }
        db.prepare(`INSERT INTO transactions (id, from_user_id, to_user_id, amount, nonce, signature, mode, status, created_at, synced_at, expires_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
          txn.id, txn.from_user_id, txn.to_user_id, txn.amount, txn.nonce, txn.signature, txn.mode || 'offline_p2p', 'confirmed', txn.created_at, Math.floor(Date.now() / 1000), txn.expires_at || (txn.created_at + 86400)
        );
      });
      confirmTxn();
      results.push({ id: txn.id, status: 'confirmed' });
    } catch (err) {
      results.push({ id: txn.id, status: 'failed', fail_reason: 'INTERNAL_ERROR' });
    }
  }

  const updatedWallet = db.prepare('SELECT confirmed_bal, locked_bal FROM wallets WHERE user_id = ?').get(userId);
  return { results, wallet: updatedWallet };
}
