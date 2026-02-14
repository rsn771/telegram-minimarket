"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronDown, ChevronUp, Star, ShieldCheck, Plus } from "lucide-react";
import { hapticFeedback } from "@/utils/telegram";
import { useApps } from "@/context/AppsContext";
import { useMyApps } from "@/context/MyAppsContext";
import { AppIcon } from "@/components/AppIcon";

type Review = {
  id: number;
  idminiapp: string;
  username: string;
  rating: number;
  text: string;
  createdAt: string;
};

export default function AppDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { getAppById, loading, refetch } = useApps();
  const { toggleApp, isInMyApps } = useMyApps();
  const [fullscreenScreenshotIndex, setFullscreenScreenshotIndex] = useState<number | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const app = typeof id === "string" ? getAppById(id) : undefined;

  // ВСЕ хуки должны быть вызваны ДО любых условных возвратов (правила React Hooks)
  // Используем встроенную кнопку Telegram BackButton вместо собственной панели
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tg = (window as unknown as {
      Telegram?: {
        WebApp?: {
          BackButton?: {
            show: () => void;
            hide: () => void;
            onClick: (cb: () => void) => void;
            offClick: (cb: () => void) => void;
          };
          close?: () => void;
        };
      };
    }).Telegram?.WebApp;
    if (!tg?.BackButton) return;

    const handleBackClick = () => {
      hapticFeedback("light");
      // Если есть история навигации внутри мини‑приложения — возвращаемся назад,
      // иначе просто закрываем мини‑приложение.
      if (window.history.length > 1) {
        router.back();
      } else {
        try {
          tg.close?.();
        } catch {
          // если close недоступен – ничего страшного
        }
      }
    };

    try {
      tg.BackButton.show();
      tg.BackButton.onClick(handleBackClick);
    } catch {
      // игнорируем, если BackButton недоступен в окружении
    }

    return () => {
      try {
        if (tg?.BackButton) {
          tg.BackButton.offClick(handleBackClick);
          tg.BackButton.hide();
        }
      } catch {
        // игнорируем ошибки при очистке
      }
    };
  }, [router]);

  // Отмечаем, что компонент смонтирован на клиенте
  useEffect(() => {
    setMounted(true);
  }, []);

  // Загрузка отзывов только на клиенте после монтирования
  useEffect(() => {
    if (!mounted || !app?.id) return;
    setLoadingReviews(true);
    fetch(`/api/reviews?idminiapp=${encodeURIComponent(app.id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setReviews(data);
        } else {
          setReviews([]);
        }
      })
      .catch((err) => {
        console.error("Ошибка загрузки отзывов:", err);
        setReviews([]);
      })
      .finally(() => {
        setLoadingReviews(false);
      });
  }, [mounted, app?.id]);

  // Условные возвраты ПОСЛЕ всех хуков
  if (loading) return <div className="p-10 text-center font-sans text-black dark:text-white bg-transparent">Загрузка…</div>;
  if (!app) return <div className="p-10 text-center font-sans text-black dark:text-white bg-transparent">Приложение не найдено</div>;

  // Вычисляем inMyApps только после монтирования, чтобы избежать проблем с гидратацией
  const inMyApps = mounted ? isInMyApps(String(app.id)) : false;

  const handleOpen = () => {
    hapticFeedback("medium");
    if (!app.url) return;
    const w = typeof window !== "undefined" ? (window as unknown as { Telegram?: { WebApp?: { openTelegramLink?: (url: string) => void; openLink?: (url: string) => void } } }) : null;
    const tg = w?.Telegram?.WebApp;
    if (tg && /^https?:\/\/(t\.me|telegram\.me)\//i.test(app.url)) {
      tg.openTelegramLink?.(app.url);
    } else if (tg?.openLink) {
      tg.openLink(app.url);
    } else {
      window.open(app.url, "_blank");
    }
  };

  const handlePlus = () => {
    hapticFeedback("light");
    toggleApp(String(app.id));
  };

  const openScreenshot = (index: number) => {
    hapticFeedback("light");
    setFullscreenScreenshotIndex(index);
  };

  const closeScreenshot = () => {
    hapticFeedback("light");
    setFullscreenScreenshotIndex(null);
  };

  const openReviewModal = () => {
    hapticFeedback("light");
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    hapticFeedback("light");
    setShowReviewModal(false);
    setSelectedRating(0);
    setReviewText("");
  };

  const handleSubmitReview = async () => {
    if (!app?.id || selectedRating === 0 || !reviewText.trim()) return;
    
    hapticFeedback("medium");
    setSubmittingReview(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idminiapp: app.id,
          rating: selectedRating,
          text: reviewText.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка при отправке отзыва");
      }

      const newReview = await response.json();
      setReviews((prev) => [newReview, ...prev]);
      
      // Обновляем данные приложения, чтобы получить новый рейтинг из БД
      // API автоматически обновляет рейтинг в БД при добавлении отзыва
      await refetch();
      
      closeReviewModal();
    } catch (err) {
      console.error("Ошибка отправки отзыва:", err);
      alert(err instanceof Error ? err.message : "Не удалось отправить отзыв");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen pb-10 font-sans antialiased bg-transparent pt-[calc(env(safe-area-inset-top,0px)+20px)]">
      <div className="mx-3 mt-4 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 pb-6 overflow-hidden">
        <div className="px-5 flex gap-5 mt-4">
          <div className="relative shrink-0">
            <AppIcon src={app.icon} alt={app.name} className="w-28 h-28 rounded-[22%] shadow-lg border border-white/40 dark:border-gray-600/40 object-cover" />
          </div>
          <div className="flex flex-col justify-between py-1">
            <div>
              <h1 className="text-[22px] font-bold leading-tight tracking-tight text-black dark:text-white">{app.name}</h1>
              <p className="text-gray-500 dark:text-gray-400 text-[15px] font-medium">{app.category.toUpperCase()}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePlus}
    aria-label={inMyApps ? "Убрать из моих приложений" : "Добавить в мои приложения"}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors active:scale-95 ${
                  inMyApps ? "bg-[#007AFF] text-white" : "bg-white/60 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 border border-white/40 dark:border-gray-600/40"
                }`}
              >
                {inMyApps ? (
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden>
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <Plus size={18} strokeWidth={2.5} />
                )}
              </button>
              <button 
                onClick={handleOpen}
                className="bg-[#007AFF] active:scale-95 transition-transform text-white px-8 py-1.5 rounded-full font-bold text-sm uppercase w-fit shadow-md"
              >
                Открыть
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-around border-t border-gray-200/80 dark:border-gray-600/80 mt-8 py-4 mx-5">
          <div className="text-center flex-1">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">Рейтинг</p>
            <p className="text-[20px] font-black text-gray-700 dark:text-gray-200 flex items-center gap-1 justify-center">
              {Number(app.rating).toFixed(1)} <Star size={16} className="fill-gray-700 dark:fill-gray-300 stroke-none" />
            </p>
          </div>
          <div className="w-[1px] bg-gray-200 dark:bg-gray-600 h-8 self-center"></div>
          <div className="text-center flex-1 px-2">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">Безопасность</p>
            <p className="text-[20px] font-black text-gray-700 dark:text-gray-200 flex justify-center">
              {app.isVerified ? <ShieldCheck className="text-green-500" /> : <ShieldCheck className="text-gray-400 dark:text-gray-500" />}
            </p>
          </div>
        </div>
      </div>

      {/* Блок скриншотов показываем только если в БД есть скриншоты (для ботов и записей без скринов не показываем) */}
      {app.screenshots && app.screenshots.length > 0 && (
        <div className="mt-3 mx-3 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 py-6 overflow-hidden">
          <h2 className="px-5 text-[20px] font-bold mb-4 tracking-tight text-black dark:text-white">Предпросмотр</h2>
          <div className="flex gap-4 overflow-x-auto px-5 no-scrollbar items-end">
            {app.screenshots.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => openScreenshot(i)}
                className="flex-shrink-0 rounded-xl overflow-hidden shadow-lg border border-white/40 dark:border-gray-600/40 bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2 dark:focus:ring-offset-gray-900 active:opacity-90"
              >
                <img src={src} alt={`Скриншот ${i + 1}`} className="max-h-[420px] w-auto object-contain block" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mx-3 mt-3 px-5 py-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/40 dark:border-gray-600/40">
        <h2 className="text-[20px] font-bold mb-3 tracking-tight text-black dark:text-white">Описание</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-[1.5] text-[16px] font-normal whitespace-pre-line">
          {app.description || "Описание пока не добавлено."}
        </p>
      </div>

      <div className="mx-3 mt-3 px-5 py-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/40 dark:border-gray-600/40">
        <h2 className="text-[20px] font-bold mb-4 tracking-tight text-black dark:text-white">Отзывы</h2>
        <div className="flex flex-wrap items-end gap-4 mb-5">
          <button
            type="button"
            onClick={openReviewModal}
            className="text-[15px] font-medium text-[#007AFF] pb-1 active:opacity-70"
          >
            Оценить
          </button>
          <p className="text-[32px] font-black text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
            {Number(app.rating).toFixed(1)} <Star size={28} className="fill-amber-400 text-amber-400 stroke-none" />
          </p>
        </div>
        {!mounted ? (
          <div className="pt-4 border-t border-gray-200/80 dark:border-gray-600/80">
            <p className="text-gray-500 dark:text-gray-400 text-[15px]">Загрузка отзывов...</p>
          </div>
        ) : (
          <div className="pt-4 border-t border-gray-200/80 dark:border-gray-600/80">
            {loadingReviews ? (
              <p className="text-gray-500 dark:text-gray-400 text-[15px]">Загрузка отзывов...</p>
            ) : reviews.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-[15px]">Пока нет отзывов. Будьте первым!</p>
            ) : (
              <>
                <div className="space-y-5">
                  {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review) => {
                    // Форматируем дату только на клиенте
                    let formattedDate = "";
                    try {
                      const reviewDate = new Date(review.createdAt);
                      formattedDate = reviewDate.toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      });
                    } catch {
                      formattedDate = review.createdAt;
                    }

                    return (
                      <div key={review.id} className="pb-4 last:pb-0 border-b border-gray-200/80 dark:border-gray-600/80 last:border-b-0">
                        <div className="flex flex-wrap items-baseline gap-2 mb-1">
                          <p className="font-semibold text-[17px] text-black dark:text-white">{review.username}</p>
                          <p className="text-[13px] text-gray-500 dark:text-gray-400">{formattedDate}</p>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              size={14}
                              className={i <= review.rating ? "fill-amber-400 text-amber-400 stroke-none" : "fill-gray-300 dark:fill-gray-600 text-gray-300 dark:text-gray-600 stroke-none"}
                            />
                          ))}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-[15px] leading-relaxed whitespace-pre-line">
                          {review.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
                {reviews.length > 3 && (
                  <button
                    type="button"
                    onClick={() => {
                      hapticFeedback("light");
                      setShowAllReviews(!showAllReviews);
                    }}
                    className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/40 dark:bg-gray-700/40 text-[#007AFF] font-semibold text-[15px] active:opacity-70 transition-colors border border-white/40 dark:border-gray-600/40"
                  >
                    {showAllReviews ? (
                      <>
                        <ChevronUp size={20} strokeWidth={2.5} />
                        <span>Скрыть</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown size={20} strokeWidth={2.5} />
                        <span>Показать все</span>
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {showReviewModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Оставить отзыв"
          onClick={closeReviewModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-[20px] font-bold text-black dark:text-white">Оставить отзыв</h3>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div>
                <p className="text-[15px] font-medium text-gray-700 dark:text-gray-300 mb-3">Оценка</p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        hapticFeedback("light");
                        setSelectedRating(star);
                      }}
                      className="focus:outline-none"
                      aria-label={`Оценить ${star} звезд`}
                    >
                      <Star
                        size={32}
                        className={`transition-colors ${
                          star <= selectedRating
                            ? "fill-amber-400 text-amber-400 stroke-none"
                            : "fill-gray-300 dark:fill-gray-600 text-gray-300 dark:text-gray-600 stroke-none"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="review-text" className="block text-[15px] font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ваш отзыв
                </label>
                <textarea
                  id="review-text"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Напишите ваш отзыв..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-[15px] text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#007AFF] resize-none"
                  rows={4}
                />
              </div>
            </div>
            <div className="px-6 py-4 flex gap-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={closeReviewModal}
                className="flex-1 py-3 rounded-xl font-semibold text-[15px] bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 active:opacity-70"
              >
                Отменить
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={selectedRating === 0 || submittingReview}
                className="flex-1 py-3 rounded-xl font-semibold text-[15px] bg-[#007AFF] text-white active:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingReview ? "Отправка..." : "Отправить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {app.screenshots && fullscreenScreenshotIndex !== null && app.screenshots[fullscreenScreenshotIndex] && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр скриншота"
          onClick={closeScreenshot}
        >
          <div className="flex items-center gap-2 pt-[calc(1rem+env(safe-area-inset-top,0px)+2.5rem)] px-4 pb-4 bg-black/50 border-b border-white/10 shrink-0">
            <button
              type="button"
              onClick={closeScreenshot}
              className="flex items-center gap-0 text-white font-normal text-[17px] py-2 pr-3 -ml-1"
            >
              <ChevronLeft size={28} strokeWidth={2} />
              <span className="-ml-1">Назад</span>
            </button>
            <span className="text-white/70 text-sm">
              {fullscreenScreenshotIndex + 1} / {app.screenshots.length}
            </span>
          </div>
          <div
            className="flex-1 flex items-center justify-center min-h-0 p-4 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={app.screenshots[fullscreenScreenshotIndex]}
              alt={`Скриншот ${fullscreenScreenshotIndex + 1}`}
              className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}