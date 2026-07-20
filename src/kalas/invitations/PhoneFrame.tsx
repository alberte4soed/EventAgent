'use client';

import './templates.css';
import type { ReactNode } from 'react';

/** iPhone-style frame (`.phone > .screen > .island`) for gallery + editor
    previews. `width` overrides the default 280px; aspect-ratio keeps height. */
export function PhoneFrame({ children, width, className }: { children: ReactNode; width?: number; className?: string }) {
  return (
    <div className={`kinv${className ? ` ${className}` : ''}`}>
      <div className="phone" style={width ? { width } : undefined}>
        <div className="screen">
          <div className="island" />
          {children}
        </div>
      </div>
    </div>
  );
}

/** Full-bleed stage for the public share page — the invitation fills the
    viewport (no phone chrome, no notch). */
export function InvitationStage({ children }: { children: ReactNode }) {
  return (
    <div className="kinv kinv-stage">
      <div className="screen">{children}</div>
    </div>
  );
}
