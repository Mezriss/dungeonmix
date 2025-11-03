import { ErrorBoundary } from "react-error-boundary";
import AudioLibrary from "./components/AudioLibrary/AudioLibrary";
import BoardCanvas from "./components/BoardCanvas";
import BoardError from "./components/BoardError";
import BoardMissing from "./components/BoardMissing";
import ErrorToast from "./components/ErrorToast";
import Header from "./components/Header";
import Locator from "./components/Locator";
import Toolbar from "./components/Toolbar";
import { useStoredState } from "./hooks/useStoredState";
import { BoardStateContext } from "./providers/BoardStateContext";

import styles from "./styles/Board.module.css";

export default function Board({ id }: { id: string }) {
  const { state, isNotFound } = useStoredState(id);

  if (isNotFound) return <BoardMissing />;

  if (state)
    return (
      <BoardStateContext.Provider value={state}>
        <ErrorBoundary FallbackComponent={BoardError}>
          <div className={styles.board}>
            <Header />
            <BoardCanvas />
            <Toolbar />
            <Locator />
            <AudioLibrary />
            <ErrorToast />
          </div>
        </ErrorBoundary>
      </BoardStateContext.Provider>
    );

  return null;
}
