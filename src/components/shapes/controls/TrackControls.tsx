import { t } from "@lingui/core/macro";
import VolumeControl from "./VolumeControl";
import Tooltip from "@/components/ui/Tooltip";
import { useBoardState } from "@/providers/BoardStateContext";

import type { AudioArea } from "@/state";

import { CirclePause, CirclePlay, Trash2 } from "lucide-react";
import styles from "@/styles/AreaControls.module.css";

export default function TrackControls({
  areaId,
  track,
}: {
  areaId: string;
  track: AudioArea["tracks"][number];
}) {
  const { actions } = useBoardState();

  return (
    <div className={styles.controls}>
      <Tooltip text={t`Toggle autoplay`}>
        <button
          className={"button"}
          onClick={() => actions.toggleTrackAutoplay(areaId, track.trackId)}
        >
          {track.autoplay ? (
            <CirclePlay size={16} />
          ) : (
            <CirclePause size={16} />
          )}
        </button>
      </Tooltip>
      <VolumeControl areaId={areaId} track={track} />
      <Tooltip text={t`Remove track`}>
        <button
          className={"button"}
          onClick={() => actions.removeTrackFromArea(areaId, track.trackId)}
        >
          <Trash2 size={16} />
        </button>
      </Tooltip>
    </div>
  );
}
