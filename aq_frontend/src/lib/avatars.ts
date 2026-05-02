export type AvatarDef = {
  emoji: string;
  bg: string;
  ring: string;
};

export const AVATARS: AvatarDef[] = [
  { emoji: "🦊", bg: "bg-orange-100", ring: "ring-2 ring-orange-200" },
  { emoji: "🐸", bg: "bg-green-100",  ring: "ring-2 ring-green-200"  },
  { emoji: "🦄", bg: "bg-purple-100", ring: "ring-2 ring-purple-200" },
  { emoji: "🐧", bg: "bg-blue-100",   ring: "ring-2 ring-blue-200"   },
  { emoji: "🦔", bg: "bg-amber-100",  ring: "ring-2 ring-amber-200"  },
  { emoji: "🐙", bg: "bg-red-100",    ring: "ring-2 ring-red-200"    },
  { emoji: "🦜", bg: "bg-teal-100",   ring: "ring-2 ring-teal-200"   },
  { emoji: "🐹", bg: "bg-yellow-100", ring: "ring-2 ring-yellow-200" },
  { emoji: "🦝", bg: "bg-slate-100",  ring: "ring-2 ring-slate-200"  },
  { emoji: "🐡", bg: "bg-pink-100",   ring: "ring-2 ring-pink-200"   },
];

export function getAvatar(avatarId: number): AvatarDef {
  return AVATARS[avatarId % AVATARS.length];
}
