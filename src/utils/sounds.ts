"use client";

let plusAudio: HTMLAudioElement | null = null;

export function preloadPlusSound() {
  if (typeof window === "undefined") return;
  if (!plusAudio) {
    try {
      plusAudio = new Audio("/plus-chime.wav");
      plusAudio.preload = "auto";
    } catch {
      plusAudio = null;
    }
  }
}

export function playPlusSound() {
  if (typeof window === "undefined") return;
  if (!plusAudio) {
    preloadPlusSound();
  }
  if (!plusAudio) return;
  try {
    plusAudio.currentTime = 0;
    void plusAudio.play().catch(() => {});
  } catch {
    // Игнорируем ошибки воспроизведения
  }
}

