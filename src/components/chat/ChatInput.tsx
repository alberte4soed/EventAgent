"use client";

import { useState } from "react";

export function ChatInput({
  disabled,
  onSend,
}: {
  disabled: boolean;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");

  function submit() {
    if (!text.trim() || disabled) return;
    onSend(text);
    setText("");
  }

  return (
    <div className="shrink-0 px-4 pb-4 pt-1">
      <div className="flex flex-col gap-2.5 rounded-2xl border border-[#dfd9c6] bg-[#fdfbf4] p-3.5 shadow-[0px_2px_8px_rgba(61,43,35,0.06),0px_8px_24px_rgba(61,43,35,0.05)]">
        <textarea
          id="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={2}
          placeholder="Tell kalas more about the party…"
          disabled={disabled}
          className="max-h-32 min-h-[2.5rem] w-full resize-none bg-transparent text-sm leading-normal text-[#3d2b23] outline-none placeholder:text-[#9a8a77] disabled:opacity-50"
        />
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled
            aria-hidden
            className="flex size-[30px] items-center justify-center rounded-[9px] border border-[#e5e0cf] text-[#7a6b5c] opacity-40"
          >
            <svg
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="size-3.5"
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={disabled || !text.trim()}
            aria-label="Send message"
            className="flex size-8 items-center justify-center rounded-[11px] bg-[#ac5239] text-[#f8f4e9] transition hover:bg-[#96462f] disabled:opacity-40"
          >
            <svg
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="size-[15px]"
            >
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
