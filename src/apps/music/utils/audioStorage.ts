/**
 * IndexedDB Audio File Storage Engine
 * Persists local user audio files (MP3, WAV, FLAC, M4A, etc.) in the browser.
 */

const DB_NAME = 'harmony_music_player_db';
const DB_VERSION = 1;
const STORE_FILES = 'audio_files';
const STORE_METADATA = 'audio_metadata';

export interface SavedTrackRecord {
  id: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl: string;
  duration: number;
  addedAt: number;
  sizeBytes: number;
  fileName: string;
  mimeType: string;
}

class AudioStorageEngine {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
          reject(new Error('IndexedDB is not supported in this browser environment.'));
          return;
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_FILES)) {
            db.createObjectStore(STORE_FILES);
          }
          if (!db.objectStoreNames.contains(STORE_METADATA)) {
            db.createObjectStore(STORE_METADATA, { keyPath: 'id' });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          this.dbPromise = null;
          reject(request.error);
        };
        request.onblocked = () => {
          console.warn('[AudioStorageEngine] IndexedDB open blocked');
        };
      });
    }
    return this.dbPromise;
  }

  /**
   * Save a local file blob and its metadata to IndexedDB
   */
  public async saveAudioTrack(metadata: SavedTrackRecord, fileBlob: Blob): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_FILES, STORE_METADATA], 'readwrite');
      const filesStore = tx.objectStore(STORE_FILES);
      const metaStore = tx.objectStore(STORE_METADATA);

      filesStore.put(fileBlob, metadata.id);
      metaStore.put(metadata);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Retrieve audio file Blob by track ID
   */
  public async getAudioBlob(id: string): Promise<Blob | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_FILES, 'readonly');
      const filesStore = tx.objectStore(STORE_FILES);
      const request = filesStore.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieve all track metadata records
   */
  public async getAllMetadata(): Promise<SavedTrackRecord[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_METADATA, 'readonly');
      const metaStore = tx.objectStore(STORE_METADATA);
      const request = metaStore.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a track and its binary audio file from IndexedDB
   */
  public async deleteAudioTrack(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_FILES, STORE_METADATA], 'readwrite');
      tx.objectStore(STORE_FILES).delete(id);
      tx.objectStore(STORE_METADATA).delete(id);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Clear all tracks, audio binary blobs, and metadata from IndexedDB
   */
  public async clearAll(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_FILES, STORE_METADATA], 'readwrite');
      tx.objectStore(STORE_FILES).clear();
      tx.objectStore(STORE_METADATA).clear();

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const audioStorage = new AudioStorageEngine();
