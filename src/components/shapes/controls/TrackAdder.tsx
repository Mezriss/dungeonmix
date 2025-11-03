import { Combobox } from "@base-ui-components/react";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useState } from "react";
import { useSnapshot } from "valtio";
import { useBoardState } from "@/providers/BoardStateContext";

import type { FileInfo } from "@/state";

import styles from "@/styles/TrackAdder.module.css";

type Props = {
  children: React.ReactNode;
  areaId: string;
};

export default function TrackAdder({ children, areaId }: Props) {
  const state = useBoardState();
  const data = useSnapshot(state.data);
  const [value, setValue] = useState<FileInfo | null>(null);

  const tracks = Object.values(data.files).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const handleChange = (track: FileInfo | null) => {
    if (track) {
      state.actions.addTrackToArea(areaId, track.id);
    }
    setValue(null);
  };

  return (
    <Combobox.Root
      items={tracks}
      value={value}
      onValueChange={handleChange}
      filter={(item: FileInfo, query: string) => {
        if (!query) return true;
        return item.name.toLowerCase().includes(query.toLowerCase());
      }}
    >
      <Combobox.Trigger render={<div />} nativeButton={false}>
        {children}
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner align="start" sideOffset={4}>
          <Combobox.Popup className={styles.popup} aria-label={t`Select track`}>
            <div className={styles.inputContainer}>
              <Combobox.Input
                placeholder={tracks[0] ? t`e.g.` + " " + tracks[0].name : ""}
                className={styles.input}
              />
            </div>
            <Combobox.Empty className={styles.empty}>
              <Trans>No tracks found.</Trans>
            </Combobox.Empty>
            <Combobox.List className={styles.list}>
              {(track: FileInfo) => (
                <Combobox.Item
                  key={track.id}
                  value={track}
                  className={styles.item}
                >
                  {/* TODO: show file path */}
                  <div className={styles.itemText}>{track.name}</div>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
