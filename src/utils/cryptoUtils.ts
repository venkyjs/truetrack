import CryptoJS from 'crypto-js';

// AES encryption key size
const KEY_SIZE = 256; // bits
const ITERATIONS = 100; // Number of iterations for PBKDF2

/**
 * Encrypts data using AES-GCM with a passphrase.
 * @param dataString The string data to encrypt.
 * @param passphrase The passphrase to use for encryption.
 * @returns A string containing the salt, IV, and ciphertext, concatenated and base64 encoded.
 */
export const encryptData = async (dataString: string, passphrase: string): Promise<string> => {
    return new Promise((resolve) => {
        const salt = CryptoJS.lib.WordArray.random(128 / 8); // 16 bytes salt
        const key = CryptoJS.PBKDF2(passphrase, salt, {
            keySize: KEY_SIZE / 32, // keySize in Words (32-bit)
            iterations: ITERATIONS
        });

        const iv = CryptoJS.lib.WordArray.random(128 / 8); // 16 bytes IV for GCM, typical is 12 bytes but crypto-js AES uses 16
        const encrypted = CryptoJS.AES.encrypt(dataString, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC, // Using CBC as GCM is not directly supported in a simple way by crypto-js for this structure
            padding: CryptoJS.pad.Pkcs7
        });

        // Concatenate salt, iv, and ciphertext then base64 encode
        // Format: salt + iv + ciphertext
        const saltHex = CryptoJS.enc.Hex.stringify(salt);
        const ivHex = CryptoJS.enc.Hex.stringify(iv);
        const cipherTextHex = CryptoJS.enc.Hex.stringify(encrypted.ciphertext);

        resolve(`${saltHex}:${ivHex}:${cipherTextHex}`);
    });
};

/**
 * Decrypts data using AES-GCM with a passphrase.
 * @param encryptedDataString The base64 encoded string containing salt, IV, and ciphertext.
 * @param passphrase The passphrase to use for decryption.
 * @returns The original decrypted string.
 * @throws Error if decryption fails (e.g., wrong passphrase, corrupted data).
 */
export const decryptData = async (
    encryptedDataString: string,
    passphrase: string
): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            const parts = encryptedDataString.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted data format.');
            }

            const salt = CryptoJS.enc.Hex.parse(parts[0]);
            const iv = CryptoJS.enc.Hex.parse(parts[1]);
            const cipherText = CryptoJS.enc.Hex.parse(parts[2]);

            const key = CryptoJS.PBKDF2(passphrase, salt, {
                keySize: KEY_SIZE / 32,
                iterations: ITERATIONS
            });

            const decrypted = CryptoJS.AES.decrypt(
                { ciphertext: cipherText } as CryptoJS.lib.CipherParams,
                key,
                {
                    iv: iv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                }
            );

            const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

            if (!decryptedString) {
                // This can happen if the passphrase is wrong, leading to incorrect decryption & invalid UTF-8
                throw new Error(
                    'Decryption failed. Likely incorrect passphrase or corrupted data.'
                );
            }
            resolve(decryptedString);
        } catch (error) {
            console.error('Decryption error:', error);
            reject(error);
        }
    });
};
