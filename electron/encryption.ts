import crypto from 'crypto';

// For AES-256-GCM, the key needs to be 32 bytes and IV 12 bytes.
// IMPORTANT: This is a placeholder key. In a real application,
// this key must be securely generated, stored, and managed.
// It should not be hardcoded directly in the source code for production.
const ENCRYPTION_KEY = crypto.createHash('sha256').update('mySuperSecretPasswordPlaceholder').digest('base64').substring(0, 32);
const IV_LENGTH = 12; // For GCM, 12 bytes is recommended

export function encryptData(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  // Prepend IV and authTag to the encrypted data for use in decryption
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

export function decryptData(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format. Expected IV:AuthTag:Data.');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedData = parts[2];

    if (iv.length !== IV_LENGTH) {
        throw new Error(`Invalid IV length. Expected ${IV_LENGTH} bytes, got ${iv.length}.`);
    }

    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    // Depending on the use case, you might want to throw the error,
    // return null, or return an empty string.
    // For a task manager, failing to decrypt likely means data corruption
    // or wrong key, so throwing an error or specific handling is important.
    throw new Error('Failed to decrypt data. It may be corrupted or the key is incorrect.');
  }
} 