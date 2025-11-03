import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import LocaleSwitcher from "./components/LocaleSwitcher";
import {
  BASE_URL,
  KEY_BOARDS,
  STORE_PREFIX,
  VIDEO_INTRO_URL_EN,
  VIDEO_INTRO_URL_UA,
} from "./const";
import { error } from "./services/errorHandler";
import { getInitialBoardState } from "./state";

import { TriangleAlert } from "lucide-react";
import styles from "@/styles/Landing.module.css";

export type BoardList = {
  id: string;
  name: string;
}[];

export default function Landing() {
  const [, navigate] = useLocation();
  const [boards, setBoards] = useState<BoardList | null>(null);
  const { i18n } = useLingui();

  const videoUrl =
    i18n.locale === "ua" ? VIDEO_INTRO_URL_UA : VIDEO_INTRO_URL_EN;

  const browserSupported = "showDirectoryPicker" in window;

  const untitled = t`Untitled Board`;

  useEffect(() => {
    try {
      setBoards(JSON.parse(localStorage.getItem(KEY_BOARDS) || "[]"));
    } catch (e) {
      error(e as Error, t`Failed to load boards list`);
    }
  }, []);

  function createBoard() {
    const id = nanoid();
    localStorage.setItem(
      KEY_BOARDS,
      JSON.stringify([...(boards || []), { id, name: untitled }]),
    );
    localStorage.setItem(
      STORE_PREFIX + id,
      JSON.stringify(getInitialBoardState(id)),
    );
    navigate(`${BASE_URL}/boards/${id}`);
  }

  return (
    <>
      <div className={styles.landing}>
        <div className={styles.content}>
          <h1>
            <Trans>
              Welcome to <span>DungeonMix</span>
            </Trans>
          </h1>
          <p>
            <Trans>
              DungeonMix is a web application that allows you to create audio
              boards for your dungeon maps.
            </Trans>
          </p>
          <p>
            <Trans>
              Not sure what this is or how to use it?
              <br />
              Watch a{" "}
              <a href={videoUrl} target="_blank">
                video introduction
              </a>
              .
            </Trans>
          </p>
          {!browserSupported && (
            <p>
              <TriangleAlert size={32} />
              <Trans>
                To provide a seamless experience and conveniently handle your
                local files, this application uses a feature that is not
                available in your current browser. For the best experience,
                please use a recent version of Google Chrome, Microsoft Edge, or
                Opera.
              </Trans>
            </p>
          )}
          <div className={styles.controls}>
            <>
              <button onClick={createBoard} className="button">
                <Trans>Create New Board</Trans>
              </button>
              {!boards?.length ? null : (
                <>
                  <div>
                    <Trans>or load existing board</Trans>
                  </div>
                  <ul>
                    {boards.map((board) => (
                      <li key={board.id}>
                        <Link href={`${BASE_URL}/boards/${board.id}`}>
                          {board.name || untitled}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          </div>
        </div>
        <div className={styles.illustration} />
      </div>
      <LocaleSwitcher />
    </>
  );
}
