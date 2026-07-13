import React, { useState, useMemo } from "react";
import { Search, Scale, ChevronRight, BookOpen, Copy, Check, Bookmark, BookmarkCheck, Upload, Trash2, HelpCircle, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { 
  LAWS_DATA, 
  CATEGORIES, 
  ARA_VAHDAT_DATA, 
  ARA_VAHDAT_CATEGORIES, 
  NAZARIAT_DATA, 
  LawData, 
  Chapter 
} from "../data/lawsData";

interface LawsDatabaseProps {
  mode?: "laws" | "ara-vahdat" | "nazariat";
}

export default function LawsDatabase({ mode = "laws" }: LawsDatabaseProps) {
  const categoriesList = useMemo(() => {
    if (mode === "ara-vahdat" || mode === "nazariat") return ARA_VAHDAT_CATEGORIES;
    return CATEGORIES;
  }, [mode]);

  const lawsDataSet = useMemo(() => {
    if (mode === "ara-vahdat") return ARA_VAHDAT_DATA;
    if (mode === "nazariat") return NAZARIAT_DATA;
    return LAWS_DATA;
  }, [mode]);

  const [activeCategory, setActiveCategory] = useState<any>("civil");
  const [selectedLaw, setSelectedLaw] = useState<LawData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChapterIndex, setActiveChapterIndex] = useState<number | null>(null);
  const [copiedArticleId, setCopiedArticleId] = useState<string | null>(null);
  const [bookmarkedArticles, setBookmarkedArticles] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("law_bookmarks");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // State for Custom Laws Database
  const [customLaws, setCustomLaws] = useState<Record<string, LawData[]>>(() => {
    try {
      const saved = localStorage.getItem("custom_laws_db");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showImportGuide, setShowImportGuide] = useState(false);
  const [parsingPdf, setParsingPdf] = useState(false);

  const processFile = (file: File) => {
    setUploadError("");
    setUploadSuccess(false);
    
    const isJson = file.type === "application/json" || file.name.endsWith(".json");
    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");

    if (!isJson && !isPdf) {
      setUploadError("لطفاً یک فایل معتبر با پسوند .json یا .pdf انتخاب کنید.");
      return;
    }

    if (isPdf) {
      setParsingPdf(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const dataUrl = event.target?.result as string;
          const base64Data = dataUrl.split(",")[1];

          const res = await fetch("/api/laws/parse-pdf", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              base64: base64Data,
              fileName: file.name
            })
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "خطا در برقراری ارتباط با سرویس پارسر هوشمند.");
          }

          const responseData = await res.json();
          if (!responseData.success || !responseData.data) {
            throw new Error("پاسخ معتبری از پارسر هوشمند دریافت نشد.");
          }

          const item = responseData.data;
          
          // Validate structure
          if (!item.title || !item.chapters || !Array.isArray(item.chapters)) {
            throw new Error("ساختار خروجی پارسر معتبر نیست. قانون باید دارای عنوان و فصول باشد.");
          }

          const chapters: Chapter[] = item.chapters.map((chap: any, idx: number) => {
            if (!chap.title || !chap.articles || !Array.isArray(chap.articles)) {
              throw new Error(`ساختار فصل شماره ${idx + 1} کامل نیست.`);
            }
            return {
              title: chap.title,
              articles: chap.articles.map((art: any, artIdx: number) => {
                if (!art.text || art.number === undefined) {
                  throw new Error(`ساختار ماده در فصل ${chap.title} کامل نیست.`);
                }
                return {
                  number: Number(art.number),
                  text: String(art.text),
                  notes: art.notes ? String(art.notes) : undefined
                };
              })
            };
          });

          const validatedLaw: LawData = {
            id: item.id || `custom-pdf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: String(item.title),
            description: item.description ? String(item.description) : `مجموعه قوانین استخراج شده از فایل ${file.name}`,
            chapters
          };

          setCustomLaws(prev => {
            const categoryKey = activeCategory as string;
            const updatedCategoryLaws = [...(prev[categoryKey] || []), validatedLaw];
            const updated = {
              ...prev,
              [categoryKey]: updatedCategoryLaws
            };
            localStorage.setItem("custom_laws_db", JSON.stringify(updated));
            return updated;
          });

          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 4000);
        } catch (err: any) {
          setUploadError(err.message || "خطا در تحلیل فایل PDF قوانین توسط هوش مصنوعی.");
        } finally {
          setParsingPdf(false);
        }
      };
      reader.onerror = () => {
        setUploadError("خطا در خواندن فایل پی‌دی‌اف.");
        setParsingPdf(false);
      };
      reader.readAsDataURL(file);
      return;
    }

    // JSON flow
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const list = Array.isArray(json) ? json : [json];
        const validatedList: LawData[] = [];
        
        for (const item of list) {
          if (!item.title || !item.chapters || !Array.isArray(item.chapters)) {
            throw new Error("ساختار فایل معتبر نیست. هر قانون باید حداقل دارای عنوان (title) و فصول (chapters) باشد.");
          }
          
          const chapters: Chapter[] = item.chapters.map((chap: any, idx: number) => {
            if (!chap.title || !chap.articles || !Array.isArray(chap.articles)) {
              throw new Error(`فصل شماره ${idx + 1} معتبر نیست.`);
            }
            return {
              title: chap.title,
              articles: chap.articles.map((art: any, artIdx: number) => {
                if (!art.text || art.number === undefined) {
                  throw new Error(`ماده در فصل ${chap.title} معتبر نیست.`);
                }
                return {
                  number: Number(art.number),
                  text: String(art.text),
                  notes: art.notes ? String(art.notes) : undefined
                };
              })
            };
          });

          validatedList.push({
            id: item.id ? `custom-${item.id}-${Date.now()}` : `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: String(item.title),
            description: item.description ? String(item.description) : "مجموعه قوانین بارگذاری شده توسط کاربر",
            chapters
          });
        }

        setCustomLaws(prev => {
          const categoryKey = activeCategory as string;
          const updatedCategoryLaws = [...(prev[categoryKey] || []), ...validatedList];
          const updated = {
            ...prev,
            [categoryKey]: updatedCategoryLaws
          };
          localStorage.setItem("custom_laws_db", JSON.stringify(updated));
          return updated;
        });

        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } catch (err: any) {
        setUploadError(err.message || "خطا در پردازش فایل JSON. ساختار فایل را بررسی کنید.");
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleClearCustomLaws = () => {
    if (window.confirm("آیا از حذف تمامی قوانین بارگذاری شده در این دسته‌بندی اطمینان دارید؟")) {
      setCustomLaws(prev => {
        const updated = { ...prev };
        delete updated[activeCategory as string];
        localStorage.setItem("custom_laws_db", JSON.stringify(updated));
        return updated;
      });
    }
  };

  // State for live AI law retrieval
  const [aiArticleNum, setAiArticleNum] = useState("");
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [retrievalError, setRetrievalError] = useState("");

  const dbTitle = useMemo(() => {
    if (mode === "ara-vahdat") return "مجموعه آرا وحدت رویه دیوان عالی کشور";
    if (mode === "nazariat") return "نظریات مشورتی اداره حقوقی قوه قضائیه";
    return "بانک جامع قوانین کشور";
  }, [mode]);

  const aiPanelTitle = useMemo(() => {
    if (mode === "ara-vahdat") return "استخراج هوشمند و زنده آرا وحدت رویه";
    if (mode === "nazariat") return "استخراج هوشمند و زنده نظریات مشورتی";
    return "استخراج هوشمند و زنده مواد قانونی کشور";
  }, [mode]);

  const aiPanelDesc = useMemo(() => {
    if (mode === "ara-vahdat") return "شماره رای وحدت رویه مورد نظر را بنویسید تا مستقیماً و با اعتبار کامل به صورت زنده استخراج شود.";
    if (mode === "nazariat") return "شماره نظریه یا موضوع مورد نظر را بنویسید تا پاسخ مستدل آن با هوش مصنوعی و به صورت زنده استخراج شود.";
    return "شماره ماده مورد نظر را بنویسید تا مستقیماً و با اعتبار کامل از سامانه مرکزی استخراج شود.";
  }, [mode]);

  const handleRetrieveArticle = async (numToQuery?: string) => {
    const targetNum = numToQuery || aiArticleNum;
    if (!targetNum || !selectedLaw) return;
    
    setIsRetrieving(true);
    setRetrievalError("");
    try {
      const res = await fetch("/api/laws/retrieve_article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lawTitle: selectedLaw.title,
          articleNumber: targetNum,
          mode: mode
        })
      });
      const data = await res.json();
      if (res.ok && data.text) {
        // Dynamically inject into the law's chapters so it becomes part of the view
        setSelectedLaw(prev => {
          if (!prev) return null;
          
          const chaptersCopy = [...prev.chapters];
          let aiChapter = chaptersCopy.find(c => c.title.includes("استخراج شده آنلاین"));
          
          const labelSource = mode === "ara-vahdat" 
            ? "آرای وحدت رویه" 
            : mode === "nazariat" 
              ? "نظریات مشورتی" 
              : "بانک قوانین کشور";

          const newArticle = {
            number: data.number,
            text: data.text,
            notes: `استخراج شده به صورت زنده از بانک داده مرجع ${labelSource} (${selectedLaw.title})`
          };
          
          const aiChapterTitle = mode === "ara-vahdat"
            ? "آرای استخراج شده آنلاین با هوش مصنوعی (زنده)"
            : mode === "nazariat"
              ? "نظریات استخراج شده آنلاین با هوش مصنوعی (زنده)"
              : "مواد استخراج شده آنلاین با هوش مصنوعی (زنده)";

          if (aiChapter) {
            // Avoid duplicates
            if (!aiChapter.articles.some(a => a.number === data.number)) {
              aiChapter.articles = [newArticle, ...aiChapter.articles];
            }
          } else {
            chaptersCopy.unshift({
              title: aiChapterTitle,
              articles: [newArticle]
            });
          }
          
          return {
            ...prev,
            chapters: chaptersCopy
          };
        });
        
        // Auto open the first chapter (which is now our AI chapter)
        setActiveChapterIndex(0);
        setAiArticleNum(""); // Reset input
      } else {
        setRetrievalError(data.error || "یافت نشد. لطفاً مورد را صحیح وارد کنید.");
      }
    } catch (err) {
      setRetrievalError("خطا در ارتباط با سرور. لطفاً مجدداً تلاش کنید.");
    } finally {
      setIsRetrieving(false);
    }
  };

  // Filter categories laws based on global search in categories list
  const currentLaws = useMemo(() => {
    const defaultLaws = lawsDataSet[activeCategory] || [];
    const importedLaws = customLaws[activeCategory] || [];
    const allLaws = [...defaultLaws, ...importedLaws];
    
    if (!searchQuery) return allLaws;
    return allLaws.filter(law => {
      const titleMatches = law.title.toLowerCase().includes(searchQuery.toLowerCase());
      const descriptionMatches = law.description.toLowerCase().includes(searchQuery.toLowerCase());
      const hasMatchingArticle = law.chapters.some(chap => 
        chap.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chap.articles.some(art => art.text.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      return titleMatches || descriptionMatches || hasMatchingArticle;
    });
  }, [activeCategory, searchQuery, lawsDataSet, customLaws]);

  // Filter inside selected law articles
  const filteredChapters = useMemo(() => {
    if (!selectedLaw) return [];
    if (!searchQuery) return selectedLaw.chapters;

    return selectedLaw.chapters.map(chapter => {
      const isChapterTitleMatch = chapter.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchingArticles = chapter.articles.filter(article => 
        article.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
        String(article.number).includes(searchQuery)
      );

      if (isChapterTitleMatch || matchingArticles.length > 0) {
        return {
          ...chapter,
          articles: isChapterTitleMatch ? chapter.articles : matchingArticles
        };
      }
      return null;
    }).filter(Boolean) as Chapter[];
  }, [selectedLaw, searchQuery]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedArticleId(id);
    setTimeout(() => setCopiedArticleId(null), 2000);
  };

  const handleToggleBookmark = (id: string) => {
    setBookmarkedArticles(prev => {
      const isBookmarked = prev.includes(id);
      const updated = isBookmarked ? prev.filter(b => b !== id) : [...prev, id];
      try {
        localStorage.setItem("law_bookmarks", JSON.stringify(updated));
      } catch (e) {
        console.error("Error saving bookmarks", e);
      }
      return updated;
    });
  };

  // Render detail view of a law
  if (selectedLaw) {
    return (
      <div className="h-full flex flex-col bg-slate-50 animate-in fade-in slide-in-from-right-4 duration-300" dir="rtl">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setSelectedLaw(null);
                setActiveChapterIndex(null);
              }}
              className="p-2 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              title="بازگشت"
            >
              <ChevronRight className="w-6 h-6 text-slate-700" />
            </button>
            <div>
              <h2 className="text-sm font-black text-slate-800">{selectedLaw.title}</h2>
              <p className="text-[10px] text-slate-500">{selectedLaw.description}</p>
            </div>
          </div>
          <BookOpen className="w-5 h-5 text-[#1e3a8a]" />
        </div>

        {/* Local Search in the selected law */}
        <div className="bg-white border-b border-slate-100 px-4 py-3 sticky top-[69px] z-10">
          <div className="max-w-xl mx-auto flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="جستجو در مواد و فصول این قانون..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-2 bg-slate-100 border-none rounded-xl text-xs focus:ring-2 focus:ring-[#1e3a8a] outline-none transition font-medium text-right shadow-inner"
              />
            </div>
            
        {/* Quick AI Retrieval Panel */}
            <div className="bg-gradient-to-l from-slate-50 to-amber-50/40 p-3 rounded-xl border border-amber-200/60 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
              <div className="flex-1 text-right">
                <h4 className="text-[11px] font-black text-amber-800 flex items-center gap-1.5 mb-1 justify-start">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                  {aiPanelTitle}
                </h4>
                <p className="text-[9.5px] text-slate-500 leading-relaxed font-medium">
                  {aiPanelDesc}
                </p>
              </div>
              <div className="flex items-center gap-2 justify-end shrink-0">
                <input
                  type="text"
                  placeholder="مثال: ۸۵۰"
                  value={aiArticleNum}
                  onChange={(e) => {
                    setAiArticleNum(e.target.value);
                    if (retrievalError) setRetrievalError("");
                  }}
                  className="w-20 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-center text-xs font-bold focus:ring-2 focus:ring-[#1e3a8a] outline-none shadow-sm"
                />
                <button
                  onClick={() => handleRetrieveArticle()}
                  disabled={isRetrieving || !aiArticleNum}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black px-4 py-1.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {isRetrieving ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    "استخراج زنده"
                  )}
                </button>
              </div>
            </div>
            {retrievalError && (
              <p className="text-[10px] text-red-600 font-bold bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 text-right">
                {retrievalError}
              </p>
            )}
          </div>
        </div>

        {/* Content of the law */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-slate-50">
          <div className="max-w-4xl mx-auto space-y-6">
            {filteredChapters.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-bold">موردی یافت نشد</p>
              </div>
            ) : (
              filteredChapters.map((chapter, chapIdx) => {
                const isOpen = activeChapterIndex === chapIdx || searchQuery.length > 0;
                return (
                  <div key={chapIdx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all">
                    {/* Chapter Bar */}
                    <button
                      onClick={() => setActiveChapterIndex(activeChapterIndex === chapIdx ? null : chapIdx)}
                      className="w-full px-5 py-4 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between text-right"
                    >
                      <h3 className="text-xs font-black text-slate-800 leading-relaxed">
                        {chapter.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full font-bold">
                          {chapter.articles.length} ماده
                        </span>
                        <ChevronRight 
                          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                            isOpen ? "rotate-90" : "rotate-180"
                          }`} 
                        />
                      </div>
                    </button>

                    {/* Articles List */}
                    {isOpen && (
                      <div className="divide-y divide-slate-100">
                        {chapter.articles.map((art) => {
                          const artId = `${selectedLaw.id}-${art.number}`;
                          const isBookmarked = bookmarkedArticles.includes(artId);
                          const isCopied = copiedArticleId === artId;

                          return (
                            <div key={art.number} className="p-5 hover:bg-slate-50/50 transition">
                              <div className="flex items-center justify-between mb-3">
                                <span className="bg-gradient-to-l from-amber-500 to-orange-500 text-white text-[11px] font-black px-3 py-1 rounded-lg shadow-sm">
                                  ماده {art.number}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {/* Bookmark */}
                                  <button
                                    onClick={() => handleToggleBookmark(artId)}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-amber-500 cursor-pointer"
                                    title={isBookmarked ? "حذف نشان" : "نشان کردن"}
                                  >
                                    {isBookmarked ? (
                                      <BookmarkCheck className="w-4 h-4 text-amber-500" />
                                    ) : (
                                      <Bookmark className="w-4 h-4" />
                                    )}
                                  </button>

                                  {/* Copy */}
                                  <button
                                    onClick={() => handleCopy(`ماده ${art.number} - ${art.text}`, artId)}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-[#1e3a8a] cursor-pointer"
                                    title="کپی متن ماده"
                                  >
                                    {isCopied ? (
                                      <Check className="w-4 h-4 text-green-600 animate-bounce" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs leading-loose text-slate-700 text-justify font-medium">
                                {art.text}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // Categories and list view
  return (
    <div className="h-full flex flex-col bg-slate-50 animate-in fade-in duration-300 relative" dir="rtl">
      {/* Header and Search */}
      <div className="bg-white px-4 pt-4 pb-0 sticky top-0 z-10 shadow-sm flex flex-col gap-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-black text-[#1e3a8a] flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {dbTitle}
          </h1>
          <div className="relative w-40 md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={
                mode === "ara-vahdat" 
                  ? "جستجو در آرا..." 
                  : mode === "nazariat" 
                    ? "جستجو در نظریات..." 
                    : "جستجو در قوانین..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-9 py-2 bg-slate-100 border-none rounded-full text-xs focus:ring-2 focus:ring-[#1e3a8a] outline-none transition font-medium text-right"
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-3">
          {categoriesList.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-[11px] font-black transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat.id 
                  ? "bg-[#1e3a8a] text-white shadow-sm" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Laws List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-slate-100">
        <div className="max-w-2xl mx-auto space-y-4">
          
          {/* Custom JSON Laws Import Section */}
          <div className="bg-white rounded-[24px] p-5 border border-slate-200 shadow-sm transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#1e3a8a]" />
                <h3 className="text-xs font-black text-slate-800">درون‌ریزی قوانین شخصی و فایل‌های JSON</h3>
              </div>
              <button 
                onClick={() => setShowImportGuide(!showImportGuide)}
                className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {showImportGuide ? "بستن راهنما" : "راهنمای ساختار فایل"}
              </button>
            </div>

            {/* Error explainers for search URLs */}
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-right mb-4">
              <h4 className="text-[11px] font-black text-amber-800 flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                چرا برخی لینک‌های دیتابیس در نتایج جستجو ارور می‌دهند؟
              </h4>
              <p className="text-[9.5px] text-slate-600 leading-relaxed">
                لینک‌های نتایج جستجوی موتور گوگل (به ویژه لینک‌های هدایت‌گر Vertex AI و مخازن قدیمی گیت‌هاب) به دلیل فیلترینگ شدید گیت‌هاب بر روی کاربران ایران، اتمام انقضای توکن سشن، یا حذف شدن مخازن ممکن است ارور ۴۰۴ بدهند. به جای استفاده از لینک‌های ناپایدار بیرونی، از <strong>بانک جامع قوانین آفلاین پیش‌فرض ما</strong> استفاده کنید یا به راحتی فایل قوانین خود را با فرمت JSON استاندارد در بخش زیر آپلود کنید.
              </p>
            </div>

            {/* JSON Template Guide */}
            {showImportGuide && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-4 text-right animate-in fade-in slide-in-from-top-2 duration-200">
                <p className="text-[10.5px] text-slate-700 mb-2 leading-relaxed font-semibold">
                  فایل JSON شما برای درون‌ریزی موفقیت‌آمیز در دسته‌بندی <span className="text-[#1e3a8a]">«{categoriesList.find(c => c.id === activeCategory)?.label || ""}»</span> باید دقیقاً ساختاری مشابه الگوی زیر داشته باشد:
                </p>
                <pre className="text-[9px] bg-slate-900 text-emerald-400 p-3 rounded-lg overflow-x-auto text-left font-mono dir-ltr mb-3 leading-relaxed shadow-inner">
{`[
  {
    "title": "قانون جرایم رایانه‌ای",
    "description": "قانون مجازات اشخاص در فضای مجازی و اینترنت",
    "chapters": [
      {
        "title": "فصل اول - جرایم علیه محرمانگی داده‌ها",
        "articles": [
          {
            "number": 1,
            "text": "هرکس به طور غیرمجاز به داده‌ها یا سامانه‌های رایانه‌ای یا مخابراتی دسترسی یابد..."
          }
        ]
      }
    ]
  }
]`}
                </pre>
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify([
                        {
                          title: "قانون جرایم رایانه‌ای",
                          description: "قانون مجازات اشخاص در فضای مجازی و اینترنت",
                          chapters: [
                            {
                              title: "فصل اول - جرایم علیه محرمانگی داده‌ها",
                              articles: [
                                {
                                  number: 1,
                                  text: "هرکس به طور غیرمجاز به داده‌ها یا سامانه‌های رایانه‌ای یا مخابراتی که به وسیله تدابیر حفاظتی حفاظت شده است دسترسی یابد به حبس از نود و یک روز تا یک سال یا جزای نقدی محکوم خواهد شد."
                                }
                              ]
                            }
                          ]
                        }
                      ], null, 2));
                      alert("نمونه قالب در کلیپ‌بورد کپی شد!");
                    }}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    کپی نمونه قالب
                  </button>
                </div>
              </div>
            )}

             {/* Drag & Drop Zone */}
             <div
               onDragOver={parsingPdf ? undefined : handleDragOver}
               onDragLeave={parsingPdf ? undefined : handleDragLeave}
               onDrop={parsingPdf ? undefined : handleDrop}
               className={`border-2 border-dashed rounded-xl p-6 text-center transition duration-150 flex flex-col items-center justify-center ${
                 parsingPdf 
                   ? "border-amber-500 bg-amber-50/20 cursor-wait animate-pulse"
                   : isDragging 
                     ? "border-[#1e3a8a] bg-blue-50/50 scale-[0.99] cursor-pointer" 
                     : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer"
               }`}
               onClick={() => !parsingPdf && document.getElementById("json-file-input")?.click()}
             >
               <input
                 id="json-file-input"
                 type="file"
                 accept=".json,.pdf"
                 onChange={handleFileUpload}
                 disabled={parsingPdf}
                 className="hidden"
               />
               {parsingPdf ? (
                 <>
                   <div className="w-8 h-8 border-3 border-amber-500/30 border-t-amber-600 rounded-full animate-spin mb-3" />
                   <p className="text-xs font-black text-amber-800 mb-1">در حال پردازش و استخراج هوشمند سند قوانین از فایل PDF...</p>
                   <p className="text-[10px] text-amber-600">هوش مصنوعی در حال بازخوانی و دسته‌بندی مواد قانونی است. لطفاً شکیبا باشید.</p>
                 </>
               ) : (
                 <>
                   <Upload className={`w-8 h-8 mb-2 transition-transform duration-200 ${isDragging ? "-translate-y-1 text-[#1e3a8a]" : "text-slate-400"}`} />
                   <p className="text-xs font-black text-slate-700 mb-1">فایل JSON یا PDF قوانین خود را بکشید و رها کنید</p>
                   <p className="text-[10px] text-slate-400">یا برای انتخاب فایل کلیک کنید (سازگار با قالب استاندارد یا پی‌دی‌اف‌های متنی متداول)</p>
                 </>
               )}
             </div>

            {/* Success & Error State Visualizers */}
            {uploadError && (
              <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-[10px] font-bold text-right">
                <X className="w-4 h-4 text-red-500 shrink-0" />
                <p>{uploadError}</p>
              </div>
            )}

            {uploadSuccess && (
              <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-600 text-[10px] font-bold text-right animate-bounce">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <p>فایل قوانین دلخواه با موفقیت درون‌ریزی و ادغام شد!</p>
              </div>
            )}

            {/* Clear custom imported laws */}
            {customLaws[activeCategory] && customLaws[activeCategory].length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold">
                  تعداد قوانین سفارشی درون‌ریزی شده: {customLaws[activeCategory].length} مورد
                </span>
                <button
                  onClick={handleClearCustomLaws}
                  className="text-[10px] text-red-600 hover:text-red-800 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  حذف تمامی قوانین سفارشی این دسته‌بندی
                </button>
              </div>
            )}
          </div>

          {currentLaws.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold">
                {mode === "ara-vahdat" 
                  ? "رای وحدت رویه‌ای در این دسته‌بندی یافت نشد" 
                  : mode === "nazariat" 
                    ? "نظریه مشورتی در این دسته‌بندی یافت نشد" 
                    : "قانونی در این دسته‌بندی یافت نشد"}
              </p>
            </div>
          ) : (
            currentLaws.map((law, index) => (
              <button
                key={law.id}
                onClick={() => {
                  setSelectedLaw(law);
                  setSearchQuery(""); // Clear search to show the whole law initially
                }}
                className="w-full bg-gradient-to-l from-[#172554] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#2563eb] text-white rounded-[24px] py-5 px-6 flex items-center justify-between shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer text-right"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'both'
                }}
              >
                <div className="flex-1 pr-2">
                  <div className="font-bold text-xs md:text-sm leading-tight mb-1">
                    {law.title}
                  </div>
                  <div className="text-[10px] text-slate-300 line-clamp-1">
                    {law.description}
                  </div>
                </div>
                <div className="shrink-0 w-10 h-10 border border-white/20 rounded-full flex items-center justify-center bg-white/10">
                   <Scale className="w-5 h-5 text-white" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
