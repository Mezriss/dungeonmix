import { t } from "@lingui/core/macro";
import { useEffect, useState } from "react";
import { proxy, subscribe } from "valtio";
import { actions } from "../actions";
import { STORE_PREFIX } from "../const";
import {
  getInitialBoardState,
  getInitialUIState,
  migrations,
  VERSION,
} from "../state";
import { error } from "@/services/errorHandler";

import type { BoardState, State } from "../state";

function loadBoardState(id: string): State | null {
  const stored = localStorage.getItem(STORE_PREFIX + id);
  let data: BoardState | null = null;
  if (stored) {
    try {
      data = JSON.parse(stored);
    } catch {
      error(
        `Somehow data for board ${id} is corrupted: [${stored}]`,
        t`Data for this board got corrupted for unknown reasons and was reset.`,
      );
      data = getInitialBoardState(id);
      localStorage.setItem(STORE_PREFIX + id, JSON.stringify(data));
    }
  }
  if (!data) return null;

  if (!("version" in data) || data.version < VERSION) {
    for (const migration of migrations) {
      data = migration(data);
    }
    data.version = VERSION;
  }

  const pData = proxy(data);
  const pUI = proxy(getInitialUIState());
  return {
    data: pData,
    ui: pUI,
    actions: actions(pData, pUI),
  };
}

export function useStoredState(id: string) {
  const [state, setState] = useState<State | null | undefined>(undefined);

  useEffect(() => {
    const boardState = loadBoardState(id);
    setState(boardState);

    const unsubscribe = boardState
      ? subscribe(boardState.data, () => {
          localStorage.setItem(
            STORE_PREFIX + id,
            JSON.stringify(boardState.data),
          );
        })
      : undefined;

    return () => {
      unsubscribe?.();
    };
  }, [id]);

  return {
    state,
    isNotFound: state === null,
  };
}
