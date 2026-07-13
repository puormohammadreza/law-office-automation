import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Briefcase,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  Scale,
  Search,
  BookOpen,
  HelpCircle,
  Shield,
  Copy,
  Printer,
  Download,
  ChevronDown,
  FileUp,
  X,
  Check,
  ChevronLeft,
  Trash2,
  Gavel,
  UserCircle,
  ArrowLeft,
  Save,
  Zap,
  Map,
  FileEdit,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LegalCase, CaseDocument, CaseNote } from "../types";
import { toPersianDigits, toEnglishDigits } from "../utils/shamsi";
import { safeStorage } from "../utils/safeStorage";
import { PleadingDraftingForm } from "./PleadingDraftingForm";

interface AIAnalysisPageProps {
  cases: LegalCase[];
  documents: CaseDocument[];
  notes: CaseNote[];
  selectedCaseForSave: string;
  setSelectedCaseForSave: (caseId: string) => void;
  selectedDocId: string;
  setSelectedDocId: (docId: string) => void;
  analysisStatus: "idle" | "loading" | "success" | "error";
  setAnalysisStatus: (status: "idle" | "loading" | "success" | "error") => void;
  analysisProgressMsg: string;
  analysisResult: {
    keywords: string[];
    laws: { article: string; reason: string }[];
    precedents: { title: string; desc: string }[];
    opinions: { title: string; desc: string }[];
    judgements: { title: string; desc: string }[];
    risk: {
      level: "بالا" | "متوسط" | "کم";
      percentage: string;
      details: string;
      successChance?: string;
      successReason?: string;
      failureChance?: string;
      failureReason?: string;
    };
    nextSteps: string[];
    isOfflineAnalysis?: boolean;
  } | null;
  setAnalysisResult: (result: any) => void;
  handleRunAiAnalysis: (
    caseId?: string,
    docIds?: string[],
    manualDesc?: string,
  ) => Promise<void>;
  handleSaveAnalysisAsNote: (silent?: boolean) => void;
  getAvailableDocsForAnalysis: () => any[];
  localUploadedDocs: any[];
  setLocalUploadedDocs: React.Dispatch<React.SetStateAction<any[]>>;
  onNavigate?: (tab: string) => void;
  onAddNote?: (note: CaseNote) => void;
  aiCaseDescription: string;
  setAiCaseDescription: (val: string) => void;
  aiSelectedDocIds: string[];
  setAiSelectedDocIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function AIAnalysisPage({
  cases,
  documents,
  selectedCaseForSave,
  setSelectedCaseForSave,
  selectedDocId,
  setSelectedDocId,
  analysisStatus,
  setAnalysisStatus,
  analysisProgressMsg,
  analysisResult,
  setAnalysisResult,
  handleRunAiAnalysis,
  handleSaveAnalysisAsNote,
  getAvailableDocsForAnalysis,
  localUploadedDocs,
  setLocalUploadedDocs,
  onNavigate,
  notes = [],
  onAddNote,
  aiCaseDescription,
  setAiCaseDescription,
  aiSelectedDocIds,
  setAiSelectedDocIds,
}: AIAnalysisPageProps) {
  // Analysis expand states
  const [expandedLaws, setExpandedLaws] = useState<number[]>([]);
  const [expandedPrecedents, setExpandedPrecedents] = useState<number[]>([]);
  const [expandedOpinions, setExpandedOpinions] = useState<number[]>([]);
  const [expandedJudgements, setExpandedJudgements] = useState<number[]>([]);

  // Note saving state
  const [saveNotePrompt, setSaveNotePrompt] = useState(false);
  const [showPleading, setShowPleading] = useState(false);
  const [selectedAnalysisNoteText, setSelectedAnalysisNoteText] = useState<string>("");
  const [showRiskDetailView, setShowRiskDetailView] = useState(false);

  // Pleading Drafting States - Handled by PleadingDraftingForm component
  // Opinion states
  const [lawyerOpinion, setLawyerOpinion] = useState("");
  const [opposingOpinion, setOpposingOpinion] = useState("");
  const [judgeOpinion, setJudgeOpinion] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [selectedDocsForContext, setSelectedDocsForContext] = useState<
    string[]
  >([]);
  const [isGeneratingOpinions, setIsGeneratingOpinions] = useState(false);

  // Auto-save case notes options
  const [autoSaveToNotes, setAutoSaveToNotes] = useState<boolean>(() => {
    return safeStorage.getItem("r_auto_save_analysis_note") === "true";
  });
  const [autoSaveCompleted, setAutoSaveCompleted] = useState<boolean>(false);

  // Reset autoSaveCompleted when status changes to loading or case selection changes
  useEffect(() => {
    if (analysisStatus === "loading") {
      setAutoSaveCompleted(false);
      setShowPleading(false);
      setShowRiskDetailView(false);
    }
  }, [analysisStatus]);

  // Handle auto-save trigger on success
  useEffect(() => {
    if (
      autoSaveToNotes &&
      analysisStatus === "success" &&
      analysisResult &&
      selectedCaseForSave &&
      !autoSaveCompleted
    ) {
      handleSaveAnalysisAsNote(true);
      setAutoSaveCompleted(true);
    }
  }, [analysisStatus, analysisResult, autoSaveToNotes, selectedCaseForSave, autoSaveCompleted, handleSaveAnalysisAsNote]);

  const handleToggleAutoSave = (val: boolean) => {
    setAutoSaveToNotes(val);
    safeStorage.setItem("r_auto_save_analysis_note", String(val));
    
    // If they enable it after we already have a successful analysis, trigger silent save immediately
    if (val && analysisResult && analysisStatus === "success" && selectedCaseForSave && !autoSaveCompleted) {
      handleSaveAnalysisAsNote(true);
      setAutoSaveCompleted(true);
    }
  };

  // Sync selected case specific documents on load or case change
  useEffect(() => {
    const docs = getAvailableDocsForAnalysis();
    if (docs.length > 0) {
      // Clear or sync selected IDs if they are no longer available
      setAiSelectedDocIds((prev) =>
        prev.filter((id) => docs.some((d) => d.id === id)),
      );
    }
  }, [selectedCaseForSave]);

  const handleCopyDraft = () => {
    // This is now handled inside PleadingDraftingForm
  };

  // Pleading helper functions are now handled by the sub-component

  const handleSavePleadingAsNote = (content: string, title: string) => {
    if (!selectedCaseForSave || !content) return;

    try {
      const newNote: CaseNote = {
        id: "note_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9),
        caseId: selectedCaseForSave,
        title: title,
        content: content,
        createdAt: new Date().toLocaleDateString("fa-IR"),
      };

      if (onAddNote) {
        onAddNote(newNote);
      } else {
        const savedNotesStr = safeStorage.getItem("r_notes") || "[]";
        let currentNotes: CaseNote[] = JSON.parse(savedNotesStr);
        currentNotes.push(newNote);
        safeStorage.setItem("r_notes", JSON.stringify(currentNotes));
      }
    } catch (e) {
      console.error("Failed to save pleading to case notes", e);
    }
  };

  const handleGenerateOpinions = async () => {
    if (!analysisResult) return;
    setIsGeneratingOpinions(true);
    setOpposingOpinion("");
    setJudgeOpinion("");

    const promptText = `
با توجه به تحلیل حقوقی پرونده و اظهارات/دفاعیات وکیل مدافع:
نظرات وکیل مدافع: ${lawyerOpinion || "ثبت نشده (تحلیل بر اساس مستندات قبلی)"}

لطفا خروجی را منحصراً در قالب یک آبجکت معتبر JSON (بدون هیچ مارک‌داون یا تگ اضافه) به زبان فارسی با ساختار زیر برگردانید:
{
  "opposingOpinion": "متن کامل و مستدل نظر و دفاعیات احتمالی وکیل طرف مقابل...",
  "judgeOpinion": "متن کامل و مستدل نظر قاضی و پیش‌بینی رأی دادگاه با توجه به مستندات و دفاعیات طرفین..."
}
    `;

    try {
      let response: Response | null = null;
      let retries = 3;
      let delay = 1500;
      let lastError: any = null;

      while (retries >= 0) {
        try {
          response = await fetch("/api/gemini/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [{ role: "user", content: promptText }],
              systemInstruction:
                "شما یک دستیار هوش مصنوعی حقوقی تراز اول و یک هیئت متخصص شامل وکیل طرف مقابل و قاضی بازنشسته دیوان عالی هستید. خروجی صرفا باید جیسون معتبر باشد.",
            }),
          });

          if (response.ok) {
            break;
          } else {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `API Error: ${response.status}`);
          }
        } catch (err: any) {
          lastError = err;
          retries--;
          if (retries >= 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 1.5;
          }
        }
      }

      if (!response || !response.ok) {
        throw new Error(lastError?.message || "خطا در برقراری ارتباط با سرور");
      }

      const data = await response.json();
      let rawText = data.text || "";

      const start = rawText.indexOf("{");
      const end = rawText.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        rawText = rawText.substring(start, end + 1);
      }

      const parsed = JSON.parse(rawText);
      setOpposingOpinion(
        parsed.opposingOpinion || "خطا در تولید نظر وکیل طرف مقابل",
      );
      setJudgeOpinion(parsed.judgeOpinion || "خطا در تولید نظر قاضی");
    } catch (e: any) {
      console.error(e);
      setOpposingOpinion(
        "متاسفانه در تولید نظر وکیل طرف مقابل خطایی رخ داد: " + e.message,
      );
      setJudgeOpinion("متاسفانه در تولید نظر قاضی خطایی رخ داد.");
    } finally {
      setIsGeneratingOpinions(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isText =
      file.type === "text/plain" ||
      file.type === "text/csv" ||
      file.name.endsWith(".md") ||
      file.name.endsWith(".txt");

    reader.onload = (event) => {
      const result = event.target?.result as string;
      const newDoc = {
        id: `local-${Date.now()}`,
        name: file.name,
        type: isText ? "doc" : file.type.startsWith("image/") ? "image" : "pdf",
        desc: "فایل بارگذاری شده موقت",
        isSample: false,
        dataUrl: !isText ? result : undefined,
        textContent: isText ? result : undefined,
        isLocal: true,
        date: new Date().toISOString().split('T')[0]
      };
      // Replace previous local uploads to enforce single file limit
      setLocalUploadedDocs([newDoc]);
      // Auto-select the new document
      setAiSelectedDocIds([newDoc.id]);
    };

    if (isText) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  // Combine all documents and filter out duplicates by unique id
  const rawAvailableDocs = [
    ...(selectedCaseForSave ? [
      ...getAvailableDocsForAnalysis(),
      ...notes.filter(n => n.caseId === selectedCaseForSave).map(n => ({
        id: n.id,
        name: `یادداشت: ${n.title}`,
        type: 'doc' as const,
        textContent: n.content,
        isNote: true
      }))
    ] : []),
    ...localUploadedDocs
  ];

  const seenDocIds = new Set<string>();
  const availableDocs = rawAvailableDocs.filter(doc => {
    if (!doc || !doc.id) return false;
    if (seenDocIds.has(doc.id)) return false;
    seenDocIds.add(doc.id);
    return true;
  });

  const getRiskDetails = () => {
    if (!analysisResult || !analysisResult.risk) return null;
    const riskObj = analysisResult.risk;
    
    // parse risk percentage safely
    let riskNum = 50; // default
    if (riskObj.percentage) {
      const cleanDigits = toEnglishDigits(riskObj.percentage).replace(/[^0-9]/g, "");
      const parsed = parseInt(cleanDigits, 10);
      if (!isNaN(parsed)) {
        riskNum = parsed;
      }
    }
    
    const level = riskObj.level || "متوسط";
    
    const successChance = riskObj.successChance || `${toPersianDigits(100 - riskNum)}٪`;
    const failureChance = riskObj.failureChance || `${toPersianDigits(riskNum)}٪`;
    
    const successReason = riskObj.successReason || "انطباق قوی با قوانین موضوعه، برخورداری از پشتوانه آرای محاکم عالی و پیگیری مستمر گام‌های دادرسی مندرج در تحلیل.";
    const failureReason = riskObj.failureReason || riskObj.details || "چالش‌های ذاتی ناشی از عدم وجود ادله کافی، انقضای مواعد قانونی یا تفسیر متفاوت محاکم بدوی.";
    
    const customMeaning = `ریسک پرونده در این مورد خاص به معنای احتمال مواجهه با رای رد دعوا یا تایید ادعای طرف مقابل است. در این پرونده ویژه، به علت چالش‌های مربوط به «${riskObj.details || "نیاز به بررسی دقیق‌تر مستندات اثباتی"}»، ضریب ریسک کلی معادل ${riskObj.percentage} تخمین زده شده است. این متغیر نشانگر حساسیت موضوع بوده و نیاز مبرم به دفاع مستدل را تایید می‌کند.`;

    return {
      level,
      percentage: riskObj.percentage,
      details: riskObj.details,
      successChance,
      successReason,
      failureChance,
      failureReason,
      meaning: customMeaning
    };
  };

  const renderAnalysisContent = () => {
    if (!analysisResult) return null;
    return (
      <div className="space-y-8">
        {/* Offline report banner */}
        {analysisResult.isOfflineAnalysis && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-amber-800 text-xs font-bold flex items-start gap-2.5 shadow-sm">
            <span className="text-sm">⚠️</span>
            <div className="text-right">
              <strong>تحلیل مستقل آفلاین:</strong> این تحلیل به علت عدم دسترسی سیستم به اینترنت، به صورت آنی توسط دیتابیس هوشمند و کدهای استنادی محلی پورتال وکالت استخراج و آماده شده است.
            </div>
          </div>
        )}

        {/* Risk Assessment - Touchable for full details & success/failure simulator */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div 
            onClick={() => setShowRiskDetailView(true)}
            className={`p-5 rounded-[1.5rem] border flex items-center gap-4 shadow-sm w-full cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md active:scale-95 group ${
              analysisResult.risk.level === "بالا" 
                ? "bg-red-50 hover:bg-red-100/50 border-red-100" 
                : analysisResult.risk.level === "متوسط"
                ? "bg-amber-50 hover:bg-amber-100/50 border-amber-100"
                : "bg-emerald-50 hover:bg-emerald-100/50 border-emerald-100"
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 transition-all group-hover:rotate-12 ${
              analysisResult.risk.level === "بالا" ? "bg-red-100 border-red-200 text-red-600" :
              analysisResult.risk.level === "متوسط" ? "bg-amber-100 border-amber-200 text-amber-600" :
              "bg-emerald-100 border-emerald-200 text-emerald-600"
            }`}>
              <Scale className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider opacity-60">ریسک پرونده:</span>
                  <span className={`text-sm font-black ${
                    analysisResult.risk.level === "بالا" ? "text-red-700" :
                    analysisResult.risk.level === "متوسط" ? "text-amber-700" :
                    "text-emerald-700"
                  }`}>
                    {analysisResult.risk.percentage} ({analysisResult.risk.level})
                  </span>
                </div>
                <span className="text-[9px] font-black text-slate-400 group-hover:text-slate-600 transition-all flex items-center gap-1">
                  مشاهده جزئیات شانس موفقیت ◀
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold mt-1">
                👉 برای تحلیل تفصیلی علت ریسک، شانس موفقیت ({getRiskDetails()?.successChance}) و شکست کلیک کنید.
              </p>
            </div>
          </div>
        </div>

        {/* Laws Section - Interactive - No boxes */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 border-r-4 border-emerald-500 pr-3 mb-2">
            <Scale className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-black">مواد قانونی استنادی منطبق:</h3>
          </div>
          <div className="space-y-1">
            {analysisResult.laws.map((law, i) => {
              const isExpanded = expandedLaws.includes(i);
              return (
                <div key={i} className="border-b border-slate-50 last:border-0">
                  <button 
                    onClick={() => setExpandedLaws(prev => isExpanded ? prev.filter(x => x !== i) : [...prev, i])}
                    className="w-full py-2 flex items-center justify-between text-right group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <h5 className="text-[11px] font-bold text-emerald-800 group-hover:text-emerald-600 transition-colors">{law.article}</h5>
                    </div>
                    <ChevronDown className={`w-3 h-3 text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {isExpanded && (
                    <div className="pb-3 pr-4 animate-in slide-in-from-top-1 duration-200">
                      <p className="text-slate-500 leading-relaxed font-medium text-[10px]">{law.reason}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Steps - Shrunk */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900 border-r-4 border-emerald-500 pr-3">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-black">اقدامات پیشنهادی:</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysisResult.nextSteps.map((step, i) => (
              <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-4 hover:bg-emerald-50 transition-all shadow-sm">
                <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 font-black text-xs">
                  {toPersianDigits(i + 1)}
                </div>
                <p className="text-slate-700 text-[11px] leading-relaxed font-bold">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Legal References - Interactive Toggles - No Boxes */}
        {(analysisResult.precedents?.length > 0 || analysisResult.opinions?.length > 0 || analysisResult.judgements?.length > 0) && (
          <div className="space-y-4 pt-2">
            {analysisResult.precedents?.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-900 border-r-4 border-blue-500 pr-3 mb-1">
                  <Gavel className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-black">آرای وحدت رویه:</h3>
                </div>
                <div className="space-y-0.5">
                  {analysisResult.precedents.map((item, i) => {
                    const isExpanded = expandedPrecedents.includes(i);
                    return (
                      <div key={i} className="border-b border-slate-50 last:border-0">
                        <button 
                          onClick={() => setExpandedPrecedents(prev => isExpanded ? prev.filter(x => x !== i) : [...prev, i])}
                          className="w-full py-1.5 flex items-center justify-between text-right group"
                        >
                          <h5 className="text-blue-700 font-bold text-[10px] group-hover:text-blue-500 transition-colors">{item.title}</h5>
                          <ChevronDown className={`w-3 h-3 text-blue-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isExpanded && (
                          <div className="pb-2 pr-3 animate-in slide-in-from-top-1 duration-200">
                            <p className="text-slate-500 text-[10px] leading-relaxed font-medium">{item.desc}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {analysisResult.opinions?.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-900 border-r-4 border-amber-500 pr-3 mb-1">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-black">نظریات مشورتی:</h3>
                </div>
                <div className="space-y-0.5">
                  {analysisResult.opinions.map((item, i) => {
                    const isExpanded = expandedOpinions.includes(i);
                    return (
                      <div key={i} className="border-b border-slate-50 last:border-0">
                        <button 
                          onClick={() => setExpandedOpinions(prev => isExpanded ? prev.filter(x => x !== i) : [...prev, i])}
                          className="w-full py-1.5 flex items-center justify-between text-right group"
                        >
                          <h5 className="text-amber-700 font-bold text-[10px] group-hover:text-amber-500 transition-colors">{item.title}</h5>
                          <ChevronDown className={`w-3 h-3 text-amber-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isExpanded && (
                          <div className="pb-2 pr-3 animate-in slide-in-from-top-1 duration-200">
                            <p className="text-slate-500 text-[10px] leading-relaxed font-medium">{item.desc}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {analysisResult.judgements?.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-900 border-r-4 border-purple-500 pr-3 mb-1">
                  <Scale className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-black">آرای اصراری:</h3>
                </div>
                <div className="space-y-0.5">
                  {analysisResult.judgements.map((item, i) => {
                    const isExpanded = expandedJudgements.includes(i);
                    return (
                      <div key={i} className="border-b border-slate-50 last:border-0">
                        <button 
                          onClick={() => setExpandedJudgements(prev => isExpanded ? prev.filter(x => x !== i) : [...prev, i])}
                          className="w-full py-1.5 flex items-center justify-between text-right group"
                        >
                          <h5 className="text-purple-700 font-bold text-[10px] group-hover:text-purple-500 transition-colors">{item.title}</h5>
                          <ChevronDown className={`w-3 h-3 text-purple-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isExpanded && (
                          <div className="pb-2 pr-3 animate-in slide-in-from-top-1 duration-200">
                            <p className="text-slate-500 text-[10px] leading-relaxed font-medium">{item.desc}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 text-right max-w-4xl mx-auto pb-24" dir="rtl">
      <div className="flex justify-start px-4">
        <button 
          onClick={() => onNavigate?.('dashboard' as any)}
          className="flex items-center gap-2 text-slate-500 hover:text-emerald-400 transition-colors text-xs font-black group"
        >
          <ArrowLeft className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
          <span>بازگشت به صفحه قبل</span>
        </button>
      </div>

      {/* Main Analysis Container - Matching Screenshot Style */}
      <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.08)] relative overflow-hidden min-h-[900px]">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Header Section - Shrinked as requested */}
        <div className="flex flex-row items-center justify-center text-center gap-4 mb-10 pb-6 border-b border-slate-100">
          <div className="relative group scale-75">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-[0_10px_40px_rgba(16,185,129,0.1)] group-hover:scale-105 transition-transform duration-500">
              <Scale className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full border border-slate-100 shadow-md">
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">تحلیل و شبیه‌ساز</h1>
          </div>
        </div>

        {/* Form Sections */}
        <div className="space-y-10">
          {/* Case Description Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 border-b border-emerald-100/50 pb-2">
              <div className="p-1.5 bg-emerald-50 rounded-lg">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black">شرح کامل ماوقع پرونده:</h3>
            </div>
            <div className="relative group">
              <textarea
                value={aiCaseDescription}
                onChange={(e) => setAiCaseDescription(e.target.value)}
                placeholder="تمامی جزئیات، ادعاها، مدارک و شرایط پرونده را با دقت در اینجا بنویسید..."
                className="w-full h-96 bg-slate-50 border border-slate-200 rounded-[2rem] p-8 text-slate-800 text-base font-medium leading-loose focus:outline-none focus:border-emerald-500/30 transition-all resize-none placeholder:text-slate-400 custom-scrollbar shadow-inner"
              />
              <div className="absolute bottom-6 left-8 text-[11px] text-slate-400 font-mono bg-white/80 px-3 py-1 rounded-full border border-slate-100">
                {aiCaseDescription.length.toLocaleString()} کاراکتر
              </div>
            </div>
          </div>

          {/* Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Case Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pr-2">
                <Briefcase className="w-5 h-5 text-emerald-600" />
                <label className="text-sm font-black text-slate-500">انتخاب پرونده از نرم‌افزار:</label>
              </div>
              <div className="relative group">
                <select
                  value={selectedCaseForSave}
                  onChange={(e) => setSelectedCaseForSave(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-2xl py-5 px-6 text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all cursor-pointer shadow-sm appearance-none"
                >
                  <option value="">-- پرونده‌ای انتخاب نشده است --</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>{c.title} (موکل: {c.clientName})</option>
                  ))}
                </select>
                <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown className="w-5 h-5" />
                </div>
              </div>
              {selectedCaseForSave && (
                <div className="flex items-center gap-3 pr-2 mt-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50 w-fit">
                  <input
                    type="checkbox"
                    id="auto-save-notes"
                    checked={autoSaveToNotes}
                    onChange={(e) => handleToggleAutoSave(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 bg-white border-slate-300 focus:ring-emerald-500 focus:ring-2 cursor-pointer accent-emerald-500 animate-in fade-in zoom-in-95"
                  />
                  <label htmlFor="auto-save-notes" className="text-xs font-black text-slate-600 cursor-pointer select-none">
                    ذخیره خودکار در یادداشت‌های پرونده پس از اتمام تحلیل
                  </label>
                </div>
              )}
            </div>

            {/* File Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pr-2">
                <div className="flex items-center gap-3">
                  <FileUp className="w-5 h-5 text-emerald-600" />
                  <label className="text-sm font-black text-slate-500">انتخاب اسناد و فایل‌های گوشی:</label>
                </div>
                <input 
                  type="file" 
                  id="phone-upload" 
                  className="hidden" 
                  accept="image/*,application/pdf,.txt,.md,.csv"
                  onChange={handleFileUpload} 
                />
                <label 
                  htmlFor="phone-upload" 
                  className="text-xs text-emerald-600 bg-emerald-50 px-5 py-2.5 rounded-xl border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition-all font-black shadow-sm"
                >
                  فایل جدید
                </label>
              </div>
              <div className="flex flex-wrap gap-2.5 max-h-[140px] overflow-y-auto p-2 custom-scrollbar bg-slate-50 rounded-2xl border border-slate-100 min-h-[60px]">
                {availableDocs.length === 0 ? (
                  <div className="w-full py-4 text-center">
                    <p className="text-[10px] text-slate-400">سندی انتخاب نشده است.</p>
                  </div>
                ) : (
                  availableDocs.map(doc => {
                    const isSelected = aiSelectedDocIds.includes(doc.id);
                    return (
                      <button
                        key={doc.id}
                        onClick={() => {
                          setAiSelectedDocIds(prev => 
                            prev.includes(doc.id) ? prev.filter(id => id !== doc.id) : [...prev, doc.id]
                          );
                        }}
                        className={`group relative text-[11px] font-bold px-4 py-3 rounded-xl border transition-all flex items-center gap-3 ${
                          isSelected
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <FileText className={`w-4 h-4 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
                        <span className="truncate max-w-[140px]">{doc.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Main Action Buttons */}
          <div className="pt-8 flex flex-col gap-3">
            <button
              onClick={() => {
                const docIdsToAnalyze = aiSelectedDocIds.length > 0 
                  ? aiSelectedDocIds 
                  : availableDocs.map(d => d.id);
                handleRunAiAnalysis(selectedCaseForSave, docIdsToAnalyze, aiCaseDescription);
              }}
              disabled={analysisStatus === "loading" || (!aiCaseDescription && !selectedCaseForSave && aiSelectedDocIds.length === 0)}
              className={`w-full px-4 py-2.5 rounded-xl text-sm font-black flex items-center justify-start gap-3 shadow-lg transition-all group relative overflow-hidden ${
                analysisStatus === "loading"
                  ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-[0.98]"
              }`}
            >
              {analysisStatus === "loading" ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
                  <span>در حال تحلیل...</span>
                </div>
              ) : (
                <>
                  <Scale className="w-5 h-5" />
                  <span>تحلیل پرونده</span>
                </>
              )}
            </button>

            <button
              onClick={() => onNavigate?.("court-simulator")}
              className="w-full px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-black flex items-center justify-start gap-3 shadow-lg transition-all active:scale-95 group"
            >
              <Gavel className="w-5 h-5" />
              <span>شبیه‌ساز دادگاه</span>
            </button>
            <button
              onClick={() => {
                // If there's an active analysis, just use it
                if (analysisResult) {
                  setSelectedAnalysisNoteText("");
                  setShowPleading(true);
                  return;
                }
                
                // Otherwise, try to find the most recent smart analysis note
                if (selectedCaseForSave) {
                  const caseNotes = notes.filter(n => n.caseId === selectedCaseForSave && n.title.includes("تحلیل هوشمند"));
                  if (caseNotes.length > 0) {
                    // Sort by newest first
                    caseNotes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
                    setSelectedAnalysisNoteText(caseNotes[0].content);
                    setShowPleading(true);
                    return;
                  }
                }
                
                // If no analysis is available, we can trigger the analysis first or just show the form empty
                // For now, let's just trigger the form with empty analysis, it will use whatever context it can
                setSelectedAnalysisNoteText("");
                setShowPleading(true);
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black flex items-center justify-start gap-3 shadow-lg transition-all active:scale-95 group"
            >
              <FileEdit className="w-5 h-5" />
              <span>تنظیم لایحه</span>
            </button>
          </div>
        </div>

        {/* Loading / Results Overlay */}
        {(analysisResult || analysisStatus === "loading" || showPleading) && (
          <div className="absolute inset-0 bg-white z-50 p-10 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-500 flex flex-col">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100 shadow-sm">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    {showRiskDetailView ? "شبیه‌ساز ریسک و شانس موفقیت" : showPleading ? "تنظیم لایحه دفاعیه" : "تحلیل پرونده"}
                  </h2>
                </div>
              </div>
              <button 
                onClick={() => {
                  setAnalysisResult(null);
                  setShowRiskDetailView(false);
                  setShowPleading(false);
                }}
                className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-full transition-all text-slate-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {analysisStatus === "loading" ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-12 py-10">
                <div className="relative">
                  <div className="w-40 h-40 rounded-full border-[6px] border-emerald-50 border-t-emerald-500 animate-spin shadow-sm" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center animate-pulse">
                      <Sparkles className="w-12 h-12 text-emerald-500" />
                    </div>
                  </div>
                </div>
                <div className="space-y-5">
                  <h3 className="text-2xl font-black text-slate-800 tracking-wider animate-pulse">{analysisProgressMsg}</h3>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 pb-20">
                {showRiskDetailView ? (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    {/* Back Button */}
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <button
                        onClick={() => setShowRiskDetailView(false)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black flex items-center gap-1.5 transition-all"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        بازگشت به گزارش تحلیل
                      </button>
                      <h4 className="text-xs font-black text-slate-800">جزئیات ریسک و شبیه‌ساز شانس موفقیت</h4>
                    </div>

                    {/* Detailed Risk Content */}
                    <div className="space-y-6">
                      {/* Section 1: Detailed Meaning */}
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
                            <HelpCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-900">مفهوم ریسک در این پرونده چیست؟</h3>
                            <p className="text-[10px] text-slate-400 font-bold">تحلیل معنایی و حقوقی متغیر ریسک برای پرونده ویژه شما</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-700 leading-6 font-bold text-justify">
                          {getRiskDetails()?.meaning}
                        </p>
                      </div>

                      {/* Section 2: Success & Failure Options Split */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Success Card */}
                        <div className="bg-emerald-50/40 border border-emerald-100/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">امید به موفقیت (پیروزی)</span>
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="text-3xl font-black text-emerald-700 tracking-tight mb-2">
                              {getRiskDetails()?.successChance}
                            </div>
                            <p className="text-xs text-slate-700 leading-6 font-bold text-justify">
                              <strong className="text-emerald-800">علت اصلی موفقیت:</strong> {getRiskDetails()?.successReason}
                            </p>
                          </div>
                        </div>

                        {/* Failure Card */}
                        <div className="bg-red-50/40 border border-red-100/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-[10px] font-black uppercase tracking-wider text-red-800 bg-red-100 px-2.5 py-1 rounded-full">ریسک شکست (رد دعوا)</span>
                              <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="text-3xl font-black text-red-700 tracking-tight mb-2">
                              {getRiskDetails()?.failureChance}
                            </div>
                            <p className="text-xs text-slate-700 leading-6 font-bold text-justify">
                              <strong className="text-red-800">علت اصلی شکست:</strong> {getRiskDetails()?.failureReason}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Educational context on Case Risk */}
                      <div className="border border-slate-100 rounded-2xl p-5 bg-white shadow-sm space-y-3">
                        <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                          <Scale className="w-4 h-4 text-slate-500" />
                          راهنمای حقوقی مدیریت ریسک
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-5 font-bold">
                          هر پرونده قضایی دارای متغیرهایی چون تفسیر سلیقه‌ای قانون توسط قضات، قوت یا ضعف ادله ابرازی و دفاعیات طرف مقابل است. شبیه‌ساز ما بر اساس تطابق مستندات شما با آرای مشابه قبلی، این تخمین را طراحی کرده است. شما می‌توانید با پیگیری مستمر <strong className="text-slate-800">گام‌های پیشنهادی</strong> در صفحه تحلیل، به مرور شانس موفقیت خود را افزایش داده و ریسک کلی را تعدیل کنید.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : showPleading ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <button
                        onClick={() => setShowPleading(false)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black flex items-center gap-1.5 transition-all"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        بازگشت به تحلیل پرونده
                      </button>
                      <h4 className="text-xs font-black text-slate-800">بخش تنظیم هوشمند لایحه قضایی</h4>
                    </div>
                    
                    <PleadingDraftingForm
                      analysisResult={analysisResult}
                      analysisText={selectedAnalysisNoteText}
                      selectedCaseObj={cases.find((c) => c.id === selectedCaseForSave)}
                      onSaveToNotes={handleSavePleadingAsNote}
                    />
                  </div>
                ) : (
                  <>
                    {renderAnalysisContent()}
                    
                    {/* Note saving section */}
                    {!autoSaveCompleted && !saveNotePrompt && (
                      <div className="mt-6 flex justify-center">
                        <button 
                          onClick={() => setSaveNotePrompt(true)}
                          className="px-4 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-black hover:bg-emerald-100 transition-all"
                        >
                          ذخیره در یادداشت‌ها؟
                        </button>
                      </div>
                    )}

                    {saveNotePrompt && !autoSaveCompleted && (
                      <div className="mt-6 p-3 bg-white border border-slate-200 rounded-xl max-w-xs mx-auto animate-in zoom-in-95 shadow-sm">
                        <p className="text-[10px] text-slate-700 font-black text-center mb-3">ذخیره تحلیل در پرونده؟</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleSaveAnalysisAsNote(true)}
                            className="flex-1 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-black hover:bg-emerald-600 transition-all"
                          >
                            بله
                          </button>
                          <button 
                            onClick={() => setSaveNotePrompt(false)}
                            className="flex-1 py-1.5 bg-slate-50 border border-slate-100 text-slate-500 rounded-lg text-[9px] font-black hover:bg-slate-100 transition-all"
                          >
                            خیر
                          </button>
                        </div>
                      </div>
                    )}

                    {autoSaveCompleted && (
                      <div className="mt-6 p-2 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center gap-2 text-emerald-700 max-w-[200px] mx-auto animate-in fade-in zoom-in-95">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="text-[9px] font-black">ذخیره شد.</span>
                      </div>
                    )}

                    {/* Bottom Action Menu - Horizontal Layout - Very Small */}
                    <div className="mt-8 pt-4 border-t border-slate-50">
                      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                        <button 
                          onClick={() => onNavigate?.("client-roadmap")}
                          className="whitespace-nowrap px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black flex items-center gap-1.5 hover:bg-slate-800 transition-all shadow-sm"
                        >
                          <Map className="w-3 h-3" />
                          نقشه راه
                        </button>
                        
                        <button 
                          onClick={() => setShowPleading(true)}
                          className="whitespace-nowrap px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[9px] font-black flex items-center gap-1.5 hover:bg-emerald-100 transition-all"
                        >
                          <FileEdit className="w-3 h-3" />
                          تنظیم لایحه
                        </button>

                        <button 
                          onClick={() => setAnalysisResult(null)}
                          className="whitespace-nowrap px-3 py-1.5 bg-white border border-slate-200 text-slate-500 rounded-lg text-[9px] font-black hover:bg-slate-50 transition-all"
                        >
                          بازگشت
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
