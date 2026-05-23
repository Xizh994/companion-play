"use client";

import { cn } from "@/lib/utils";
import { SHOP_GAME_GROUPS } from "@/lib/shop-taxonomy";
import { ShopGameGroupRow, shopGameChipClass } from "@/components/shop-game-group-row";

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
    <div className={cn("space-y-3", className)}>
      {SHOP_GAME_GROUPS.map((group) => (
        <ShopGameGroupRow key={group.id} label={group.label}>
          {group.games.map((game) => {
            const selected = value.includes(game);
            const atMax = !selected && value.length >= max;
            return (
              <button
                key={game}
                type="button"
                disabled={disabled || atMax}
                onClick={() => toggle(game)}
                className={shopGameChipClass(
                  selected,
                  (disabled || atMax) && !selected ? "opacity-40 cursor-not-allowed" : undefined
                )}
              >
                {game}
              </button>
            );
          })}
        </ShopGameGroupRow>
      ))}
    </div>
  );
}
