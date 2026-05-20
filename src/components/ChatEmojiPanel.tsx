"use client";

import { useEffect, useState } from "react";

/** QQ 风格精选表情（约 96 个常用） */
export const CHAT_EMOJIS: string[] = [
  "😀", "😁", "😂", "🤣", "😊", "😇", "🙂", "😉",
  "😍", "🥰", "😘", "😗", "😋", "😛", "😜", "🤪",
  "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨",
  "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "😌",
  "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢",
  "🤮", "🥵", "🥶", "🥴", "😵", "🤯", "😎", "🤓",
  "🧐", "😕", "😟", "🙁", "☹️", "😮", "😯", "😲",
  "😳", "🥺", "😦", "😧", "😨", "😰", "😥", "😢",
  "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫",
  "🥱", "😤", "😡", "😠", "🤬", "👍", "👎", "👏",
  "🙌", "🤝", "🙏", "💪", "❤️", "🧡", "💛", "💚",
  "💙", "💜", "🖤", "💔", "💕", "💖", "✨", "⭐",
];

const RECENT_KEY = "dazistar_recent_emojis";
const MAX_RECENT = 16;

type ChatEmojiPanelProps = {
  onPick: (emoji: string) => void;
};

function EmojiGrid({
  emojis,
  onPick,
}: {
  emojis: string[];
  onPick: (emoji: string) => void;
}) {
  return (
    <div className="grid grid-cols-10 gap-px p-1" role="listbox">
      {emojis.map((emoji) => (
        <button
          key={emoji}
          type="button"
          role="option"
          className="h-7 w-7 flex items-center justify-center rounded text-base hover:bg-white/10 active:scale-95 transition"
          onClick={() => onPick(emoji)}
          title={emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

export function ChatEmojiPanel({ onPick }: ChatEmojiPanelProps) {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed)) setRecent(parsed.slice(0, MAX_RECENT));
      }
    } catch {
      // ignore
    }
  }, []);

  const handlePick = (emoji: string) => {
    onPick(emoji);
    setRecent((prev) => {
      const next = [emoji, ...prev.filter((e) => e !== emoji)].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <div className="w-[300px] select-none" aria-label="表情">
      {recent.length > 0 && (
        <div className="border-b border-white/10">
          <p className="text-[10px] text-gray-500 px-2 pt-1.5 pb-0.5">最近</p>
          <EmojiGrid emojis={recent} onPick={handlePick} />
        </div>
      )}
      <div>
        <p className="text-[10px] text-gray-500 px-2 pt-1.5 pb-0.5">表情</p>
        <div className="max-h-[132px] overflow-y-auto overflow-x-hidden">
          <EmojiGrid emojis={CHAT_EMOJIS} onPick={handlePick} />
        </div>
      </div>
    </div>
  );
}
