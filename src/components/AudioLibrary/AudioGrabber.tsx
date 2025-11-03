import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useRef, useState } from "react";
import { useBoardState } from "@/providers/BoardStateContext";

import { CircleX, X } from "lucide-react";
import styles from "@/styles/AudioGrabber.module.css";

export default function AudioGrabber() {
  const { actions } = useBoardState();
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragCounter = useRef(0);

  const selectDirectory = async () => {
    try {
      setError(null);

      const handle = await window.showDirectoryPicker({
        mode: "read",
      });
      await actions.addFolder(handle);
    } catch (error: unknown) {
      const err = error as { name?: string };
      if (err.name !== "AbortError") {
        console.error("Error selecting directory:", error);
        setError(t`Failed to select directory.`);
      }
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer?.types.includes("Files")) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounter.current = 0;

    try {
      const items = Array.from(e.dataTransfer.items);

      for (const item of items) {
        if (item.kind === "file") {
          if (item.getAsFileSystemHandle) {
            const handle = await item.getAsFileSystemHandle();
            if (handle && handle.kind === "directory") {
              const dirHandle = handle as unknown as FileSystemDirectoryHandle;
              await actions.addFolder(dirHandle);
              return;
            }
          }
        }
      }

      setError(t`Please drop a folder containing audio files.`);
    } catch (error) {
      console.error("Error handling dropped directory:", error);
      setError(t`Failed to access the dropped folder.`);
    }
  };

  return (
    <>
      {error && (
        <div className="error">
          <div>
            <CircleX /> {error}
          </div>
          <div className="dismiss" onClick={() => setError(null)}>
            <X size={16} />
          </div>
        </div>
      )}
      <div
        className={`${styles.dropArea} ${isDragOver ? styles.dragOver : ""}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div>
          <Trans>
            Give DungeonMix access to a folder with your audio files.
          </Trans>
        </div>
        <div>
          <Trans>Drag and drop a folder</Trans>
          {"showDirectoryPicker" in window && (
            <Trans>
              {" "}
              or{" "}
              <button className="button" onClick={selectDirectory}>
                browse
              </button>
            </Trans>
          )}
        </div>
      </div>
    </>
  );
}
