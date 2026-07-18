import { safeStorage } from "../utils/safeStorage";
import React, { useState, useEffect } from "react";
import {
  Shield,
  Usb,
  MessageSquare,
  CloudUpload,
  UserCheck,
  RefreshCw,
  FolderDown,
  FolderUp,
  Server,
  CheckCircle,
  AlertCircle,
  Key,
  Database,
  Lock,
  Compass,
  LogOut,
  Mail
} from "lucide-react";
import { toPersianDigits } from "../utils/shamsi";
import { auth, signInWithGoogle, onAuthStateChanged, signOut } from "../firebase/config";
import { syncFullStateToCloud, restoreFromCloud } from "../firebase/db";
import { documentDb } from "../utils/documentStorage";
type User = { uid: string; email?: string | null };
import { Client, LegalCase, CaseNote, CaseDocument, LegalEvent } from "../types";
import BackupCenter from "./BackupCenter";

interface BackupSecurityHubProps {
  clients: any[];
  cases: any[];
  notes: any[];
  documents: any[];
  events: any[];
  lawyerName: string;
  lawyerNationalId: string;
  lawyerPassword: string;
  lawyerPhoto: string;
  onUpdateProfile: (name: string, nationalId: string, pass: string, photo?: string) => void;
  onTriggerRestore: (backupData: any) => void;
  onLockScreen: () => void;
  onNavigate?: (tab: string, subTab?: string, stateToPass?: any) => void;
}

export default function BackupSecurityHub({
  clients,
  cases,
  notes,
  documents,
  events,
  lawyerName,
  lawyerNationalId,
  lawyerPassword,
  lawyerPhoto,
  onUpdateProfile,
  onTriggerRestore,
  onLockScreen,
  onNavigate
}: BackupSecurityHubProps) {
  const [activeSubTab, setActiveSubTab] = useState<"backup" | "security">("backup");

  // Auth state
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Profile management states
  const [profName, setProfName] = useState(lawyerName);
  const [profNationalId, setProfNationalId] = useState(lawyerNationalId);
  const [profPass, setProfPass] = useState(lawyerPassword);
  const [profPassConfirm, setProfPassConfirm] = useState(lawyerPassword);
  const [profPhoto, setProfPhoto] = useState(lawyerPhoto || "");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");

  // Cloud Sync states
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudBackupExists, setCloudBackupExists] = useState(false);
  const [cloudBackupMeta, setCloudBackupMeta] = useState<{
    date: string;
    clientsCount: number;
    casesCount: number;
    notesCount: number;
    docsCount: number;
    eventsCount: number;
  } | null>(null);
  const [cloudMsg, setCloudMsg] = useState("");
  const [cloudError, setCloudError] = useState("");
  const [cloudLogs, setCloudLogs] = useState<string[]>([]);

  useEffect(() => {
    // Check if cloud backup slot exists
    const cloudRaw = safeStorage.getItem("r_cloud_backup_slot");
    if (cloudRaw) {
      try {
        const parsed = JSON.parse(cloudRaw);
        setCloudBackupExists(true);
        setCloudBackupMeta({
          date: parsed.backupDateShort || "۱۴۰۵/۰۳/۲۵",
          clientsCount: parsed.clients?.length || 0,
          casesCount: parsed.cases?.length || 0,
          notesCount: parsed.notes?.length || 0,
          docsCount: parsed.documents?.length || 0,
          eventsCount: parsed.events?.length || 0
        });
      } catch (e) {
        setCloudBackupExists(false);
      }
    }
  }, []);

  // --- FLASH USB EXPORT ---
  const handleFlashExport = async () => {
    const fullDocs = await Promise.all(
      documents.map(async (doc) => {
        const dataUrl = await documentDb.get(doc.id);
        return {
          ...doc,
          dataUrl: dataUrl || doc.dataUrl || ""
        };
      })
    );

    const backupObj = {
      clients,
      cases,
      notes,
      documents: fullDocs,
      events,
      exportVersion: "2.0_USB",
      exportDate: new Date().toISOString(),
      backupType: "USB_FLASH_DRIVE_EXPLICIT",
      lawyerName,
      lawyerNationalId,
      lawyerPassword,
      lawyerPhoto
    };
    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `پشتیبان_کامل_سیستم_فلش_${lawyerName.replace(/\s+/g, "_")}_${new Date().toLocaleDateString("fa-IR").replace(/\//g, "-")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Simulated short log info
    setCloudLogs((prev) => [
      `[${new Date().toLocaleTimeString("fa-IR")}] ایجاد فایل بکاپ دیسک خارجی در فلش مموری با موفقیت انجام شد.`,
      ...prev
    ]);
  };

  // --- FLASH USB IMPORT ---
  const handleFlashImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.clients || parsed.cases || parsed.documents || parsed.events) {
          onTriggerRestore(parsed);

          // Update local cloud backup metadata display if user is logged in
          if (user) {
            const persianDate = new Date().toLocaleDateString("fa-IR");
            const meta = {
              date: persianDate,
              clientsCount: (parsed.clients || []).length,
              casesCount: (parsed.cases || []).length,
              notesCount: (parsed.notes || []).length,
              docsCount: (parsed.documents || []).length,
              eventsCount: (parsed.events || []).length
            };
            setCloudBackupMeta(meta);
            setCloudBackupExists(true);
          }

          alert("اطلاعات فایل پشتیبان پورتال با موفقیت بازخوانی و جایگزین داده‌های محلی مرورگر گردید.");
        } else {
          alert("ساختار فایل ورودی با شناسه‌های عدلی دفتری این برنامه همخوانی ندارد. لطفاً فایل معتبر انتخاب کنید.");
        }
      } catch (err) {
        alert("خطا در تفکیک ارقام فایل پشتیبان. لطفاً فرمت فایل را بررسی کنید.");
      }
    };
    reader.readAsText(file);
  };

  // --- CLOUD SYNC FIREBASE ---
  const handleLogin = async () => {
    setCloudError("");
    try {
      setIsCloudSyncing(true);
      await signInWithGoogle();
      setCloudMsg("خوش آمدید! اکنون می‌توانید از فضای ابری استفاده کنید.");
    } catch (error: any) {
      setCloudError(error.message && error.message.includes("دامنه") ? error.message : "خطا در ورود به حساب کاربری. ممکن است پاپ‌آپ مسدود شده باشد یا نیاز باشد آدرس سایت را در دامنه‌های مجاز فایربیس ثبت کنید.");
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCloudMsg("از حساب کاربری خارج شدید.");
  };

  const handleCloudBackupPush = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!user) {
      setCloudError("لطفاً ابتدا وارد حساب کاربری گوگل شوید تا همگام‌سازی ابری فعال گردد.");
      return;
    }

    // SAFEGUARD: If trying to push an empty local state, check first to protect valuable backups
    const isLocalEmpty = clients.length === 0 && cases.length === 0;
    if (isLocalEmpty && cloudBackupExists) {
      if (!window.confirm("توجه: شما هیچ اطلاعات موکل یا پرونده‌ای در نرم‌افزار ثبت نکرده‌اید (برنامه خالی است). در صورت همگام‌سازی، بکاپ ابری قبلی شما پاک خواهد شد. آیا مطمئنید؟")) {
        setCloudMsg("همگام‌سازی توسط کاربر لغو شد.");
        return;
      }
    }

    setCloudError("");
    setIsCloudSyncing(true);
    setCloudMsg("در حال برقراری کانال رمزگذاری شده با سرور ابری پشتیبان...");
    setCloudLogs((prev) => [`[${new Date().toLocaleTimeString("fa-IR")}] تلاش برای اتصال امن دوجداره به سرور ابری`, ...prev]);

    try {
      // Strip base64 files to prevent Firestore 1MB quota limit error
      const safeDocs = documents.map(d => {
        const copy = { ...d };
        delete copy.dataUrl;
        return copy;
      });

      await syncFullStateToCloud(user.uid, {
        clients,
        cases,
        notes,
        documents: safeDocs,
        events
      });

      const persianDate = new Date().toLocaleDateString("fa-IR");
      
      const meta = {
        date: persianDate,
        clientsCount: clients.length,
        casesCount: cases.length,
        notesCount: notes.length,
        docsCount: documents.length,
        eventsCount: events.length
      };
      safeStorage.setItem(`r_cloud_backup_meta_${user.uid}`, JSON.stringify(meta));

      setCloudBackupExists(true);
      setCloudBackupMeta(meta);

      setCloudMsg("همگام‌سازی ابری با موفقیت ۱۰۰٪ به اتمام رسید.");
      setCloudLogs((prev) => [
        `[${new Date().toLocaleTimeString("fa-IR")}] آپلود ابری سرور با شناسه تراکنش ثبت شد.`,
        `[${new Date().toLocaleTimeString("fa-IR")}] انتقال موفقیت‌آمیز به فضای ابری ${user.email}`,
        ...prev
      ]);
    } catch (error: any) {
      const errorMsg = error && error.message ? error.message : "";
      const errorData = errorMsg.startsWith('{') ? JSON.parse(errorMsg) : { error: errorMsg || "خطای ناشناخته" };
      setCloudError(`خطا در همگام‌سازی: ${errorData.error}`);
      setCloudMsg("خطای عملیاتی در ابر.");
      setCloudLogs((prev) => [`[${new Date().toLocaleTimeString("fa-IR")}] خطا: ${errorData.error}`, ...prev]);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleCloudRestorePull = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!user) return;

    setCloudError("");
    setIsCloudSyncing(true);
    setCloudMsg("در حال دانلود و بازیابی کل آرشیو وکالتی از ابر پشتیبان...");
    setCloudLogs((prev) => [`[${new Date().toLocaleTimeString("fa-IR")}] ردیابی دیتابیس ابری و تخلیه پکت اطلاعاتی`, ...prev]);

    try {
      const data = await restoreFromCloud(user.uid);
      
      // Calculate totals to see if cloud is empty
      const totalItems = 
        (data?.clients?.length || 0) + 
        (data?.cases?.length || 0) + 
        (data?.notes?.length || 0) + 
        (data?.documents?.length || 0) + 
        (data?.events?.length || 0);

      if (totalItems === 0) {
        setCloudError("پیکربندی ابری شما کاملاً خالی است. داده‌ای برای بازیابی وجود ندارد.");
        setCloudLogs((prev) => [`[${new Date().toLocaleTimeString("fa-IR")}] هشدار: بازیابی لغو شد (ابر خالی)`, ...prev]);
        setIsCloudSyncing(false);
        return;
      }

      if (data) {
        onTriggerRestore(data);
        setCloudMsg("بازیابی و ست‌آپ نهایی داده‌های ابری با موفقیت انجام شد.");
        setCloudLogs((prev) => [`[${new Date().toLocaleTimeString("fa-IR")}] سیستم با دیتای ابری بروزرسانی شد.`, ...prev]);
      }
    } catch (error: any) {
      setCloudError("خطایی در بازیابی اطلاعات رخ داد: " + error.message);
      setCloudLogs((prev) => [`[${new Date().toLocaleTimeString("fa-IR")}] خطا در بازیابی ابری`, ...prev]);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  useEffect(() => {
    if (user) {
      const savedMeta = safeStorage.getItem(`r_cloud_backup_meta_${user.uid}`);
      if (savedMeta) {
        setCloudBackupMeta(JSON.parse(savedMeta));
        setCloudBackupExists(true);
      } else {
        setCloudBackupExists(false);
        setCloudBackupMeta(null);
      }
    }
  }, [user]);

  // --- SAVE PROFILE & PASSWORD ---
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg("");
    setProfileErrorMsg("");

    if (!profName.trim()) {
      setProfileErrorMsg("نام وکیل نمی‌تواند تهی باشد.");
      return;
    }
    if (!profNationalId.trim() || profNationalId.length < 8) {
      setProfileErrorMsg("کد ملی وکیل باید حداقل دارای ۸ کاراکتر عددی باشد.");
      return;
    }
    if (profPass.length < 3) {
      setProfileErrorMsg("کلمه عبور امنیتی باید حداقل دارای ۳ کاراکتر باشد.");
      return;
    }
    if (profPass !== profPassConfirm) {
      setProfileErrorMsg("کلمه عبور وارد شده با تاییدیه آن مطابقت ندارد.");
      return;
    }

    onUpdateProfile(profName, profNationalId, profPass, profPhoto);
    setProfileSuccessMsg("مشخصات هویتی، تصویر پرسنلی و رمز عبور ورود با موفقیت ذخیره شد.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-950 text-white rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center border border-amber-500/20 gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full w-fit border border-amber-500/20">
            <Lock className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">مدیریت امنیت، پشتیبان‌گیری و دسترسی پورتال</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white mt-3">
            پشتیبان‌گیری، امنیت و رمز ورود
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 font-medium">
            پشتیبان‌گیری ابری و محلی اطلاعات دفتری، تنظیم هویت قانونی وکیل مسئول و مدیریت رمز عبور ورود در پورتال {lawyerName || "وکیل"}
          </p>
        </div>
        <button
          onClick={onLockScreen}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 select-none shrink-0 cursor-pointer shadow-md shadow-red-900/10 animate-pulse"
        >
          <Lock className="w-4 h-4" />
          قفل آنی نرم‌افزار (خروج امن)
        </button>
      </div>

      {/* Embedded Sub-Tabs selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveSubTab("backup")}
          className={`px-5 py-3 text-xs font-black transition-all border-b-2 cursor-pointer select-none ${
            activeSubTab === "backup"
              ? "border-amber-500 text-slate-900 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-650"
          }`}
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span>مرکز پشتیبان‌گیری اطلاعات دفتر (محلی و ابری)</span>
          </div>
        </button>
        <button
          onClick={() => setActiveSubTab("security")}
          className={`px-5 py-3 text-xs font-black transition-all border-b-2 cursor-pointer select-none ${
            activeSubTab === "security"
              ? "border-amber-500 text-slate-900 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-650"
          }`}
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>تنظیمات امنیتی و رمز ورود پورتال</span>
          </div>
        </button>
      </div>

      {activeSubTab === "backup" ? (
        <div className="animate-in fade-in duration-250">
          <BackupCenter
            clients={clients}
            cases={cases}
            notes={notes}
            documents={documents}
            events={events}
            lawyerName={lawyerName}
            lawyerNationalId={lawyerNationalId}
            onTriggerRestore={onTriggerRestore}
            onNavigate={onNavigate}
          />
        </div>
      ) : (
        /* ACCESS & SECURITY SETTINGS */
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" />
              شناسه امنیتی و رمز ورود پورتال {lawyerName || "وکیل"}
            </h2>
            <p className="text-[10px] text-slate-450 mt-1">تغییر کد عبور ورود به پورتال، نام هویتی و کدملی موجه جهت کنترل پنل‌های تستر و قفل اداری</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5 max-w-xl animate-in fade-in duration-200">
            {profileSuccessMsg && (
              <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {profileErrorMsg && (
              <div className="p-3.5 bg-red-50 text-red-800 border border-red-150 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>{profileErrorMsg}</span>
              </div>
            )}

            {/* Lawyer Profile Photo Section */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
              <div className="w-16 h-16 rounded-full border-2 border-amber-500/40 overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                {profPhoto ? (
                  <img src={profPhoto} alt="تصویر وکیل" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-[10px] text-amber-600 font-extrabold">بدون تصویر</span>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 block">تصویر پرسنلی وکیل مسئول</label>
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-950 rounded-lg text-[10px] font-black cursor-pointer transition select-none">
                    بارگزاری عکس جدید
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === "string") {
                              setProfPhoto(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {profPhoto && (
                    <button
                      type="button"
                      onClick={() => setProfPhoto("")}
                      className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-[10px] font-black transition cursor-pointer select-none"
                    >
                      حذف تصویر
                    </button>
                  )}
                </div>
                <p className="text-[9px] text-slate-400">تصویر حرفه‌ای با فرمت‌های رایج (پیشنهاد: نسبت مربع ۱:۱)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
              <div className="space-y-1.5">
                <label className="block">نام و نام خانوادگی وکیل مسئول:</label>
                <input
                  type="text"
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2.5 font-bold outline-none text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block">کد ملی ده رقمی وکیل دفتری:</label>
                <input
                  type="text"
                  value={profNationalId}
                  onChange={(e) => setProfNationalId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2.5 font-mono font-bold outline-none text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block">رمز ورود به نرم‌افزار (جدید):</label>
                <input
                  type="password"
                  value={profPass}
                  onChange={(e) => setProfPass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2.5 font-mono font-bold outline-none text-slate-800"
                  placeholder="گذرواژه ورود"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block">تکرار کلمه عبور جدید:</label>
                <input
                  type="password"
                  value={profPassConfirm}
                  onChange={(e) => setProfPassConfirm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2.5 font-mono font-bold outline-none text-slate-800"
                  placeholder="تکرار کلمه عبور"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition select-none cursor-pointer"
              >
                ذخیره تغییرات و برقراری امنیت دفتری
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
