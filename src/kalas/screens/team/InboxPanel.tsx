"use client";

import Inbox from '../Inbox';
import type { NavigateTarget } from '../../lib/hub-nav';

export default function InboxPanel({ onNavigate }: { onNavigate?: (s: NavigateTarget) => void }) {
  return <Inbox onNavigate={onNavigate} embedded />;
}
