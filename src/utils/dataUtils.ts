import { openDB, idbSet } from './indexedDB'; // Assuming openDB is exported from indexedDB.ts

const OBJECT_STORE_NAME = 'appData'; // As defined in indexedDB.ts

/**
 * Retrieves all data from the specified object store in IndexedDB.
 */
export const getAllDataFromDB = async (): Promise<Record<string, unknown>> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(OBJECT_STORE_NAME, 'readonly');
        const store = transaction.objectStore(OBJECT_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            // The appData store saves items as { key: string, value: unknown }
            // We need to transform this back into a simple key-value object
            const allItems = request.result;
            const dataMap: Record<string, unknown> = {};
            if (allItems && Array.isArray(allItems)) {
                allItems.forEach((item) => {
                    if (item && typeof item.key === 'string') {
                        dataMap[item.key] = item.value;
                    }
                });
            }
            resolve(dataMap);
        };

        request.onerror = () => {
            console.error('Error getting all data from IndexedDB:', request.error);
            reject(request.error);
        };
    });
};

/**
 * Clears all data from the specified object store in IndexedDB.
 */
export const clearAllDataInDB = async (): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(OBJECT_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(OBJECT_STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            console.error('Error clearing data in IndexedDB:', request.error);
            reject(request.error);
        };
    });
};

/**
 * Restores data to the specified object store in IndexedDB.
 * Assumes data is a key-value object where keys are strings.
 */
export const restoreDataToDB = async (data: Record<string, unknown>): Promise<void> => {
    // We don't need to openDB explicitly here if idbSet handles it,
    // but for clarity or if idbSet was more primitive, we might.
    // Assuming idbSet correctly puts data in the { key, value } format.
    const promises: Promise<void>[] = [];
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            promises.push(idbSet(key, data[key]));
        }
    }
    await Promise.all(promises);
    // Note: If idbSet opens a new transaction for each set, this might be inefficient for large datasets.
    // A more optimized version would handle this in a single transaction if possible.
    // However, given the current structure of idbSet, this is the straightforward way.
};
