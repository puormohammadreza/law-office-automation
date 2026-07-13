import React from "react";
import { LegalEvent } from "../types";
import { toPersianDigits, isEventExpired } from "../utils/shamsi";
import { Archive, ArrowRight, Trash2, Edit, CheckCircle } from "lucide-react";

interface PastEventsArchiveProps {
  events: LegalEvent[];
  onBack: () => void;
  onEdit: (event: LegalEvent) => void;
  onDelete: (id: string) => void;
}

export default function PastEventsArchive({ events, onBack, onEdit, onDelete }: PastEventsArchiveProps) {
  // Get only expired events
  const pastEvents = events
    .filter(ev => ev.isArchived || isEventExpired(ev.jalaliDate, ev.time, 5, ev.endRepeatDate))
    .sort((a, b) => b.jalaliDate.localeCompare(a.jalaliDate) || b.time.localeCompare(a.time));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-200 bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <ArrowRight className="w-5 h-5 text-slate-700" />
          </button>
          <div className="p-2.5 bg-slate-100 rounded-xl text-slate-700">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">بایگانی رویدادهای گذشته</h1>
            <p className="text-xs text-slate-500 font-bold mt-1">مشاهده، ویرایش و مدیریت اطلاعات رویدادهای منقضی شده</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm min-h-[60vh]">
        {pastEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <CheckCircle className="w-16 h-16 opacity-30 mb-4" />
            <p className="text-sm font-bold">هیچ رویداد گذشته‌ای یافت نشد.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pastEvents.map(ev => {
              const dev = ev as any;
              return (
                <div key={ev.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${ev.type === "جلسه دادرسی" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {ev.type}
                       </span>
                       <h3 className="font-black text-slate-800 text-sm">{ev.title}</h3>
                    </div>
                    <div className="text-xs font-semibold text-slate-500 flex flex-wrap gap-x-4 gap-y-2">
                      <span>تاریخ: {toPersianDigits(ev.jalaliDate)}</span>
                      <span>ساعت: {toPersianDigits(ev.time)}</span>
                      {ev.caseTitle && <span>پرونده: {ev.caseTitle}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                       onClick={() => onEdit(ev)}
                       className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                       title="ویرایش"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                       onClick={() => onDelete(ev.id)}
                       className="p-2 bg-red-50 border border-red-100 text-red-600 rounded-xl hover:bg-red-100 transition cursor-pointer"
                       title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
