import { createContext, useContext } from "react";

import type { State } from "@/state";

const BoardStateContext = createContext<State | undefined>(undefined);

export function useBoardState(): State {
  const context = useContext(BoardStateContext);
  if (context === undefined) {
    throw new Error(
      "useBoardState must be used within a BoardStateContext.Provider",
    );
  }
  return context;
}

export { BoardStateContext };
