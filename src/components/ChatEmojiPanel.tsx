"use client";

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

type ChatEmojiPanelProps = {
  onPick: (emoji: string) => void;
};

export function ChatEmojiPanel({ onPick }: ChatEmojiPanelProps) {
  return (
    <div
      className="grid grid-cols-8 gap-0.5 p-2 max-h-[200px] overflow-y-auto"
      role="listbox"
      aria-label="表情"
    >
      {CHAT_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          role="option"
          className="h-9 w-full rounded-lg text-xl hover:bg-white/10 active:scale-95 transition"
          onClick={() => onPick(emoji)}
          title={emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
