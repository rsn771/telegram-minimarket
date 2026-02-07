"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const FADE_IN_MS = 600;
const HOLD_MS = 1400;
const FADE_OUT_MS = 500;

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState<"idle" | "show" | "hold" | "hide" | "done">("idle");

  useEffect(() => {
    const t1 = setTimeout(() => setStep("show"), 50);
    const t2 = setTimeout(() => setStep("hold"), 50 + FADE_IN_MS);
    const t3 = setTimeout(() => setStep("hide"), 50 + FADE_IN_MS + HOLD_MS);
    const t4 = setTimeout(() => setStep("done"), 50 + FADE_IN_MS + HOLD_MS + FADE_OUT_MS);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const showSplash = step !== "done";

  return (
    <>
      {showSplash && (
        <div
          className="fixed inset-0 z-[100] bg-white flex items-center justify-center"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 flex items-center justify-center p-8 ease-out"
            style={{
              opacity: step === "idle" ? 0 : step === "show" || step === "hold" ? 1 : 0,
              transition: step === "show" ? `opacity ${FADE_IN_MS}ms ease-out` : step === "hide" ? `opacity ${FADE_OUT_MS}ms ease-out` : "none",
            }}
          >
            <Image
              src="/logo-splash.png"
              alt=""
              width={280}
              height={280}
              className="w-[70%] max-w-[280px] h-auto object-contain"
              priority
            />
          </div>
          {/* Белый оверлей поверх картинки при исчезновении */}
          <div
            className="absolute inset-0 bg-white transition-opacity ease-out"
            style={{
              opacity: step === "hide" ? 1 : 0,
              transitionDuration: `${FADE_OUT_MS}ms`,
            }}
          />
        </div>
      )}
      <div className={showSplash ? "opacity-0" : "opacity-100 transition-opacity duration-300"}>
        {children}
      </div>
    </>
  );
}
