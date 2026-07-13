import React from "react";
import { ArrowRight, Clock, Info, BookOpen, AlertTriangle } from "lucide-react";
import { toPersianDigits, adjustDateForHolidays } from "../utils/shamsi";

interface DeadlineResultPageProps {
  deadlineResult: any;
  deadlineType: string;
  deadlineBaseYear: string;
  deadlineBaseMonth: string;
  deadlineBaseDay: string;
  judicialResult: any;
  judicialDaysInput: string;
  currentDeadlineOptions: any[];
  onBack: () => void;
}

export default function DeadlineResultPage({
  deadlineResult,
  deadlineType,
  deadlineBaseYear,
  deadlineBaseMonth,
  deadlineBaseDay,
  judicialResult,
  judicialDaysInput,
  currentDeadlineOptions,
  onBack
}: DeadlineResultPageProps) {
  if (!deadlineResult) return null;

  const holidayAdjustment = adjustDateForHolidays(deadlineResult.dueDate);
  const judicialAdjustment = judicialResult ? adjustDateForHolidays(judicialResult.dueDate) : null;
  const originDate = toPersianDigits(`${deadlineBaseYear}/${deadlineBaseMonth.toString().padStart(2, "0")}/${deadlineBaseDay.toString().padStart(2, "0")}`);
  const hasNoLimit = deadlineType.includes("اعتراض ثالث اصلی") || deadlineType.includes("اعتراض ثالث تبعی");
  const deadlineOption = currentDeadlineOptions.find(opt => opt.title === deadlineType);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
            <Clock className="w-6 h-6 font-bold" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800">جزئیات محاسبه موعد قانونی</h2>
            <p className="text-[10px] text-slate-400 mt-0.5 font-bold">{deadlineType}</p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-850 text-amber-400 rounded-2xl text-xs font-black transition-all cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>برگشت به محاسبه</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Judicial Deadline Box */}
        {judicialResult && judicialDaysInput && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl shadow-sm overflow-hidden flex flex-col md:max-w-md">
            <div className="bg-amber-600 text-white px-5 py-4 text-xs font-black flex items-center gap-2">
              <Clock className="w-4 h-4" />
              مهلت قضایی سفارشی
            </div>
            <div className="p-6 flex-1 space-y-4">
              <div className="flex justify-between text-xs font-bold text-amber-800">
                <span>مدت وارد شده:</span>
                <span className="text-amber-950 font-black">{toPersianDigits(judicialResult.baseDaysCount)} روز</span>
              </div>
              <div className="pt-4 border-t border-amber-200/50">
                <div className="text-[10px] font-black text-amber-700/60 mb-2">آخرین مهلت اقدام قضایی:</div>
                <div className="text-lg font-black text-red-600 font-mono text-left">
                  {judicialAdjustment && judicialAdjustment.explanation ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 justify-start">
                        <span className="text-sm text-amber-600/65 line-through font-mono">
                          {toPersianDigits(judicialResult.dueDate)}
                        </span>
                        <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-lg font-black border border-red-200">تعطیل</span>
                      </div>
                      <div className="text-xl font-black text-red-600 font-mono">
                        {judicialAdjustment.adjustedDate}
                      </div>
                    </div>
                  ) : (
                    toPersianDigits(judicialResult.dueDate)
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Process Flow */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="bg-slate-100 text-slate-800 px-5 py-4 text-sm font-black text-center border-b border-slate-200">
          روند و منطق محاسبه (مستند به ماده ۴۴۵ و ۴۴۴ ق.آ.د.م)
        </div>
        <div className="p-6 space-y-4 text-sm text-slate-700 leading-relaxed font-medium">
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
            <p>تاریخ مبدأ ابلاغ: <span className="font-black text-slate-900">{originDate}</span></p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
            <p>روز ابلاغ (مبدأ) بر اساس قانون در شمارش مهلت لحاظ نگردید.</p>
          </div>
          
          {!hasNoLimit && (
            <>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
                <p>
                  مهلت {toPersianDigits(judicialDaysInput ? judicialResult.baseDaysCount : deadlineResult.baseDaysCount)} روزه از {toPersianDigits(judicialDaysInput ? judicialResult.startDate : deadlineResult.startDate)} آغاز گردید.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
                <p>
                  پس از اتمام {toPersianDigits(judicialDaysInput ? judicialResult.baseDaysCount : deadlineResult.baseDaysCount)} روز شمارش مادی، تاریخ {toPersianDigits(judicialDaysInput ? judicialResult.endDate : deadlineResult.endDate)} بدست آمد.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
                <p>
                  روز {toPersianDigits(judicialDaysInput ? judicialResult.endDate : deadlineResult.endDate)} به عنوان روز اقدام در نظر گرفته شد و جزء مدت محسوب نگردید.
                </p>
              </div>

              {!holidayAdjustment.explanation ? (
                <div className="bg-red-50 border border-red-100 p-5 rounded-2xl flex gap-3 items-start animate-pulse">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-red-900 font-black">
                    روز بعد یعنی <span className="text-xl font-mono mx-1">{toPersianDigits(judicialDaysInput ? judicialResult.dueDate : deadlineResult.dueDate)}</span> به عنوان پایان قطعی مهلت در نظر گرفته شد.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
                    <p>
                      روز بعد یعنی {toPersianDigits(deadlineResult.dueDate)} به عنوان پایان مهلت مادی بود اما به دلیل تعطیلی رسمی این روز، مهلت انتقال یافت.
                    </p>
                  </div>
                  <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex gap-3 items-start shadow-sm">
                    <Info className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-red-900 font-black">
                        به دلیل تعطیلی روز پایان مهلت، بر اساس ماده ۴۴۴ ق.آ.د.م، مهلت به اولین روز کاری بعد یعنی <span className="text-xl font-mono mx-1">{toPersianDigits(holidayAdjustment.adjustedDate)}</span> منتقل گردید.
                      </p>
                      <p className="text-[10px] text-red-700 font-bold opacity-80 leading-relaxed">
                        {holidayAdjustment.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Legal References */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="bg-slate-100 text-slate-800 px-5 py-4 text-sm font-black text-center border-b border-slate-200">
          مستندات قانونی و متون استنادی
        </div>
        <div className="p-6 space-y-6 text-sm text-slate-700 leading-relaxed font-medium">
          {deadlineOption?.article && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-black">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <h4>{deadlineOption.article}:</h4>
              </div>
              {deadlineOption.lawText && (
                <div className="bg-slate-50 p-4 rounded-2xl border-r-4 border-amber-500 italic text-slate-600 text-xs">
                  {deadlineOption.lawText}
                </div>
              )}
            </div>
          )}

          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-black">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <h4>ماده ۴۴۵ قانون آیین دادرسی مدنی:</h4>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border-r-4 border-slate-300 text-slate-600 text-xs">
              موعدی که ابتدای آن تاریخ ابلاغ یا اعلام ذکر شده است، روز ابلاغ و اعلام و همچنین روز اقدام جزء مدت محسوب نمی‌شود.
            </div>
          </div>
          
          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl text-[10px] text-blue-800 font-bold leading-relaxed">
            تذکر: این محاسبات صرفاً جهت راهنمایی بوده و وکیل محترم باید بر اساس تجارب قضایی و رویه جاری شعبه رسیدگی‌کننده، زمان نهایی اقدام را تنظیم نماید.
          </div>
        </div>
      </div>
    </div>
  );
}
