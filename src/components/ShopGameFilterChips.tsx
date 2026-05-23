"use client";

import { cn } from "@/lib/utils";
import { SHOP_GAME_GROUPS } from "@/lib/shop-taxonomy";

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
  const chipClass = (active: boolean) =>
    cn(
      "px-3 py-1 rounded-full text-xs border transition shrink-0",
      active
        ? "bg-purple-500/25 text-purple-200 border-purple-500/40"
        : "bg-white/5 text-gray-400 border-white/10 hover:border-purple-500/30"
    );

  return (
    <div className={cn("space-y-3 text-left max-w-2xl mx-auto", className)}>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => onSelect("")}
          className={chipClass(!selectedGame)}
        >
          全部
        </button>
      </div>
      {SHOP_GAME_GROUPS.map((group) => (
        <div key={group.id}>
          <p className="text-[11px] text-gray-500 mb-1.5 text-center">{group.label}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {group.games.map((game) => (
              <button
                key={game}
                type="button"
                onClick={() => onSelect(game)}
                className={chipClass(selectedGame === game)}
              >
                {game}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
