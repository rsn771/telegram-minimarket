import Link from "next/link";
import { CategoryList } from "@/components/CategoryList";

const TITLES: Record<string, string> = {
  neuro: "Лучшие нейросети",
  games: "Лучшие игры",
  probiv: "Лучший пробив",
  vpn: "Лучшие vpn",
};

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const title = TITLES[slug] ?? "Категория";

  return (
    <div className="min-h-screen pb-24 bg-white dark:bg-gray-950">
      <header className="sticky top-0 z-20 pt-[env(safe-area-inset-top,20px)] px-4 pb-3 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 -ml-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 active:opacity-70"
            aria-label="Назад"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-black dark:text-white">
            {title}
          </h1>
        </div>
      </header>
      <main className="px-4 pt-4">
        <CategoryList slug={slug} />
      </main>
    </div>
  );
}
