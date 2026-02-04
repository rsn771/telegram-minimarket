"use client";
import { APPS } from "@/data/apps";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Star, Share, ShieldCheck, Zap } from "lucide-react";
import { hapticFeedback } from "@/utils/telegram";

export default function AppDetail() {
  const { id } = useParams();
  const router = useRouter();
  const app = APPS.find((a) => a.id.toString() === id);

  if (!app) return <div className="p-10 text-center font-sans">Приложение не найдено</div>;

  const handleBack = () => {
    hapticFeedback("light");
    router.back();
  };

  const handleShare = () => {
    hapticFeedback("medium");
  };

  const handleDownload = () => {
    hapticFeedback("medium");
  };

  return (
    <div className="bg-[#F2F2F7] min-h-screen pb-10 text-black font-sans antialiased">
      {/* Верхняя панель */}
      <div className="p-4 flex justify-between items-center bg-white/70 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-200/50">
        <button onClick={handleBack} className="text-[#007AFF] flex items-center gap-0 font-normal text-[17px]">
          <ChevronLeft size={32} strokeWidth={2} /> 
          <span className="-ml-1">Назад</span>
        </button>
        <button onClick={handleShare}>
          <Share size={22} className="text-[#007AFF]" />
        </button>
      </div>

      <div className="bg-white pb-6 shadow-sm">
        {/* Шапка */}
        <div className="px-5 flex gap-5 mt-4">
          <div className="relative shrink-0">
            <img src={app.icon} className="w-28 h-28 rounded-[22%] shadow-lg border border-black/5 object-cover" alt={app.name} />
          </div>
          <div className="flex flex-col justify-between py-1">
            <div>
              <h1 className="text-[22px] font-bold leading-tight tracking-tight text-gray-900">{app.name}</h1>
              <p className="text-gray-500 text-[15px] font-medium">{app.category.toUpperCase()}</p>
            </div>
            <button 
              onClick={handleDownload}
              className="bg-[#007AFF] active:scale-95 transition-transform text-white px-8 py-1.5 rounded-full font-bold text-sm uppercase w-fit shadow-md shadow-blue-200"
            >
              Загрузить
            </button>
          </div>
        </div>

        {/* Статистика */}
        <div className="flex justify-around border-t border-gray-100 mt-8 py-4 mx-5">
          <div className="text-center flex-1">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Рейтинг</p>
            <p className="text-[20px] font-black text-gray-700 flex items-center gap-1 justify-center">
              {app.rating} <Star size={16} className="fill-gray-700 stroke-none" />
            </p>
          </div>
          <div className="w-[1px] bg-gray-100 h-8 self-center"></div>
          <div className="text-center flex-1 px-2">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Безопасность</p>
            <p className="text-[20px] font-black text-gray-700 flex justify-center"><ShieldCheck className="text-green-500" /></p>
          </div>
          <div className="w-[1px] bg-gray-100 h-8 self-center"></div>
          <div className="text-center flex-1">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Возраст</p>
            <p className="text-[20px] font-black text-gray-700">4+</p>
          </div>
        </div>
      </div>

      {/* Скриншоты */}
      <div className="mt-6 bg-white py-6 shadow-sm">
        <h2 className="px-5 text-[20px] font-bold mb-4 tracking-tight">Предпросмотр</h2>
        <div className="flex gap-4 overflow-x-auto px-5 no-scrollbar">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[260px] h-[460px] bg-gradient-to-br from-blue-500 to-purple-600 rounded-[2.5rem] flex-shrink-0 shadow-xl overflow-hidden relative border-[6px] border-black">
               <div className="absolute top-0 w-full h-6 bg-black flex justify-center">
                  <div className="w-20 h-4 bg-black rounded-b-xl"></div>
               </div>
               <div className="flex flex-col items-center justify-center h-full text-white p-8 text-center">
                  <Zap size={48} className="mb-4 opacity-50" />
                  <div className="text-xl font-bold italic">AMAZING INTERFACE</div>
                  <div className="text-sm opacity-70 mt-2 text-balance">Built for Telegram Mini Apps 2026</div>
               </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Описание */}
      <div className="px-5 mt-6 bg-white py-6 shadow-sm border-t border-gray-100">
        <h2 className="text-[20px] font-bold mb-3 tracking-tight">Описание</h2>
        <p className="text-gray-600 leading-[1.5] text-[16px] font-normal">
          Это официальное приложение для платформы Telegram. Мы объединили удобство мессенджера и мощь современных технологий. 
          <br /><br />
          • Мгновенный запуск без установки <br />
          • Полная интеграция с вашим аккаунтом <br />
          • Безопасные платежи через Telegram Pay
        </p>
      </div>
    </div>
  );
}