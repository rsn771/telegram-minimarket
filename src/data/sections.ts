import { Wallet, Gamepad2, Bot, Gift, Wrench, TrendingUp, Brain } from "lucide-react";

export type SectionSlug = "finance" | "games" | "bots" | "gifts" | "utilities" | "trends" | "ai";

export const SECTIONS: {
  slug: SectionSlug;
  title: string;
  category: string; // для фильтрации APPS по категории
  Icon: typeof Wallet;
}[] = [
  { slug: "finance", title: "Finance", category: "Финансы", Icon: Wallet },
  { slug: "games", title: "Games", category: "Игры", Icon: Gamepad2 },
  { slug: "bots", title: "Bots", category: "Боты", Icon: Bot },
  { slug: "gifts", title: "Gifts", category: "Подарки", Icon: Gift },
  { slug: "utilities", title: "Utilities", category: "Утилиты", Icon: Wrench },
  { slug: "trends", title: "Trends", category: "Тренды", Icon: TrendingUp },
  { slug: "ai", title: "Neural networks", category: "Нейросети", Icon: Brain },
];
