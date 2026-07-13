import { safeStorage } from "../utils/safeStorage";
import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, AlertCircle, RefreshCw, Paperclip } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIAssistant() {
  const [lawyerPhoto, setLawyerPhoto] = useState(() => safeStorage.getItem("r_lawyer_photo") || "");
  const [lawyerName, setLawyerName] = useState(() => safeStorage.getItem("r_lawyer_name") || "وکیل مسئول");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `با سلام من ${safeStorage.getItem("r_lawyer_name") || "وکیل مسئول"} هستم چطور میتونم در مسائل حقوقی کمکتان بکنم؟`
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        // Here you would implement the file upload logic, 
        // e.g., convert to data URL or upload to server, 
        // and then send as a message.
        // For now, let's just simulate adding a message about the file.
        setMessages(prev => [...prev, { role: "user", content: `فایل ارسال شد: ${file.name}` }]);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const rawText = textToSend || input;
    if (!rawText.trim()) return;

    if (!textToSend) {
      setInput("");
    }
    setError(null);

    // Offline simulation mode
    if (!navigator.onLine) {
      const updatedMessages = [...messages, { role: "user" as const, content: rawText }];
      setMessages(updatedMessages);
      setLoading(true);
      setTimeout(() => {
        setMessages([
          ...updatedMessages,
          {
            role: "assistant",
            content: "⚠️ اتصال به اینترنت برقرار نیست.\n\nبه عنوان دستیار پورتال دفتری شما، توجه داشته باشید که تحلیل‌های زنده هوش مصنوعی حقوقی نیازمند ارتباط با شبکه است. با این حال، کلیه امکانات ثبت و مدیریت پرونده‌ها، ثبت موکلین، اسناد پیوستی، محاسبات دیه و ارث به صورت ۱۰۰٪ آفلاین و امن درون دیتابیس بومی دستگاه شما قابل استفاده هستند. پس از برقراری مجدد ارتباط، آماده پاسخ‌گویی تخصصی خواهم بود."
          }
        ]);
        setLoading(false);
      }, 1000);
      return;
    }

    setLoading(true);

    const updatedMessages = [...messages, { role: "user" as const, content: rawText }];
    setMessages(updatedMessages);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          systemInstruction: `شما همان ${lawyerName || "وکیل پایه یک دادگستری"} و مشاور حقوقی مجرب ایران هستید. پاسخ‌های خود را به صورت مستقیم، دقیق، مستدل بر پایه مواد قانونی ایران (قانون مدنی، قانون مجازات اسلامی، آیین دادرسی و آرای وحدت رویه) با لحنی صمیمی، مقتدر، محترمانه و حرفه‌ای ارائه فرمایید. از قالب‌های تکراری دستیار هوش مصنوعی پرهیز کرده و همانند یک وکیل کارکشته راهنمایی نمایید.`
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "خطا در پردازش توسط سرور.");
      }

      const data = await response.json();
      setMessages([...updatedMessages, { role: "assistant", content: data.text }]);
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || "برقراری ارتباط موفقیت‌آمیز نبود. لطفا مجددا تلاش فرمایید.";
      if (err.message === "Failed to fetch") errMsg = "ارتباط با سرور اینترنت قطع می‌باشد.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        role: "assistant",
        content: `با سلام من ${lawyerName || "وکیل مسئول"} هستم چطور میتونم در مسائل حقوقی کمکتان بکنم؟`
      }
    ]);
    setError(null);
  };

  return (
    <div id="ai_assistant_section" className="flex flex-col h-[650px] bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden max-w-4xl mx-auto animate-in fade-in duration-350">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500 shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs font-black">گفتگو مستقیم با {lawyerName || "وکیل مسئول"}</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">پاسخ‌دهی هوشمند موجه و بر پایه مراجع رسمی قضایی کشور</p>
          </div>
        </div>
        <button
          onClick={handleClear}
          title="شروع مجدد گفتگو"
          className="text-slate-400 hover:text-white transition p-2 rounded-xl hover:bg-slate-800 cursor-pointer select-none"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
        {messages.map((m, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 max-w-[85%] ${
              m.role === "user" ? "mr-auto flex-row-reverse" : "ml-auto"
            }`}
          >
            {m.role === "user" ? (
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-slate-800 bg-slate-900 text-white text-xs font-bold">
                شما
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-amber-400 bg-amber-500 overflow-hidden text-slate-950 text-xs font-bold shadow-3xs">
                {lawyerPhoto ? (
                  <img src={lawyerPhoto} alt="وکیل" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  "وکیل"
                )}
              </div>
            )}

            <div
              className={`p-3.5 rounded-2xl text-[11px] font-bold leading-relaxed shadow-sm ${
                m.role === "user"
                  ? "bg-slate-900 text-white rounded-tr-none"
                  : "bg-white text-slate-800 border border-slate-100 rounded-tl-none whitespace-pre-wrap"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3 ml-auto animate-pulse">
            <div className="w-8 h-8 rounded-full border border-amber-500/20 bg-amber-500/10 overflow-hidden text-amber-500 flex items-center justify-center shrink-0 text-xs font-bold shadow-3xs">
              {lawyerPhoto ? (
                <img src={lawyerPhoto} alt="وکیل" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                "وکیل"
              )}
            </div>
            <div className="bg-white border border-slate-100 p-3.5 rounded-2xl rounded-tl-none text-[11px] text-slate-500 flex items-center gap-2 shadow-sm font-bold">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-200"></span>
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-300"></span>
              </span>
              در حال بررسی و تحلیل حقوقی...
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-100 rounded-xl text-xs mr-auto ml-auto max-w-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="h-11 px-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition"
          title="ارسال فایل"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleSend()}
          placeholder="سوال حقوقی خود را اینجا مطرح فرمایید..."
          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold focus:ring-1 focus:ring-amber-500 focus:bg-white outline-none transition"
          disabled={loading}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="h-11 px-5 bg-amber-500 border border-amber-500 hover:bg-amber-600 hover:border-amber-600 text-slate-950 rounded-xl flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed text-xs font-black cursor-pointer select-none"
        >
          <Send className="w-4 h-4 rotate-180" />
        </button>
      </div>
    </div>
  );
}
