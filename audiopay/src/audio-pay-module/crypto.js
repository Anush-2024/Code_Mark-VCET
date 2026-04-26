// For demo purposes, we use a hardcoded secret key.
// In production, this would be a per-user key securely distributed by the backend.
export const SECRET_KEY = 'audiopay-demo-key-2024-fixed-string';

export function generateNonce() {
  const array = new Uint8Array(4);
  window.crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(''); // 8-char hex string
}

export async function computeHMAC(message, keyString) {
  const enc = new TextEncoder();
  const keyData = enc.encode(keyString);
  const msgData = enc.encode(message);
  
  const key = await window.crypto.subtle.importKey(
    'raw', 
    keyData,
    { name: 'HMAC', hash: 'SHA-256' }, 
    false, 
    ['sign']
  );
  
  const sig = await window.crypto.subtle.sign('HMAC', key, msgData);
  
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Payload structure (27 chars):
// VERSION(1) + SENDER_ID(8) + NONCE(8) + HMAC(6) + PADDING(4 zeros)
export async function buildPayload(userUUID) {
  const version = '1';
  const senderId = userUUID.replace(/-/g, '').substring(0, 8);
  const nonce = generateNonce();
  
  // HMAC covers senderId + nonce
  const fullHmac = await computeHMAC(senderId + nonce, SECRET_KEY);
  const hmac = fullHmac.substring(0, 6);
  
  const padding = '0000';
  
  const payload = version + senderId + nonce + hmac + padding;
  return payload;
}

export async function validatePayload(payloadString) {
  if (!payloadString || payloadString.length !== 27) {
    return { valid: false };
  }

  const version = payloadString.substring(0, 1);
  const senderId = payloadString.substring(1, 9);
  const nonce = payloadString.substring(9, 17);
  const receivedHmac = payloadString.substring(17, 23);
  const padding = payloadString.substring(23, 27);

  if (version !== '1') {
    return { valid: false };
  }

  // Recompute HMAC to verify authenticity and integrity
  const fullHmac = await computeHMAC(senderId + nonce, SECRET_KEY);
  const expectedHmac = fullHmac.substring(0, 6);

  console.log('[Crypto] checksum computed:', expectedHmac, '| received:', receivedHmac);

  if (receivedHmac !== expectedHmac) {
    console.error('[Crypto] HMAC validation failed! expected:', expectedHmac, 'received:', receivedHmac);
    return { valid: false };
  }

  return {
    valid: true,
    senderUUID: senderId, // Partial UUID, but unique enough for demo
    nonce
  };
}
