"use client";

import { cn } from "@/lib/utils";
import { SHOP_GAME_OPTIONS } from "@/lib/shop-taxonomy";
import { ShopGameChipGrid, shopGameChipClass } from "@/components/shop-game-chips";

interface ShopGameFilterChipsProps {
  selectedGame: string;
  onSelect: (game: string) => void;
  className?: string;
}

export function ShopGameFilterChips({
  selectedGame,
  onSelect,
  className,
}: ShopGameFilterChipsProps) {
  return (
    <ShopGameChipGrid className={cn("px-2", className)}>
      <button
        type="button"
        onClick={() => onSelect("")}
        className={shopGameChipClass(!selectedGame)}
      >
        全部
      </button>
      {SHOP_GAME_OPTIONS.map((game) => (
        <button
          key={game}
          type="button"
          onClick={() => onSelect(game)}
          className={shopGameChipClass(selectedGame === game)}
        >
          {game}
        </button>
      ))}
    </ShopGameChipGrid>
  );
}
