"use client";

let plusAudio: HTMLAudioElement | null = null;
let appOpenAudio: HTMLAudioElement | null = null;
let appOpenPlayed = false;

// Звук для нажатия на плюсик
export function preloadPlusSound() {
  if (typeof window === "undefined") return;
  if (!plusAudio) {
    try {
      // Новый звук из файла mixkit-modern-technology-select-3124.wav
      plusAudio = new Audio("/mixkit-modern-technology-select-3124.wav");
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

// Звук открытия мини‑приложения
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
  // Гарантируем, что звук срабатывает только один раз за сессию
  if (appOpenPlayed) return;
  if (!appOpenAudio) {
    preloadAppOpenSound();
  }
  if (!appOpenAudio) return;
  try {
    appOpenPlayed = true;
    appOpenAudio.currentTime = 0;
    void appOpenAudio.play().catch(() => {});
  } catch {
    // Игнорируем ошибки воспроизведения
  }
}

