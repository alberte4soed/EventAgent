"use client";

/* Drives Ava's conversational walkthrough from inside the chat.
 *
 * Each step navigates the stage and drops one local assistant bubble into the
 * message list. The bubbles are client-only — never POSTed, never persisted —
 * so replaying the walkthrough never pollutes the couple's real chat history.
 *
 * Advancing is always the couple's call. Ava used to move on by herself a
 * beat after the agent turn finished — which navigated the stage away from the
 * venues she had just put there, so the one thing the step existed to show was
 * the one thing they never saw. Now a step that has been tried just waits.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessageRow } from '@/lib/db/types';
import type { NavigateTarget } from './lib/hub-nav';
import { useLang } from './i18n';
import {
  WALKTHROUGH_KEY,
  WALKTHROUGH_STEPS,
  stepTries,
  type WalkthroughParams,
} from './walkthrough';

export interface Walkthrough {
  /** Null when the walkthrough isn't running. */
  step: (typeof WALKTHROUGH_STEPS)[number] | null;
  /** Try-prompts for the current step, placeholders already filled. */
  tries: string[];
  /** The couple ran a prompt on this step — its result is sitting on the stage. */
  tried: boolean;
  /** Send a try-prompt as a real agent turn. */
  runTry: (prompt: string) => void;
  /** Manual "Videre" — used on steps with nothing to try. */
  next: () => void;
  /** Jump to the final chat-vs-classic choice. */
  skip: () => void;
  /** Finish, optionally kicking Ava off on the couple's remaining gaps. */
  finish: (mode: 'chat' | 'classic') => void;
  /** Composer hook — typing your own question counts as trying this step. */
  noteTurn: () => void;
}

export function useWalkthrough({
  active,
  historyLoaded,
  params,
  onNavigate,
  sendMessage,
  setMessages,
  onFinish,
}: {
  active: boolean;
  /** Chat history has landed — injecting earlier would be overwritten. */
  historyLoaded: boolean;
  params: Partial<WalkthroughParams>;
  onNavigate?: (s: NavigateTarget) => void;
  sendMessage: (text: string, ctx?: { kickoff?: boolean }) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessageRow[]>>;
  onFinish: (mode: 'chat' | 'classic') => void;
}): Walkthrough {
  const { t } = useLang();
  const [idx, setIdx] = useState(() => {
    try {
      const raw = localStorage.getItem(WALKTHROUGH_KEY);
      const n = raw === null ? 0 : Number.parseInt(raw, 10);
      return Number.isFinite(n) ? Math.min(Math.max(n, 0), WALKTHROUGH_STEPS.length - 1) : 0;
    } catch {
      return 0;
    }
  });

  const step = active ? WALKTHROUGH_STEPS[idx] ?? null : null;

  // Latest-value refs so the effects below never re-fire on identity changes.
  // Declared first so they are current before the step effect runs.
  const navigateRef = useRef(onNavigate);
  const tRef = useRef(t);
  const paramsRef = useRef(params);
  useEffect(() => {
    navigateRef.current = onNavigate;
    tRef.current = t;
    paramsRef.current = params;
  }, [onNavigate, t, params]);

  /* ── Open the step: move the stage, then say the line ─────────────── */
  const openedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!active || !historyLoaded || !step) return;
    if (openedRef.current === step.id) return;
    openedRef.current = step.id;

    if (step.page) navigateRef.current?.(step.page);

    const bubble: ChatMessageRow = {
      id: `wt-${step.id}`,
      event_id: '',
      user_id: '',
      role: 'assistant',
      content: tRef.current(step.message, paramsRef.current as Record<string, string | number>),
      payload: null,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => (m.some((x) => x.id === bubble.id) ? m : [...m, bubble]));
  }, [active, historyLoaded, step, setMessages]);

  /* ── Persist progress so a reload resumes mid-walkthrough ─────────── */
  useEffect(() => {
    if (!active) return;
    try { localStorage.setItem(WALKTHROUGH_KEY, String(idx)); } catch { /* ignore */ }
  }, [active, idx]);

  const advance = useCallback(() => {
    setIdx((i) => Math.min(i + 1, WALKTHROUGH_STEPS.length - 1));
  }, []);

  /* ── Which step they have already tried ───────────────────────────── */
  /* Remembered by step id, so the chips can stop offering a prompt that has
     already run and point at the stage instead. */
  const [triedStep, setTriedStep] = useState<string | null>(null);
  const stepId = step?.id ?? null;

  /** Called by the composer too — typing your own question counts as a try. */
  const noteTurn = useCallback(() => {
    if (active && stepId) setTriedStep(stepId);
  }, [active, stepId]);

  const runTry = useCallback(
    (prompt: string) => {
      noteTurn();
      void sendMessage(prompt);
    },
    [noteTurn, sendMessage],
  );

  const skip = useCallback(() => {
    setIdx(WALKTHROUGH_STEPS.length - 1);
  }, []);

  const finish = useCallback(
    (mode: 'chat' | 'classic') => {
      if (mode === 'chat') {
        // Straight into real work: Ava reads the plan and asks what's missing.
        void sendMessage(tRef.current('Hjælp os videre, hvad mangler vi at få på plads?'), {
          kickoff: true,
        });
      }
      onFinish(mode);
    },
    [onFinish, sendMessage],
  );

  return {
    step,
    tries: step ? stepTries(step, params).map((p) => t(p, params as Record<string, string | number>)) : [],
    tried: Boolean(stepId && triedStep === stepId),
    runTry,
    next: advance,
    skip,
    finish,
    noteTurn,
  };
}
