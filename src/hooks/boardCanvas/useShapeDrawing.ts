import { useState } from "react";
import { useSnapshot } from "valtio";
import { useBoardState } from "@/providers/BoardStateContext";

import type { AudioArea } from "@/state";
import type { PointerEvent } from "react";

type Props = {
  rect: { x: number; y: number; width: number; height: number };
};

export function useShapeDrawing({ rect }: Props) {
  const state = useBoardState();
  const ui = useSnapshot(state.ui);
  const [tempShape, setTempShape] = useState<AudioArea | null>(null);

  const startDrawing = (e: PointerEvent) => {
    if (
      !state.ui.editMode ||
      e.buttons !== 1 ||
      !["circle", "rectangle"].includes(state.ui.selectedTool) ||
      (e.target as HTMLElement).closest("button") ||
      !(e.target as HTMLElement).closest("#root")
    )
      return;

    setTempShape({
      id: "temp",
      shape: state.ui.selectedTool as "circle" | "rectangle",
      width: 0,
      height: 0,
      x: e.clientX - rect.x,
      y: e.clientY - rect.y,
      tracks: [],
    });
  };

  const draw = (e: PointerEvent) => {
    if (!tempShape) return;
    setTempShape({
      ...tempShape,

      width: e.clientX - rect.x - tempShape.x,
      height: e.clientY - rect.y - tempShape.y,
    });
  };

  const endDrawing = () => {
    if (tempShape) {
      tempShape.x =
        (tempShape.x - ui.position.x - rect.width / 2) * (1 / ui.zoom);
      tempShape.y =
        (tempShape.y - ui.position.y - rect.height / 2) * (1 / ui.zoom);
      tempShape.width *= 1 / ui.zoom;
      tempShape.height *= 1 / ui.zoom;
      state.actions.addArea(tempShape);
      setTempShape(null);
    }
  };

  return { tempShape, startDrawing, draw, endDrawing };
}
