import type { FishingSpot } from "@/lib/types";

const DB_NAME = "fishing-app-db";
const STORE_NAME = "fishing-spots";
const DB_VERSION = 1;

/**
 * IndexedDB のリクエストを Promise で扱いやすくするための関数です。
 * 成功したら result を返し、失敗したら reject します。
 */
function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * 書き込みトランザクションが完了するまで待つための関数です。
 */
function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

/**
 * ブラウザの IndexedDB を開きます。
 * 初回は object store を作成します。
 */
export function openSpotDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("このブラウザでは IndexedDB が利用できません。"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * ブラウザごとの差異に備えて、ID を安全に作るための関数です。
 */
function createSpotId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * 1件保存します。
 * 保存後は、実際に保存したデータを返します。
 */
export async function saveSpot(
  input: Omit<FishingSpot, "id">
): Promise<FishingSpot> {
  const database = await openSpotDatabase();

  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const newSpot: FishingSpot = {
      id: createSpotId(),
      title: input.title,
      memo: input.memo,
      lat: input.lat,
      lng: input.lng,
      date: input.date,
    };

    store.put(newSpot);
    await transactionToPromise(transaction);

    return newSpot;
  } finally {
    database.close();
  }
}

/**
 * 一覧を取得します。
 * 新しい記録が上に来るように日付の降順で並べます。
 */
export async function getAllSpots(): Promise<FishingSpot[]> {
  const database = await openSpotDatabase();

  try {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    const spots = await requestToPromise<FishingSpot[]>(request);

    return spots.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } finally {
    database.close();
  }
}

/**
 * id を使って 1件だけ取得します。
 */
export async function getSpotById(
  id: string
): Promise<FishingSpot | undefined> {
  const database = await openSpotDatabase();

  try {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    const spot = await requestToPromise<FishingSpot | undefined>(request);
    return spot;
  } finally {
    database.close();
  }
}
