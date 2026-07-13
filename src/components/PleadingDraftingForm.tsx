import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Copy, 
  Check, 
  Printer, 
  Save, 
  AlertCircle,
  ArrowRight,
  Edit2,
  Eye,
  RefreshCw,
  Settings,
  FileText
} from "lucide-react";

interface PleadingDraftingFormProps {
  analysisResult: any;
  analysisText?: string;
  selectedCaseObj: any;
  onSaveToNotes: (content: string, title: string) => void;
}

export const PleadingDraftingForm: React.FC<PleadingDraftingFormProps> = ({
  analysisResult,
  analysisText,
  selectedCaseObj,
  onSaveToNotes
}) => {
  const [lawyerRole, setLawyerRole] = useState<"plaintiff" | "defendant" | "complainant" | "accused">("plaintiff");
  const [tone, setTone] = useState<"formal" | "firm" | "conciliatory">("formal");
  const [draftingStatus, setDraftingStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [draftingProgressMsg, setDraftingProgressMsg] = useState("");
  const [pleadingText, setPleadingText] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  // Helper: Convert API text response (with double newlines) to clean paragraphs or lines
  const cleanAndFormatText = (text: string) => {
    if (!text) return "";
    // If the text contains HTML-like paragraph tags already, keep it, otherwise format nicely
    if (text.includes("<p>") || text.includes("<br>")) {
      // Strip HTML tag wrappers if we want plain text for editor
      const temp = document.createElement("div");
      temp.innerHTML = text;
      return temp.textContent || temp.innerText || text;
    }
    return text.trim();
  };

  const handleGeneratePleading = async () => {
    
    
    setDraftingStatus("loading");
    setDraftingProgressMsg("در حال استخراج مستندات و تنظیم بدنه لایحه...");

    try {
      const roleLabel = 
        lawyerRole === "plaintiff" ? "وکیل خواهان" :
        lawyerRole === "defendant" ? "وکیل خوانده" :
        lawyerRole === "complainant" ? "وکیل شاکی" :
        "وکیل متهم";

      const toneLabel = 
        tone === "formal" ? "رسمی و حقوقی" :
        tone === "firm" ? "تند و قاطع" :
        "سازش‌طلبانه";

      const promptText = `شما یک وکیل تراز اول و قاضی بازنشسته دیوان عالی کشور هستید.
بر اساس تحلیل تخصصی زیر، یک لایحه دفاعیه «جامع و مانع»، مستدل و فوق‌تخصصی از طرف «${roleLabel}» با لحن «${toneLabel}» تنظیم کنید.

اطلاعات پرونده:
- موضوع: ${selectedCaseObj?.title || "پرونده حقوقی"}
- نقش موکل: ${roleLabel} (نام موکل: ${selectedCaseObj?.clientName || "موکل"})
- طرف مقابل: ${selectedCaseObj?.opposingPartyName || "طرف مقابل"}

${analysisText ? `مستندات و تحلیل قبلی پرونده:\n${analysisText}` : `مستندات استخراج شده از تحلیل (باید حتماً در لایحه استفاده شوند):
- کلمات کلیدی: ${analysisResult?.keywords?.join(" ، ") || "تحلیل عمومی"}
- مواد قانونی: ${analysisResult?.laws?.map((l: any) => l.article).join(" ، ") || "قوانین عام مرتبط"}
- آرای وحدت رویه: ${analysisResult?.precedents?.map((p: any) => `${p.title}: ${p.desc}`).join(" \n ") || "موردی یافت نشد"}
- نظریات مشورتی اداره حقوقی: ${analysisResult?.opinions?.map((o: any) => `${o.title}: ${o.desc}`).join(" \n ") || "موردی یافت نشد"}
- آرای اصراری: ${analysisResult?.judgements?.map((j: any) => `${j.title}: ${j.desc}`).join(" \n ") || "موردی یافت نشد"}`}

دستورالعمل تنظیم:
۱. لایحه باید با «بسمه تعالی» آغاز شود.
۲. خطاب به «ریاست محترم شعبه رسیدگی کننده».
۳. مقدمه‌ای فنی و قوی شامل کلاسه پرونده و مشخصات اصحاب دعوی.
۴. بدنه اصلی شامل دفاعیات ماهوی و شکلی با استناد دقیق به مواد قانونی و آرای وحدت رویه مذکور.
۵. استفاده از عبارات حقوقی فاخر، مستند و محکمه‌پسند متناسب با لحن ${toneLabel}.
۶. خلاصه تحلیلی بسیار قوی و اقناع‌کننده.
۷. نتیجه‌گیری قوی و درخواست صریح از دادگاه.
۸. پایان با عبارت «با احترام - ${roleLabel}».

متن لایحه باید طولانی، دقیق، جامع و کاملاً مستند به موازین قانونی باشد. پاسخ را فقط به زبان فارسی برگردانید. هیچ متن توضیحی اضافی قبل یا بعد از لایحه قرار ندهید. فقط و فقط خود لایحه دفاعیه را بنویسید.`;

      if (!navigator.onLine) {
        // Generate an elite, custom offline pleading draft
        const draft = `بسمه تعالی

ریاست محترم شعبه رسیدگی کننده دادگاه عمومی حقوقی / کیفری
موضوع: لایحه دفاعیه در خصوص پرونده موضوع: «${selectedCaseObj?.title || "پرونده حقوقی"}»

با سلام و دعای خیر؛
احتراماً اینجانب به عنوان ${roleLabel}، در مقام دفاع از حقوق موکل خویش آقای/خانم «${selectedCaseObj?.clientName || "موکل"}» در برابر دعوای مطروحه از سوی «${selectedCaseObj?.opposingPartyName || "خواهان / شاکی"}»، به استحضار عالی می‌رساند:

۱. مقدمه و تشریح ماوقع:
خواسته و ادعای طرف مقابل فاقد هرگونه مبنای متقن و ادله اثباتی مستند است. بر اساس مستندات ابرازی، تعهدات فی‌مابین طرفین مشمول توافقات و تفاهمات بومی بوده که متأسفانه طرف مقابل با نادیده گرفتن حقیقت عینی ماجرا، اقدام به طرح دعوای واهی نموده است.

۲. دفاعیات تخصصی و استنادات قانونی:
- به موجب مواد قانونی مرتبط از جمله: ${analysisResult?.laws?.map((l: any) => l.article).join(" ، ") || "ماده ۱۰ قانون مدنی (اصل آزادی قراردادها) و قوانین آیین دادرسی مدنی"}، تعهدات قراردادی بر اساس اصل حاکمیت اراده و لزوم وفای به عهد ارزیابی می‌گردد.
- همچنین، آرای محاکم عالی و آرای وحدت رویه از جمله: ${analysisResult?.precedents?.map((p: any) => p.title).join(" ، ") || "رأی وحدت رویه شماره ۸۰۶ دیوان عالی کشور"}، بر لزوم احراز دقیق منشأ طلب و تایید اصالت توافق خصوصی دلالت تام دارند.

۳. نتیجه‌گیری و درخواست نهایی از دادگاه:
بنا به مراتب مسطوره و با عنایت به ادله ابرازی و اصل عدم تبرع، صدور حکم شایسته مبنی بر رد دعوای واهی خواهان و تایید اصالت حقوق موکل مورد استدعا می‌باشد.

با احترام وافر و سپاس شایسته؛
${roleLabel} - لایحه تخصصی تولید شده در حالت آفلاین و مستقل از شبکه`;

        setTimeout(() => {
          setPleadingText(draft);
          setDraftingStatus("success");
          setIsEditMode(false);
        }, 1200);
        return;
      }

      const response = await fetch(`${window.location.origin}/api/gemini/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: promptText }],
          systemInstruction: "شما یک وکیل پایه یک دادگستری متخصص در نگارش لوایح قضایی وزین و فنی هستید."
        })
      });

      if (!response.ok) throw new Error("API call failed");
      
      const data = await response.json();
      const rawText = data.text || "";
      const cleaned = cleanAndFormatText(rawText);
      setPleadingText(cleaned);
      setDraftingStatus("success");
      setIsEditMode(false); // Default to preview mode for clean visual reading
    } catch (error) {
      console.error("Drafting error details:", error);
      setDraftingStatus("error");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(pleadingText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      // Formatted HTML for neat printing
      const formattedHtml = pleadingText
        .split('\n')
        .map(line => line.trim() ? `<p>${line}</p>` : '<p><br></p>')
        .join('');

      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>چاپ لایحه دفاعیه قضایی</title>
            <style>
              @page {
                size: A4;
                margin: 20mm;
              }
              body { 
                font-family: 'Tahoma', 'Arial', sans-serif; 
                padding: 10px; 
                line-height: 2.2; 
                color: #0f172a; 
                background: #white; 
                font-size: 14px;
              }
              .page { 
                background: white; 
                max-width: 800px; 
                margin: 0 auto; 
                text-align: justify;
              }
              .header { 
                text-align: center; 
                margin-bottom: 30px; 
                font-size: 16px;
                font-weight: bold; 
                border-bottom: 1px double #cbd5e1; 
                padding-bottom: 15px; 
              }
              .meta-info {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                margin-bottom: 30px;
                color: #334155;
              }
              .content { 
                text-align: justify; 
              }
              p { 
                margin-bottom: 1.2em; 
                text-indent: 15px;
              }
            </style>
          </head>
          <body>
            <div class="page">
              <div class="header">بسمه تعالی</div>
              <div class="meta-info">
                <div>تاریخ: ${new Date().toLocaleDateString("fa-IR")}</div>
                <div>کلاسه پرونده: ${selectedCaseObj?.caseNumber || "در دست اقدام"}</div>
                <div>پیوست: دارد</div>
              </div>
              <div class="content">${formattedHtml}</div>
            </div>
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleSave = () => {
    // Save to notes using callback
    const title = `لایحه دفاعیه (${lawyerRole === "plaintiff" || lawyerRole === "complainant" ? "خواهان/شاکی" : "خوانده/متهم"}) - ${new Date().toLocaleDateString("fa-IR")}`;
    
    // Sanitize: remove control characters except newline
    const sanitizedText = pleadingText.replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g, "");

    onSaveToNotes(sanitizedText, title);
    setSaveStatus("لایحه با موفقیت در یادداشت‌های پرونده ذخیره شد.");
    setTimeout(() => setSaveStatus(""), 3000);
  };

  // Render the setup panel
  if (draftingStatus === "idle" || draftingStatus === "loading" || draftingStatus === "error") {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">تنظیم هوشمند لایحه قضایی</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">تنظیم پیش‌نویس لایحه دفاعیه مستند به موازین قانونی بر اساس تحلیل هوش مصنوعی</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Lawyer Role Select */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-2 pr-1">نقش موکل شما در پرونده:</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "plaintiff", label: "خواهان" },
                { id: "defendant", label: "خوانده" },
                { id: "complainant", label: "شاکی" },
                { id: "accused", label: "متهم" }
              ].map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setLawyerRole(role.id as any)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                    lawyerRole === role.id
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                      : "bg-slate-50/50 border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tone Select */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-2 pr-1">لحن نگارش و ادبیات لایحه:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "formal", label: "رسمی و محتاط" },
                { id: "firm", label: "قاطع و صریح" },
                { id: "conciliatory", label: "مصالحه‌آمیز" }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id as any)}
                  className={`py-2 px-2 rounded-xl border text-[10px] font-bold transition-all text-center ${
                    tone === t.id
                      ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                      : "bg-slate-50/50 border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-2">
            <button
              onClick={handleGeneratePleading}
              disabled={draftingStatus === "loading"}
              className={`w-full py-3.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md ${
                draftingStatus === "loading"
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10"
              }`}
            >
              {draftingStatus === "loading" ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin shrink-0" />
                  <span className="animate-pulse">{draftingProgressMsg}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>تنظیم و ساخت لایحه دفاعیه</span>
                </>
              )}
            </button>
          </div>

          {draftingStatus === "error" && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2.5 text-red-600 mt-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-[10px] font-bold">بروز خطا در برقراری ارتباط با هوش مصنوعی. لطفاً مجدداً تلاش کنید.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render the Generated Pleading page (صفحه جدید و مرتب)
  return (
    <div className="space-y-4 w-full animate-in fade-in duration-500">
      {/* Operation Action Bar - Compact & Tidy */}
      <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-md">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1.5 transition-all ${
              isEditMode 
                ? "bg-amber-500 text-white" 
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
            title={isEditMode ? "مشاهده پیش‌نمایش" : "ویرایش لایحه"}
          >
            {isEditMode ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>مشاهده لایحه</span>
              </>
            ) : (
              <>
                <Edit2 className="w-3.5 h-3.5" />
                <span>ویرایش لایحه</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Save to Notes */}
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black flex items-center gap-1.5 transition-all"
            title="ذخیره در پرونده"
          >
            <Save className="w-3.5 h-3.5" />
            <span>ذخیره نهایی</span>
          </button>

          {/* Copy Text */}
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black flex items-center gap-1.5 transition-all"
            title="کپی کردن متن"
          >
            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? "کپی شد" : "کپی لایحه"}</span>
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-[10px] font-black flex items-center gap-1.5 transition-all"
            title="چاپ لایحه"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>چاپ</span>
          </button>

          {/* Re-draft Settings */}
          <button
            onClick={() => setDraftingStatus("idle")}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-[10px] font-black flex items-center transition-all"
            title="تغییر تنظیمات"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-center text-[10px] font-bold text-emerald-700 animate-in fade-in duration-300">
          {saveStatus}
        </div>
      )}

      {/* Neat Court Paper Pleading View (صفحه جدید و مرتب) */}
      <div className="bg-white border-2 border-double border-slate-200 rounded-3xl overflow-hidden shadow-md">
        {/* Paper Header Decoration */}
        <div className="border-b border-slate-100 bg-slate-50/50 p-4 flex justify-between items-center text-[9px] text-slate-400 font-bold">
          <div>سامانه هوشمند وکالت - لایحه قضایی</div>
          <div>تاریخ تنظیم: {new Date().toLocaleDateString("fa-IR")}</div>
        </div>

        {isEditMode ? (
          /* High Fidelity Mobile-Responsive Textarea */
          <div className="p-4 bg-slate-50/50">
            <textarea
              value={pleadingText}
              onChange={(e) => setPleadingText(e.target.value)}
              className="w-full h-[500px] p-5 text-sm md:text-base text-slate-800 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-sans leading-relaxed text-justify resize-none shadow-inner"
              placeholder="متن لایحه را ویرایش کنید..."
              dir="rtl"
            />
          </div>
        ) : (
          /* Realistic Court Paper Preview Layout */
          <div className="p-8 md:p-12 bg-white relative">
            {/* Top Emblem and Header */}
            <div className="text-center mb-8 border-b border-slate-100 pb-6 relative">
              <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">بسمه تعالی</div>
              <div className="text-[10px] font-bold text-slate-400 absolute right-0 top-0 text-right space-y-1">
                <div>شماره: {selectedCaseObj?.caseNumber || "در دست اقدام"}</div>
                <div>تاریخ: {new Date().toLocaleDateString("fa-IR")}</div>
              </div>
              <div className="text-[10px] font-bold text-slate-400 absolute left-0 top-0 text-left">
                <div>پیوست: دارد</div>
              </div>
              <div className="h-6" /> {/* Spacer for absolute headers */}
            </div>

            {/* Document Body */}
            <div className="space-y-5 text-sm md:text-[15px] text-slate-900 font-medium leading-[2.2] text-justify select-text">
              {pleadingText.split('\n').map((paragraph, index) => {
                const trimmed = paragraph.trim();
                if (!trimmed) return <div key={index} className="h-3" />;
                
                // Style lines nicely based on keywords
                const isHeading = trimmed.startsWith("بسمه تعالی") || trimmed.startsWith("ریاست محترم") || trimmed.startsWith("با احترام");
                
                return (
                  <p 
                    key={index} 
                    className={`${isHeading ? 'font-black text-slate-950' : 'text-slate-800'} ${trimmed.startsWith("با احترام") ? 'text-left mt-8 pl-4' : 'indent-4 md:indent-8'}`}
                  >
                    {trimmed}
                  </p>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
