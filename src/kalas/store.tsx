/* Shared app state so screens tell the same story: timeline progress,
   approval queue, and Ava's unread badge all live here instead of in
   per-screen local state. */
import * as React from 'react';
import { createContext, useContext, useMemo, useState } from 'react';
import { timeline, queue, type Task } from './data';

const ORIG_DONE = new Set(timeline.filter((t) => t.status === 'done').map((t) => t.id));

export type QueueStatus = 'approved' | 'dismissed';

type KalasStore = {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  doneIds: Set<string>;
  /** Returns true when the task was just marked done (for celebrations). */
  toggleDone: (id: string) => boolean;
  resetTimeline: () => void;

  queueHandled: Record<string, QueueStatus>;
  handleQueueItem: (id: string, status: QueueStatus) => void;
  undoQueueItem: (id: string) => void;
  pendingCount: number;

  avaBadge: number;
  clearAvaBadge: () => void;

};

const Ctx = createContext<KalasStore | null>(null);

export function KalasProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(timeline);
  const [doneIds, setDoneIds] = useState<Set<string>>(() => new Set(ORIG_DONE));
  const [queueHandled, setQueueHandled] = useState<Record<string, QueueStatus>>({});
  const [avaBadge, setAvaBadge] = useState(2);

  const toggleDone = (id: string): boolean => {
    const nowDone = !doneIds.has(id);
    setDoneIds((prev) => {
      const next = new Set(prev);
      nowDone ? next.add(id) : next.delete(id);
      return next;
    });
    return nowDone;
  };

  const resetTimeline = () => {
    setTasks(timeline);
    setDoneIds(new Set(ORIG_DONE));
  };

  const handleQueueItem = (id: string, status: QueueStatus) =>
    setQueueHandled((prev) => ({ ...prev, [id]: status }));

  const undoQueueItem = (id: string) =>
    setQueueHandled((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

  const pendingCount = queue.filter((q) => !queueHandled[q.id]).length;

  const value = useMemo<KalasStore>(() => ({
    tasks, setTasks, doneIds, toggleDone, resetTimeline,
    queueHandled, handleQueueItem, undoQueueItem, pendingCount,
    avaBadge, clearAvaBadge: () => setAvaBadge(0),
  }), [tasks, doneIds, queueHandled, avaBadge]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useKalas(): KalasStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useKalas must be used inside <KalasProvider>');
  return ctx;
}
