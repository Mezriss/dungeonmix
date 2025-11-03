import { t } from "@lingui/core/macro";
import { del, get, getMany, set } from "idb-keyval";
import { nanoid } from "nanoid";
import { STORE_PREFIX } from "@/const";
import { error, warning } from "@/services/errorHandler";
import { getFilesRecursively, getPermission } from "@/util/file";

import type { BoardState, FileInfo, UIState } from "@/state";

export const libraryActions = (
  data: BoardState,
  ui: UIState,
  trackCache: Map<string, Howl>,
) => {
  const removeFile = (id: string) => {
    delete data.files[id];
    data.areas.forEach((area) => {
      area.tracks = area.tracks.filter((track) => track.trackId !== id);
    });
    delete ui.tracks[id];
    trackCache.delete(id);
  };
  return {
    addFolder: async (handle: FileSystemDirectoryHandle) => {
      try {
        const id = nanoid();
        if (data.folders.length) {
          const existingHandleIds = data.folders.map(
            (folder) => STORE_PREFIX + folder.id,
          );
          const existingHandles: FileSystemDirectoryHandle[] =
            await getMany(existingHandleIds);
          for (const existingHandle of existingHandles) {
            if (await existingHandle.isSameEntry(handle)) {
              return;
            }
          }
        }
        for await (const { file, path } of getFilesRecursively(handle)) {
          const fullPath = path ? `${path}/${file.name}` : file.name;
          const fileId = nanoid();
          const info: FileInfo = {
            id: fileId,
            path: fullPath,
            name: file.name.replace(/\.[^.]+$/, ""),
            format: file.name.split(".").pop() || "",
            folderId: id,
          };
          data.files[fileId] = info;
        }
        data.folders.push({
          id,
          name: handle.name,
        });
        await set(STORE_PREFIX + id, handle);
      } catch (e) {
        error(
          `Failed to add folder ${handle.name}: ${e}`,
          t`Failed to add folder ${handle.name}`,
        );
      }
    },
    removeFolder: async (id: string) => {
      const index = data.folders.findIndex((folder) => folder.id === id);
      if (index !== -1) {
        data.folders.splice(index, 1);
      }
      for (const key in data.files) {
        const file = data.files[key];
        if (file.folderId === id) {
          removeFile(file.id);
        }
      }
      await del(STORE_PREFIX + id);
    },
    refreshFolder: async (folderId: string) => {
      const folder = data.folders.find((folder) => folder.id === folderId);
      if (!folder) {
        return warning(`Folder ${folderId} is missing from state`);
      }
      const handle: FileSystemDirectoryHandle | undefined = await get(
        STORE_PREFIX + folderId,
      );

      if (!handle) {
        return error(
          `Folder ${folderId} handle is missing from storage`,
          t`Couldn't resolve directory, your board data is probably corrupt and it would be better to recreate it.`,
        );
      }
      if (!getPermission(handle))
        return error(
          `Permission denied for folder "${handle.name} (${folderId})`,
          t`Couldn't get permission to folder "${handle.name}". Try restarting your browser and doing it again.`,
        );

      const files: { path: string; name: string }[] = [];
      for await (const { file, path } of getFilesRecursively(handle)) {
        const fullPath = path ? `${path}/${file.name}` : file.name;
        files.push({ path: fullPath, name: file.name });
      }
      const removedFiles = Object.values(data.files)
        .filter(
          (file) =>
            file.folderId === folderId &&
            !files.some((f) => f.path === file.path),
        )
        .map((file) => file.id);
      removedFiles.forEach(removeFile);

      files.forEach(({ path, name }) => {
        if (
          !Object.values(data.files).some(
            (f) => f.folderId === folderId && f.path === path,
          )
        ) {
          const fileId = nanoid();
          const info: FileInfo = {
            id: fileId,
            path: path,
            name: name.replace(/\.[^.]+$/, ""),
            format: name.split(".").pop() || "",
            folderId: folderId,
          };
          data.files[fileId] = info;
        }
      });
    },
  };
};
