// Everything lives on the phone in IndexedDB. One record per training day.

export interface SetLog { kg: number | null; reps: number | null; done: boolean }
export interface DayLog {
  date: string;                       // YYYY-MM-DD, local
  session: number;                    // 1 to 4
  ex: Record<string, SetLog[]>;       // exercise id -> sets
  extra: { done: boolean; note: string };
  updated: number;
}

const DB_NAME = "gymplan";
const STORE = "days";
let dbp: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (!dbp) {
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "date" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbp;
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | void> {
  return open().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const s = t.objectStore(STORE);
    const r = fn(s);
    t.oncomplete = () => resolve(r ? (r as IDBRequest<T>).result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

export async function loadAll(): Promise<Record<string, DayLog>> {
  const rows = (await tx<DayLog[]>("readonly", s => s.getAll())) || [];
  const out: Record<string, DayLog> = {};
  (rows as DayLog[]).forEach(r => { out[r.date] = r; });
  return out;
}

export function put(day: DayLog): Promise<unknown> {
  day.updated = Date.now();
  return tx("readwrite", s => s.put(JSON.parse(JSON.stringify(day))));
}

export function remove(date: string): Promise<unknown> {
  return tx("readwrite", s => s.delete(date));
}

export async function replaceAll(days: DayLog[]): Promise<void> {
  await tx("readwrite", s => { s.clear(); days.forEach(d => s.put(d)); });
}

// Ask iOS to keep our data even under storage pressure.
export async function askPersist(): Promise<boolean> {
  try { return navigator.storage && navigator.storage.persist ? await navigator.storage.persist() : false; }
  catch { return false; }
}
