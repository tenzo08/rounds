"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { TOUR_STEPS } from "@/components/tour/tourSteps";

interface TourOverlayProps {
  onClose: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const SPOTLIGHT_PADDING = 8;
const CARD_WIDTH = 340;
const CARD_MARGIN = 12;
// Roughly how tall the tooltip card is — used to decide whether it fits
// below the spotlighted element or needs to flip above it.
const CARD_HEIGHT_ESTIMATE = 210;

function measureTarget(target: string): Rect | null {
  const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function TourOverlay({ onClose }: TourOverlayProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [measuredStepIndex, setMeasuredStepIndex] = useState(-1);

  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;

  // Reset locate-state the moment the step changes. Adjusted during render
  // (React's documented pattern for this — see SubjectTopicFolderFields for
  // the same technique) rather than inside an effect, so it's never a
  // synchronous setState-in-effect.
  if (measuredStepIndex !== stepIndex) {
    setMeasuredStepIndex(stepIndex);
    setRect(null);
    setIsLocating(step.target !== null);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Locate this step's target: navigate to its route if we're not already
  // there, then poll briefly for the element to mount (route changes and
  // drawer/menu opens aren't instant). If it never shows up — e.g. the
  // student has no groups yet — fall back to the centered, no-target card
  // rather than getting stuck. The first measurement is deferred a tick so
  // every setState call here happens inside a timer callback, never
  // synchronously within the effect body itself.
  useEffect(() => {
    if (!step.target) return;
    if (step.route && step.route !== pathname) {
      router.push(step.route);
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 40;

    function tryMeasure() {
      if (cancelled) return;
      const found = measureTarget(step.target!);
      if (found) {
        setRect(found);
        setIsLocating(false);
        return;
      }
      attempts += 1;
      if (attempts >= maxAttempts) {
        setIsLocating(false);
        return;
      }
      setTimeout(tryMeasure, 50);
    }
    const timer = setTimeout(tryMeasure, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  useEffect(() => {
    if (!step.target) return;
    function reposition() {
      const found = measureTarget(step.target!);
      if (found) setRect(found);
    }
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [step.target, stepIndex]);

  function goNext() {
    if (isLast) {
      onClose();
      return;
    }
    setStepIndex((i) => i + 1);
  }

  function goBack() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  const spotlightBox = rect
    ? {
        top: rect.top - SPOTLIGHT_PADDING,
        left: rect.left - SPOTLIGHT_PADDING,
        width: rect.width + SPOTLIGHT_PADDING * 2,
        height: rect.height + SPOTLIGHT_PADDING * 2,
      }
    : null;

  const cardPosition = computeCardPosition(spotlightBox);

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Full-screen click-catcher — clicking anywhere (including on the
          spotlighted element itself) closes the tour instead of triggering
          the real button underneath. The card stops its own clicks below. */}
      <div onClick={onClose} className="fixed inset-0" />

      {spotlightBox ? (
        <div
          className="pointer-events-none fixed rounded-[6px] transition-all duration-200"
          style={{
            top: spotlightBox.top,
            left: spotlightBox.left,
            width: spotlightBox.width,
            height: spotlightBox.height,
            boxShadow: "0 0 0 9999px rgba(20,26,22,0.6)",
          }}
        />
      ) : (
        <div className="pointer-events-none fixed inset-0 bg-[rgba(20,26,22,0.6)]" />
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed w-[340px] max-w-[calc(100vw-24px)] rounded-[5px] border-t-[5px] bg-card px-4 pt-4 pb-4 shadow-xl"
        style={{ borderTopColor: "#6B5B95", ...cardPosition }}
      >
        <div className="mb-1.5 font-mono text-[10.5px] tracking-[0.08em] text-ink-soft uppercase">
          Step {stepIndex + 1} of {TOUR_STEPS.length}
        </div>
        <h4 className="m-0 mb-1.5 font-serif text-[17px] text-ink">{step.title}</h4>
        <p className="m-0 mb-4 text-[13px] leading-[1.5] text-ink-soft">
          {isLocating ? "One moment…" : step.body}
        </p>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[10.5px] text-ink-soft uppercase hover:text-ink"
          >
            Skip tour
          </button>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="rounded border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-opacity hover:opacity-88"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              className="rounded bg-ink px-3 py-1.5 text-xs font-semibold text-paper transition-opacity hover:opacity-88"
            >
              {isLast ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Prefers placing the tooltip just below the spotlighted element; flips
// above it if there's not enough room; falls back to a centered card when
// there's no spotlight at all. Always clamped to stay on-screen.
function computeCardPosition(
  spotlightBox: Rect | null,
): { top: number; left: number } | { top: string; left: string; transform: string } {
  if (!spotlightBox || typeof window === "undefined") {
    return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  let top = spotlightBox.top + spotlightBox.height + CARD_MARGIN;
  if (top + CARD_HEIGHT_ESTIMATE > viewportH) {
    top = Math.max(CARD_MARGIN, spotlightBox.top - CARD_HEIGHT_ESTIMATE - CARD_MARGIN);
  }

  let left = spotlightBox.left;
  if (left + CARD_WIDTH + CARD_MARGIN > viewportW) {
    left = Math.max(CARD_MARGIN, viewportW - CARD_WIDTH - CARD_MARGIN);
  }

  return { top, left };
}
