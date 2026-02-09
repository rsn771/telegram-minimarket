"use client";

let plusAudio: HTMLAudioElement | null = null;
let appOpenAudio: HTMLAudioElement | null = null;

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

export function preloadAppOpenSound() {
  if (typeof window === "undefined") return;
  if (!appOpenAudio) {
    try {
      appOpenAudio = new Audio("/app-open.mp3");
      appOpenAudio.preload = "auto";
    } catch {
      appOpenAudio = null;
    }
  }
}

export function playAppOpenSound() {
  if (typeof window === "undefined") return;
  if (!appOpenAudio) {
    preloadAppOpenSound();
  }
  if (!appOpenAudio) return;
  try {
    appOpenAudio.currentTime = 0;
    void appOpenAudio.play().catch(() => {});
  } catch {
    // Игнорируем ошибки воспроизведения
  }
}

