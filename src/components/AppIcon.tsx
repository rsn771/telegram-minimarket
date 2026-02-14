"use client";

import { useState } from "react";

type AppIconProps = {
  src: string;
  alt: string;
  className?: string;
};

export function AppIcon({ src, alt, className = "" }: AppIconProps) {
  const [error, setError] = useState(false);

  if (error || !src) {
    const letter = alt ? alt.trim().charAt(0).toUpperCase() : "?";
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 font-bold select-none ${className}`}
        aria-hidden
      >
        <span className="text-2xl leading-none font-bold">{letter}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
}
