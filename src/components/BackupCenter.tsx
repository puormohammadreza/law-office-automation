import { safeStorage } from "../utils/safeStorage";
import React, { useState, useEffect } from "react";
import { PublicClientApplication } from "@azure/msal-browser";
import {
  Usb,
  CloudUpload,
  FolderDown,
  FolderUp,
  Server,
  CheckCircle,
  AlertCircle,
  Database,
  Lock,
  LogOut,
  Mail,
  Shield,
  Activity,
  Cloud,
  FileCheck,
  UploadCloud,
  Loader2,
  FileText,
  MessageSquare,
  ChevronLeft
} from "lucide-react";

const OneDriveIcon = () => (
  <svg viewBox="0 0 48 48" className="w-5 h-5 fill-[#0078d4]" xmlns="http://www.w3.org/2000/svg">
    <path d="M40.16 26.69c-.31-5.32-4.06-9.61-9.11-10.43a9.403 9.403 0 00-14.71-3.69c-3.77 3-5.59 7.9-4.7 12.65-4.21 1.48-6.19 6.27-4.29 10.37 1.4 3 4.41 4.96 7.69 5.02h24.26c3.97.16 7.42-2.73 7.84-6.68.32-3.1-1.63-6-4.59-7.05-1.04-.45-1.95-.5-2.39-.19z" />
  </svg>
);
import { toPersianDigits } from "../utils/shamsi";
import { auth, signInWithGoogle, signInWithEmail, signUpWithEmail, onAuthStateChanged, signOut } from "../firebase/config";
import { syncFullStateToCloud, restoreFromCloud } from "../firebase/db";
type User = { uid: string; email?: string | null };
import { documentDb } from "../utils/documentStorage";

interface BackupCenterProps {
  clients: any[];
  cases: any[];
  notes: any[];
  documents: any[];
  events: any[];
  lawyerName: string;
  lawyerNationalId: string;
  lawyerPassword?: string;
  lawyerPhoto?: string;
  onTriggerRestore: (backupData: any) => void;
  onNavigate?: (tab: string, subTab?: string, stateToPass?: any) => void;
}

export default function BackupCenter({
  clients,
  cases,
  notes,
  documents,
  events,
  lawyerName,
  lawyerNationalId,
  lawyerPassword,
  lawyerPhoto,
  onTriggerRestore,
  onNavigate
}: BackupCenterProps) {
  const [user, setUser] = useState<User | null>(null);
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
  

  
  // Custom Email Login states (Second Solution)
  const [loginMode, setLoginMode] = useState<"google" | "email">("google");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // --- EMAIL BACKUP STATES ---
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");
  const [emailError, setEmailError] = useState("");

  // --- ONEDRIVE BACKUP STATES ---
  const [isOnedriveSyncing, setIsOnedriveSyncing] = useState(false);
  const [showCaseNotesPanel, setShowCaseNotesPanel] = useState(false);
  const [currentView, setCurrentView] = useState<"main" | "case-notes">("main");

  // Update recipient email when user changes
  useEffect(() => {
    if (user && user.email) {
      setRecipientEmail(user.email);
    }
  }, [user]);

  // Calculate volume
  const getDocumentsTotalBytes = () => {
    let docTotalBytes = 0;
    if (Array.isArray(documents)) {
      documents.forEach(doc => {
        if (doc.size) {
          const match = doc.size.trim().match(/^([\d.]+)\s*(KB|MB|B|کیلوبایت|مگابایت|بایت)?$/i);
          if (match) {
            const val = parseFloat(match[1]);
            const unit = (match[2] || "").toLowerCase();
            if (unit.includes("mb") || unit.includes("مگابایت")) {
              docTotalBytes += val * 1024 * 1024;
            } else if (unit.includes("kb") || unit.includes("کیلوبایت")) {
              docTotalBytes += val * 1024;
            } else {
              docTotalBytes += val;
            }
          }
        }
      });
    }
    return docTotalBytes;
  };

  const getQuickNotesCount = () => {
    try {
      const saved = localStorage.getItem("r_quick_notes_v2");
      if (saved) {
        return JSON.parse(saved).length;
      }
    } catch (e) {
      console.warn(e);
    }
    return 0;
  };

  const getBackupVolumeText = () => {
    try {
      const textDataStr = JSON.stringify({
        clients,
        cases,
        notes,
        events
      });
      const textBytes = new Blob([textDataStr]).size;
      const docsBytes = getDocumentsTotalBytes();
      const totalBytes = textBytes + docsBytes;

      if (totalBytes < 1024) {
        return `${toPersianDigits(totalBytes.toString())} بایت`;
      } else if (totalBytes < 1024 * 1024) {
        return `${toPersianDigits((totalBytes / 1024).toFixed(1))} کیلوبایت`;
      } else {
        return `${toPersianDigits((totalBytes / (1024 * 1024)).toFixed(2))} مگابایت`;
      }
    } catch (e) {
      return toPersianDigits("0") + " بایت";
    }
  };

  const handleSendEmailBackup = async () => {
    if (!recipientEmail.trim()) {
      setEmailError("لطفاً آدرس ایمیل معتبری وارد نمایید.");
      return;
    }

    setIsEmailSending(true);
    setEmailError("");
    setEmailMsg("");
    setCloudLogs((prev) => [
      `[${new Date().toLocaleTimeString("fa-IR")}] شروع فشرده‌سازی اطلاعات و اسناد و مدارک ذخیره‌شده...`,
      ...prev
    ]);

    try {
      // Fetch full backup including files (dataUrl) from IndexedDB
      setCloudLogs((prev) => [
        `[${new Date().toLocaleTimeString("fa-IR")}] در حال خواندن همزمان فایل‌های پیوست از دیتابیس لوکال...`,
        ...prev
      ]);
      
      const fullDocs = await Promise.all(
        documents.map(async (doc) => {
          const dataUrl = await documentDb.get(doc.id);
          return {
            ...doc,
            dataUrl: dataUrl || doc.dataUrl || "" // fallback to existing
          };
        })
      );

      const backupObj = {
        clients,
        cases,
        notes,
        documents: fullDocs,
        events,
        exportVersion: "2.0_Email_Full",
        exportDate: new Date().toISOString(),
        lawyerName,
        lawyerNationalId
      };

      setCloudLogs((prev) => [
        `[${new Date().toLocaleTimeString("fa-IR")}] بسته‌بندی نهایی کامل شد. ارسال به سرور...`,
        ...prev
      ]);

      const rsp = await fetch("/api/backup/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: recipientEmail,
          backupData: backupObj
        })
      });

      if (!rsp.ok) {
        const errorData = await rsp.json().catch(() => ({}));
        throw new Error(errorData.error || "خطا در برقراری ارتباط با پورت ایمیل.");
      }

      const resJson = await rsp.json();

      setCloudLogs((prev) => [
        `[${new Date().toLocaleTimeString("fa-IR")}] پاسخ سرور ایمیل: ${resJson.message}`,
        ...prev
      ]);

      setEmailMsg(resJson.message);

      // If simulated, trigger download
      if (resJson.simulated) {
        const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `پشتیبان دفتر_${new Date().toLocaleDateString("fa-IR").replace(/\//g, "-")}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      let errMsg = err.message || "خطا در ارسال ایمیل پشتیبان.";
      if (err.message === "Failed to fetch") errMsg = "ارتباط با شبکه اینترنت قطع است.";
      setEmailError(errMsg);
      setCloudLogs((prev) => [
        `[${new Date().toLocaleTimeString("fa-IR")}] خطا در تهیه ایمیل: ${errMsg}`,
        ...prev
      ]);
    } finally {
      setIsEmailSending(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      // 1. Set immediately from localStorage if present
      const savedMeta = safeStorage.getItem(`r_cloud_backup_meta_${user.uid}`);
      if (savedMeta) {
        try {
          setCloudBackupMeta(JSON.parse(savedMeta));
          setCloudBackupExists(true);
        } catch (e) {
          // ignore
        }
      }

      // 2. Fetch directly from Firestore to check actual backup size and metadata
      const checkCloudBackup = async () => {
        try {
          // If we have saved meta, we can be more patient or show it immediately
          const data = await restoreFromCloud(user.uid);
          if (!data) return;
          
          const clientsCount = data?.clients?.length || 0;
          const casesCount = data?.cases?.length || 0;
          const notesCount = data?.notes?.length || 0;
          const docsCount = data?.documents?.length || 0;
          const eventsCount = data?.events?.length || 0;
          
          const total = clientsCount + casesCount + notesCount + docsCount + eventsCount;
          if (total > 0) {
            let backupDate = new Date().toLocaleDateString("fa-IR");
            if (savedMeta) {
              try {
                const parsed = JSON.parse(savedMeta);
                backupDate = parsed.date || backupDate;
              } catch (e) {}
            }
            const meta = {
              date: backupDate,
              clientsCount,
              casesCount,
              notesCount,
              docsCount,
              eventsCount
            };
            setCloudBackupMeta(meta);
            setCloudBackupExists(true);
            safeStorage.setItem(`r_cloud_backup_meta_${user.uid}`, JSON.stringify(meta));
          } else {
            setCloudBackupExists(false);
            setCloudBackupMeta(null);
          }
        } catch (e: any) {
          // Silent warning for connection issues, as we already have local data or handled it in db.ts
          console.warn("Cloud meta fetch status:", e.message);
          if (e.message?.includes("ارتباط با شبکه ضعیف است")) {
             setCloudLogs(prev => [`[${new Date().toLocaleTimeString("fa-IR")}] پورتال ابری در دسترس نیست (حالت آفلاین فعال شد)`, ...prev]);
          }
        }
      };
      
      // We debounce/delay this slightly to allow the UI to settle
      const timer = setTimeout(checkCloudBackup, 1500);
      return () => clearTimeout(timer);
    } else {
      setCloudBackupExists(false);
      setCloudBackupMeta(null);
    }
  }, [user]);

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
    link.download = `پشتیبان دفتر_${new Date().toLocaleDateString("fa-IR").replace(/\//g, "-")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCloudLogs((prev) => [
      `[${new Date().toLocaleTimeString("fa-IR")}] ایجاد فایل بکاپ با موفقیت انجام شد.`,
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
      if (error.code === "auth/popup-closed-by-user") {
        setCloudError("پنجره ورود به اکانت گوگل توسط شما بسته شد. لطفاً دوباره تلاش کنید.");
      } else {
        setCloudError(error.message && error.message.includes("دامنه") ? error.message : "خطا در ورود به حساب کاربری. ممکن است پاپ‌آپ مسدود شده باشد.");
      }
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setCloudError("");
    if (!emailInput || !passwordInput) {
      setCloudError("لطفاً ایمیل و رمز عبور را وارد کنید.");
      return;
    }
    if (passwordInput.length < 6) {
      setCloudError("رمز عبور باید حداقل ۶ کاراکتر باشد.");
      return;
    }
    
    try {
      setIsCloudSyncing(true);
      if (isRegistering) {
        await signUpWithEmail(emailInput, passwordInput);
        setCloudMsg("ثبت نام با موفقیت انجام شد.");
      } else {
        await signInWithEmail(emailInput, passwordInput);
        setCloudMsg("ورود با موفقیت انجام شد.");
      }
    } catch (error: any) {
      let msg = "خطا در احراز هویت.";
      if (error.code === 'auth/email-already-in-use') msg = "این ایمیل قبلاً ثبت نام شده است، لطفا وارد شوید.";
      if (error.code === 'auth/invalid-credential') msg = "ایمیل یا رمز عبور اشتباه است.";
      if (error.code === 'auth/operation-not-allowed') msg = "راه حل دوم فعال نیست: ابتدا باید از بخش Firebase Console -> Authentication -> Sign-in Method گزینه‌ی Email/Password را فعال کنید.";
      setCloudError(msg);
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
      // Strip base64 files to prevent Firestore 1MB quota limit error and reduce LocalStorage memory footprint
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

      try {
        safeStorage.setItem(`r_cloud_backup_meta_${user.uid}`, JSON.stringify(meta));
      } catch (metaErr) {
        console.warn("Could not save cloud backup metadata to localStorage:", metaErr);
      }

      try {
        safeStorage.setItem("r_cloud_backup_slot", JSON.stringify({
          backupDateShort: persianDate,
          clients,
          cases,
          notes,
          documents: safeDocs,
          events
        }));
      } catch (slotErr) {
        console.warn("Could not save full cloud backup cache to localStorage due to quota limit:", slotErr);
        // Fallback to storing a skeleton object so existing checks for this slot still succeed
        try {
          safeStorage.setItem("r_cloud_backup_slot", JSON.stringify({
            backupDateShort: persianDate,
            clients: [],
            cases: [],
            notes: [],
            documents: [],
            events: []
          }));
        } catch (fallbackErr) {
          console.warn("Could not write even skeleton cloud backup slot:", fallbackErr);
        }
      }

      setCloudBackupExists(true);
      setCloudBackupMeta(meta);

      setCloudMsg("همگام‌سازی ابری با موفقیت ۱۰۰٪ به اتمام رسید.");
      setCloudLogs((prev) => [
        `[${new Date().toLocaleTimeString("fa-IR")}] آپلود ابری سرور با شناسه تراکنش ثبت شد.`,
        `[${new Date().toLocaleTimeString("fa-IR")}] انتقال موفقیت‌آمیز به فضای ابری ${user.email}`,
        ...prev
      ]);
    } catch (error: any) {
      const errorData = error.message && error.message.startsWith('{') ? JSON.parse(error.message) : { error: error.message || "Unknown error" };
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

  if (currentView === "case-notes") {
    return (
      <div className="space-y-6 animate-in fade-in duration-350" dir="rtl">
        {/* Sub-page Header with Back button */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-950 text-white rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border border-amber-500/20 gap-4 shadow-lg">
          <div className="space-y-1 text-right">
            <h1 className="text-xl font-black text-white">یادداشت‌های مربوط به پرونده‌ها</h1>
            <p className="text-slate-400 text-xs font-medium">مشاهده و دسترسی سریع به یادداشت‌های ضمیمه شده به پرونده‌های دفتر وکالت</p>
          </div>
          <button
            onClick={() => setCurrentView("main")}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white hover:text-amber-400 text-xs font-bold rounded-xl transition border border-slate-700 flex items-center gap-1.5 cursor-pointer select-none"
          >
            بازگشت به مرکز پشتیبان‌گیری
          </button>
        </div>

        {/* Case Notes List */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          {notes.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" />
              <p className="text-slate-500 text-sm font-bold">هیچ یادداشت پرونده‌ای ثبت نشده است.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map(note => {
                const matchedCase = cases.find(c => c.id === note.caseId);
                const caseTitle = matchedCase ? matchedCase.title : "پرونده مرتبط";
                const isClosed = matchedCase?.status === "مختومه";

                return (
                  <div
                    key={note.id}
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate("cases", isClosed ? "closedCases" : "cases", { caseId: note.caseId, openNotes: true });
                      }
                    }}
                    className="flex items-center justify-between p-4 border border-slate-150 bg-slate-50 hover:bg-amber-500/5 hover:border-amber-500/30 cursor-pointer rounded-2xl transition-all shadow-sm hover:shadow gap-4"
                  >
                    {/* Right Side: پرونده: موضوع پرونده */}
                    <div className="text-right overflow-hidden">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-800">
                        پرونده: <span className="text-amber-600 font-black">{caseTitle}</span>
                      </span>
                    </div>

                    {/* Left Side: نام و نام خانوادگی موکل */}
                    <div className="text-left shrink-0">
                      <span className="text-[10px] sm:text-xs font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                        {matchedCase ? matchedCase.clientName : "نامشخص"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-350">
      
      {/* Cloud Operation Status Banner */}
      {(cloudMsg || cloudError) && (
        <div className="space-y-3 pb-3">
          {cloudMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-3xl text-sm font-bold flex items-center justify-between shadow-sm">
               <div className="flex items-center gap-2">
                 <CheckCircle className="w-6 h-6 text-emerald-600" />
                 <span>{cloudMsg}</span>
               </div>
               <button onClick={() => setCloudMsg("")} className="text-emerald-500 hover:text-emerald-800">بستن</button>
            </div>
          )}

          {cloudError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-3xl text-sm font-bold flex items-center justify-between shadow-sm">
               <div className="flex items-center gap-2">
                 <AlertCircle className="w-6 h-6 text-rose-600" />
                 <span>{cloudError}</span>
               </div>
               <button onClick={() => setCloudError("")} className="text-rose-500 hover:text-rose-800">بستن</button>
            </div>
          )}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-950 text-white rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center border border-amber-500/20 gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full w-fit border border-amber-500/20">
            <Database className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">پشتیبان‌گیری امن و یکپارچه</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white mt-3">
            مرکز پشتیبان‌گیری اطلاعات دفتر وکالت
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 font-medium">
            مدیریت فایل‌های نسخه پشتیبان به صورت فیزیکی (فلش مموری) یا آنلاین در فضای ابری محرمانه متصل به شناسه ملی وکیل
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Method 1: USB Flash Drive */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-200/50">
                <Usb className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  ۱. پشتیبان‌گیری روی فلش مموری (فیزیکی / آفلاین)
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">تولید مستقیم فایل فشرده متنی سبک جهت کپی دستی و بایگانی در هارد یا فلش مموری</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
              شما می‌توانید در هرلحظه کلیه اطلاعات از جمله مشخصات موکلین، پرونده‌ها، یادداشت‌های پیوستی، تراکنش‌ها علمی و قرارهای تقویم دفتری را استخراج نمایید. این کار هیچ ردپای اینترنتی بر جای نمی‌گذارد و کاملاً آفلاین است.
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <span className="text-[10px] text-slate-500 font-extrabold flex items-center justify-between gap-1.5">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-450" />
                  حجم کل دیتای لوکال آماده ذخیره‌سازی:
                </span>
                <span className="bg-amber-100 text-amber-900 font-mono text-xs px-2 py-0.5 rounded-md font-black">{getBackupVolumeText()}</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[10px] font-bold text-slate-700">
                <div 
                  className={`bg-white border border-slate-150 p-2 rounded-xl text-center ${onNavigate ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''}`}
                  onClick={() => onNavigate && onNavigate("cases", "clients")}
                  title={onNavigate ? "مشاهده لیست موکلین" : ""}
                >
                  <span className="text-slate-450 block text-[9px]">کل موکلین:</span>
                  <span className="text-slate-850 font-mono text-xs">{toPersianDigits(clients.length)} مورد</span>
                </div>
                <div 
                  className={`bg-white border border-slate-150 p-2 rounded-xl text-center ${onNavigate ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''}`}
                  onClick={() => onNavigate && onNavigate("cases", "cases")}
                  title={onNavigate ? "مشاهده همه پرونده‌ها" : ""}
                >
                  <span className="text-slate-450 block text-[9px]">کل پرونده‌ها:</span>
                  <span className="text-slate-850 font-mono text-xs">{toPersianDigits(cases.length)} مورد</span>
                </div>
                <div 
                  className={`bg-white border border-slate-150 p-2 rounded-xl text-center ${onNavigate ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''}`}
                  onClick={() => onNavigate && onNavigate("cases", "cases")}
                  title={onNavigate ? "مشاهده پرونده‌های جاری" : ""}
                >
                  <span className="text-slate-450 block text-[9px]">پرونده‌های جاری:</span>
                  <span className="text-slate-850 font-mono text-xs">{toPersianDigits(cases.filter(c => c.status !== "مختومه").length)} مورد</span>
                </div>
                <div 
                  className={`bg-white border border-slate-150 p-2 rounded-xl text-center ${onNavigate ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''}`}
                  onClick={() => onNavigate && onNavigate("cases", "closedCases")}
                  title={onNavigate ? "مشاهده پرونده‌های مختومه" : ""}
                >
                  <span className="text-slate-450 block text-[9px]">پرونده مختومه:</span>
                  <span className="text-slate-850 font-mono text-xs">{toPersianDigits(cases.filter(c => c.status === "مختومه").length)} مورد</span>
                </div>
                <div 
                  className={`bg-white border border-slate-150 p-2 rounded-xl text-center ${onNavigate ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''}`}
                  onClick={() => onNavigate && onNavigate("calendar")}
                  title={onNavigate ? "مشاهده رویدادها و آلارم‌ها در تقویم" : ""}
                >
                  <span className="text-slate-450 block text-[9px]">کل آلارم‌ها:</span>
                  <span className="text-slate-850 font-mono text-xs">{toPersianDigits(events.length)} مورد</span>
                </div>
                <div 
                  className={`bg-white border border-slate-150 p-2 rounded-xl text-center ${onNavigate ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''}`}
                  onClick={() => onNavigate && onNavigate("cases")}
                  title={onNavigate ? "مدیریت مستندات در پرونده‌ها" : ""}
                >
                  <span className="text-slate-450 block text-[9px]">کل مستندات:</span>
                  <span className="text-slate-850 font-mono text-xs">{toPersianDigits(documents.length)} مورد</span>
                </div>
              </div>

              {/* Quick Access to Notes Section */}
              <div className="mt-4 bg-white border border-slate-200 rounded-2xl p-4 text-right">
                <h3 className="text-xs font-black text-slate-850 mb-3 pb-2 border-b border-slate-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  دسترسی به بخش یادداشت‌ها
                </h3>

                <div className="space-y-2">
                  {/* Row 1: دفترچه یادداشت */}
                  <div
                    onClick={() => onNavigate && onNavigate("quick-notes")}
                    className="flex items-center justify-between p-3 border border-slate-150 bg-slate-50/50 rounded-xl hover:bg-amber-500/5 hover:border-amber-500/30 cursor-pointer transition-all gap-4 select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="font-bold text-xs text-slate-800">دفترچه یادداشت</span>
                        <span className="text-[9px] text-slate-400">یادداشت‌های عمومی و روزانه دفتر وکالت</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-lg">
                        {toPersianDigits(getQuickNotesCount())} یادداشت
                      </span>
                      <ChevronLeft className="w-4 h-4 text-slate-400 animate-pulse" />
                    </div>
                  </div>

                  {/* Row 2: یادداشت‌های پرونده‌ها */}
                  <div
                    onClick={() => setCurrentView("case-notes")}
                    className="flex items-center justify-between p-3 border border-slate-150 bg-slate-50/50 rounded-xl hover:bg-amber-500/5 hover:border-amber-500/30 cursor-pointer transition-all gap-4 select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="font-bold text-xs text-slate-800">یادداشت‌های پرونده‌ها</span>
                        <span className="text-[9px] text-slate-400">یادداشت‌های پیوست شده به پرونده‌های موکلین</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-lg">
                        {toPersianDigits(notes.length)} یادداشت
                      </span>
                      <ChevronLeft className="w-4 h-4 text-slate-400 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 pt-6 border-t border-slate-100">
            {/* Local Backup Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-2 mb-2">
                  <FolderDown className="w-4 h-4 text-amber-600" />
                  پشتیبان‌گیری محلی (فلش/سیستم)
                </h4>
                <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
                  فایل پشتیبان را مستقیماً روی دستگاه خود دانلود کنید یا فایل‌های قبلی را از سیستم/فلش بازیابی نمایید.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleFlashExport}
                  className="py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 select-none cursor-pointer w-full"
                >
                  <FolderDown className="w-4 h-4 text-amber-400" />
                  دانلود نسخه پشتیبان
                </button>
                <label className="py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 select-none cursor-pointer text-center w-full">
                  <FolderUp className="w-4 h-4" />
                  بازیابی فایل پشتیبان
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFlashImport}
                    className="hidden"
                  />
                </label>
              </div>
            </div>


          </div>
        </div>

      </div>




    </div>
  );
}
