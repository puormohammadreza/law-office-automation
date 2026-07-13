import React, { useState, useEffect } from "react";
import { FileText, Download, Printer, X, Loader2, AlertCircle } from "lucide-react";
import { documentDb } from "../utils/documentStorage";

interface StandaloneDocViewerProps {
  docId: string;
  initialName: string;
  initialType: string;
}

export default function StandaloneDocViewer({ docId, initialName, initialType }: StandaloneDocViewerProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDocument() {
      try {
        setLoading(true);
        const storedUrl = await documentDb.get(docId);
        if (!storedUrl) {
          setError("فایل یافت نشد یا در مرورگر ذخیره نشده است. لطفاً پنجره را بسته و مجدداً از تب اصلی باز کنید.");
          setLoading(false);
          return;
        }

        setDataUrl(storedUrl);

        if (storedUrl.startsWith("data:")) {
          try {
            const parts = storedUrl.split(",");
            const mime = parts[0].match(/:(.*?);/)?.[1] || "application/octet-stream";
            const b64Data = parts[1];
            const byteCharacters = atob(b64Data);
            const byteArrays = [];
            
            for (let offset = 0; offset < byteCharacters.length; offset += 512) {
              const slice = byteCharacters.slice(offset, offset + 512);
              const byteNumbers = new Array(slice.length);
              for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              byteArrays.push(byteArray);
            }
            
            const blob = new Blob(byteArrays, { type: mime });
            const u = URL.createObjectURL(blob);
            setBlobUrl(u);
          } catch (e) {
            console.error("Error creating blob URL:", e);
            setBlobUrl(storedUrl); // Fallback to raw data URI
          }
        } else {
          setBlobUrl(storedUrl);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error loading document:", err);
        setError("خطا در بارگذاری محتوای سند.");
        setLoading(false);
      }
    }

    loadDocument();

    // Cleanup blob URL on unmount
    return () => {
      if (blobUrl && blobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [docId]);

  const handleDownload = () => {
    if (!dataUrl) return;
    try {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = initialName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error("Download failed:", e);
    }
  };

  const handlePrint = () => {
    if (!blobUrl) return;
    const printWindow = window.open(blobUrl, "_blank");
    if (printWindow) {
      printWindow.focus();
      // Most modern browsers support printing directly for PDF or images when they load
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    }
  };

  const isImage = initialType === "image" || initialName.toLowerCase().endsWith(".png") || initialName.toLowerCase().endsWith(".jpg") || initialName.toLowerCase().endsWith(".jpeg") || (dataUrl?.startsWith("data:image/") ?? false);
  const isPdf = initialType === "pdf" || initialName.toLowerCase().endsWith(".pdf") || (dataUrl?.startsWith("data:application/pdf") ?? false);
  const isAudio = initialType === "audio" || initialName.toLowerCase().endsWith(".mp3") || initialName.toLowerCase().endsWith(".wav") || (dataUrl?.startsWith("data:audio/") ?? false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir="rtl">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <FileText className="w-5 h-5" />
          </div>
          <div className="text-right">
            <h1 className="text-xs sm:text-sm font-bold text-slate-100 truncate max-w-xs sm:max-w-md">{initialName}</h1>
            <p className="text-[10px] text-slate-400 mt-0.5">پیش‌نمایش امن سند • پورتال هوشمند وکالت</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Print Button */}
          {(isImage || isPdf) && blobUrl && (
            <button
              onClick={handlePrint}
              className="p-2 sm:px-3 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md"
              title="چاپ سند"
            >
              <Printer className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">چاپ سند</span>
            </button>
          )}

          {/* Download Button */}
          {dataUrl && (
            <button
              onClick={handleDownload}
              className="p-2 sm:px-3 sm:py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/10 active:scale-95"
              title="دانلود مستقیم سند"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">دانلود مستقیم</span>
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={() => window.close()}
            className="p-2 bg-slate-800 hover:bg-red-500 hover:text-white text-slate-400 rounded-xl transition cursor-pointer"
            title="بستن این پنجره"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 overflow-auto bg-slate-950/40 relative">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
            <p className="text-xs font-bold text-slate-400">در حال آماده‌سازی و بازخوانی امن سند...</p>
          </div>
        ) : error ? (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-sm font-bold text-slate-200">عدم دسترسی به سند</h2>
              <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
            </div>
            <button
              onClick={() => window.close()}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              بستن پنجره
            </button>
          </div>
        ) : blobUrl ? (
          <div className="w-full max-w-4xl h-[calc(100vh-120px)] flex items-center justify-center">
            {isImage ? (
              <div className="max-w-full max-h-full overflow-auto rounded-2xl border border-slate-800 shadow-2xl bg-slate-900/40 p-2">
                <img
                  src={blobUrl}
                  alt={initialName}
                  className="max-w-full max-h-[80vh] rounded-xl object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : isPdf ? (
              <object
                data={blobUrl}
                type="application/pdf"
                className="w-full h-full rounded-2xl border border-slate-800 shadow-2xl bg-white"
              >
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 h-full text-slate-400">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-300 mx-auto">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-slate-200 font-bold mb-2">مرورگر شما قادر به نمایش درجا یا مستقیم PDF نیست</p>
                    <p className="text-[11px] text-slate-400 mb-6 leading-relaxed">
                      فایل آماده شده است. می‌توانید فایل را با استفاده از دکمه‌های بالا چاپ یا مستقیماً بر روی دستگاه خود ذخیره و باز کنید.
                    </p>
                    <button
                      onClick={handleDownload}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
                    >
                      <Download className="w-4 h-4" />
                      بارگیری و ذخیره سند بر روی دستگاه
                    </button>
                  </div>
                </div>
              </object>
            ) : isAudio ? (
              <div className="flex flex-col items-center justify-center w-full max-w-md p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
                <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.15)] mx-auto relative overflow-hidden">
                  <div className="absolute inset-0 bg-amber-500/20 blur-xl animate-pulse animate-duration-1000"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 relative z-10"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>
                </div>
                <div className="w-full text-center space-y-1">
                  <p className="text-slate-200 font-bold text-sm truncate px-4" dir="ltr">{initialName}</p>
                  <p className="text-amber-400 text-[10px] uppercase tracking-widest font-black">Audio File</p>
                </div>
                <audio 
                  controls 
                  src={blobUrl} 
                  className="w-full outline-none"
                  controlsList="nodownload"
                />
              </div>
            ) : (
              <div className="text-center space-y-4 py-12 text-slate-400 bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-200">این نوع فایل قابلیت پیش‌نمایش ندارد</p>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                    با کلیک روی دکمه زیر می‌توانید این سند را به صورت فیزیکی دانلود کنید.
                  </p>
                </div>
                <button
                  onClick={handleDownload}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  دانلود مستقیم سند
                </button>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
