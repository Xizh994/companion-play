"use client";

import { cn } from "@/lib/utils";
import { SHOP_GAME_OPTIONS } from "@/lib/shop-taxonomy";

interface GameCategoryPickerProps {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  disabled?: boolean;
  className?: string;
}

export function GameCategoryPicker({
  value,
  onChange,
  max = 5,
  disabled = false,
  className,
}: GameCategoryPickerProps) {
  const toggle = (game: string) => {
    if (disabled) return;
    if (value.includes(game)) {
      onChange(value.filter((g) => g !== game));
      return;
    }
    if (value.length >= max) return;
    onChange([...value, game]);
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {SHOP_GAME_OPTIONS.map((game) => {
        const selected = value.includes(game);
        const atMax = !selected && value.length >= max;
        return (
          <button
            key={game}
            type="button"
            disabled={disabled || atMax}
            onClick={() => toggle(game)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm border transition",
              selected
                ? "bg-purple-500/20 text-purple-200 border-purple-500/40"
                : "bg-white/5 text-gray-400 border-white/10 hover:border-purple-500/30 hover:text-gray-200",
              (disabled || atMax) && !selected && "opacity-40 cursor-not-allowed"
            )}
          >
            {game}
          </button>
        );
      })}
    </div>
  );
}
