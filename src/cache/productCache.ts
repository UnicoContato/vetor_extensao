import { openDB, type IDBPDatabase } from 'idb';
import type { ProductInfo } from '@/services/googleSheetsService';

const DB_NAME = 'product-database';
const STORE_NAME = 'products';
const DB_VERSION = 1;

// Function to initialize the database and object store
async function initDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // As per your plan, use 'codigo' as the key for efficient lookups
        // and future incremental updates.
        db.createObjectStore(STORE_NAME, { keyPath: 'codigo' });
      }
    },
  });
}

// Check if the cache is empty or uninitialized
export async function isCacheEmpty(): Promise<boolean> {
  const db = await initDB();
  const count = await db.count(STORE_NAME);
  return count === 0;
}

// Save products to the cache
export async function saveProductsToCache(products: ProductInfo[]): Promise<void> {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await Promise.all(products.map(product => tx.store.put(product)));
  await tx.done;
  console.log('Product cache has been successfully populated.');
}

// Retrieve all products from the cache
export async function getProductsFromCache(): Promise<ProductInfo[]> {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}