import { useCallback, useEffect, useRef } from "react";

import type { RefObject } from "react";

type Props = {
  refs: RefObject<HTMLDivElement>[];
  onUpdate: (moveX: number, moveY: number) => void;
};

export function useDrag({ refs, onUpdate }: Props) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const refsRef = useRef(refs);
  const onUpdateRef = useRef(onUpdate);

  // Keep refs up to date
  useEffect(() => {
    refsRef.current = refs;
    onUpdateRef.current = onUpdate;
  });

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!start.current) return;
    for (const ref of refsRef.current) {
      if (ref.current) {
        ref.current.style.setProperty(
          "--dx",
          `${e.clientX - start.current.x}px`,
        );
        ref.current.style.setProperty(
          "--dy",
          `${e.clientY - start.current.y}px`,
        );
      }
    }
  }, []);

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      for (const ref of refsRef.current) {
        ref.current?.style.removeProperty("--dx");
        ref.current?.style.removeProperty("--dy");
      }
      if (start.current) {
        onUpdateRef.current(
          e.clientX - start.current.x,
          e.clientY - start.current.y,
        );
        start.current = null;
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    },
    [onPointerMove],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  const onDragStart = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      start.current = { x: e.clientX, y: e.clientY };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [onPointerMove, onPointerUp],
  );

  return {
    onDragStart,
  };
}
