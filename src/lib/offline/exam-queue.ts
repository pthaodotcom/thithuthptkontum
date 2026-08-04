export type TraLoiOffline = {
  cauHoiSnapshotId: string;
  chiTietThuTu: number;
  dapAnLuaChonId?: string | null;
  dapAnDungSai?: boolean | null;
  dapAnChuoi?: string | null;
};

export type QueueOperation = {
  operationId: string;
  baiLamId: string;
  sequence: number;
  type: "autosave" | "submit";
  answers: TraLoiOffline[];
  lyDo?: "TuNop" | "HetGio" | "ViPham";
  createdAt: number;
  attempts: number;
  lastError?: string;
};

const DB_NAME = "thi-thu-offline";
const DB_VERSION = 1;
const STORE = "exam-operations";

function moDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "operationId" });
        store.createIndex("by-exam-sequence", ["baiLamId", "sequence"], { unique: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore, done: (value: T) => void) => void,
) {
  const db = await moDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    action(tx.objectStore(STORE), resolve);
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => db.close();
  });
}

export async function layHangDoi(baiLamId: string): Promise<QueueOperation[]> {
  const all = await transaction<QueueOperation[]>("readonly", (store, done) => {
    const request = store.getAll();
    request.onsuccess = () => done(request.result as QueueOperation[]);
  });
  return all.filter((x) => x.baiLamId === baiLamId).sort((a, b) => a.sequence - b.sequence);
}

export async function themOperation(
  input: Omit<QueueOperation, "operationId" | "sequence" | "createdAt" | "attempts">,
) {
  const current = await layHangDoi(input.baiLamId);
  const submitted = current.find((item) => item.type === "submit");
  // Submission is the terminal operation for an attempt. Repeated clicks and
  // timer-driven autosaves after it reuse the queued submission instead of
  // creating work that could run after grading.
  if (submitted) return submitted;
  const operation: QueueOperation = {
    ...input,
    operationId: crypto.randomUUID(),
    sequence: (current.at(-1)?.sequence ?? 0) + 1,
    createdAt: Date.now(),
    attempts: 0,
  };
  await transaction<void>("readwrite", (store, done) => {
    const request = store.add(operation);
    request.onsuccess = () => done();
  });
  return operation;
}

export async function capNhatOperation(operation: QueueOperation) {
  await transaction<void>("readwrite", (store, done) => {
    const request = store.put(operation);
    request.onsuccess = () => done();
  });
}

export async function xoaOperation(operationId: string) {
  await transaction<void>("readwrite", (store, done) => {
    const request = store.delete(operationId);
    request.onsuccess = () => done();
  });
}

export function dapAnMoiNhat(queue: QueueOperation[]) {
  return queue.at(-1)?.answers;
}
