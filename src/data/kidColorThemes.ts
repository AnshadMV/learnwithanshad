/**
 * Child-Friendly Color Themes for Arabic Educational Games
 * Highly engaging, playful, distinct colors specifically tuned for young learners (ages 4-7).
 */

export interface KidColorTheme {
  name: string
  bg: string
  border: string
  hoverBorder: string
  hoverBg: string
  text: string
  badgeBg: string
  badgeText: string
  ring: string
  gradient: string
  shadow: string
}

export const KID_COLOR_THEMES: KidColorTheme[] = [
  // 1. Sunshine Amber
  {
    name: 'amber',
    bg: 'bg-amber-100',
    border: 'border-amber-400',
    hoverBorder: 'hover:border-amber-500',
    hoverBg: 'hover:bg-amber-200',
    text: 'text-amber-950',
    badgeBg: 'bg-amber-300',
    badgeText: 'text-amber-950',
    ring: 'ring-amber-300',
    gradient: 'from-amber-400 to-yellow-500',
    shadow: 'shadow-amber-200/60',
  },
  // 2. Sky Blue
  {
    name: 'sky',
    bg: 'bg-sky-100',
    border: 'border-sky-400',
    hoverBorder: 'hover:border-sky-500',
    hoverBg: 'hover:bg-sky-200',
    text: 'text-sky-950',
    badgeBg: 'bg-sky-300',
    badgeText: 'text-sky-950',
    ring: 'ring-sky-300',
    gradient: 'from-sky-400 to-blue-500',
    shadow: 'shadow-sky-200/60',
  },
  // 3. Mint Emerald
  {
    name: 'emerald',
    bg: 'bg-emerald-100',
    border: 'border-emerald-400',
    hoverBorder: 'hover:border-emerald-500',
    hoverBg: 'hover:bg-emerald-200',
    text: 'text-emerald-950',
    badgeBg: 'bg-emerald-300',
    badgeText: 'text-emerald-950',
    ring: 'ring-emerald-300',
    gradient: 'from-emerald-400 to-teal-500',
    shadow: 'shadow-emerald-200/60',
  },
  // 4. Berry Rose / Coral
  {
    name: 'rose',
    bg: 'bg-rose-100',
    border: 'border-rose-400',
    hoverBorder: 'hover:border-rose-500',
    hoverBg: 'hover:bg-rose-200',
    text: 'text-rose-950',
    badgeBg: 'bg-rose-300',
    badgeText: 'text-rose-950',
    ring: 'ring-rose-300',
    gradient: 'from-rose-400 to-pink-500',
    shadow: 'shadow-rose-200/60',
  },
  // 5. Magic Lavender / Violet
  {
    name: 'purple',
    bg: 'bg-purple-100',
    border: 'border-purple-400',
    hoverBorder: 'hover:border-purple-500',
    hoverBg: 'hover:bg-purple-200',
    text: 'text-purple-950',
    badgeBg: 'bg-purple-300',
    badgeText: 'text-purple-950',
    ring: 'ring-purple-300',
    gradient: 'from-purple-400 to-indigo-500',
    shadow: 'shadow-purple-200/60',
  },
  // 6. Tangy Orange
  {
    name: 'orange',
    bg: 'bg-orange-100',
    border: 'border-orange-400',
    hoverBorder: 'hover:border-orange-500',
    hoverBg: 'hover:bg-orange-200',
    text: 'text-orange-950',
    badgeBg: 'bg-orange-300',
    badgeText: 'text-orange-950',
    ring: 'ring-orange-300',
    gradient: 'from-orange-400 to-amber-500',
    shadow: 'shadow-orange-200/60',
  },
  // 7. Ocean Cyan / Teal
  {
    name: 'teal',
    bg: 'bg-teal-100',
    border: 'border-teal-400',
    hoverBorder: 'hover:border-teal-500',
    hoverBg: 'hover:bg-teal-200',
    text: 'text-teal-950',
    badgeBg: 'bg-teal-300',
    badgeText: 'text-teal-950',
    ring: 'ring-teal-300',
    gradient: 'from-teal-400 to-cyan-500',
    shadow: 'shadow-teal-200/60',
  },
  // 8. Sugar Pink
  {
    name: 'pink',
    bg: 'bg-pink-100',
    border: 'border-pink-400',
    hoverBorder: 'hover:border-pink-500',
    hoverBg: 'hover:bg-pink-200',
    text: 'text-pink-950',
    badgeBg: 'bg-pink-300',
    badgeText: 'text-pink-950',
    ring: 'ring-pink-300',
    gradient: 'from-pink-400 to-rose-500',
    shadow: 'shadow-pink-200/60',
  },
]

export function getKidCardTheme(index: number): KidColorTheme {
  return KID_COLOR_THEMES[Math.abs(index) % KID_COLOR_THEMES.length]
}
