import { t } from "@lingui/core/macro";
import { useEffect, useState } from "react";
import Slider from "@/components/ui/Slider";
import Tooltip from "@/components/ui/Tooltip";
import { useBoardState } from "@/providers/BoardStateContext";

import type { Image as ImageType } from "@/state";
import type { ChangeEvent, PointerEvent } from "react";

import { ImageIcon, Move, Plus, Scaling, Trash2 } from "lucide-react";
import styles from "@/styles/Image.module.css";

type Props = {
  image: ImageType;
  handleDragStart: (event: PointerEvent<HTMLButtonElement>) => void;
  containerRef: React.RefObject<HTMLDivElement>;
};

export default function ImageControls({
  image,
  handleDragStart,
  containerRef,
}: Props) {
  const state = useBoardState();

  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;

    const file = e.target.files[0];
    setLoading(true);
    await state.actions.loadImage(image.id, file);
    setLoading(false);
  };

  const [scale, setScale] = useState(image.scale * 100);
  useEffect(() => {
    setScale(image.scale * 100);
  }, [image.scale]);

  const onScaleCommit = (value: number) => {
    state.actions.setImageScale(image.id, value / 100);
  };

  const onScaleChange = (value: number) => {
    setScale(value);
    containerRef.current?.style.setProperty("--scale", `${value / 100}`);
  };

  return (
    <div className={styles.controls}>
      {!image.assetId && (
        <Tooltip text={t`Add image`}>
          <label className={"button"}>
            <input
              disabled={loading}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            <Plus size={16} />
            <ImageIcon size={16} />
          </label>
        </Tooltip>
      )}
      <Tooltip text={t`Hold button to move image`}>
        <button className={"button"} onPointerDown={handleDragStart}>
          <Move size={16} />
        </button>
      </Tooltip>
      <Tooltip text={t`Delete image`}>
        <button
          className={"button"}
          onClick={() => state.actions.deleteImage(image.id)}
        >
          <Trash2 size={16} />
        </button>
      </Tooltip>
      {image.assetId && (
        <Tooltip text={t`Scale Image`}>
          <div className={styles.scaleControl}>
            <Scaling size={16} />
            <Slider
              value={scale}
              min={10}
              max={200}
              onChange={onScaleChange}
              onCommit={onScaleCommit}
            />
          </div>
        </Tooltip>
      )}
    </div>
  );
}
