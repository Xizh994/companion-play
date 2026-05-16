const POSITIVE_COMBOS = [
  { mouth: "smile", eyes: "happy" },
  { mouth: "twinkle", eyes: "default" },
  { mouth: "tongue", eyes: "wink" },
  { mouth: "eating", eyes: "default" },
  { mouth: "smile", eyes: "winkWacky" },
  { mouth: "twinkle", eyes: "happy" },
  { mouth: "smile", eyes: "surprised" },
  { mouth: "default", eyes: "happy" },
  { mouth: "tongue", eyes: "default" },
  { mouth: "smile", eyes: "wink" },
  { mouth: "twinkle", eyes: "squint" },
  { mouth: "eating", eyes: "happy" },
  { mouth: "smile", eyes: "squint" },
  { mouth: "default", eyes: "wink" },
  { mouth: "tongue", eyes: "surprised" },
  { mouth: "twinkle", eyes: "wink" },
];

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

export function generateAvatarUrl(seed: string): string {
  const idx = Math.abs(hashCode(seed)) % POSITIVE_COMBOS.length;
  const { mouth, eyes } = POSITIVE_COMBOS[idx];
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&mouth=${mouth}&eyes=${eyes}&backgroundColor=transparent`;
}
