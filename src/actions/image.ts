import { del, set } from "idb-keyval";
import { nanoid } from "nanoid";
import { STORE_PREFIX } from "@/const";
import { warning, withErrorHandling } from "@/services/errorHandler";

import type { BoardState } from "@/state";

export const imageActions = (data: BoardState) => ({
  addImage: (x: number, y: number) => {
    const imageId = nanoid();
    data.images.push({
      id: imageId,
      x,
      y,
      scale: 1,
      assetId: null,
    });
    return imageId;
  },
  moveImage: (id: string, x: number, y: number) => {
    const image = data.images.find((image) => image.id === id);
    if (!image) {
      return warning(`Image with id ${id} not found`);
    }
    image.x += x;
    image.y += y;
  },
  loadImage: async (id: string, file: File) => {
    const image = data.images.find((image) => image.id === id);
    if (!image) {
      return warning(`Image placeholder ${id} is not in state`);
    }
    const assetId = nanoid();
    await withErrorHandling(() => set(STORE_PREFIX + assetId, file), "error");
    image.assetId = assetId;
  },
  setImageScale: (id: string, scale: number) => {
    const image = data.images.find((image) => image.id === id);
    if (!image) {
      return warning(`Image with id ${id} not found`);
    }
    image.scale = scale;
  },
  deleteImage: (id: string) => {
    const image = data.images.find((image) => image.id === id);
    if (!image) {
      return warning(`Image with id ${id} not found`);
    }
    const assetId = image.assetId;
    if (assetId) {
      del(STORE_PREFIX + assetId);
    }
    data.images.splice(data.images.indexOf(image), 1);
  },
});
