import { i18n } from "@lingui/core";
import { Howl } from "howler";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { actions } from "@/actions";
import { getInitialBoardState, getInitialUIState } from "@/state";

import type { BoardState, UIState } from "@/state";

describe("track", () => {
  let data: BoardState;
  let ui: UIState;

  i18n.loadAndActivate({ locale: "en", messages: {} });

  vi.mock("idb-keyval", () => ({
    get: vi.fn().mockResolvedValue("test"),
  }));

  vi.mock("@/util/file.ts", () => ({
    getPermission: vi.fn().mockResolvedValue(true),
    getFileHandleFromPath: () =>
      Promise.resolve({
        getFile: () => Promise.resolve({}),
      }),
  }));

  const howlerMock = vi.hoisted(() => ({
    play: vi.fn(),
    stop: vi.fn(),
    volume: vi.fn().mockReturnValue(1),
  }));

  vi.mock("howler", () => {
    return {
      Howl: vi.fn().mockImplementation(function () {
        return {
          off: vi.fn(),
          fade: vi.fn(),
          volume: howlerMock.volume,
          play: howlerMock.play,
          pause: vi.fn(),
          once: vi.fn(),
          seek: vi.fn(),
          duration: vi.fn().mockReturnValue(1000),
          stop: howlerMock.stop,
        };
      }),
    };
  });

  vi.stubGlobal("URL", {
    createObjectURL: vi.fn().mockReturnValue("test"),
  });

  beforeEach(() => {
    vi.useFakeTimers();

    data = getInitialBoardState("board-1");
    ui = getInitialUIState();

    const { addArea, addTrackToArea } = actions(data, ui);
    addArea({
      id: "temp",
      shape: "rectangle",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      tracks: [],
    });
    addArea({
      id: "temp",
      shape: "rectangle",
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      tracks: [],
    });
    addTrackToArea(data.areas[0].id, "track-1");
    data.files["track-1"] = {
      id: "track-1",
      name: "track-1",
      path: "track-1.mp3",
      format: "mp3",
      folderId: "folder-1",
    };
    addTrackToArea(data.areas[1].id, "track-2");
    data.files["track-2"] = {
      id: "track-2",
      name: "track-2",
      path: "track-2.mp3",
      format: "mp3",
      folderId: "folder-1",
    };
  });
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("setMarker", () => {
    it("should set marker to new position", async () => {
      const { setMarker } = actions(data, ui);
      await setMarker({ x: 1, y: 2 });
      expect(ui.marker).toEqual({ x: 1, y: 2 });
    });
    it("should init tracks outside of track cache", async () => {
      const { setMarker } = actions(data, ui);
      await setMarker({ x: 1, y: 1 });
      expect(ui.tracks["track-1"]).toBeDefined();
    });
    it("should play tracks that are in hit areas", async () => {
      const { setMarker } = actions(data, ui);
      await setMarker({ x: 1, y: 1 });
      expect(ui.tracks["track-1"].status).toBe("playing");
      await setMarker({ x: 75, y: 75 });
      expect(ui.tracks["track-1"].status).toBe("playing");
      expect(ui.tracks["track-2"].status).toBe("playing");
    });
    it("should fade out tracks outside of hit areas", async () => {
      const { setMarker } = actions(data, ui);
      await setMarker({ x: 1, y: 1 });
      await setMarker({ x: 200, y: 1 });
      expect(ui.tracks["track-1"].status).toBe("fadingout");
    });
    it("should not call play when returning to area with fading out track", async () => {
      const { setMarker } = actions(data, ui);
      await setMarker({ x: 1, y: 1 });
      await setMarker({ x: 200, y: 1 });
      await setMarker({ x: 1, y: 1 });
      expect(howlerMock.play).toBeCalledTimes(1);
    });
  });

  describe("previewVolume", () => {
    it("should init track for preview", async () => {
      const { previewVolume } = actions(data, ui);
      await previewVolume("track-1", 0.5);
      expect(Howl).toHaveBeenCalled();
    });
    it("should adjust volume of currently playing track", async () => {
      const { setMarker, previewVolume } = actions(data, ui);
      await setMarker({ x: 1, y: 1 });
      // @ts-expect-error it's a mock, not actual Howl instance
      Howl.mockClear();
      await previewVolume("track-1", 0.5);
      expect(howlerMock.volume).toHaveBeenCalledWith(0.5);
      expect(Howl).not.toHaveBeenCalled();
    });
    it("should stop in 3s after last preview", async () => {
      const { previewVolume } = actions(data, ui);
      await previewVolume("track-1", 0.5);
      vi.advanceTimersByTime(2000);
      expect(howlerMock.stop).not.toHaveBeenCalled();
      await previewVolume("track-1", 0.5);
      vi.advanceTimersByTime(2000);
      expect(howlerMock.stop).not.toHaveBeenCalled();
      vi.advanceTimersByTime(3500);
      expect(howlerMock.stop).toHaveBeenCalled();
    });
  });
});
