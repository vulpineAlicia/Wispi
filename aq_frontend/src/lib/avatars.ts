export type AvatarDef = {
  emoji: string;
  bg: string;
};

export const AVATARS: AvatarDef[] = [
  { emoji: "🦊", bg: "bg-orange-100" },
  { emoji: "🐸", bg: "bg-green-100" },
  { emoji: "🦄", bg: "bg-purple-100" },
  { emoji: "🐧", bg: "bg-blue-100" },
  { emoji: "🦔", bg: "bg-amber-100" },
  { emoji: "🐙", bg: "bg-red-100" },
  { emoji: "🦜", bg: "bg-teal-100" },
  { emoji: "🐿️", bg: "bg-yellow-100" },
  { emoji: "🦭", bg: "bg-slate-100" },
  { emoji: "🐡", bg: "bg-pink-100" },
];

export function getAvatar(avatarId: number): AvatarDef {
  return AVATARS[avatarId % AVATARS.length];
}
