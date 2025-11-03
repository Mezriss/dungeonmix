import { t } from "@lingui/core/macro";
import { useSnapshot } from "valtio";
import TrackAdder from "./TrackAdder";
import TrackControls from "./TrackControls";
import Tooltip from "@/components/ui/Tooltip";
import { useBoardState } from "@/providers/BoardStateContext";

import type { AudioArea } from "@/state";
import type { Snapshot } from "valtio";

import { Move, Music, Plus, Trash2 } from "lucide-react";
import styles from "@/styles/AreaControls.module.css";

type Props = {
  area: Snapshot<AudioArea>;
  handleMoveStart: (e: React.PointerEvent<HTMLButtonElement>) => void;
};

export default function AreaControls({ area, handleMoveStart }: Props) {
  const state = useBoardState();
  const data = useSnapshot(state.data);
  return (
    <>
      {!!area.tracks.length && (
        <div className={styles.tracklist}>
          {area.tracks.map((track) => (
            <div key={track.trackId} className={styles.track}>
              <div className={styles.title}>
                {data.files[track.trackId].name}
              </div>
              <TrackControls areaId={area.id} track={track} />
            </div>
          ))}
        </div>
      )}
      <div className={styles.controls}>
        {!!data.folders.length && (
          <TrackAdder areaId={area.id}>
            <Tooltip text={t`Add track`}>
              <button className={"button"}>
                <Plus size={16} />
                <Music size={16} />
              </button>
            </Tooltip>
          </TrackAdder>
        )}

        <Tooltip text={t`Hold button to move area`}>
          <button className={"button"} onPointerDown={handleMoveStart}>
            <Move size={16} />
          </button>
        </Tooltip>
        <Tooltip text={t`Delete area (there is no undo)`}>
          <button
            className={"button"}
            onClick={() => state.actions.deleteArea(area.id)}
          >
            <Trash2 size={16} />
          </button>
        </Tooltip>
      </div>
    </>
  );
}
