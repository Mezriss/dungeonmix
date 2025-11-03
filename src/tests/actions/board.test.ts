import { i18n } from "@lingui/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { actions } from "@/actions";
import { KEY_BOARDS } from "@/const";
import { getInitialBoardState, getInitialUIState } from "@/state";

import type { BoardState, UIState } from "@/state";
import type { Mocked } from "vitest";

describe("board", () => {
  i18n.loadAndActivate({ locale: "en", messages: {} });

  let data: BoardState;
  let ui: UIState;
  let localStorageMock: Mocked<Storage>;

  beforeEach(() => {
    data = getInitialBoardState("board-1");
    data.name = "Old Board Name";
    ui = getInitialUIState();

    localStorageMock = {
      length: 0,
      key: vi.fn(),
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    vi.stubGlobal("localStorage", localStorageMock);
  });

  describe("updateName", () => {
    it("should update the board name in state and board list", () => {
      const newName = "New Board Name";
      const boardList = [
        {
          id: "board-1",
          name: "Old Board Name",
        },
        {
          id: "board-2",
          name: "Another Board",
        },
      ];

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(boardList));

      const { updateName } = actions(data, ui);
      updateName(newName);

      expect(data.name).toBe(newName);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        KEY_BOARDS,
        JSON.stringify([
          {
            id: "board-1",
            name: newName,
          },
          {
            id: "board-2",
            name: "Another Board",
          },
        ]),
      );
    });

    it("should handle localStorage.getItem returning an invalid JSON string", () => {
      const newName = "New Board Name";
      localStorageMock.getItem.mockReturnValueOnce("invalid json");
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {}); // Mock console.error

      const { updateName } = actions(data, ui);
      updateName(newName);

      expect(data.name).toBe(newName);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(KEY_BOARDS);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "dungeonmix:boards",
        '[{"id":"board-1","name":"New Board Name"}]',
      );
      expect(errorSpy).toHaveBeenCalled();

      errorSpy.mockRestore(); // Restore console.error
    });
  });
});
