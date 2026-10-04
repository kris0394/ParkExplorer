/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScoredPhoto } from '../entities/photography.ts';

const DB_NAME = 'park-explorer';
const STORE_NAME = 'photos';

function openDB(): Promise<IDBDatabase | null> {
  return new Promise(resolve => {
    try {
      if (!('indexedDB' in window)) {
        return resolve(null);
      }
      const req = window.indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest | void,
  fallback: T
): Promise<T> {
  return openDB().then(
    db =>
      new Promise(resolve => {
        if (!db) return resolve(fallback);
        try {
          const tx = db.transaction(STORE_NAME, mode);
          const store = tx.objectStore(STORE_NAME);
          const req = fn(store);
          tx.oncomplete = () => {
            db.close();
            resolve(req && 'result' in req ? req.result : fallback);
          };
          tx.onerror = () => {
            db.close();
            resolve(fallback);
          };
          tx.onabort = () => {
            db.close();
            resolve(fallback);
          };
        } catch {
          resolve(fallback);
        }
      })
  );
}

export function getAllPhotos(): Promise<ScoredPhoto[]> {
  return withStore(
    'readonly',
    store => store.getAll(),
    [] as ScoredPhoto[]
  ).then(list => (Array.isArray(list) ? list : []).sort((a, b) => b.takenAt - a.takenAt));
}

export function savePhotoToStore(photo: ScoredPhoto): Promise<void> {
  return withStore('readwrite', store => store.put(photo), undefined);
}

export function deletePhotoFromStore(id: string): Promise<void> {
  return withStore('readwrite', store => store.delete(id), undefined);
}

export function replaceAllPhotos(photos: ScoredPhoto[]): Promise<void> {
  return withStore(
    'readwrite',
    store => {
      store.clear();
      for (const p of photos) {
        store.put(p);
      }
    },
    undefined
  );
}

export function clearAllPhotos(): Promise<void> {
  return withStore('readwrite', store => store.clear(), undefined);
}
