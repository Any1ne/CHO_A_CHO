// src/components/Builder/onboarding/useOnboarding.ts
//
// Phase 29 / Phase 30 Subtask 4: hook driving the builder onboarding
// tours. Owns two independent tours (setup + design), each with its own
// localStorage completion flag. Setup tour auto-starts on first visit
// when the buyer lands on the setup stage. Design tour auto-starts the
// first time the buyer enters the design stage. `restart` re-fires the
// tour matching the current stage.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DESIGN_TOUR_STEPS,
  SETUP_TOUR_STEPS,
  hasCompletedDesignTour,
  hasCompletedSetupTour,
  markDesignTourCompleted,
  markSetupTourCompleted,
  type TourContext,
  type TourStep,
} from "@/lib/builder/onboarding";

interface UseOnboardingResult {
  active: boolean;
  currentStep: TourStep | null;
  stepIndex: number;
  totalSteps: number;
  next: () => void;
  skip: () => void;
  restart: () => void;
}

const AUTO_START_DELAY_MS = 800;
type Phase = "setup" | "design";

function filterSteps(source: TourStep[], ctx: TourContext): TourStep[] {
  return source.filter((s) => !s.condition || s.condition(ctx));
}

export function useOnboarding(ctx: TourContext): UseOnboardingResult {
  const [activePhase, setActivePhase] = useState<Phase | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);

  // Latest ctx in a ref so callbacks fired outside React's reactive scope
  // (e.g. window listeners) re-filter against fresh context.
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;

  // Track whether we've already attempted the design auto-start so the
  // effect doesn't re-fire every time the stage flips back to design.
  const designAutoStartedRef = useRef(false);

  // Setup tour auto-start: once on mount, if we're on setup AND the
  // buyer hasn't completed the setup tour yet.
  useEffect(() => {
    if (ctxRef.current.stage !== "setup") return;
    if (hasCompletedSetupTour()) return;
    const id = window.setTimeout(() => {
      // Bail if the buyer has since transitioned away — don't pop the
      // setup tour while they're already in design.
      if (ctxRef.current.stage !== "setup") return;
      setSteps(filterSteps(SETUP_TOUR_STEPS, ctxRef.current));
      setStepIndex(0);
      setActivePhase("setup");
    }, AUTO_START_DELAY_MS);
    return () => window.clearTimeout(id);
  }, []);

  // Design tour auto-start: when the buyer first enters the design
  // stage AND hasn't completed the design tour yet. The ref guards
  // against re-firing on subsequent design-stage entries.
  useEffect(() => {
    if (ctx.stage !== "design") return;
    if (designAutoStartedRef.current) return;
    if (hasCompletedDesignTour()) {
      designAutoStartedRef.current = true;
      return;
    }
    designAutoStartedRef.current = true;
    const id = window.setTimeout(() => {
      if (ctxRef.current.stage !== "design") return;
      setSteps(filterSteps(DESIGN_TOUR_STEPS, ctxRef.current));
      setStepIndex(0);
      setActivePhase("design");
    }, AUTO_START_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [ctx.stage]);

  const complete = useCallback(() => {
    if (activePhase === "setup") markSetupTourCompleted();
    if (activePhase === "design") markDesignTourCompleted();
    setActivePhase(null);
    setStepIndex(0);
  }, [activePhase]);

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i >= steps.length - 1) {
        window.requestAnimationFrame(() => complete());
        return i;
      }
      return i + 1;
    });
  }, [steps.length, complete]);

  const skip = useCallback(() => {
    complete();
  }, [complete]);

  const restart = useCallback(() => {
    const phase: Phase = ctxRef.current.stage;
    const source =
      phase === "setup" ? SETUP_TOUR_STEPS : DESIGN_TOUR_STEPS;
    setSteps(filterSteps(source, ctxRef.current));
    setStepIndex(0);
    setActivePhase(phase);
  }, []);

  const currentStep = useMemo(() => {
    if (!activePhase) return null;
    return steps[stepIndex] ?? null;
  }, [activePhase, steps, stepIndex]);

  return {
    active: activePhase !== null,
    currentStep,
    stepIndex,
    totalSteps: steps.length,
    next,
    skip,
    restart,
  };
}
