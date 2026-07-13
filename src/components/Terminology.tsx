import React, { useState, useEffect } from "react";
import { 
  Search, 
  BookOpen, 
  Sparkles, 
  Bookmark, 
  Copy, 
  ChevronLeft, 
  X, 
  Volume2,
  Scale,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LegalDocument {
  title: string;
  fullText: string;
}

interface GlobalResult {
  word: string;
  definition: string;
  legalArticle?: string | null;
  isCompoundable?: string | null;
  isFinancial?: string | null;
  judicialPrecedents?: LegalDocument[] | null;
  advisoryOpinions?: LegalDocument[] | null;
  persistentRulings?: LegalDocument[] | null;
  source: string;
  pronunciation?: string;
  examples?: string[];
}

export default function Terminology() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Global search states
  const [globalResults, setGlobalResults] = useState<GlobalResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [lastSearchedTerm, setLastSearchedTerm] = useState("");

  // Bookmarks and Recent states
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("r_dict_recent");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [bookmarks, setBookmarks] = useState<GlobalResult[]>(() => {
    try {
      const saved = localStorage.getItem("r_dict_bookmarks");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Selected result for modal
  const [selectedResult, setSelectedResult] = useState<GlobalResult | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<{ title: string; fullText: string; type: string } | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("r_dict_recent", JSON.stringify(recentSearches));
  }, [recentSearches]);

  useEffect(() => {
    localStorage.setItem("r_dict_bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Handle Search Submission
  const handleGlobalSearch = async (termToSearch: string) => {
    const cleanTerm = termToSearch.trim();
    if (!cleanTerm) return;

    setSearching(true);
    setGlobalError("");
    setLastSearchedTerm(cleanTerm);

    // Save to recents
    setRecentSearches(prev => {
      const filtered = prev.filter(t => t !== cleanTerm);
      return [cleanTerm, ...filtered].slice(0, 10);
    });

    try {
      const res = await fetch(`/api/dictionary/search?q=${encodeURIComponent(cleanTerm)}`);
      if (!res.ok) {
        throw new Error("خطا در برقراری ارتباط با واژه‌نامه.");
      }
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        setGlobalResults(data.results);
      } else {
        setGlobalResults([]);
        setGlobalError("نتیجه‌ای برای این واژه یافت نشد. می‌توانید با واژه دیگری امتحان کنید.");
      }
    } catch (err: any) {
      console.error(err);
      setGlobalError(err.message || "خطا در برقراری ارتباط با سرور.");
    } finally {
      setSearching(false);
    }
  };

  // Toggle Bookmark
  const toggleBookmark = (result: GlobalResult) => {
    setBookmarks(prev => {
      const exists = prev.some(b => b.word === result.word && b.source === result.source);
      if (exists) {
        return prev.filter(b => !(b.word === result.word && b.source === result.source));
      } else {
        return [...prev, result];
      }
    });
  };

  const isBookmarked = (result: GlobalResult) => {
    return bookmarks.some(b => b.word === result.word && b.source === result.source);
  };

  // Copy word definition to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };

  // Pronounce word (using speech synthesis for Farsi)
  const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'fa-IR';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="p-6 bg-slate-900 text-white rounded-3xl relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl -ml-16 -mb-16" />
        
        <div className="relative z-10 flex flex-col items-center justify-center text-center gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/30">
              <Sparkles className="w-3 h-3" />
              متصل به فرهنگ دهخدا، معین و عمید
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">فرهنگ لغت و ترمینولوژی حقوقی</h1>
            <p className="text-slate-400 text-sm max-w-xl">
              جستجوی آنلاین کلمات در فرهنگ‌های معتبر زبان فارسی به همراه ترمینولوژی تخصصی حقوقی.
            </p>
          </div>
          <BookOpen className="w-16 h-16 text-amber-500/20 self-end md:self-center hidden sm:block" />
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Right Column: Search & Results */}
        <div className="lg:col-span-2 space-y-5">
          {/* Search Input */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleGlobalSearch(searchTerm);
            }}
            className="relative flex gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="واژه مورد نظر خود را بنویسید (مثال: حق، عدالت، بیع...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition shadow-sm text-slate-800"
              />
              <Search className="absolute right-4 top-4 w-5 h-5 text-slate-400" />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-6 bg-slate-950 text-white font-bold rounded-2xl hover:bg-slate-850 active:scale-98 transition disabled:opacity-50 flex items-center justify-center cursor-pointer min-w-[100px]"
            >
              {searching ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "جستجو"
              )}
            </button>
          </form>

          {/* Results Section */}
          <div className="space-y-4">
            {searching ? (
              // Loading Skeleton
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="p-5 bg-white rounded-2xl border border-slate-100 space-y-3 animate-pulse">
                    <div className="flex justify-between">
                      <div className="h-6 w-32 bg-slate-200 rounded-md" />
                      <div className="h-5 w-20 bg-slate-200 rounded-md" />
                    </div>
                    <div className="h-4 w-full bg-slate-100 rounded-md" />
                    <div className="h-4 w-3/4 bg-slate-100 rounded-md" />
                  </div>
                ))}
              </div>
            ) : globalError ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/60 shadow-sm space-y-3">
                <p className="text-slate-600 font-medium">{globalError}</p>
                <button 
                  onClick={() => handleGlobalSearch(lastSearchedTerm)}
                  className="px-4 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition cursor-pointer"
                >
                  تلاش مجدد
                </button>
              </div>
            ) : globalResults.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-slate-400">
                    نتایج جستجو برای واژه <span className="text-slate-800 font-bold">«{lastSearchedTerm}»</span>
                  </span>
                  <span className="text-xs bg-amber-500/10 text-amber-600 px-2.5 py-1 rounded-full font-bold">
                    {globalResults.length} نتیجه یافت شد
                  </span>
                </div>

                <div className="space-y-3">
                  {globalResults.map((result, idx) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={result.word + result.source + idx}
                      className="p-5 bg-white rounded-2xl border border-slate-100 hover:border-slate-300 transition shadow-sm space-y-3 relative group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-black text-slate-900">{result.word}</h3>
                          {result.pronunciation && (
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                              {result.pronunciation}
                            </span>
                          )}
                          <button
                            onClick={() => speakWord(result.word)}
                            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition"
                            title="شنیدن تلفظ"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold bg-amber-500/15 text-amber-700 px-2.5 py-1 rounded-lg">
                            {result.source}
                          </span>
                          <button
                            onClick={() => toggleBookmark(result)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              isBookmarked(result)
                                ? "bg-amber-500 text-white border-amber-500"
                                : "bg-slate-50 text-slate-400 hover:text-slate-600 border-slate-200"
                            }`}
                          >
                            <Bookmark className="w-3.5 h-3.5 fill-current" />
                          </button>
                        </div>
                      </div>

                      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line line-clamp-3">
                        {result.definition}
                      </p>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-100/60">
                        <button
                          onClick={() => setSelectedResult(result)}
                          className="text-xs font-bold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1 cursor-pointer"
                        >
                          مشاهده تعریف کامل
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => copyToClipboard(`${result.word}: ${result.definition}`)}
                            className="p-1.5 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            title="کپی متن"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
                <Search className="w-12 h-12 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <p className="text-slate-700 font-bold text-base">آماده جستجو</p>
                  <p className="text-slate-400 text-xs">واژه دلخواه خود را در کادر بالا بنویسید و دکمه جستجو را بزنید.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Left Column: Bookmarks */}
        <div className="space-y-6">
          {/* Bookmarks */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-3">
              <Bookmark className="w-4 h-4 text-amber-500 fill-amber-500/10" />
              <h3 className="text-sm">نشان‌شده‌ها ({bookmarks.length})</h3>
            </div>

            {bookmarks.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {bookmarks.map((b, idx) => (
                  <div 
                    key={b.word + b.source + idx} 
                    className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100/80 transition flex items-center justify-between border border-slate-100"
                  >
                    <button
                      onClick={() => setSelectedResult(b)}
                      className="text-right flex-1"
                    >
                      <p className="text-xs font-bold text-slate-800">{b.word}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{b.source}</p>
                    </button>
                    <button
                      onClick={() => toggleBookmark(b)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-md"
                      title="حذف نشان"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">کلمه‌ای را نشان نکرده‌اید.</p>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence mode="wait">
        {selectedDoc && (
          <div key="selected-doc-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div
              key="selected-doc-modal"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col"
            >
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full uppercase tracking-widest mb-1 inline-block">
                    {selectedDoc.type}
                  </span>
                  <h2 className="text-xl font-black">{selectedDoc.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-2 hover:bg-white/10 rounded-xl transition text-slate-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 overflow-y-auto bg-white text-slate-800">
                <div className="whitespace-pre-wrap text-lg leading-loose text-justify font-sans">
                  {selectedDoc.fullText}
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition shadow-lg shadow-slate-200"
                >
                  بازگشت
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {selectedResult && (
          <div key="selected-result-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              key="selected-result-modal"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200"
            >
              {/* Modal Header */}
              <div className="p-6 bg-slate-900 text-white relative">
                <button
                  onClick={() => setSelectedResult(null)}
                  className="absolute left-6 top-6 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="space-y-1.5 pr-8">
                  <span className="text-[11px] font-bold bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full">
                    {selectedResult.source}
                  </span>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black">{selectedResult.word}</h2>
                    {selectedResult.pronunciation && (
                      <span className="text-xs text-slate-300 bg-white/10 px-2 py-0.5 rounded-md font-mono">
                        {selectedResult.pronunciation}
                      </span>
                    )}
                    <button
                      onClick={() => speakWord(selectedResult.word)}
                      className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto text-slate-800">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">تعریف و معنی</h3>
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line font-sans">
                    {selectedResult.definition}
                  </p>
                </div>
                {selectedResult.legalArticle && (
                  <div key="modal-article" className="space-y-3 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider">ماده قانونی مربوطه</h3>
                    <p className="text-slate-800 text-sm font-bold bg-amber-50 p-3 rounded-xl border border-amber-100">
                      {selectedResult.legalArticle}
                    </p>
                  </div>
                )}
                {selectedResult.isCompoundable && (
                  <div key="modal-compound" className="space-y-3 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">وضعیت قابل گذشت بودن</h3>
                    <p className="text-slate-800 text-sm font-bold bg-slate-100 p-3 rounded-xl border border-slate-200">
                      {selectedResult.isCompoundable}
                    </p>
                  </div>
                )}
                {selectedResult.isFinancial && (
                  <div key="modal-financial" className="space-y-3 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">نوع دعوی (مالی / غیرمالی)</h3>
                    <p className="text-slate-800 text-sm font-bold bg-slate-100 p-3 rounded-xl border border-slate-200">
                      {selectedResult.isFinancial}
                    </p>
                  </div>
                )}

                {/* Legal Precedents and Opinions as interactive lists */}
                {selectedResult.judicialPrecedents && Array.isArray(selectedResult.judicialPrecedents) && selectedResult.judicialPrecedents.length > 0 && (
                  <div key="modal-precedents" className="space-y-3 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Scale className="w-4 h-4" /> آرای وحدت رویه مرتبط
                    </h3>
                    <div className="space-y-2">
                      {selectedResult.judicialPrecedents.map((doc, i) => (
                        <button
                          key={`precedent-${i}`}
                          onClick={() => setSelectedDoc({ ...doc, type: "رای وحدت رویه" })}
                          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-xl transition group text-right"
                        >
                          <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700">{doc.title}</span>
                          <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-[-2px] transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedResult.advisoryOpinions && Array.isArray(selectedResult.advisoryOpinions) && selectedResult.advisoryOpinions.length > 0 && (
                  <div key="modal-advisory" className="space-y-3 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4" /> نظریات مشورتی حقوقی
                    </h3>
                    <div className="space-y-2">
                      {selectedResult.advisoryOpinions.map((doc, i) => (
                        <button
                          key={`advisory-${i}`}
                          onClick={() => setSelectedDoc({ ...doc, type: "نظریه مشورتی" })}
                          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-xl transition group text-right"
                        >
                          <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700">{doc.title}</span>
                          <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-[-2px] transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedResult.persistentRulings && Array.isArray(selectedResult.persistentRulings) && selectedResult.persistentRulings.length > 0 && (
                  <div key="modal-persistent" className="space-y-3 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Scale className="w-4 h-4" /> آرای اصراری مرتبط
                    </h3>
                    <div className="space-y-2">
                      {selectedResult.persistentRulings.map((doc, i) => (
                        <button
                          key={`persistent-${i}`}
                          onClick={() => setSelectedDoc({ ...doc, type: "رای اصراری" })}
                          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-xl transition group text-right"
                        >
                          <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700">{doc.title}</span>
                          <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-[-2px] transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedResult.examples && selectedResult.examples.length > 0 && (
                  <div key="modal-examples" className="space-y-3 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">شواهد و مثال‌ها</h3>
                    <div className="space-y-2">
                      {selectedResult.examples.map((ex, i) => (
                        <p key={`example-${i}`} className="text-slate-600 text-sm italic pr-3 border-r-2 border-amber-500/30">
                          {ex}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-between items-center">
                <button
                  onClick={() => toggleBookmark(selectedResult)}
                  className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                    isBookmarked(selectedResult)
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  <Bookmark className="w-4 h-4 fill-current" />
                  {isBookmarked(selectedResult) ? "نشان‌شده" : "نشان کردن کلمه"}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(`${selectedResult.word}: ${selectedResult.definition}`)}
                    className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition cursor-pointer"
                    title="کپی"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedResult(null)}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    بستن
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Copy Toast */}
      <AnimatePresence>
        {showCopyToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-xl z-50 border border-slate-800"
          >
            متن با موفقیت در حافظه کپی شد.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
