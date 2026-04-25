# PocketPay PRD

## Writing `cryptoService.js`

- [x] Create file `client/src/services/cryptoService.js` and export an empty module
- [x] Add base64 helper functions for ArrayBuffer to base64 and base64 to ArrayBuffer
- [x] Implement `generateKeypair()` using Web Crypto API with Ed25519 and export keys in base64 format
- [x] Implement `deriveKeyFromPIN(pin, salt)` using PBKDF2 and AES-GCM key derivation
- [x] Implement `encryptPrivateKey(privKeyRaw, aesKey)` using AES-GCM encryption
- [x] Implement `decryptPrivateKey(encryptedKeyB64, ivB64, aesKey)` returning decrypted private key
- [x] Implement `signTransaction(payload, privateKey)` using Ed25519 signing
- [x] Implement `verifySignature(payload, signatureB64, pubKeyB64)` using Ed25519 verification
- [x] Ensure all functions are exported correctly and module loads without errors

---

### 🧠 Why this works

Now each task is:
✔ Small
✔ Testable
✔ Independent
