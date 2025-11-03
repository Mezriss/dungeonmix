import { t } from "@lingui/core/macro";
import { useRef } from "react";
import { createPortal } from "react-dom";
import { useSnapshot } from "valtio";
import AreaControls from "./controls/AreaControls";
import Tooltip from "@/components/ui/Tooltip";
import { useDrag } from "@/hooks/boardCanvas/useDrag";
import { useBoardState } from "@/providers/BoardStateContext";
import { classes } from "@/util/misc";

import type { AudioArea } from "@/state";

import { CirclePause, CirclePlay } from "lucide-react";
import styles from "@/styles/AudioArea.module.css";

type Props = {
  id: string;
  rect: { x: number; y: number; width: number; height: number };
};

export function AudioArea({ id, rect }: Props) {
  const state = useBoardState();
  const area = useSnapshot(state.data.areas.find((area) => area.id === id)!);
  const areaRef = useRef<HTMLDivElement>(null!);
  const controlsRef = useRef<HTMLDivElement>(null!);

  const { editMode, selectedId, position, zoom } = useSnapshot(state.ui);
  const { files } = useSnapshot(state.data);
  const selected = selectedId === area.id;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      e.buttons === 1 &&
      state.ui.editMode &&
      state.ui.selectedTool === "select"
    ) {
      state.actions.select(area.id);
    }
  };

  const cssVars = {
    "--zoom": zoom,
  };

  const { onDragStart } = useDrag({
    refs: [areaRef, controlsRef],
    onUpdate: (moveX, moveY) => {
      state.actions.moveArea(
        area.id,
        moveX * (1 / state.ui.zoom),
        moveY * (1 / state.ui.zoom),
      );
    },
  });

  const absoluteAreaCenter = {
    x: rect.x + rect.width / 2 + position.x + (area.x + area.width / 2) * zoom,
    y:
      rect.y + rect.height / 2 + position.y + (area.y + area.height / 2) * zoom,
  };

  return (
    <div
      ref={areaRef}
      onPointerDown={handlePointerDown}
      className={classes(
        styles.area,
        area.shape === "circle" && styles.circle,
        selected && styles.selected,
      )}
      style={{
        left: area.x,
        top: area.y,
        width: area.width,
        height: area.height,
        ...cssVars,
      }}
    >
      <div className={styles.tracklist}>
        {area.tracks.map((track) => (
          <div key={track.trackId} className={styles.track}>
            {!editMode ? (
              <Tooltip text={t`Toggle autoplay`}>
                <button
                  className={classes("button", styles.autoplay)}
                  onClick={() =>
                    state.actions.toggleTrackAutoplay(area.id, track.trackId)
                  }
                >
                  {track.autoplay ? (
                    <CirclePlay size={16} />
                  ) : (
                    <CirclePause size={16} />
                  )}
                </button>
              </Tooltip>
            ) : track.autoplay ? (
              <CirclePlay size={16} />
            ) : (
              <CirclePause size={16} />
            )}
            <div className={styles.title}>{files[track.trackId].name}</div>
          </div>
        ))}
      </div>

      {editMode &&
        selected &&
        createPortal(
          <div
            ref={controlsRef}
            className={classes(styles.controlsPanel, "panel")}
            style={{
              left: absoluteAreaCenter.x,
              top: absoluteAreaCenter.y,
            }}
          >
            <AreaControls area={area} handleMoveStart={onDragStart} />
          </div>,
          document.body,
        )}
    </div>
  );
}

export function TempAudioArea({ area }: { area: AudioArea }) {
  return (
    <div
      className={classes(
        styles.area,
        area.shape === "circle" && styles.circle,
        styles.temp,
      )}
      style={{
        left: area.x,
        top: area.y,
        width: area.width,
        height: area.height,
      }}
    />
  );
}
