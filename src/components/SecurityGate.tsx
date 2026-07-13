import { safeStorage } from "../utils/safeStorage";
import React, { useState } from "react";
import { Lock, Shield, User, Key, ShieldCheck, HelpCircle, Fingerprint } from "lucide-react";
import { toPersianDigits } from "../utils/shamsi";
import { getRandomQuote } from "../utils/imamQuotes";

interface SecurityGateProps {
  storedName: string;
  storedNationalId: string;
  storedPass: string;
  isRegistered: boolean;
  onRegisterCustom: (name: string, nationalId: string, pass: string) => void;
  onUnlockSuccess: () => void;
}

export default function SecurityGate({
  storedName,
  storedNationalId,
  storedPass,
  isRegistered,
  onRegisterCustom,
  onUnlockSuccess,
}: SecurityGateProps) {
  // Setup / First-time registration states
  const [regName, setRegName] = useState(storedName || "");
  const [regNationalId, setRegNationalId] = useState(storedNationalId || "");
  const [regPass, setRegPass] = useState(storedPass || "");
  const [regPassConfirm, setRegPassConfirm] = useState(storedPass || "");
  const [regError, setRegError] = useState("");

  // Random quote selected on mount
  const [quote, setQuote] = useState(() => getRandomQuote());

  const handleNextQuote = () => {
    setQuote(getRandomQuote());
  };

  // Login unlock states
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  
  const isCurrentlyInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch(e) {
      return true;
    }
  })();

  const handleBiometricLogin = async () => {
    if (!window.isSecureContext || !window.PublicKeyCredential) {
      setLoginError("سخت‌افزار یا مرورگر شما از احراز هویت بیومتریک (اثر انگشت/تشخیص چهره) پشتیبانی نمی‌کند. از پسورد استفاده کنید.");
      return;
    }

    // Check if we are in an iframe
    let isInIframe = false;
    try {
      isInIframe = window.self !== window.top;
    } catch (e) {
      isInIframe = true; // if it throws, we are in an iframe for sure
    }
    
    try {
      setIsScanning(true);
      setLoginError("");

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      
      const hasEnrolled = safeStorage.getItem("biometric_enrolled") === "true";
      const currentHost = window.location.hostname;

      if (!hasEnrolled) {
        // Registration phase
        if (isInIframe) {
          setLoginError("جهت ثبت اثر انگشت برای بار اول، لطفاً ابتدا برنامه را در یک پنجره جدید (Open in new tab) باز کنید. محدودیت امنیتی مرورگر اجازه ثبت در این بخش را نمی‌دهد.");
          return;
        }

        const createOptions: any = {
          publicKey: {
            challenge: challenge,
            rp: { 
              name: "سامانه قضایی " + (storedName || "دفتر وکالت"), 
              id: currentHost === "localhost" ? "localhost" : undefined 
            },
            user: {
              id: window.crypto.getRandomValues(new Uint8Array(16)),
              name: storedNationalId || "lawyer-" + Date.now(),
              displayName: storedName || "وکیل مسئول"
            },
            pubKeyCredParams: [
              { alg: -7, type: "public-key" }, // ES256
              { alg: -257, type: "public-key" } // RS256
            ],
            authenticatorSelection: { 
              authenticatorAttachment: "platform", 
              userVerification: "required",
              residentKey: "preferred"
            },
            timeout: 60000
          }
        };

        const credential = await navigator.credentials.create(createOptions);
        if (credential) {
          safeStorage.setItem("biometric_enrolled", "true");
          const rawId = new Uint8Array((credential as any).rawId);
          safeStorage.setItem("biometric_cred_id", btoa(String.fromCharCode(...rawId)));
          
          setLoginError("اثر انگشت شما با موفقیت ثبت شد. از این پس می‌توانید بدون پسورد وارد شوید.");
          setTimeout(() => {
            handleNextQuote();
            onUnlockSuccess();
          }, 1500);
        }
      } else {
        // Verification phase
        const storedCredId = safeStorage.getItem("biometric_cred_id");
        const getOptions: any = {
          publicKey: {
            challenge: challenge,
            timeout: 60000,
            userVerification: "required",
            rpId: currentHost === "localhost" ? "localhost" : undefined,
          }
        };

        if (storedCredId) {
          const credIdBytes = Uint8Array.from(atob(storedCredId), c => c.charCodeAt(0));
          getOptions.publicKey.allowCredentials = [{
            id: credIdBytes,
            type: "public-key",
            transports: ["internal"]
          }];
        }

        const assertion = await navigator.credentials.get(getOptions);
        if (assertion) {
          handleNextQuote();
          onUnlockSuccess();
        }
      }
    } catch (err: any) {
      console.error("Biometric implementation error:", err);
      if (err.name === "NotAllowedError") {
        setLoginError("اسکن لغو شد یا اثر انگشت مطابقت نداشت.");
      } else if (err.name === "SecurityError") {
        setLoginError("خطای امنیتی: سیستم بیومتریک در این محیط مسدود شده است. محیطStandalone پیشنهاد می‌شود.");
      } else if (err.name === "NotSupportedError") {
        setLoginError("این دستگاه از تنظیمات امنیتی فعلی پشتیبانی نمی‌کند.");
      } else if (err.name === "InvalidStateError") {
        // Already registered on this device usually
        safeStorage.setItem("biometric_enrolled", "true");
        setLoginError("این دستگاه قبلاً ثبت شده است. دوباره تلاش کنید.");
      } else {
        setLoginError("سیستم بیومتریک در دسترس نیست. شاید نیاز به تنظیم مجدد باشد.");
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");

    if (!regName.trim()) {
      setRegError("نام و نام خانوادگی وکیل نمی‌تواند خالی باشد.");
      return;
    }
    if (!regNationalId.trim() || regNationalId.length < 6) {
      setRegError("کد ملی معتبر وارد کنید.");
      return;
    }
    if (!regPass.trim() || regPass.length < 3) {
      setRegError("کلمه عبور باید حداقل دارای ۳ کاراکتر باشد.");
      return;
    }
    if (regPass !== regPassConfirm) {
      setRegError("رمز عبور و تاییدیه فرستاده شده مطابقت ندارند.");
      return;
    }

    onRegisterCustom(regName, regNationalId, regPass);
    handleNextQuote(); // Prepare fresh quote for next session
    onUnlockSuccess();
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (loginPass === storedPass) {
      handleNextQuote(); // Prepare fresh quote for next session
      onUnlockSuccess();
    } else {
      setLoginError("کد امنیتی یا رمز عبور اشتباه است؛ لطفاً مجدداً تلاش فرمایید.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans select-none my-0">
      {/* Background gradients and visual graphics */}
      <div className="absolute top-[-20%] left-[-25%] w-[80%] h-[80%] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-25%] w-[80%] h-[80%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6 z-10">
        <div className="text-center space-y-4">
          {/* Beautiful traditional visual style quote header with dynamic quotes about Justice */}
          <div className="border border-amber-500/20 bg-amber-100/5 rounded-2xl p-4 text-center space-y-2 animate-in fade-in duration-500">
            <div className="text-amber-500 text-[10px] font-extrabold uppercase tracking-widest">
              {quote.speaker}
            </div>
            <p className="text-amber-300 font-serif text-sm leading-relaxed italic font-black">
              {quote.arabic}
            </p>
            <div className="h-[1px] w-12 bg-amber-500/30 mx-auto my-1"></div>
            <p className="text-slate-200 text-xs leading-relaxed font-bold">
              {quote.persian}
            </p>
            {quote.ref && (
              <div className="text-[9px] text-amber-500/60 font-medium text-center pt-1 font-mono">
                {quote.ref}
              </div>
            )}
            <button
              type="button"
              onClick={handleNextQuote}
              className="mt-2 mx-auto block px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 rounded-lg text-[9px] font-black transition-all cursor-pointer select-none"
            >
              کلام الهی دیگر ⟳
            </button>
          </div>

          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              سامانه هوشمند و یکپارچه مدیریت پرونده‌های وکالت و دفتری
            </p>
          </div>
        </div>

        {!isRegistered ? (
          /* REGISTRATION SCREEN */
          <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-amber-500/10 border border-amber-500/15 p-3 rounded-2xl">
              <span className="text-[10px] text-amber-400 font-black block">نصب و راه‌اندازی اولیه نرم‌افزار</span>
              <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">
                جهت حفاظت از محرمانگی پرونده‌های موکلین شما، ثبت امنیتی اطلاعات پایه و رمز ورود وکیل در این بخش الزامی است. این اطلاعات در این مرورگر به صورت رمزشده ذخیره می‌گردند.
              </p>
            </div>

            {regError && (
              <div className="p-3 bg-red-950/20 text-red-400 border border-red-500/25 rounded-xl text-[11px] font-bold text-center">
                {regError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">نام و نام خانوادگی وکیل:</label>
                <div className="relative">
                  <User className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-3 py-2 text-white outline-none focus:border-amber-500 transition font-bold"
                    placeholder="مثال: رضا پورمحمد"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">کد ملی وکیل دفتری:</label>
                <div className="relative">
                  <ShieldCheck className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={regNationalId}
                    onChange={(e) => setRegNationalId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-3 py-2 text-white outline-none focus:border-amber-500 transition font-mono font-bold"
                    placeholder="کد ملی ده رقمی بدون خط تیره"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">رمز عبور ورود:</label>
                  <div className="relative">
                    <Key className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="password"
                      value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-8 pl-3 py-2 text-white outline-none focus:border-amber-500 transition font-mono font-bold"
                      placeholder="رمز ورود"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-bold">تکرار کلمه عبور:</label>
                  <div className="relative">
                    <Key className="absolute right-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="password"
                      value={regPassConfirm}
                      onChange={(e) => setRegPassConfirm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-8 pl-3 py-2 text-white outline-none focus:border-amber-500 transition font-mono font-bold"
                      placeholder="مجدداً تایپ کنید"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl transition text-xs select-none cursor-pointer mt-2"
            >
              ذخیره و راه‌اندازی امن پورتال دفتری
            </button>
          </form>
        ) : (
          /* UNLOCK LOGIN SCREEN */
          <form onSubmit={handleLoginSubmit} className="space-y-4 animate-in fade-in duration-350">
            <div className="text-center bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60">
              <span className="text-[9px] text-slate-500 font-bold uppercase block">احراز هویت وکیل مسئول</span>
              <h2 className="text-sm font-extrabold text-white mt-1">خوش‌آمدید، جناب وکیل {storedName}</h2>
              <span className="text-[9px] text-amber-500 font-mono font-bold block mt-1">کد ملی ثبت شده: {toPersianDigits(storedNationalId)}</span>
            </div>

            {loginError && (
              <div className="p-3 bg-red-950/20 text-red-400 border border-red-500/25 rounded-xl text-[11px] font-bold text-center space-y-2">
                <p>{loginError}</p>
                {safeStorage.getItem("biometric_enrolled") === "true" && (
                  <button 
                    type="button" 
                    onClick={() => {
                      safeStorage.removeItem("biometric_enrolled");
                      safeStorage.removeItem("biometric_cred_id");
                      setLoginError("تنظیمات بیومتریک بازنشانی شد. می‌توانید دوباره تلاش کنید.");
                    }}
                    className="text-[9px] text-red-300 hover:text-red-200 underline cursor-pointer font-black"
                  >
                    تنظیم مجدد و ثبت دوباره اثر انگشت
                  </button>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[11px] text-slate-400 font-bold">کلمه عبور خود را وارد نمایید:</label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="رمز امنیتی (مثلاً ۱۲۳۴ پیش‌فرض)"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-3 py-2.5 text-white outline-none focus:border-amber-500 transition font-mono font-bold text-center text-sm placeholder:text-slate-700"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isScanning}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl transition text-xs select-none cursor-pointer mt-1 disabled:opacity-50"
            >
              گشایش و ورود ایمن به برنامه
            </button>

            <div className="relative flex items-center justify-center gap-3 my-2">
              <div className="h-[1px] bg-slate-800 flex-1"></div>
              <span className="text-[10px] text-slate-600 font-bold px-2">یا</span>
              <div className="h-[1px] bg-slate-800 flex-1"></div>
            </div>

            <button
              type="button"
              onClick={handleBiometricLogin}
              disabled={isScanning}
              className={`w-full py-2.5 rounded-xl transition text-xs select-none cursor-pointer flex items-center justify-center gap-2 group border relative overflow-hidden ${
                isScanning 
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-500" 
                  : "bg-slate-800 hover:bg-slate-750 text-amber-400 border-amber-500/20"
              }`}
            >
              {isScanning ? (
                <div className="flex items-center gap-2 z-10">
                  <div className="w-3 h-3 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                  <span className="animate-pulse font-black">در حال احراز هویت بیومتریک...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 z-10">
                  <Fingerprint className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="font-black">ورود هوشمند با اثر انگشت</span>
                </div>
              )}
              {isScanning && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent animate-shimmer"></div>
              )}
            </button>

              <div className="text-center pt-2">
                <span className="text-[9.5px] text-slate-500 font-semibold flex flex-col items-center justify-center gap-1 leading-relaxed">
                  <div className="flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-500/60" />
                    در صورت استفاده اول برای نخستین بار، پسورد پیش‌فرض <strong className="text-slate-400 font-mono">1234</strong> است.
                  </div>
                  {isCurrentlyInIframe && (
                    <a 
                      href={window.location.href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-amber-500 hover:text-amber-400 underline mt-1"
                    >
                      باز کردن برنامه در پنجره جدید (جهت فعالسازی اثر انگشت)
                    </a>
                  )}
                </span>
              </div>
          </form>
        )}

        {/* Footer security labels */}
        <div className="text-center pt-2 border-t border-slate-800">
          <p className="text-[9px] text-slate-500 flex items-center justify-center gap-1">
            <span>سامانه محلی و غیربانکی رمزگذاری شده دسکتاپ</span>
            <span className="text-emerald-500">•</span>
            <span>بسترساز پدافند غیرعامل</span>
          </p>
        </div>
      </div>
    </div>
  );
}
