"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AssistantSidebar } from "./AssistantSidebar";

interface OpenContext {
  contextReplyId?: string;
}

interface AssistantContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Open the sidebar and prime it with a prompt (optionally reply-scoped). */
  openWithPrompt: (prompt: string, ctx?: OpenContext) => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function useAssistant(): AssistantContextValue {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistant must be used within AssistantProvider");
  return ctx;
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  // Pending prompt handed to the sidebar when it opens.
  const pendingRef = useRef<{ prompt: string; ctx?: OpenContext } | null>(null);
  const [pendingVersion, setPendingVersion] = useState(0);

  const openWithPrompt = useCallback((prompt: string, ctx?: OpenContext) => {
    pendingRef.current = { prompt, ctx };
    setPendingVersion((v) => v + 1);
    setOpen(true);
  }, []);

  const value = useMemo(
    () => ({ open, setOpen, openWithPrompt }),
    [open, openWithPrompt]
  );

  return (
    <AssistantContext.Provider value={value}>
      {children}
      <AssistantSidebar
        open={open}
        onOpenChange={setOpen}
        pendingRef={pendingRef}
        pendingVersion={pendingVersion}
      />
    </AssistantContext.Provider>
  );
}
