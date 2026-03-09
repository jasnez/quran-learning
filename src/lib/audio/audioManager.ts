/**
 * Manages a single HTML5 Audio instance (singleton).
 * Pure audio logic — no React.
 */

let instance: HTMLAudioElement | null = null;

function getInstance(): HTMLAudioElement {
  if (instance == null) {
    instance = new Audio();
  }
  return instance;
}

export function loadAudio(url: string): void {
  const audio = getInstance();
  audio.src = url;
  audio.preload = "auto";
  audio.load();
}

/** Callback when audio can seek (e.g. after loadedmetadata). Use for chapter-level seek. */
export function onCanSeek(callback: () => void): () => void {
  const audio = getInstance();
  const handler = () => callback();
  audio.addEventListener("loadedmetadata", handler);
  audio.addEventListener("canplay", handler);
  return () => {
    audio.removeEventListener("loadedmetadata", handler);
    audio.removeEventListener("canplay", handler);
  };
}

export function play(): Promise<void> {
  return getInstance().play();
}

export function pause(): void {
  getInstance().pause();
}

export function seek(time: number): void {
  getInstance().currentTime = time;
}

export function setPlaybackRate(speed: number): void {
  getInstance().playbackRate = speed;
}

export function onTimeUpdate(callback: () => void): () => void {
  const audio = getInstance();
  audio.addEventListener("timeupdate", callback);
  return () => audio.removeEventListener("timeupdate", callback);
}

export function onEnded(callback: () => void): () => void {
  const audio = getInstance();
  audio.addEventListener("ended", callback);
  return () => audio.removeEventListener("ended", callback);
}

export function getCurrentTime(): number {
  return getInstance().currentTime;
}

export function getDuration(): number {
  return getInstance().duration;
}

export function destroy(): void {
  if (instance) {
    instance.pause();
    instance.src = "";
    instance = null;
  }
}
