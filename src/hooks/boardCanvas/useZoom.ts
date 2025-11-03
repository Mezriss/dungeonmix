import { useEffect } from "react";
import { useBoardState } from "@/providers/BoardStateContext";

import type { RefObject } from "react";

export function useZoom(ref: RefObject<HTMLElement>) {
  const { actions } = useBoardState();
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      const { deltaY } = event;
      const zoomFactor = deltaY > 0 ? 0.1 : -0.1;
      actions.changeZoom(zoomFactor);
    };
    const el = ref?.current;

    el?.addEventListener("wheel", handleWheel);

    return () => {
      el?.removeEventListener("wheel", handleWheel);
    };
  }, [actions, ref]);
}
