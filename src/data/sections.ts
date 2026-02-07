import { Wallet, Gamepad2, Bot, Gift, Wrench, TrendingUp } from "lucide-react";

export type SectionSlug = "finance" | "games" | "bots" | "gifts" | "utilities" | "trends";

export const SECTIONS: {
  slug: SectionSlug;
  title: string;
  category: string; // для фильтрации APPS по категории
  Icon: typeof Wallet;
}[] = [
  { slug: "finance", title: "Финансы", category: "Финансы", Icon: Wallet },
  { slug: "games", title: "Игры", category: "Игры", Icon: Gamepad2 },
  { slug: "bots", title: "Боты", category: "Боты", Icon: Bot },
  { slug: "gifts", title: "Подарки", category: "Подарки", Icon: Gift },
  { slug: "utilities", title: "Утилиты", category: "Утилиты", Icon: Wrench },
  { slug: "trends", title: "Тренды", category: "Тренды", Icon: TrendingUp },
];
