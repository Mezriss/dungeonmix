import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useSnapshot } from "valtio";
import { Link } from "wouter";
import Info from "./Info";
import Settings from "./Settings";
import Switch from "./ui/Switch";
import { BASE_URL } from "@/const";
import { useBoardState } from "@/providers/BoardStateContext";

import styles from "@/styles/Header.module.css";

export default function Header() {
  const state = useBoardState();
  const data = useSnapshot(state.data);
  const ui = useSnapshot(state.ui);

  return (
    <>
      <div className={styles.header}>
        <div className={styles.logo}>
          <Link to={`${BASE_URL}/`}>DungeonMix</Link>
        </div>
        <div className={styles.name}>
          {ui.editMode ? (
            <input
              name={t`Board name`}
              placeholder={t`Untitled board`}
              value={data.name}
              onChange={(e) => state.actions.updateName(e.target.value)}
            />
          ) : (
            <h2>{data.name || t`Untitled board`}</h2>
          )}
        </div>
        <div className={styles.editToggle}>
          <div>
            <Trans>
              Edit
              <br />
              Mode
            </Trans>
          </div>
          <Switch
            checked={ui.editMode}
            onChange={(checked) => state.actions.toggleEditMode(checked)}
          />
        </div>
        <div className={styles.headerButton}>
          <Info />
        </div>
        <div className={styles.headerButton}>
          <Settings />
        </div>
      </div>
    </>
  );
}
