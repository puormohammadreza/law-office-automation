import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  Download, 
  Search, 
  ArrowRight,
  FileText,
  ExternalLink,
  ChevronLeft,
  Clock
} from "lucide-react";
import { toPersianDigits } from "../utils/shamsi";
import { doc, increment, updateDoc, getDoc, setDoc, getDocs, collection } from "firebase/firestore";
import { db, auth } from "../firebase/config";

interface Precedent {
  id: string;
  title: string;
  number: string;
  date: string;
  category: string;
  downloadUrl: string;
}

const PRECEDENTS_DATA: Precedent[] = [
  {
    id: "1",
    title: "رأی وحدت رویه شماره ۸۳۵ هیأت عمومی دیوان عالی کشور در خصوص مسئولیت تضامنی در اسناد تجاری",
    number: "۸۳۵",
    date: "۱۴۰۲/۰۶/۲۱",
    category: "حقوقی",
    downloadUrl: "https://www.rrk.ir/Laws/ShowLaw.aspx?Code=28350"
  },
  {
    id: "2",
    title: "رأی وحدت رویه شماره ۸۳۴ هیأت عمومی دیوان عالی کشور در مورد صلاحیت دادگاه در رسیدگی به جرم کلاهبرداری رایانه ای",
    number: "۸۳۴",
    date: "۱۴۰۲/۰۵/۱۷",
    category: "کیفری",
    downloadUrl: "https://www.rrk.ir/Laws/ShowLaw.aspx?Code=28340"
  },
  {
    id: "3",
    title: "رأی وحدت رویه شماره ۸۳۳ هیأت عمومی دیوان عالی کشور در خصوص مبدأ محاسبه خسارت تأخیر تأدیه",
    number: "۸۳۳",
    date: "۱۴۰۲/۰۴/۱۳",
    category: "حقوقی",
    downloadUrl: "https://www.rrk.ir/Laws/ShowLaw.aspx?Code=28330"
  },
  {
    id: "4",
    title: "رأی وحدت رویه شماره ۸۳۲ هیأت عمومی دیوان عالی کشور با موضوع قابلیت فرجام خواهی آراء صادره از دادگاه تجدیدنظر در مورد ورشکستگی",
    number: "۸۳۲",
    date: "۱۴۰۲/۰۳/۱۶",
    category: "تجاری",
    downloadUrl: "https://www.rrk.ir/Laws/ShowLaw.aspx?Code=28320"
  },
  {
    id: "5",
    title: "رأی وحدت رویه شماره ۸۳۱ هیأت عمومی دیوان عالی کشور در خصوص نحوه محاسبه نیم عشر اجرایی",
    number: "۸۳۱",
    date: "۱۴۰۲/۰۲/۱۹",
    category: "اجرای احکام",
    downloadUrl: "https://www.rrk.ir/Laws/ShowLaw.aspx?Code=28310"
  },
  {
    id: "6",
    title: "رأی وحدت رویه شماره ۸۳۰ هیأت عمومی دیوان عالی کشور در مورد مرور زمان در جرم انتقال مال غیر",
    number: "۸۳۰",
    date: "۱۴۰۲/۰۱/۲۲",
    category: "کیفری",
    downloadUrl: "https://www.rrk.ir/Laws/ShowLaw.aspx?Code=28300"
  },
  {
    id: "7",
    title: "رأی وحدت رویه شماره ۸۲۹ هیأت عمومی دیوان عالی کشور در خصوص مرجع صالح رسیدگی به اعتراض به آرای هیأت حل اختلاف قانون تعیین تکلیف وضعیت ثبتی",
    number: "۸۲۹",
    date: "۱۴۰۱/۱۲/۰۹",
    category: "ثبتی",
    downloadUrl: "https://www.rrk.ir/Laws/ShowLaw.aspx?Code=28290"
  },
  {
    id: "8",
    title: "رأی وحدت رویه شماره ۸۲۸ هیأت عمومی دیوان عالی کشور در خصوص امکان صدور حکم اعسار از پرداخت هزینه دادرسی برای اشخاص حقوقی",
    number: "۸۲۸",
    date: "۱۴۰۱/۱۱/۰۴",
    category: "حقوقی",
    downloadUrl: "https://www.rrk.ir/Laws/ShowLaw.aspx?Code=28280"
  }
];

interface JudicialPrecedentsProps {
  onBack: () => void;
}

// Define error handler types and function
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function JudicialPrecedents({ onBack }: JudicialPrecedentsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("همه");
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "precedents"));
        const newCounts: Record<string, number> = {};
        snapshot.forEach(doc => {
          newCounts[doc.id] = doc.data().downloadCount || 0;
        });
        setCounts(newCounts);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, "precedents");
      }
    };
    fetchCounts();
  }, []);

  const categories = ["همه", ...new Set(PRECEDENTS_DATA.map(p => p.category))];

  const filteredPrecedents = PRECEDENTS_DATA.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.number.includes(searchQuery);
    const matchesCategory = selectedCategory === "همه" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDownload = async (precedent: Precedent) => {
    // Increment in Firestore
    const docRef = doc(db, "precedents", precedent.id);
    try {
       await updateDoc(docRef, { downloadCount: increment(1) });
       setCounts(prev => ({ ...prev, [precedent.id]: (prev[precedent.id] || 0) + 1 }));
    } catch (e) {
      try {
        await setDoc(docRef, { downloadCount: 1 }, { merge: true });
        setCounts(prev => ({ ...prev, [precedent.id]: 1 }));
      } catch (error) {
        console.error('Failed to update download count:', error);
        // Do not throw here, allow download to proceed anyway
      }
    }

    // Trigger download
    try {
      const response = await fetch(precedent.downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${precedent.title}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      // Fallback
      window.open(precedent.downloadUrl, "_blank");
    }
  };

  const clearSearch = () => setSearchQuery("");

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-in fade-in duration-300">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-black text-slate-800">مجموعه آرا وحدت رویه</h1>
            <p className="text-[10px] text-slate-500 font-bold">بانک اطلاعاتی هیأت عمومی دیوان عالی کشور</p>
          </div>
        </div>
        <div className="bg-amber-100 p-2 rounded-xl">
          <BookOpen className="w-5 h-5 text-amber-600" />
        </div>
      </header>

      {/* Filters & Search */}
      <div className="p-4 space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="جستجو در آرا (نام یا شماره رای)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pr-10 pl-10 py-3 text-xs font-bold text-slate-700 outline-none focus:border-amber-500 shadow-sm transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button 
              onClick={clearSearch}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 hover:text-amber-600"
            >
              پاکسازی
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black whitespace-nowrap transition-all border ${
                selectedCategory === cat 
                  ? "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20" 
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Precedents List */}
      <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-3">
        {filteredPrecedents.length > 0 ? (
          filteredPrecedents.map(precedent => (
            <div 
              key={precedent.id}
              className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black rounded-lg border border-slate-200">
                      شماره {toPersianDigits(precedent.number)}
                    </span>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-black rounded-lg border border-amber-100">
                      {precedent.category}
                    </span>
                  </div>
                  <h3 className="text-xs font-black text-slate-800 leading-relaxed group-hover:text-amber-700 transition-colors">
                    {precedent.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                    <Clock className="w-3 h-3" />
                    تاریخ صدور: {toPersianDigits(precedent.date)}
                  </div>
                </div>
                
                <button
                  onClick={() => handleDownload(precedent)}
                  className="w-auto h-10 px-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-amber-500 hover:text-white hover:border-amber-600 transition-all shrink-0 shadow-xs gap-2"
                  title="دانلود و مشاهده متن کامل"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-[10px] font-black">{toPersianDigits(counts[precedent.id] || 0)}</span>
                </button>
              </div>
              
              <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                <div className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  فرمت فایل: PDF / متن
                </div>
                <a 
                  href={precedent.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-black text-amber-600 flex items-center gap-1 hover:underline"
                >
                  مشاهده در روزنامه رسمی
                  <ChevronLeft className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Search className="w-8 h-8" />
            </div>
            <p className="text-xs font-bold text-slate-400">موردی یافت نشد!</p>
          </div>
        )}
      </div>

      {/* Floating Info */}
      <div className="fixed bottom-6 left-6 right-6 z-10 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-sm text-white px-5 py-3 rounded-2xl border border-slate-800 shadow-xl max-w-xs mx-auto text-center">
          <p className="text-[10px] font-black leading-relaxed">
             آرا به صورت مستقیم از سرورهای روزنامه رسمی کشور دریافت می‌شوند.
          </p>
        </div>
      </div>
    </div>
  );
}
