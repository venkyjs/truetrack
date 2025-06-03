const DB_NAME = 'ProjectPulseDB';
const DB_VERSION = 1;

interface MyDB extends IDBDatabase {
    // Define your object stores here if needed for type safety,
    // though direct interaction is usually through transactions.
}

let db: IDBDatabase | null = null;

export const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const tempDb = (event.target as IDBOpenDBRequest).result;
            if (!tempDb.objectStoreNames.contains('appData')) {
                tempDb.createObjectStore('appData', { keyPath: 'key' });
            }
            // Example: Create an object store for user settings if it doesn't exist
            // if (!tempDb.objectStoreNames.contains('userSettings')) {
            //   tempDb.createObjectStore('userSettings', { keyPath: 'settingName' });
            // }
        };

        request.onsuccess = (event) => {
            db = (event.target as IDBOpenDBRequest).result;
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
            reject('Error opening IndexedDB');
        };
    });
};

export const idbGet = async <T>(key: string): Promise<T | undefined> => {
    const currentDb = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = currentDb.transaction(['appData'], 'readonly');
        const store = transaction.objectStore('appData');
        const request = store.get(key);

        request.onsuccess = () => {
            resolve(request.result ? request.result.value : undefined);
        };

        request.onerror = () => {
            console.error('Error getting data from IndexedDB:', request.error);
            reject(request.error);
        };
    });
};

export const idbSet = async (key: string, value: unknown): Promise<void> => {
    const currentDb = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = currentDb.transaction(['appData'], 'readwrite');
        const store = transaction.objectStore('appData');
        const request = store.put({ key, value }); // Using { key, value } structure

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            console.error('Error setting data in IndexedDB:', request.error);
            reject(request.error);
        };
    });
};

export const idbRemove = async (key: string): Promise<void> => {
    const currentDb = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = currentDb.transaction(['appData'], 'readwrite');
        const store = transaction.objectStore('appData');
        const request = store.delete(key);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            console.error('Error removing data from IndexedDB:', request.error);
            reject(request.error);
        };
    });
};

// Example of a more specific store if needed:
// const SETTINGS_STORE_NAME = 'userSettings';
// export const getSetting = async <T>(settingName: string): Promise<T | undefined> => { ... }
// export const setSetting = async (settingName: string, value: unknown): Promise<void> => { ... }
