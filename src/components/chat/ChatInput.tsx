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
    <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-3">
      <div className="mx-auto flex w-full max-w-2xl items-end gap-2">
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
          rows={1}
          placeholder="Describe your event or ask anything…"
          className="max-h-40 flex-1 resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
        />
        <button
          onClick={submit}
          disabled={disabled || !text.trim()}
          className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
