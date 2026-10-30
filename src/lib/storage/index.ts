import { StorageAdapter } from './adapter';
import { LocalStorageAdapter } from './localStorageAdapter';

let instance: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (!instance) {
    instance = new LocalStorageAdapter();
  }
  return instance;
}

export * from './adapter';
