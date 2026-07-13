import React, { useState, useEffect } from "react";
import { Download, Smartphone, X, Info, Share2, Check, HelpCircle, AlertTriangle } from "lucide-react";

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isInIframe, setIsInIframe] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleForceResetAndRepair = async () => {
    setIsResetting(true);
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        for (const key of keys) {
          await caches.delete(key);
        }
      }
      localStorage.removeItem("pwa_banner_dismissed");
      setDeferredPrompt(null);
      setIsInstallable(false);

      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.register('/sw.js');
        await reg.update();
      }

      setResetSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e) {
      console.error("Failed to reset PWA:", e);
      setIsResetting(false);
    }
  };

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
    }

    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone ||
      window.location.search.includes("pwa=true");
    
    setIsInstalled(!!isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      
      const dismissed = localStorage.getItem("pwa_banner_dismissed");
      if (dismissed !== "true") {
        setIsVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const dismissed = localStorage.getItem("pwa_banner_dismissed");
    if (dismissed === "true") {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA installation outcome: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const dismissBanner = () => {
    setIsVisible(false);
    localStorage.setItem("pwa_banner_dismissed", "true");
  };

  if (isInstalled) {
    return null;
  }

  return (
    <div className="w-full mb-6">
      {!isVisible && (
        <button
          onClick={() => setIsVisible(true)}
          className="flex items-center gap-2 px-4 py-2 mx-auto bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-full text-xs font-bold transition-all border border-amber-500/20 cursor-pointer shadow-sm animate-bounce"
        >
          <Smartphone className="w-4 h-4 animate-pulse" />
          <span>نصب اپلیکیشن</span>
        </button>
      )}

      {isVisible && (
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-slate-100 p-5 rounded-3xl shadow-lg border-2 border-amber-500/40 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <button 
            onClick={dismissBanner}
            className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-xl transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-900 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                <Download className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="text-base font-black text-amber-400">
                  نصب نرم‌افزار (پیشنهاد ویژه)
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  برای سرعت بیشتر و دسترسی آفلاین، سامانه را نصب کنید.
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col gap-3">
              {isInIframe ? (
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5 rotate-180" />
                  باز کردن در تب جدید جهت نصب
                </a>
              ) : isInstallable ? (
                <button
                  onClick={handleInstallClick}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-2xl text-base transition shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 animate-pulse"
                >
                  <Download className="w-6 h-6" />
                  بله، همین الان نصب شود
                </button>
              ) : isIOS ? (
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-2xl text-sm border border-amber-500/20 flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  راهنمای نصب آیفون
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-2xl text-sm border border-slate-700 flex items-center justify-center gap-2"
                  >
                    <Info className="w-5 h-5" />
                    راهنمای نصب از طریق مرورگر
                  </button>
                </div>
              )}
            </div>

            {/* FIX SECTION */}
            {!isInstallable && !isInIframe && !isIOS && (
              <div className="mt-2 bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl">
                <h4 className="text-xs font-black text-rose-400 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  دکمه نصب ظاهر نمی‌شود؟ (حتماً بخوانید)
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed mb-3 text-justify">
                  اگر مرورگر شما در منوی خود به جای «نصب برنامه»، گزینه <strong>«ایجاد میان‌بر»</strong> را نشان می‌دهد، به این دلیل است که گوگل کروم نصب‌های مجدد را مسدود می‌کند. <strong className="text-white">برای رفع این مشکل امنیتی گوگل کروم و فعال شدن دکمه نصب:</strong> روی دکمه قرمز زیر کلیک کنید.
                </p>
                <button
                  onClick={handleForceResetAndRepair}
                  disabled={isResetting}
                  className="w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white shadow-lg"
                >
                  {isResetting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                      در حال پاکسازی...
                    </span>
                  ) : resetSuccess ? (
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      انجام شد! لطفاً صبر کنید...
                    </span>
                  ) : (
                    "رفع مشکل و فعال‌سازی دکمه نصب"
                  )}
                </button>
              </div>
            )}

            {showInstructions && (
              <div className="mt-2 bg-slate-950/50 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {isIOS ? (
                  <ul className="list-disc pr-4 space-y-2 text-right">
                    <li>در مرورگر سافاری، دکمه Share (اشتراک گذاری) در پایین صفحه را بزنید.</li>
                    <li>گزینه Add to Home Screen را انتخاب کنید.</li>
                    <li>در بالا سمت راست روی Add بزنید.</li>
                  </ul>
                ) : (
                  <ul className="list-disc pr-4 space-y-2 text-right">
                    <li>روی دکمه سه نقطه مرورگر کروم کلیک کنید.</li>
                    <li>گزینه <strong>Install App</strong> یا <strong>نصب برنامه</strong> را انتخاب کنید.</li>
                    <li className="text-rose-300 font-bold">توجه: اگر به جای نصب، نوشته بود «ایجاد میان‌بر»، لطفاً روی دکمه قرمز رنگ بالا کلیک کنید تا مشکل حل شود.</li>
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
