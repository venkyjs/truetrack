import fs from 'fs-extra'; // Using fs-extra for convenience, e.g., ensureFile
import path from 'path';
import { encryptData, decryptData } from './encryption';

/**
 * Writes an object as encrypted JSON to a file.
 * Ensures the directory exists before writing.
 * @param filePath The full path to the file.
 * @param data The JavaScript object to encrypt and write.
 */
export async function secureWriteJsonFile(filePath: string, data: any): Promise<void> {
  try {
    const jsonData = JSON.stringify(data, null, 2); // Pretty print JSON
    const encryptedData = encryptData(jsonData);
    await fs.ensureDir(path.dirname(filePath)); // Ensures directory exists
    await fs.writeFile(filePath, encryptedData, 'utf8');
  } catch (error) {
    console.error(`Error writing secure file ${filePath}:`, error);
    throw error; // Re-throw to allow caller to handle
  }
}

/**
 * Reads and decrypts a JSON file into an object.
 * @param filePath The full path to the file.
 * @returns The decrypted JavaScript object, or null if the file doesn't exist.
 * @throws Error if decryption fails or other file access errors occur.
 */
export async function secureReadJsonFile<T = any>(filePath: string): Promise<T | null> {
  try {
    if (!(await fs.pathExists(filePath))) {
      return null; // File doesn't exist
    }
    const encryptedData = await fs.readFile(filePath, 'utf8');
    if (!encryptedData) {
      return null; // File is empty
    }
    const jsonData = decryptData(encryptedData);
    return JSON.parse(jsonData) as T;
  } catch (error) {
    console.error(`Error reading secure file ${filePath}:`, error);
    // If decryption specifically failed, it would throw from decryptData
    // Otherwise, it could be a file access issue or JSON parsing issue after successful decryption
    throw error; // Re-throw to allow caller to handle
  }
} 