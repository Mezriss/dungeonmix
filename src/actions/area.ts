import { nanoid } from "nanoid";
import { MIN_AREA_SIZE } from "@/const";
import { warning } from "@/services/errorHandler";

import type { AudioArea, BoardState, UIState } from "@/state";

export const areaActions = (data: BoardState, ui: UIState) => ({
  addArea: (shape: AudioArea) => {
    const area = {
      ...shape,
      id: nanoid(),
    };

    area.width = Math.max(area.width, MIN_AREA_SIZE);
    area.height = Math.max(area.height, MIN_AREA_SIZE);
    data.areas.push(area);
    ui.selectedId = area.id;
  },

  deleteArea: (id: string) => {
    const index = data.areas.findIndex((area) => area.id === id);
    if (index === -1) {
      return warning(`Area ${id} is missing from state`);
    }
    data.areas.splice(index, 1);
  },
  moveArea: (id: string, x: number, y: number) => {
    const area = data.areas.find((area) => area.id === id);
    if (!area) {
      return warning(`Area ${id} is missing from state`);
    }
    area.x += x;
    area.y += y;
  },
});
