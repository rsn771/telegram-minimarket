"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { hapticFeedback } from "@/utils/telegram";

export const AppCard = ({ app }: any) => {
  const handleClick = () => {
    hapticFeedback("light");
  };

  return (
    <Link href={`/app/${app.id}`} className="block" onClick={handleClick}>
      <div className="flex items-center gap-4 p-4 active:bg-gray-100 transition-colors">
        {/* Контейнер для иконки с фиксированным размером */}
        <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-[22%] border border-gray-100 shadow-sm">
          <img 
            src={app.icon} 
            className="w-full h-full object-cover" 
            alt={app.name}
          />
        </div>
        
        <div className="flex-1 border-b border-gray-100 pb-4">
          <h3 className="font-bold text-[17px] text-black tracking-tight">{app.name}</h3>
          <p className="text-gray-500 text-[14px]">{app.category}</p>
          <div className="flex items-center gap-1 mt-1">
            <Star size={10} className="fill-gray-400 stroke-none" />
            <span className="text-[12px] text-gray-400 font-bold">{app.rating}</span>
          </div>
        </div>

        <button className="bg-[#F0F1F6] text-[#007AFF] px-5 py-1.5 rounded-full font-bold text-[13px] uppercase active:opacity-50">
          Открыть
        </button>
      </div>
    </Link>
  );
};