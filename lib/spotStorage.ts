import type { FishingLog, Spot } from "@/lib/types";

const DB_NAME = "fishing-app-db";
const DB_VERSION = 2;
const SPOT_STORE_NAME = "spots";
const LOG_STORE_NAME = "logs";
const LEGACY_SPOT_STORE_NAME = "fishing-spots";

type LegacyFishingSpot = {
  id: string;
  title: string;
  memo: string;
  lat: number;
  lng: number;
  date: string;
};

/**
 * IndexedDB のリクエストを Promise で扱いやすくするための関数です。
 */
function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * トランザクション完了まで待つための関数です。
 */
function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

/**
 * 古い FishingSpot 形式のデータを、新しい Spot 形式へ変換します。
 * areaName は以前の構成では無かったので、空文字で初期化します。
 */
function convertLegacySpot(legacySpot: LegacyFishingSpot): Spot {
  return {
    id: legacySpot.id,
    name: legacySpot.title,
    lat: legacySpot.lat,
    lng: legacySpot.lng,
    areaName: "",
    memo: legacySpot.memo,
    createdAt: legacySpot.date,
  };
}

/**
 * ブラウザの IndexedDB を開きます。
 * 初回やバージョン更新時に object store を作成します。
 */
export function openFishingDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("このブラウザでは IndexedDB が利用できません。"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      const transaction = request.transaction;

      if (!database.objectStoreNames.contains(SPOT_STORE_NAME)) {
        database.createObjectStore(SPOT_STORE_NAME, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(LOG_STORE_NAME)) {
        const logStore = database.createObjectStore(LOG_STORE_NAME, {
          keyPath: "id",
        });

        logStore.createIndex("spotId", "spotId", { unique: false });
      }

      // 旧構成の fishing-spots から、新しい spots へデータを移します。
      // 以前の記録をできるだけ失わないための移行処理です。
      if (
        transaction &&
        database.objectStoreNames.contains(LEGACY_SPOT_STORE_NAME)
      ) {
        const legacyStore = transaction.objectStore(LEGACY_SPOT_STORE_NAME);
        const newSpotStore = transaction.objectStore(SPOT_STORE_NAME);
        const legacyRequest = legacyStore.getAll();

        legacyRequest.onsuccess = () => {
          const legacySpots = legacyRequest.result as LegacyFishingSpot[];

          legacySpots.forEach((legacySpot) => {
            newSpotStore.put(convertLegacySpot(legacySpot));
          });
        };
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * ブラウザごとの差異に備えて、ID を安全に作るための関数です。
 */
function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Spot を1件保存します。
 */
export async function saveSpot(input: Omit<Spot, "id">): Promise<Spot> {
  const database = await openFishingDatabase();

  try {
    const transaction = database.transaction(SPOT_STORE_NAME, "readwrite");
    const store = transaction.objectStore(SPOT_STORE_NAME);

    const newSpot: Spot = {
      id: createId(),
      name: input.name,
      lat: input.lat,
      lng: input.lng,
      areaName: input.areaName,
      memo: input.memo,
      createdAt: input.createdAt,
    };

    store.put(newSpot);
    await transactionToPromise(transaction);

    return newSpot;
  } finally {
    database.close();
  }
}

/**
 * Spot 一覧を取得します。
 */
export async function getAllSpots(): Promise<Spot[]> {
  const database = await openFishingDatabase();

  try {
    const transaction = database.transaction(SPOT_STORE_NAME, "readonly");
    const store = transaction.objectStore(SPOT_STORE_NAME);
    const request = store.getAll();
    const spots = await requestToPromise<Spot[]>(request);

    return spots.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } finally {
    database.close();
  }
}

/**
 * Spot を1件取得します。
 */
export async function getSpotById(id: string): Promise<Spot | undefined> {
  const database = await openFishingDatabase();

  try {
    const transaction = database.transaction(SPOT_STORE_NAME, "readonly");
    const store = transaction.objectStore(SPOT_STORE_NAME);
    const request = store.get(id);

    return await requestToPromise<Spot | undefined>(request);
  } finally {
    database.close();
  }
}

/**
 * FishingLog を1件保存します。
 */
export async function saveFishingLog(
  input: Omit<FishingLog, "id">
): Promise<FishingLog> {
  const database = await openFishingDatabase();

  try {
    const transaction = database.transaction(LOG_STORE_NAME, "readwrite");
    const store = transaction.objectStore(LOG_STORE_NAME);

    const newLog: FishingLog = {
      id: createId(),
      spotId: input.spotId,
      date: input.date,
      result: input.result,
      fishType: input.fishType,
      sizeCm: input.sizeCm,
      count: input.count,
      weather: input.weather,
      tide: input.tide,
      timeZone: input.timeZone,
      lureOrBait: input.lureOrBait,
      memo: input.memo,
      createdAt: input.createdAt,
    };

    store.put(newLog);
    await transactionToPromise(transaction);

    return newLog;
  } finally {
    database.close();
  }
}

/**
 * 指定した Spot に紐づく FishingLog 一覧を取得します。
 * 新しい釣行が上に来るように並べます。
 */
export async function getFishingLogsBySpotId(
  spotId: string
): Promise<FishingLog[]> {
  const database = await openFishingDatabase();

  try {
    const transaction = database.transaction(LOG_STORE_NAME, "readonly");
    const store = transaction.objectStore(LOG_STORE_NAME);
    const index = store.index("spotId");
    const request = index.getAll(spotId);
    const logs = await requestToPromise<FishingLog[]>(request);

    return logs.sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();

      if (dateDiff !== 0) {
        return dateDiff;
      }

      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  } finally {
    database.close();
  }
}

/**
 * FishingLog を1件取得します。
 */
export async function getFishingLogById(
  id: string
): Promise<FishingLog | undefined> {
  const database = await openFishingDatabase();

  try {
    const transaction = database.transaction(LOG_STORE_NAME, "readonly");
    const store = transaction.objectStore(LOG_STORE_NAME);
    const request = store.get(id);

    return await requestToPromise<FishingLog | undefined>(request);
  } finally {
    database.close();
  }
}
