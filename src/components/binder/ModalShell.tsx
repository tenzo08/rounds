"use client";

import { useEffect, type ReactNode } from "react";

interface ModalShellProps {
  accentColor: string;
  onClose: () => void;
  children: ReactNode;
}

export function ModalShell({ accentColor, onClose, children }: ModalShellProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,26,22,0.45)] p-5"
    >
      <div
        className="relative max-h-[88vh] w-full max-w-[560px] overflow-y-auto rounded-[5px] border-t-[5px] bg-card px-7 pt-7 pb-6"
        style={{ borderTopColor: accentColor }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-1 text-lg leading-none text-ink-soft"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
