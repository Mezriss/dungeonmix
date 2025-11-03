import { useSnapshot } from "valtio";
import { useBoardState } from "@/providers/BoardStateContext";

import type { PointerEvent } from "react";

type Props = {
  rect: { x: number; y: number; width: number; height: number };
};

export function useImagePlacing({ rect }: Props) {
  const state = useBoardState();
  const ui = useSnapshot(state.ui);

  const placeImage = (e: PointerEvent<HTMLDivElement>) => {
    if (
      !state.ui.editMode ||
      state.ui.selectedTool !== "image" ||
      e.buttons !== 1 ||
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest("label") ||
      !(e.target as HTMLElement).closest("#root")
    )
      return;
    const id = state.actions.addImage(
      (e.clientX - rect.x - rect.width / 2 - ui.position.x) * (1 / ui.zoom),
      (e.clientY - rect.y - rect.height / 2 - ui.position.y) * (1 / ui.zoom),
    );
    state.actions.select(id);
  };

  return { placeImage };
}
