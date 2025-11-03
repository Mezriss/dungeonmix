import { t } from "@lingui/core/macro";
import { Howl } from "howler";
import { get } from "idb-keyval";
import { STORE_PREFIX } from "@/const";
import {
  error,
  info,
  warning,
  withErrorHandling,
} from "@/services/errorHandler";
import { getFileHandleFromPath, getPermission } from "@/util/file";
import { pointInEllipse, pointInRectangle } from "@/util/misc";

import type { BoardState, UIState } from "@/state";

export const trackActions = (
  data: BoardState,
  ui: UIState,
  trackCache: Map<string, Howl>,
) => {
  let volumePreview: null | {
    howl: Howl;
    timeout: number;
    trackId: string;
  } = null;

  const clearVolumePreview = () => {
    if (!volumePreview) return;
    clearTimeout(volumePreview.timeout);
    volumePreview.howl.stop();
    volumePreview = null;
  };

  const initTrack = async (trackId: string) => {
    const dirHandle = await get(STORE_PREFIX + data.files[trackId].folderId);
    if (!dirHandle) {
      return error(
        `Directory for ${trackId} is missing from store ${data.files[trackId].folderId}`,
        t`Couldn't resolve directory, your board data is probably corrupt and it would be better to recreate it.`,
      );
    }
    try {
      if (!getPermission(dirHandle))
        return error(
          `Permission denied for folder "${dirHandle.name} (${data.files[trackId].folderId}) on track ${trackId}"`,
          t`Couldn't get permission to folder "${dirHandle.name}". Try restarting your browser and doing it again.`,
        );
      const fileHandle = await withErrorHandling(
        () => getFileHandleFromPath(dirHandle, data.files[trackId].path),
        "error",
        t`Couldn't access track "${data.files[trackId].name}". Is it still there?`,
      );
      if (!fileHandle) return;
      const src = URL.createObjectURL(await fileHandle.getFile());
      trackCache.set(
        trackId,
        new Howl({
          src: src,
          format: data.files[trackId].format,
          volume: 1,
          loop: true,
          autoplay: false,
        }),
      );

      ui.tracks[trackId] = {
        id: trackId,
        src: src,
        status: "stopped",
      };
    } catch (e) {
      error(e as Error, `Track ${trackId} initialization failed`);
    }
  };

  return {
    addTrackToArea(areaId: string, trackId: string) {
      const area = data.areas.find((area) => area.id === areaId);
      if (!area) {
        return warning(`Area ${areaId} is missing from state`);
      }
      if (area.tracks.some((track) => track.trackId === trackId)) {
        return info(`Track ${trackId} is already in area ${areaId}`);
      }
      area.tracks.push({
        trackId,
        autoplay: true,
        volume: 1,
      });
    },
    removeTrackFromArea(areaId: string, trackId: string) {
      const area = data.areas.find((area) => area.id === areaId);
      if (!area) {
        return warning(`Area ${areaId} is missing from state`);
      }
      const index = area.tracks.findIndex((track) => track.trackId === trackId);
      if (index === -1) {
        return warning(`Track ${trackId} is missing from area ${areaId}`);
      }
      area.tracks.splice(index, 1);
    },
    toggleTrackAutoplay(areaId: string, trackId: string) {
      const area = data.areas.find((area) => area.id === areaId);
      if (!area) {
        return warning(`Area ${areaId} is missing from state`);
      }
      const track = area.tracks.find((track) => track.trackId === trackId);
      if (!track) {
        return warning(`Track ${trackId} is missing from area ${areaId}`);
      }
      track.autoplay = !track.autoplay;
      if (ui.marker) {
        this.setMarker();
      }
    },
    setTrackVolume(areaId: string, trackId: string, volume: number) {
      const area = data.areas.find((area) => area.id === areaId);
      if (!area) {
        return warning(`Area ${areaId} is missing from state`);
      }
      const track = area.tracks.find((track) => track.trackId === trackId);
      if (!track) {
        return warning(`Track ${trackId} is missing from area ${areaId}`);
      }
      track.volume = volume;
      // let's assume that user switched to edit mode to quickly adjust volume
      // there is an edge case of 2 areas with same track and user changing volume of the inactive one
      // but it will be ignored for now
      if (ui.tracks[trackId]?.status === "playing") {
        trackCache.get(trackId)?.volume(volume);
      }
      clearVolumePreview();
    },
    async previewVolume(trackId: string, volume: number) {
      if (!ui.tracks[trackId]) {
        await initTrack(trackId);
      }
      // possible improvement: don't preview track if any other is playing
      if (ui.tracks[trackId]?.status === "playing") {
        trackCache.get(trackId)?.volume(volume);
      } else if (!volumePreview || volumePreview.trackId !== trackId) {
        volumePreview = {
          trackId,
          howl: new Howl({
            src: ui.tracks[trackId].src,
            format: data.files[trackId].format,
            volume: volume,
            loop: true,
            autoplay: false,
          }),
          timeout: setTimeout(clearVolumePreview, 3000),
        };
        volumePreview.howl.seek(volumePreview.howl.duration() / 2);
        volumePreview.howl.play();
      } else {
        volumePreview.howl.volume(volume);
        clearTimeout(volumePreview.timeout);
        volumePreview.timeout = setTimeout(clearVolumePreview, 3000);
      }
    },
    setMarker: async (position = ui.marker) => {
      ui.marker = position;
      if (ui.marker === null) return;
      const areas = data.areas.filter((area) => {
        if (area.shape === "rectangle") {
          return (
            ui.marker &&
            pointInRectangle(ui.marker.x, ui.marker.y, {
              x: area.x,
              y: area.y,
              width: area.width,
              height: area.height,
            })
          );
        }
        if (area.shape === "circle") {
          return (
            ui.marker &&
            pointInEllipse(ui.marker.x, ui.marker.y, {
              x: area.x + area.width / 2,
              y: area.y + area.height / 2,
              radiusX: area.width / 2,
              radiusY: area.height / 2,
            })
          );
        }
      });
      const shouldPlay = areas.flatMap((area) =>
        area.tracks.filter((track) => track.autoplay),
      );
      const shouldPlayIds = shouldPlay.map((track) => track.trackId);
      const currentlyPlayingIds = Object.values(ui.tracks)
        .filter((track) => track.status === "playing")
        .map((track) => track.id);
      const shouldStopIds = currentlyPlayingIds.filter(
        (id) => !shouldPlayIds.includes(id),
      );

      await Promise.all(
        shouldPlay.map(async ({ trackId, volume }) => {
          if (!ui.tracks[trackId]) {
            await initTrack(trackId);
          }
          if (!currentlyPlayingIds.includes(trackId)) {
            const howl = trackCache.get(trackId);
            if (!howl) {
              return warning(`Track ${trackId} not found in cache`);
            }
            howl.off("fade");
            howl.fade(0, volume, data.settings.fadeDuration);
            if (["paused", "stopped"].includes(ui.tracks[trackId].status)) {
              howl.play();
            }
            ui.tracks[trackId].status = "playing";
          }
        }),
      );
      shouldStopIds.forEach((trackId) => {
        const howl = trackCache.get(trackId);
        if (!howl) {
          return warning(`Track ${trackId} not found in cache`);
        }
        howl.fade(howl.volume(), 0, data.settings.fadeDuration);
        ui.tracks[trackId].status = "fadingout";
        howl.once("fade", () => {
          howl.pause();
          ui.tracks[trackId].status = "paused";
        });
      });
      // if there are several areas - should the sound mix based on distance?
      // current implementation is probably good enough
    },
  };
};
