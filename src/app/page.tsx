import { AppCard } from "@/components/AppCard";
import { APPS } from "@/data/apps";

export default function Home() {
  return (
    <div className="bg-white min-h-screen pb-24 text-black">
      <header className="p-5 pt-10">
        <p className="text-gray-400 text-[13px] font-bold uppercase tracking-tight">4 февраля</p>
        <h1 className="text-[34px] font-bold tracking-tight">Сегодня</h1>
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

      <nav className="fixed bottom-0 w-full bg-white/80 backdrop-blur-md border-t border-gray-200 h-[83px] flex justify-around pt-3">
        <div className="flex flex-col items-center gap-1 text-[#007AFF]">
            <div className="w-6 h-6 bg-[#007AFF] rounded-md opacity-20"></div>
            <span className="text-[10px] font-medium">Сегодня</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-gray-400">
            <div className="w-6 h-6 bg-gray-200 rounded-md"></div>
            <span className="text-[10px] font-medium">Игры</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-gray-400">
            <div className="w-6 h-6 bg-gray-200 rounded-md"></div>
            <span className="text-[10px] font-medium">Поиск</span>
        </div>
      </nav>
    </div>
  );
}