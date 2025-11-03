import { Trans } from "@lingui/react/macro";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSnapshot } from "valtio";
import ImageControls from "./controls/ImageControls";
import { STORE_PREFIX } from "@/const";
import { useDrag } from "@/hooks/boardCanvas/useDrag";
import { useIDB } from "@/hooks/useIDB";
import { useBoardState } from "@/providers/BoardStateContext";
import { classes } from "@/util/misc";

import { ImageOff } from "lucide-react";
import styles from "@/styles/Image.module.css";

type Props = {
  id: string;
  rect: { x: number; y: number; width: number; height: number };
};

export default function ImageContainer({ id, rect }: Props) {
  const containerRef = useRef<HTMLImageElement>(null!);
  const controlsRef = useRef<HTMLDivElement>(null!);
  const state = useBoardState();
  const image = useSnapshot(state.data.images.find((img) => img.id === id)!);
  const { selectedId, zoom, position } = useSnapshot(state.ui);
  const selected = image.id === selectedId;

  const cssVars = {
    "--zoom": zoom,
    "--scale": image.scale,
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      e.buttons === 1 &&
      state.ui.editMode &&
      state.ui.selectedTool === "select"
    ) {
      state.actions.select(image.id);
    }
  };

  const { onDragStart } = useDrag({
    refs: [containerRef, controlsRef],
    onUpdate: (moveX, moveY) => {
      state.actions.moveImage(
        id,
        moveX * (1 / state.ui.zoom),
        moveY * (1 / state.ui.zoom),
      );
    },
  });

  const absoluteAreaCenter = {
    x: rect.x + rect.width / 2 + position.x + image.x * zoom,
    y: rect.y + rect.height / 2 + position.y + image.y * zoom,
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className={classes(styles.imageContainer, selected && styles.selected)}
      style={{
        top: image.y,
        left: image.x,
        ...cssVars,
      }}
    >
      {image.assetId ? (
        <Image assetId={image.assetId} />
      ) : (
        <div className={styles.noImage}>
          <ImageOff size={64} />
        </div>
      )}
      {selected &&
        createPortal(
          <div
            ref={controlsRef}
            className={classes(styles.controlsPanel, "panel")}
            style={{
              left: absoluteAreaCenter.x,
              top: absoluteAreaCenter.y,
            }}
          >
            <ImageControls
              image={image}
              handleDragStart={onDragStart}
              containerRef={containerRef}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}

function Image({ assetId }: { assetId: string }) {
  const { data, error, loading } = useIDB<File>(STORE_PREFIX + assetId);
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!data) return;
    const blob = new Blob([data], { type: "image/png" });
    const url = URL.createObjectURL(blob);
    setSrc(url);
  }, [data]);

  if (error) {
    return (
      <div>
        <Trans>Error loading image</Trans>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <Trans>Loading image...</Trans>
      </div>
    );
  }

  return <>{src && <img src={src} alt={data?.name || "Image"} />}</>;
}
