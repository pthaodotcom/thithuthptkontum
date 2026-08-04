import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  capNhatOperation,
  dapAnMoiNhat,
  layHangDoi,
  themOperation,
  xoaOperation,
} from "@/lib/offline/exam-queue";

const baiLamId = "10000000-0000-0000-0000-000000000001";
const answer = (value: string) => [{
  cauHoiSnapshotId: "20000000-0000-0000-0000-000000000001",
  chiTietThuTu: 0,
  dapAnChuoi: value,
}];

beforeEach(async () => {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase("thi-thu-offline");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
});

describe("IndexedDB exam queue", () => {
  it("persists operations in sequence and restores the newest answers", async () => {
    const first = await themOperation({ baiLamId, type: "autosave", answers: answer("1234") });
    const second = await themOperation({ baiLamId, type: "submit", answers: answer("5678"), lyDo: "TuNop" });
    const restored = await layHangDoi(baiLamId);

    expect(restored.map((x) => x.operationId)).toEqual([first.operationId, second.operationId]);
    expect(restored.map((x) => x.sequence)).toEqual([1, 2]);
    expect(dapAnMoiNhat(restored)).toEqual(answer("5678"));
  });

  it("keeps retry metadata and removes only acknowledged operations", async () => {
    const operation = await themOperation({ baiLamId, type: "autosave", answers: answer("1234") });
    operation.attempts = 3;
    operation.lastError = "network";
    await capNhatOperation(operation);
    expect((await layHangDoi(baiLamId))[0]).toMatchObject({ attempts: 3, lastError: "network" });

    await xoaOperation(operation.operationId);
    expect(await layHangDoi(baiLamId)).toEqual([]);
  });

  it("treats submit as terminal across reloads and repeated clicks", async () => {
    await themOperation({ baiLamId, type: "autosave", answers: answer("1234") });
    const submit = await themOperation({
      baiLamId, type: "submit", answers: answer("5678"), lyDo: "TuNop",
    });
    const repeated = await themOperation({
      baiLamId, type: "submit", answers: answer("9999"), lyDo: "TuNop",
    });
    const lateAutosave = await themOperation({
      baiLamId, type: "autosave", answers: answer("0000"),
    });

    expect(repeated.operationId).toBe(submit.operationId);
    expect(lateAutosave.operationId).toBe(submit.operationId);
    expect((await layHangDoi(baiLamId)).map((item) => item.type))
      .toEqual(["autosave", "submit"]);
    expect(dapAnMoiNhat(await layHangDoi(baiLamId))).toEqual(answer("5678"));
  });

  it("preserves sequence and retry state after reopening IndexedDB", async () => {
    const first = await themOperation({
      baiLamId, type: "autosave", answers: answer("1111"),
    });
    first.attempts = 2;
    first.lastError = "offline";
    await capNhatOperation(first);
    const second = await themOperation({
      baiLamId, type: "autosave", answers: answer("2222"),
    });

    const restored = await layHangDoi(baiLamId);
    expect(restored).toMatchObject([
      { operationId: first.operationId, sequence: 1, attempts: 2, lastError: "offline" },
      { operationId: second.operationId, sequence: 2, attempts: 0 },
    ]);
    expect(dapAnMoiNhat(restored)).toEqual(answer("2222"));
  });
});
