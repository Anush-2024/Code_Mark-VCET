import { getPendingTxns, getAllTxns, updateTxnStatus } from './storageService';
import { confirmSentFunds, revertFailedTxn, confirmReceivedFunds } from './walletService';
import { batchSync, hasToken } from './apiService';

export async function runSync() {
  if (!hasToken()) throw new Error('Not authenticated — cannot sync');

  // Get ALL pending and unconfirmed txns
  const allTxns = await getAllTxns();
  const pending = allTxns.filter(t => t.status === 'pending' || t.status === 'unconfirmed_received');

  if (pending.length === 0) return { confirmed: 0, failed: 0, results: [] };

  // Build payloads for the server
  const payloads = pending.map(txn => ({
    id: txn.id,
    from_user_id: txn.from_user_id || txn.fromUserId,
    to_user_id: txn.to_user_id || txn.toUserId,
    amount: txn.amount,
    nonce: txn.nonce,
    signature: txn.signature,
    mode: txn.mode || 'offline_p2p',
    created_at: txn.created_at,
    expires_at: txn.expires_at
  }));

  // Send to real server
  const { results, wallet } = await batchSync(payloads);

  // Process results locally
  let confirmed = 0, failed = 0;
  for (const r of results) {
    const localTxn = pending.find(t => t.id === r.id);
    if (!localTxn) continue;

    if (r.status === 'confirmed') {
      await updateTxnStatus(r.id, 'confirmed');
      if (localTxn.type === 'sent') await confirmSentFunds(localTxn.amount);
      if (localTxn.type === 'received' || localTxn.status === 'unconfirmed_received') {
        await confirmReceivedFunds(localTxn.amount);
      }
      confirmed++;
    } else {
      await updateTxnStatus(r.id, 'failed', r.fail_reason);
      if (localTxn.type === 'sent') await revertFailedTxn(localTxn.amount);
      failed++;
    }
  }

  return { confirmed, failed, results, serverWallet: wallet };
}

// Auto-sync when online
export function startConnectivityWatcher(onSync) {
  const trySync = async () => {
    if (!hasToken()) return;
    try {
      const result = await runSync();
      if (result.confirmed + result.failed > 0) onSync(result);
    } catch (e) {
      console.error('Auto-sync failed:', e.message);
    }
  };

  window.addEventListener('online', trySync);
  if (navigator.onLine) setTimeout(trySync, 2000); // delay to let app settle

  return () => window.removeEventListener('online', trySync);
}
