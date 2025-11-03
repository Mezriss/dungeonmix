import { t } from "@lingui/core/macro";
import { delMany } from "idb-keyval";
import { KEY_BOARDS, STORE_PREFIX } from "@/const";
import { error } from "@/services/errorHandler";

import type { BoardList } from "@/Landing";
import type { BoardState } from "@/state";

export const boardActions = (data: BoardState) => ({
  updateName: (name: string) => {
    data.name = name;
    try {
      const boardIndex: BoardList = JSON.parse(
        localStorage.getItem(KEY_BOARDS) || "",
      );
      const record = boardIndex.find((board) => board.id === data.id);
      if (record) {
        record.name = data.name;
        localStorage.setItem(KEY_BOARDS, JSON.stringify(boardIndex));
      }
    } catch (e) {
      error(e as Error, t`Could not update board name`);
      localStorage.setItem(
        KEY_BOARDS,
        JSON.stringify([{ id: data.id, name: data.name }]),
      );
    }
  },
  deleteBoard: async () => {
    try {
      const boardIndex: BoardList = JSON.parse(
        localStorage.getItem(KEY_BOARDS) || "",
      );
      const index = boardIndex.findIndex((board) => board.id === data.id);
      if (index !== -1) {
        boardIndex.splice(index, 1);
        localStorage.setItem(KEY_BOARDS, JSON.stringify(boardIndex));
      }
    } catch {
      error("Corrupted board index");
      localStorage.setItem(KEY_BOARDS, JSON.stringify([]));
    }
    localStorage.removeItem(STORE_PREFIX + data.id);
    const existingHandleIds = data.folders.map(
      (folder) => STORE_PREFIX + folder.id,
    );
    await delMany(existingHandleIds);
    const imageIds = data.images.map((image) => STORE_PREFIX + image.id);
    await delMany(imageIds);
  },
});
