import { AppCard } from "@/components/AppCard";
import { APPS } from "@/data/apps";
import { Search } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

export default function Home() {
  return (
    <div className="bg-white min-h-screen pb-24 text-black">
      {/* Строка поиска в самом верху */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="px-4 py-3 flex items-center gap-3 bg-[#F2F2F7] rounded-xl mx-4 mt-4 mb-2">
          <Search size={20} className="text-gray-400 shrink-0" />
          <input
            type="search"
            placeholder="Поиск"
            className="flex-1 bg-transparent text-[17px] text-black placeholder:text-gray-400 outline-none"
            aria-label="Поиск"
          />
        </div>
      </div>

      <header className="p-5 pt-4">
        <h1 className="text-[34px] font-bold tracking-tight">Сегодня</h1>
        {/* Картинка под надписью: на всю ширину, динамичное разрешение */}
        <div className="w-full mt-3 overflow-hidden rounded-xl">
          <img
            src="/logo-splash.png"
            alt="Mini Market"
            className="w-full h-auto object-contain object-left block"
          />
        </div>
      </header>

      <section className="mt-2">
        <div className="px-5 mb-4 flex justify-between items-end">
          <h2 className="text-[22px] font-bold">Топ чарты</h2>
          <span className="text-[#007AFF] text-[17px]">См. все</span>
        </div>
        
        <div className="flex flex-col">
          {APPS.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      </section>

      <BottomNav active="main" />
    </div>
  );
}