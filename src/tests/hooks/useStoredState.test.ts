import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { FADE_DURATION, STORE_PREFIX } from "@/const";
import { useStoredState } from "@/hooks/useStoredState";
import { VERSION } from "@/state";

import type { Mock } from "vitest";

// Mock valtio
vi.mock("valtio", () => ({
  proxy: vi.fn((obj) => obj),
  subscribe: vi.fn(() => vi.fn()),
}));

// Mock actions
vi.mock("@/actions", () => ({
  actions: vi.fn(() => ({})),
}));

describe("useStoredState", () => {
  const boardId = "test-board-123";
  const storageKey = STORE_PREFIX + boardId;

  // Setup localStorage mock for happy-dom
  beforeAll(() => {
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value.toString();
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
        get length() {
          return Object.keys(store).length;
        },
        key: (index: number) => {
          const keys = Object.keys(store);
          return keys[index] || null;
        },
      };
    })();

    Object.defineProperty(globalThis, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
  });

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should return null when no data exists in localStorage", async () => {
    const { result } = renderHook(() => useStoredState(boardId));

    // After effect runs, should be null since no data exists
    await waitFor(() => {
      expect(result.current.state).toBeNull();
    });
    expect(result.current.isNotFound).toBe(true);
  });

  it("should load existing board state from localStorage", async () => {
    const mockBoardState = {
      version: VERSION,
      id: boardId,
      name: "Test Board",
      folders: [{ id: "folder1", name: "Folder 1" }],
      files: {},
      areas: [],
      sketches: [],
      images: [],
      settings: {
        fadeDuration: FADE_DURATION,
        areaOpacity: 50,
      },
    };

    localStorage.setItem(storageKey, JSON.stringify(mockBoardState));

    const { result } = renderHook(() => useStoredState(boardId));

    await waitFor(() => {
      expect(result.current.state).not.toBeNull();
      expect(result.current.state).not.toBeUndefined();
    });

    expect(result.current.isNotFound).toBe(false);
    expect(result.current.state?.data.id).toBe(boardId);
    expect(result.current.state?.data.name).toBe("Test Board");
    expect(result.current.state?.data.folders).toHaveLength(1);
  });

  it("should handle corrupted JSON data gracefully", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const consoleInfoSpy = vi
      .spyOn(console, "info")
      .mockImplementation(() => {});

    localStorage.setItem(storageKey, "invalid-json{{{");

    const { result } = renderHook(() => useStoredState(boardId));

    await waitFor(() => {
      expect(result.current.state).not.toBeUndefined();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `Somehow data for board ${boardId} is corrupted`,
    );
    expect(consoleInfoSpy).toHaveBeenCalledWith("Resetting board state");

    // Should reset to initial state
    const storedData = localStorage.getItem(storageKey);
    expect(storedData).toBeTruthy();
    const parsed = JSON.parse(storedData!);
    expect(parsed.id).toBe(boardId);
    expect(parsed.version).toBe(VERSION);

    consoleErrorSpy.mockRestore();
    consoleInfoSpy.mockRestore();
  });

  it("should run migrations on old version data", async () => {
    const oldBoardState = {
      version: -1, // Old version
      id: boardId,
      name: "Old Board",
      folders: [],
      files: {},
      areas: [],
      sketches: [],
      images: [],
      // Missing settings - should be added by migration
    };

    localStorage.setItem(storageKey, JSON.stringify(oldBoardState));

    const { result } = renderHook(() => useStoredState(boardId));

    await waitFor(() => {
      expect(result.current.state).not.toBeNull();
      expect(result.current.state).not.toBeUndefined();
    });

    expect(result.current.state?.data.version).toBe(VERSION);
    expect(result.current.state?.data.settings).toBeDefined();
    expect(result.current.state?.data.settings.fadeDuration).toBe(
      FADE_DURATION,
    );
    expect(result.current.state?.data.settings.areaOpacity).toBe(80);
  });

  it("should subscribe to state changes and persist to localStorage", async () => {
    const { subscribe } = await import("valtio");
    const mockUnsubscribe = vi.fn();
    (subscribe as Mock).mockReturnValue(mockUnsubscribe);

    const mockBoardState = {
      version: VERSION,
      id: boardId,
      name: "Test Board",
      folders: [],
      files: {},
      areas: [],
      sketches: [],
      images: [],
      settings: {
        fadeDuration: FADE_DURATION,
        areaOpacity: 50,
      },
    };

    localStorage.setItem(storageKey, JSON.stringify(mockBoardState));

    const { result, unmount } = renderHook(() => useStoredState(boardId));

    await waitFor(() => {
      expect(result.current.state).not.toBeNull();
    });

    // Verify subscribe was called
    expect(subscribe).toHaveBeenCalled();

    // Simulate state change by calling the subscribe callback
    const subscribeCallback = (subscribe as Mock).mock.calls[0][1];
    act(() => {
      subscribeCallback();
    });

    // Verify data was saved to localStorage
    const storedData = localStorage.getItem(storageKey);
    expect(storedData).toBeTruthy();

    // Cleanup should call unsubscribe
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it("should not subscribe when board state is null", async () => {
    const { subscribe } = await import("valtio");
    (subscribe as Mock).mockClear();

    const { result } = renderHook(() => useStoredState(boardId));

    await waitFor(() => {
      expect(result.current.state).toBeNull();
    });

    expect(subscribe).not.toHaveBeenCalled();
  });

  it("should reload state when id changes", async () => {
    const boardId1 = "board-1";
    const boardId2 = "board-2";

    const mockBoardState1 = {
      version: VERSION,
      id: boardId1,
      name: "Board 1",
      folders: [],
      files: {},
      areas: [],
      sketches: [],
      images: [],
      settings: {
        fadeDuration: FADE_DURATION,
        areaOpacity: 50,
      },
    };

    const mockBoardState2 = {
      version: VERSION,
      id: boardId2,
      name: "Board 2",
      folders: [],
      files: {},
      areas: [],
      sketches: [],
      images: [],
      settings: {
        fadeDuration: FADE_DURATION,
        areaOpacity: 50,
      },
    };

    localStorage.setItem(
      STORE_PREFIX + boardId1,
      JSON.stringify(mockBoardState1),
    );
    localStorage.setItem(
      STORE_PREFIX + boardId2,
      JSON.stringify(mockBoardState2),
    );

    const { result, rerender } = renderHook(({ id }) => useStoredState(id), {
      initialProps: { id: boardId1 },
    });

    await waitFor(() => {
      expect(result.current.state?.data.name).toBe("Board 1");
    });

    // Change the id
    rerender({ id: boardId2 });

    await waitFor(() => {
      expect(result.current.state?.data.name).toBe("Board 2");
    });
  });

  it("should create state with actions and ui properties", async () => {
    const mockBoardState = {
      version: VERSION,
      id: boardId,
      name: "Test Board",
      folders: [],
      files: {},
      areas: [],
      sketches: [],
      images: [],
      settings: {
        fadeDuration: FADE_DURATION,
        areaOpacity: 50,
      },
    };

    localStorage.setItem(storageKey, JSON.stringify(mockBoardState));

    const { result } = renderHook(() => useStoredState(boardId));

    await waitFor(() => {
      expect(result.current.state).not.toBeNull();
    });

    expect(result.current.state).toHaveProperty("data");
    expect(result.current.state).toHaveProperty("ui");
    expect(result.current.state).toHaveProperty("actions");

    // Verify UI state has expected properties
    expect(result.current.state?.ui).toMatchObject({
      selectedTool: "select",
      selectedId: null,
      editMode: true,
      marker: null,
      tracks: {},
      position: { x: 0, y: 0 },
      zoom: 1,
    });
  });
});
