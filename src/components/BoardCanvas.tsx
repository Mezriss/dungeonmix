import { useRef } from "react";
import { useSnapshot } from "valtio";
import { AudioArea, TempAudioArea } from "./shapes/AudioArea";
import ImageContainer from "./shapes/ImageContainer";
import { useBoardDimensions } from "@/hooks/boardCanvas/useBoardDimensions";
import { useBoardPan } from "@/hooks/boardCanvas/useBoardPan";
import { useImagePlacing } from "@/hooks/boardCanvas/useImagePlacing";
import { useShapeDrawing } from "@/hooks/boardCanvas/useShapeDrawing";
import { useZoom } from "@/hooks/boardCanvas/useZoom";
import { useBoardState } from "@/providers/BoardStateContext";

import type { CSSProperties, PointerEvent } from "react";

import { MapPin } from "lucide-react";
import styles from "@/styles/BoardCanvas.module.css";

export default function BoardCanvas() {
  const state = useBoardState();
  const data = useSnapshot(state.data);
  const ui = useSnapshot(state.ui);
  const bodyRef = useRef<HTMLDivElement>(null!);

  useZoom(bodyRef);
  const rect = useBoardDimensions(bodyRef);

  const { tempShape, startDrawing, draw, endDrawing } = useShapeDrawing({
    rect,
  });
  const { panDelta, startPan, pan, endPan } = useBoardPan();
  const { placeImage } = useImagePlacing({ rect });

  const style = {
    "--area-opacity": data.settings.areaOpacity + "%",
  } as CSSProperties;

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    e.preventDefault();

    if (e.buttons === 2) {
      state.actions.select(null);
      return false;
    }

    startPan(e);
    startDrawing(e);
    placeImage(e);

    if (e.buttons === 1) {
      if (state.ui.editMode) {
        if (
          state.ui.selectedTool === "select" &&
          e.target === e.currentTarget
        ) {
          state.actions.select(null);
        }
      } else if (!(e.target as HTMLElement).closest("button")) {
        state.actions.setMarker({
          x:
            (e.clientX - rect.x - rect.width / 2 - ui.position.x) *
            (1 / ui.zoom),
          y:
            (e.clientY - rect.y - rect.height / 2 - ui.position.y) *
            (1 / ui.zoom),
        });
      }
    }
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    endDrawing();
    endPan(e);
  }

  function handlePointerLeave(e: PointerEvent<HTMLDivElement>) {
    endPan(e);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    draw(e);
    pan(e);
  }
  return (
    <div
      ref={bodyRef}
      className={styles.body}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      style={style}
      onContextMenu={(e) => e.preventDefault()}
      data-testid="board-canvas"
    >
      <div
        className={styles.positioner}
        style={{
          left: "50%",
          top: "50%",
          transform: `translate(${ui.position.x + panDelta.x}px, ${ui.position.y + panDelta.y}px) scale(${ui.zoom})`,
        }}
      >
        {data.images.map((image) => (
          <ImageContainer key={image.id} id={image.id} rect={rect} />
        ))}
        {data.areas.map((area) => (
          <AudioArea rect={rect} key={area.id} id={area.id} />
        ))}
        {!ui.editMode && ui.marker && (
          <div
            className={styles.marker}
            style={{
              left: ui.marker.x,
              top: ui.marker.y,
            }}
          >
            <MapPin />
          </div>
        )}
      </div>
      {tempShape && <TempAudioArea area={tempShape} />}
    </div>
  );
}
