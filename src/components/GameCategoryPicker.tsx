"use client";

import { cn } from "@/lib/utils";
import { SHOP_GAME_OPTIONS } from "@/lib/shop-taxonomy";
import { ShopGameChipGrid, shopGameChipClass } from "@/components/shop-game-chips";

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
    <ShopGameChipGrid className={className}>
      {SHOP_GAME_OPTIONS.map((game) => {
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
    </ShopGameChipGrid>
  );
}
