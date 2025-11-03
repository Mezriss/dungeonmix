import { act, renderHook } from "@testing-library/react";
import { get } from "idb-keyval";
import { describe, expect, it, vi } from "vitest";
import { useIDB } from "@/hooks/useIDB";

import type { Mock } from "vitest";

vi.mock("idb-keyval", () => ({
  get: vi.fn(),
}));

describe("useIDB", () => {
  it("should return loading true initially, then false after fetching", async () => {
    const promise = Promise.resolve("test data");
    (get as Mock).mockReturnValue(promise);

    const { result } = renderHook(() => useIDB("test-key"));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(undefined);
    expect(result.current.error).toBe(null);

    await act(async () => {
      await promise;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe("test data");
    expect(result.current.error).toBe(null);
  });

  it("should handle errors during data fetching", async () => {
    const error = new Error("Failed to fetch");
    const promise = Promise.reject(error);
    (get as Mock).mockReturnValue(promise);

    const { result } = renderHook(() => useIDB("test-key"));

    expect(result.current.loading).toBe(true);

    await act(async () => {
      try {
        await promise;
      } catch {
        // prevent unhandled promise rejection warning
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(undefined);
    expect(result.current.error).toBe(error);
  });
});
