"use client";

import { cn } from "@/lib/utils";
import { SHOP_GAME_GROUPS } from "@/lib/shop-taxonomy";
import { ShopGameGroupRow, shopGameChipClass } from "@/components/shop-game-group-row";

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
    <div className={cn("space-y-3 max-w-3xl mx-auto w-full px-1", className)}>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => onSelect("")}
          className={shopGameChipClass(!selectedGame)}
        >
          全部
        </button>
      </div>
      {SHOP_GAME_GROUPS.map((group) => (
        <ShopGameGroupRow key={group.id} label={group.label}>
          {group.games.map((game) => (
            <button
              key={game}
              type="button"
              onClick={() => onSelect(game)}
              className={shopGameChipClass(selectedGame === game)}
            >
              {game}
            </button>
          ))}
        </ShopGameGroupRow>
      ))}
    </div>
  );
}
