"use client";

/* Drives Ava's conversational walkthrough from inside the chat.
 *
 * Each step navigates the stage and drops one local assistant bubble into the
 * message list. The bubbles are client-only — never POSTed, never persisted —
 * so replaying the walkthrough never pollutes the couple's real chat history.
 * Advancing is conversational: trying a prompt (or typing anything) runs a real
 * agent turn, and when that turn finishes Ava moves on by herself.
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

/** How long to let the agent's answer breathe before Ava's next line. */
const ADVANCE_DELAY_MS = 900;

export interface Walkthrough {
  /** Null when the walkthrough isn't running. */
  step: (typeof WALKTHROUGH_STEPS)[number] | null;
  /** Try-prompts for the current step, placeholders already filled. */
  tries: string[];
  /** Send a try-prompt as a real agent turn. */
  runTry: (prompt: string) => void;
  /** Manual "Videre" — used on steps with nothing to try. */
  next: () => void;
  /** Jump to the final chat-vs-classic choice. */
  skip: () => void;
  /** Finish, optionally kicking Ava off on the couple's remaining gaps. */
  finish: (mode: 'chat' | 'classic') => void;
  /** Composer hook — typing your own question also advances the walkthrough. */
  armAutoAdvance: () => void;
}

export function useWalkthrough({
  active,
  historyLoaded,
  params,
  agentStatus,
  onNavigate,
  sendMessage,
  setMessages,
  onFinish,
}: {
  active: boolean;
  /** Chat history has landed — injecting earlier would be overwritten. */
  historyLoaded: boolean;
  params: Partial<WalkthroughParams>;
  agentStatus: string | null;
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

  /* ── Auto-advance once the agent finishes the turn they triggered ─── */
  const awaitingTurn = useRef(false);
  const prevStatus = useRef(agentStatus);
  useEffect(() => {
    const wasBusy = prevStatus.current !== null;
    prevStatus.current = agentStatus;
    if (!active || !awaitingTurn.current) return;
    if (!wasBusy || agentStatus !== null) return;
    awaitingTurn.current = false;
    const timer = setTimeout(advance, ADVANCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [active, agentStatus, advance]);

  /** Called by the composer too — typing your own question also moves things on. */
  const armAutoAdvance = useCallback(() => {
    if (active) awaitingTurn.current = true;
  }, [active]);

  const runTry = useCallback(
    (prompt: string) => {
      armAutoAdvance();
      void sendMessage(prompt);
    },
    [armAutoAdvance, sendMessage],
  );

  const skip = useCallback(() => {
    awaitingTurn.current = false;
    setIdx(WALKTHROUGH_STEPS.length - 1);
  }, []);

  const finish = useCallback(
    (mode: 'chat' | 'classic') => {
      awaitingTurn.current = false;
      if (mode === 'chat') {
        // Straight into real work: Ava reads the plan and asks what's missing.
        void sendMessage(tRef.current('Hjælp os videre — hvad mangler vi at få på plads?'), {
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
    runTry,
    next: advance,
    skip,
    finish,
    armAutoAdvance,
  };
}
