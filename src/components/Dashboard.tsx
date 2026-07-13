import { safeStorage } from "../utils/safeStorage";
import React, { useState, useEffect, useMemo } from "react";
import {
  toPersianDigits,
  isEventExpired,
  formatTimeWithColon,
  formatDateWithSlash,
  getDaysRemaining,
  getEventTimestamp,
  getRemainingTimeText,
  getCurrentJalali,
  JALALI_MONTH_NAMES,
} from "../utils/shamsi";
import {
  LegalCase,
  Client,
  LegalEvent,
  EventType,
  CaseDocument,
} from "../types";

const safeRandomUUID = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    try {
      return crypto.randomUUID();
    } catch {
      // ignore
    }
  }
  return "id_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11);
};
import {
  Briefcase,
  Users,
  Bell,
  Sparkles,
  Calculator,
  ArrowLeft,
  FileText,
  Clock,
  Plus,
  Search,
  X,
  Upload,
  CalendarDays,
  Archive,
  AlignLeft,
  Calendar,
  ArrowRight,
  Trash2,
  Edit,
  Eye,
  Download,
  Printer,
} from "lucide-react";

interface DashboardProps {
  clients: Client[];
  cases: LegalCase[];
  events: LegalEvent[];
  lawyerName?: string;
  onNavigate: (tab: any, subTab?: any, stateToPass?: any) => void;
  onAddEvent?: (newEv: LegalEvent) => void;
  onUpdateEvent?: (updatedEv: LegalEvent) => void;
  onDeleteEvent?: (id: string) => void;
  onAddDocument?: (doc: CaseDocument) => void;
}

export default function Dashboard({
  clients,
  cases,
  events,
  lawyerName,
  onNavigate,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onAddDocument,
}: DashboardProps) {
  const today = getCurrentJalali();
  const todayDateString = `${today.weekday} ${toPersianDigits(today.jd)} ${JALALI_MONTH_NAMES[today.jm - 1]} ${toPersianDigits(today.jy)}`;

  const dhikrText = (() => {
    const dayIndex = new Date().getDay();
    switch (dayIndex) {
      case 6:
        return "یَا رَبَّ الْعَالَمِینَ";
      case 0:
        return "یَا ذَا الْجَلَالِ وَ الْإِكْرَامِ";
      case 1:
        return "یَا قَاضِیَ الْحَاجَاتِ";
      case 2:
        return "یَا أَرْحَمَ الرَّاحِمِینَ";
      case 3:
        return "یَا حَیُّ یَا قَیُّومُ";
      case 4:
        return "لَا إِلَهَ إِلَّا اللَّهُ الْمَلِکُ الْحَقُّ الْمُبِینُ";
      case 5:
        return "اَللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَ آلِ مُحَمَّدِ";
      default:
        return "یَا قَاضِیَ الْحَاجَاتِ";
    }
  })();

  const activeCasesCount = (cases || []).filter(
    (c) => c && c.status === "جریان دارد",
  ).length;
  const closedCasesCount = (cases || []).filter(
    (c) => c && c.status === "مختومه",
  ).length;
  const upcomingSessionsCount = (events || [])
    .filter((e) => e && e.type === "جلسه دادرسی")
    .filter(
      (ev) =>
        ev &&
        !ev.isArchived &&
        !isEventExpired(ev.jalaliDate, ev.time, 5, ev.endRepeatDate),
    ).length;
  const upcomingRemindersCount = (events || [])
    .filter((e) => e && e.type !== "جلسه دادرسی")
    .filter(
      (ev) =>
        ev &&
        !ev.isArchived &&
        !isEventExpired(ev.jalaliDate, ev.time, 5, ev.endRepeatDate),
    ).length;

  const [quickNotesCount, setQuickNotesCount] = useState<number>(0);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

  const globalSearchResults = useMemo(() => {
    if (!globalSearchQuery.trim()) return [];
    const lowerQ = globalSearchQuery.toLowerCase();
    return cases
      .filter(
        (c) =>
          (c.title && c.title.toLowerCase().includes(lowerQ)) ||
          (c.clientName && c.clientName.toLowerCase().includes(lowerQ)) ||
          (c.caseNumber && c.caseNumber.toLowerCase().includes(lowerQ)) ||
          (c.archiveNumber && c.archiveNumber.toLowerCase().includes(lowerQ)),
      )
      .slice(0, 8); // show max 8 results
  }, [globalSearchQuery, cases]);

  useEffect(() => {
    try {
      const saved = safeStorage.getItem("r_quick_notes_v2");
      if (saved) {
        setQuickNotesCount(JSON.parse(saved).length);
      }
    } catch (e) {
      console.error(e);
    }

    // Attempt to hide mobile browser address bar
    setTimeout(() => {
      window.scrollTo({ top: 100, behavior: "smooth" });
      setTimeout(() => {
        window.scrollTo(0, 1);
      }, 300);
    }, 500);
  }, []);

  // New States for Quick Registration
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [modalType, setModalType] = useState<EventType>("جلسه دادرسی");
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [caseSearchTerm, setCaseSearchTerm] = useState("");
  const [showCaseDropdown, setShowCaseDropdown] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Alarm & SMS configuration states matching user requested design
  const [alarm1Hour, setAlarm1Hour] = useState(false);
  const [alarm1Day, setAlarm1Day] = useState(true);
  const [alarm3Days, setAlarm3Days] = useState(false);
  const [alarm1Week, setAlarm1Week] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [smsPhone1, setSmsPhone1] = useState("09144627119");
  const [smsPhone2, setSmsPhone2] = useState("09901095393");

  // New States for inline Actions inside Dashboard Events (Requested by User)
  const [selectedViewEvent, setSelectedViewEvent] = useState<LegalEvent | null>(
    null,
  );
  const [selectedEditEvent, setSelectedEditEvent] = useState<LegalEvent | null>(
    null,
  );
  const [previewDocEvent, setPreviewDocEvent] = useState<any | null>(null);

  // Edit fields for inline events modifier
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editType, setEditType] = useState<EventType>("سایر رویدادها");
  const [editCaseId, setEditCaseId] = useState("");
  const [editCaseSearchTerm, setEditCaseSearchTerm] = useState("");
  const [showEditCaseDropdown, setShowEditCaseDropdown] = useState(false);
  const [editAlarm1Hour, setEditAlarm1Hour] = useState(false);
  const [editAlarm1Day, setEditAlarm1Day] = useState(true);
  const [editAlarm3Days, setEditAlarm3Days] = useState(false);
  const [editAlarm1Week, setEditAlarm1Week] = useState(false);
  const [editSmsEnabled, setEditSmsEnabled] = useState(true);
  const [editSmsPhone1, setEditSmsPhone1] = useState("09144627119");
  const [editSmsPhone2, setEditSmsPhone2] = useState("09901095393");

  const [activeSubView, setActiveSubView] = useState<
    "home" | "sessions-list" | "reminders-list"
  >("home");

  const handleOpenView = (ev: LegalEvent) => {
    setSelectedViewEvent(ev);
  };

  const handleOpenEdit = (ev: LegalEvent) => {
    setSelectedEditEvent(ev);
    const dev = ev as any;
    setEditTitle(ev.title);
    setEditDate(ev.jalaliDate);
    setEditTime(ev.time);
    setEditDesc(ev.description || "");
    setEditType(ev.type);
    setEditCaseId(ev.caseId || "");

    setEditAlarm1Hour(!!dev.alarm1Hour);
    setEditAlarm1Day(dev.alarm1Day !== false);
    setEditAlarm3Days(!!dev.alarm3Days);
    setEditAlarm1Week(!!dev.alarm1Week);
    setEditSmsEnabled(dev.smsEnabled !== false);
    setEditSmsPhone1(dev.smsPhone1 || "09144627119");
    setEditSmsPhone2(dev.smsPhone2 || "09901095393");

    const matched = cases.find((c) => c.id === ev.caseId);
    setEditCaseSearchTerm(
      matched
        ? `${matched.title} (کلاسه دفتر: ${toPersianDigits(matched.archiveNumber || "ندارد")} | شماره ثنا: ${toPersianDigits(matched.caseNumber || "ندارد")})`
        : "",
    );
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditEvent) return;
    if (!editTitle.trim()) {
      alert("لطفاً عنوان رویداد را وارد کنید.");
      return;
    }

    const matchedCase = cases.find((c) => c.id === editCaseId);

    const updated: LegalEvent = {
      ...selectedEditEvent,
      isArchived: false,
      title: editTitle,
      type: editType,
      jalaliDate: editDate,
      time: editTime,
      description: editDesc,
      caseId: editCaseId || undefined,
      caseTitle: matchedCase?.title || undefined,
      clientName: matchedCase?.clientName || undefined,
      alarmEnabled: true,
      alarm1Hour: editAlarm1Hour,
      alarm1Day: editAlarm1Day,
      alarm3Days: editAlarm3Days,
      alarm1Week: editAlarm1Week,
      smsEnabled: editSmsEnabled,
      smsPhone1: editSmsPhone1,
      smsPhone2: editSmsPhone2,
    } as any;

    if (onUpdateEvent) {
      onUpdateEvent(updated);
    }
    setSelectedEditEvent(null);
  };

  const handleDeleteEventClick = (id: string) => {
    if (onDeleteEvent) {
      onDeleteEvent(id);
    }
  };

  const filteredCases = cases.filter(
    (c) =>
      c.title.toLowerCase().includes(caseSearchTerm.toLowerCase()) ||
      (c.archiveNumber &&
        c.archiveNumber.toLowerCase().includes(caseSearchTerm.toLowerCase())),
  );

  const filteredEditCases = cases.filter(
    (c) =>
      c.title.toLowerCase().includes(editCaseSearchTerm.toLowerCase()) ||
      (c.archiveNumber &&
        c.archiveNumber
          .toLowerCase()
          .includes(editCaseSearchTerm.toLowerCase())),
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else {
      alert("لطفاً فقط فایل PDF انتخاب کنید.");
    }
  };

  const handleQuickRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsUploading(true);
    try {
      const matchedCase = selectedCaseId
        ? cases.find((c) => c.id === selectedCaseId)
        : undefined;

      const eventId = safeRandomUUID();
      const baseEvent = {
        id: eventId,
        title: sessionTitle,
        type: modalType,
        jalaliDate: sessionDate,
        time: sessionTime,
        caseId: selectedCaseId || undefined,
        caseTitle: matchedCase?.title || undefined,
        clientName: matchedCase?.clientName || undefined,
        alarmEnabled: true,
        description: "ثبت شده از طریق داشبورد مدیریت",
        alarm1Hour,
        alarm1Day,
        alarm3Days,
        alarm1Week,
        smsEnabled,
        smsPhone1,
        smsPhone2,
      };

      // 2. Add PDF to documents if selected
      if (pdfFile && onAddDocument) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const dataUrl = event.target?.result as string;
          const docId = safeRandomUUID();
          const docName = `ابلاغیه/جلسه: ${sessionTitle}.pdf`;
          const docSize = `${(pdfFile.size / 1024).toFixed(1)} KB`;

          const newDoc: CaseDocument = {
            id: docId,
            caseId: selectedCaseId,
            name: docName,
            type: "pdf",
            size: docSize,
            dataUrl: dataUrl,
            uploadedAt: new Date().toISOString(),
          };
          onAddDocument(newDoc);

          if (onAddEvent) {
            onAddEvent({
              ...baseEvent,
              documentId: docId,
              documentName: docName,
              documentSize: docSize,
              documentDataUrl: dataUrl,
            } as any);
          }

          // Reset and close
          setSessionTitle("");
          setSessionDate("");
          setSessionTime("");
          setSelectedCaseId("");
          setCaseSearchTerm("");
          setPdfFile(null);
          setIsUploading(false);
          setShowSessionModal(false);
        };
        reader.readAsDataURL(pdfFile);
      } else {
        if (onAddEvent) {
          onAddEvent(baseEvent as any);
        }
        // Reset and close if no PDF
        setSessionTitle("");
        setSessionDate("");
        setSessionTime("");
        setSelectedCaseId("");
        setCaseSearchTerm("");
        setIsUploading(false);
        setShowSessionModal(false);
      }
    } catch (err) {
      console.error(err);
      setIsUploading(false);
      alert("خطایی در ثبت رخ داد.");
    }
  };

  return (
    <div className="space-y-3.5">
      {activeSubView === "home" ? (
        <>
          {/* Welcome Widget (Full Width) */}
          <div className="w-full bg-black text-white rounded-2xl p-4 flex flex-col justify-between border border-amber-500/20 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full w-fit border border-amber-500/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[8px] font-black uppercase tracking-widest leading-none">
                  سامانه مدیریت هوشمند وکالت
                </span>
              </div>

              <h1 className="text-base md:text-lg font-black text-white">
                {lawyerName || "وکیل پیگیر"} وکیل پایه یک دادگستری
              </h1>

              <p className="text-slate-350 text-[10px] md:text-xs font-semibold leading-relaxed max-w-2xl">
                (به پورتال هوشمند مدیریت دفتر وکالت {lawyerName || "جناب وکیل"}{" "}
                خوش آمدید) کلیه فرآیندهای دفتری، پرونده‌های حقوقی و کیفری، امور
                حسابداری دفتر، سایت عدل ایران و محاسبات و سایر از منوی کناری
                نرم‌افزار در دسترس می‌باشند.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 border-t border-slate-800/60 pt-4.5 mt-4.5 w-full font-sans">
              {/* Button 1: Manage Cases (Orange) - Standardized layout to match dimensions exactly */}
              <button
                onClick={() => onNavigate("cases")}
                className="flex items-center justify-center gap-2 px-3 py-3 w-full h-12 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 rounded-2xl text-[13px] md:text-sm font-black transition-all shadow-md select-none cursor-pointer border border-amber-400/20 text-center"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span>مدیریت پرونده‌ها</span>
              </button>

              {/* Button 2: Calculations (Blue) */}
              <button
                onClick={() => onNavigate("calculators")}
                className="flex items-center justify-center gap-2 px-3 py-3 w-full h-12 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl text-[13px] md:text-sm font-black transition-all shadow-md select-none cursor-pointer border border-blue-500/35 text-center"
              >
                <Calculator className="w-4 h-4 shrink-0 text-white" />
                <span>محاسبات قضایی</span>
              </button>

              {/* Button 3: Register Reminders (Red) */}
              <button
                onClick={() => onNavigate("add-reminder")}
                className="flex items-center justify-center gap-2 px-3 py-3 w-full h-12 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-2xl text-[13px] md:text-sm font-black transition-all shadow-md select-none cursor-pointer border border-red-500/30 text-center"
              >
                <Bell className="w-4 h-4 shrink-0" />
                <span>یادآوری</span>
              </button>

              {/* Button 4: Register Sessions (Green) */}
              <button
                onClick={() => {
                  setModalType("جلسه دادرسی");
                  setShowSessionModal(true);
                }}
                className="flex items-center justify-center gap-2 px-3 py-3 w-full h-12 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl text-[13px] md:text-sm font-black transition-all shadow-md select-none cursor-pointer border border-emerald-500/30 text-center"
              >
                <CalendarDays className="w-4 h-4 shrink-0" />
                <span>ثبت جلسات</span>
              </button>

              {/* Button 5: Dictionary (Purple) - Added as requested */}
              <button
                onClick={() => onNavigate("terminology")}
                className="flex items-center justify-center gap-2 px-3 py-3 w-full h-12 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-2xl text-[13px] md:text-sm font-black transition-all shadow-md select-none cursor-pointer border border-purple-500/30 text-center col-span-2 lg:col-span-1"
              >
                <Search className="w-4 h-4 shrink-0" />
                <span>فرهنگ لغت و ترمینولوژی</span>
              </button>
            </div>
          </div>

          {/* Global Search Bar (Hidden on mobile/hamburger view for a cleaner layout) */}
          <div className="w-full relative z-40 hidden md:block">
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="جستجوی سریع پرونده (نام موکل، شماره پرونده یا عنوان...)"
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-2xl py-3.5 pr-12 pl-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 shadow-sm transition-all"
            />

            {globalSearchQuery && globalSearchResults.length > 0 && (
              <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden max-h-64 overflow-y-auto">
                {globalSearchResults.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => {
                      onNavigate("cases", "cases", res.id);
                      setGlobalSearchQuery("");
                    }}
                    className="w-full text-right p-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 flex flex-col gap-1 cursor-pointer transition-colors"
                  >
                    <span className="text-sm font-black text-slate-800">
                      {res.title}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-2 flex-wrap">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                        موکل: {res.clientName}
                      </span>
                      {res.archiveNumber && (
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                          کلاسه: {toPersianDigits(res.archiveNumber)}
                        </span>
                      )}
                      {res.caseNumber && (
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                          ثنا: {toPersianDigits(res.caseNumber)}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {globalSearchQuery && globalSearchResults.length === 0 && (
              <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-4 text-center text-sm font-bold text-slate-500">
                پرونده‌ای یافت نشد.
              </div>
            )}
          </div>

          {/* Legal Deadlines Impending Warnings Alert Box */}
          {(() => {
            const deadlineEvents = events.filter((ev) => {
              if (!ev.title.includes("مهلت قانونی")) return false;
              const daysLeft = getDaysRemaining(ev.jalaliDate);
              // Show deadlines that are within 10 days, or expired up to 3 days ago
              return daysLeft <= 10 && daysLeft >= -3;
            });

            if (deadlineEvents.length === 0) return null;

            return (
              <div className="w-full bg-red-50/75 border border-red-200/60 rounded-2xl p-4.5 space-y-3.5 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-red-100 pb-2">
                  <div className="flex items-center gap-2.5 text-red-700">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                    </span>
                    <h2 className="text-xs font-black">هشدارهای مهلت قانونی دادنامه‌ها (نزدیک به پایان)</h2>
                  </div>
                  <span className="text-[10px] font-black text-red-600 bg-red-100/65 px-2 py-0.5 rounded-full">
                    {toPersianDigits(deadlineEvents.length)} هشدار فعال
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {deadlineEvents.map((ev) => {
                    const daysLeft = getDaysRemaining(ev.jalaliDate);
                    return (
                      <div
                        key={ev.id}
                        className="bg-white rounded-xl p-3 border border-red-100 flex flex-col justify-between space-y-2 hover:border-red-200 transition-colors shadow-2xs"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[11px] font-black text-slate-800 leading-snug">
                              {toPersianDigits(ev.title)}
                            </span>
                            {daysLeft < 0 ? (
                              <span className="text-[9px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100">
                                منقضی شده
                              </span>
                            ) : daysLeft === 0 ? (
                              <span className="text-[9px] font-black text-red-700 bg-red-100 px-1.5 py-0.5 rounded-md border border-red-200 animate-pulse">
                                امروز آخرین روز!
                              </span>
                            ) : (
                              <span className="text-[9px] font-black text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded-md border border-orange-100 animate-pulse">
                                {toPersianDigits(daysLeft)} روز باقی مانده
                              </span>
                            )}
                          </div>

                          {ev.caseTitle && (
                            <p className="text-[9px] text-slate-500 font-extrabold mt-1.5 flex items-center gap-1">
                              <Briefcase className="w-3 h-3 text-red-400 shrink-0" />
                              پرونده: {ev.caseTitle} {ev.clientName ? `(موکل: ${ev.clientName})` : ""}
                            </p>
                          )}

                          {ev.description && (
                            <p className="text-[9px] text-slate-400 leading-relaxed mt-1 font-bold">
                              {toPersianDigits(ev.description)}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-50 pt-2 text-[10px] font-bold">
                          <span className="text-slate-500 font-mono">
                            موعد نهایی: {toPersianDigits(ev.jalaliDate)}
                          </span>
                          
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("آیا تمایل دارید این هشدار مهلت قانونی را از لیست رویدادها بردارید؟")) {
                                onDeleteEvent?.(ev.id);
                              }
                            }}
                            className="text-[9px] font-black text-red-600 hover:text-red-800 bg-red-500/5 hover:bg-red-500/10 px-2 py-1 rounded-md transition cursor-pointer"
                          >
                            رفع هشدار
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Dynamic Event Stats Pills Row (Pink & Mint) - NOW COMPLETELY CLICKABLE & TAPPABLE! */}
          <div className="grid grid-cols-2 gap-3 max-w-4xl mx-auto px-1">
            {/* Sessions Pill - Mint/Green */}
            <button
              type="button"
              onClick={() => setActiveSubView("sessions-list")}
              className="bg-[#f0fdf4] hover:bg-[#e6fbf0] active:scale-95 border border-emerald-100/70 hover:border-emerald-200 p-3 rounded-2xl flex items-center justify-between text-right w-full shadow-md hover:shadow-lg cursor-pointer transition-all duration-200 select-none animate-in fade-in"
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[#dcfce7] text-emerald-600 flex items-center justify-center border border-emerald-150 shadow-inner shrink-0">
                  <CalendarDays className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs text-emerald-600 font-extrabold block mb-0.5 font-sans">
                    جلسات فعال و پیش‌رو
                  </span>
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                    <p className="text-sm sm:text-base font-black text-emerald-800 font-mono">
                      {toPersianDigits(upcomingSessionsCount)} جلسه
                    </p>
                  </div>
                </div>
              </div>
              <ArrowLeft className="w-4 h-4 text-emerald-500 mr-auto shrink-0 animate-in slide-in-from-right-1" />
            </button>

            {/* Reminders Pill - Pink/Red */}
            <button
              type="button"
              onClick={() => setActiveSubView("reminders-list")}
              className="bg-[#fff5f5] hover:bg-[#ffebeb] active:scale-95 border border-red-100/70 hover:border-red-200 p-3 rounded-2xl flex items-center justify-between text-right w-full shadow-md hover:shadow-lg cursor-pointer transition-all duration-200 select-none animate-in fade-in"
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[#ffe3e3] text-red-600 flex items-center justify-center border border-red-150 shadow-inner shrink-0">
                  <Bell className="w-5 h-5 text-red-600 animate-bounce" />
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs text-red-500 font-extrabold block mb-0.5 font-sans">
                    یادآوری‌های فعال
                  </span>
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-ping"></span>
                    <p className="text-sm sm:text-base font-black text-red-700 font-mono">
                      {toPersianDigits(upcomingRemindersCount)} مورد
                    </p>
                  </div>
                </div>
              </div>
              <ArrowLeft className="w-4 h-4 text-red-500 mr-auto shrink-0 animate-in slide-in-from-right-1" />
            </button>
          </div>

          {/* Quick Notes Pill - Custom Full-width below the two pills */}
          <div className="max-w-4xl mx-auto px-1 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate("quick-notes")}
              className="bg-[#f8fafc] hover:bg-[#f1f5f9] active:scale-95 border border-slate-200 hover:border-slate-300 py-3 px-4 rounded-xl flex items-center justify-center gap-2 w-full shadow-md hover:shadow-lg cursor-pointer transition-all duration-200 select-none text-center"
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-4.5 h-4.5 text-amber-600" />
                <span className="text-sm font-black text-slate-800 font-sans tracking-tight">
                  دفترچه یادداشت
                </span>
                {quickNotesCount > 0 && (
                  <span className="text-xs font-bold font-mono text-slate-500">
                    ({toPersianDigits(quickNotesCount)} یادداشت)
                  </span>
                )}
              </div>
            </button>

            {/* Spiritual & Time Status Widget (Centered, beautifully padded frame, scroll-safe) */}
            <div className="w-full bg-white/80 border border-slate-150/70 rounded-2xl px-6 py-6 sm:py-8 flex flex-col items-center justify-center text-center select-none gap-4 sm:gap-6 mt-4 shadow-sm hover:shadow-md transition-all duration-300 animate-in fade-in duration-300">
              <div className="text-[20px] sm:text-2xl md:text-[26px] font-black text-cyan-600 leading-relaxed tracking-wide">
                ذکر روز: {dhikrText}
              </div>
              <div className="text-2xl sm:text-3xl md:text-[32px] font-black text-cyan-600 tracking-tight">
                {todayDateString}
              </div>
            </div>

          </div>
        </>
      ) : activeSubView === "sessions-list" ? (
        <div className="space-y-6 animate-in fade-in duration-250">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveSubView("home")}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 hover:text-slate-900 rounded-2xl transition cursor-pointer flex items-center justify-center shadow-inner"
                title="برگشت به داشبورد"
              >
                <ArrowRight className="w-5 h-5 animate-pulse" />
              </button>
              <div className="text-right font-sans">
                <h2 className="text-sm font-black text-slate-800">
                  جلسات دادرسی پیش رو
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    {toPersianDigits(upcomingSessionsCount)} جلسه فعال
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate("event-archive")}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition cursor-pointer border border-slate-200/40 font-sans"
            >
              <Archive className="w-4 h-4 text-slate-500" />
              <span>بایگانی رویدادهای منقضی شده</span>
            </button>
          </div>

          {upcomingSessionsCount === 0 ? (
            <div className="bg-white border border-slate-100 rounded-[2rem] p-12 text-center text-slate-400 text-xs font-semibold flex flex-col items-center justify-center gap-2 shadow-sm min-h-[300px] font-sans">
              <CalendarDays className="w-12 h-12 text-slate-300 mb-2 animate-pulse" />
              <p>هیچ جلسه دادرسی پیش رویی برنامه‌ریزی نشده است.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
              {[...events]
                .filter(
                  (ev) =>
                    ev.type === "جلسه دادرسی" &&
                    !ev.isArchived &&
                    !isEventExpired(
                      ev.jalaliDate,
                      ev.time,
                      5,
                      ev.endRepeatDate,
                    ),
                )
                .sort(
                  (a, b) =>
                    getEventTimestamp(a.jalaliDate, a.time) -
                    getEventTimestamp(b.jalaliDate, b.time),
                )
                .map((ev) => {
                  const dev = ev as any;
                  const times = [];
                  if (dev.alarm1Hour) times.push("۱ ساعت");
                  if (dev.alarm1Day !== false) times.push("۱ روز");
                  if (dev.alarm3Days) times.push("۳ روز");
                  if (dev.alarm1Week) times.push("۱ هفته");
                  if (times.length === 0) times.push("موعد مقرر");

                  return (
                    <div
                      key={ev.id}
                      className="p-5 rounded-[2rem] border transition-all duration-150 flex flex-col justify-between space-y-4 bg-[#ecfdf5] border-emerald-200 hover:border-emerald-300 text-emerald-950 shadow-sm hover:shadow-md animate-in zoom-in-95 duration-150"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold font-mono">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{toPersianDigits(ev.time)}</span>
                          </div>
                          <span className="text-[8.5px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            کادر ثبت جلسات
                          </span>
                        </div>

                        <h4 className="text-xs font-black text-slate-800 mt-2.5 truncate">
                          {ev.title}
                        </h4>
                        {ev.caseTitle && (
                          <p className="text-[9.5px] text-slate-500 mt-1 truncate">
                            پرونده: {ev.caseTitle}
                          </p>
                        )}
                        {ev.clientName && (
                          <p className="text-[9.5px] text-slate-550 mt-0.5 truncate font-bold">
                            موکل: {ev.clientName}
                          </p>
                        )}
                      </div>

                      <div className="border-t border-emerald-200/50 pt-2 flex items-center justify-between font-bold">
                        <span className="px-2 py-1 rounded font-mono text-xs md:text-sm font-black text-emerald-850 bg-emerald-500/10">
                          از تاریخ: {toPersianDigits(ev.jalaliDate)}
                        </span>
                        <span className="text-xs md:text-sm font-medium font-sans flex items-center">
                          {dev.repeatSelected &&
                          dev.repeatSelected !== "بدون تکرار" &&
                          dev.endRepeatDate ? (
                            <span className="px-2 py-1 rounded font-mono font-black text-amber-800 bg-amber-500/10">
                              تا تاریخ: {toPersianDigits(dev.endRepeatDate)}
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded font-extrabold text-emerald-700 bg-emerald-500/10">
                              {getRemainingTimeText(ev.jalaliDate, ev.time)}
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 border-t border-emerald-200/30 pt-2 shrink-0">
                        {dev.documentDataUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewDocEvent(ev)}
                            className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-850 border border-emerald-500/10 active:scale-95 font-black text-[9px] rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                            title="مشاهده/دانلود مدرک الحاقی"
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span>مدرک</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenView(ev)}
                          className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-200/30 active:scale-95 font-black text-[9px] rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                          title="مشاهده جزئیات"
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0" />
                          <span>مشاهده</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(ev)}
                          className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/25 active:scale-95 text-amber-800 border border-amber-500/10 font-black text-[9px] rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                          title="ویرایش رویداد"
                        >
                          <Edit className="w-3.5 h-3.5 shrink-0" />
                          <span>ویرایش</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEventClick(ev.id)}
                          className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 active:scale-95 text-red-600 border border-red-500/10 font-black text-[9px] rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                          title="حذف رویداد"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-250">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveSubView("home")}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 hover:text-slate-900 rounded-2xl transition cursor-pointer flex items-center justify-center shadow-inner"
                title="برگشت به داشبورد"
              >
                <ArrowRight className="w-5 h-5 animate-pulse" />
              </button>
              <div className="text-right font-sans">
                <h2 className="text-sm font-black text-slate-800">
                  یادآوری‌های پیش رو
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                    {toPersianDigits(upcomingRemindersCount)} مورد فعال
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate("event-archive")}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition cursor-pointer border border-slate-200/40 font-sans"
            >
              <Archive className="w-4 h-4 text-slate-500" />
              <span>بایگانی رویدادهای منقضی شده</span>
            </button>
          </div>

          {upcomingRemindersCount === 0 ? (
            <div className="bg-white border border-slate-100 rounded-[2rem] p-12 text-center text-slate-400 text-xs font-semibold flex flex-col items-center justify-center gap-2 shadow-sm min-h-[300px] font-sans">
              <Bell className="w-12 h-12 text-slate-300 mb-2 animate-bounce" />
              <p>هیچ یادآوری پیش رویی برنامه‌ریزی نشده است.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
              {(events || [])
                .filter(
                  (ev) =>
                    ev &&
                    ev.type !== "جلسه دادرسی" &&
                    !ev.isArchived &&
                    !isEventExpired(
                      ev.jalaliDate,
                      ev.time,
                      5,
                      ev.endRepeatDate,
                    ),
                )
                .sort((a, b) => {
                  if (!a || !b) return 0;
                  const targetA =
                    (a as any).endRepeatDate || a.jalaliDate || "";
                  const targetB =
                    (b as any).endRepeatDate || b.jalaliDate || "";
                  return getDaysRemaining(targetA) - getDaysRemaining(targetB);
                })
                .map((ev) => {
                  const dev = ev as any;
                  const times = [];
                  if (dev.alarm1Hour) times.push("۱ ساعت");
                  if (dev.alarm1Day !== false) times.push("۱ روز");
                  if (dev.alarm3Days) times.push("۳ روز");
                  if (dev.alarm1Week) times.push("۱ هفته");
                  if (times.length === 0) times.push("موعد مقرر");

                  const isNonJudicial = ev.type === "یادآوری غیر قضایی";

                  return (
                    <div
                      key={ev.id}
                      className={`p-5 rounded-[2rem] border transition-all duration-150 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md animate-in zoom-in-95 duration-150 ${
                        isNonJudicial
                          ? "bg-purple-50/45 border-purple-200 hover:border-purple-300 text-purple-950"
                          : "bg-[#fef2f2] border-red-200 hover:border-red-300 text-red-950"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div
                            className={`flex items-center gap-1 text-[9px] font-bold font-mono ${isNonJudicial ? "text-purple-600" : "text-slate-500"}`}
                          >
                            <Clock
                              className={`w-3.5 h-3.5 ${isNonJudicial ? "text-purple-400" : "text-slate-400"}`}
                            />
                            <span>{toPersianDigits(ev.time)}</span>
                          </div>
                          <span
                            className={`text-[8.5px] font-black px-2 py-0.5 rounded-full ${
                              isNonJudicial
                                ? "bg-purple-100 text-purple-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            نمایش آلارم
                          </span>
                        </div>

                        <h4
                          className={`text-xs font-black mt-2.5 truncate ${isNonJudicial ? "text-purple-950" : "text-slate-800"}`}
                        >
                          {ev.title}
                        </h4>
                        {ev.caseTitle && (
                          <p
                            className={`text-[9.5px] mt-1 truncate ${isNonJudicial ? "text-purple-800" : "text-slate-500"}`}
                          >
                            پرونده: {ev.caseTitle}
                          </p>
                        )}
                        {ev.clientName && (
                          <p
                            className={`text-[9.5px] mt-0.5 truncate font-black p-1 bg-red-100/50 rounded-lg border border-red-200/30 ${isNonJudicial ? "text-purple-700 bg-purple-100/50 border-purple-200/30" : "text-red-800"}`}
                          >
                            <Users className="w-3 h-3 inline-block ml-1" />
                            موکل: {ev.clientName}
                          </p>
                        )}

                        {/* Calculated remaining days countdown warning */}
                        {(() => {
                          const targetDate =
                            dev.repeatSelected &&
                            dev.repeatSelected !== "بدون تکرار" &&
                            dev.endRepeatDate
                              ? dev.endRepeatDate
                              : ev.jalaliDate;
                          const daysLeft = getDaysRemaining(targetDate);
                          if (ev.type === "یادآوری غیر قضایی") {
                            if (daysLeft > 0) {
                              return (
                                <div className="mt-2.5 flex items-center gap-2.5 p-2.5 bg-purple-100 border border-purple-200/50 rounded-xl text-[11px] font-extrabold text-purple-900 animate-pulse shadow-sm animate-in zoom-in-95">
                                  <Bell className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                  <span>
                                    {toPersianDigits(daysLeft)} روز به رویداد
                                    مانده است.
                                  </span>
                                </div>
                              );
                            } else if (daysLeft === 0) {
                              return (
                                <div className="mt-2.5 flex items-center gap-2.5 p-2.5 bg-purple-200 border border-purple-300 rounded-xl text-[11px] font-extrabold text-purple-950 shadow-sm animate-pulse">
                                  <Bell className="w-3.5 h-3.5 text-purple-800 shrink-0" />
                                  <span>امروز موعد رویداد فرا رسیده است!</span>
                                </div>
                              );
                            }
                          } else {
                            if (daysLeft > 0) {
                              return (
                                <div className="mt-2.5 flex items-center gap-1.5 p-2 bg-amber-50 border border-amber-200/40 rounded-xl text-[9px] font-black text-amber-800 animate-pulse">
                                  <Bell className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>
                                    {toPersianDigits(daysLeft)} روز تا پایان
                                    مهلت باقی مانده است.
                                  </span>
                                </div>
                              );
                            } else if (daysLeft === 0) {
                              return (
                                <div className="mt-2.5 flex items-center gap-1.5 p-2 bg-orange-50 border border-orange-200/40 rounded-xl text-[9px] font-black text-orange-900">
                                  <Bell className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                                  <span>
                                    امروز موعد نهایی پایان تاریخ مهلت است!
                                  </span>
                                </div>
                              );
                            }
                          }
                          return null;
                        })()}
                      </div>

                      <div
                        className={`border-t pt-2 flex items-center justify-between font-bold ${isNonJudicial ? "border-purple-200/60" : "border-slate-200/60"}`}
                      >
                        {isNonJudicial ? (
                          <span className="px-2 py-1 rounded font-mono text-xs md:text-sm font-black text-purple-800 bg-purple-100">
                            از تاریخ: {toPersianDigits(ev.jalaliDate)}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded font-mono text-xs md:text-sm font-black text-red-600 bg-red-500/10">
                            از تاریخ: {toPersianDigits(ev.jalaliDate)}
                          </span>
                        )}
                        <span className="text-xs md:text-sm flex items-center">
                          {dev.repeatSelected &&
                          dev.repeatSelected !== "بدون تکرار" &&
                          dev.endRepeatDate ? (
                            <span
                              className={`px-2 py-1 rounded font-mono font-black ${isNonJudicial ? "text-amber-800 bg-amber-500/10" : "text-amber-800 bg-amber-500/10"}`}
                            >
                              تا تاریخ: {toPersianDigits(dev.endRepeatDate)}
                            </span>
                          ) : (
                            <span
                              className={`px-2 py-1 rounded font-sans font-extrabold ${isNonJudicial ? "text-purple-700 bg-purple-500/10" : "text-red-700 bg-red-500/10"}`}
                            >
                              {getRemainingTimeText(ev.jalaliDate, ev.time)}
                            </span>
                          )}
                        </span>
                      </div>

                      <div
                        className={`flex items-center justify-end gap-1.5 border-t pt-2 shrink-0 ${isNonJudicial ? "border-purple-200/60" : "border-slate-200/50"}`}
                      >
                        {dev.documentDataUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewDocEvent(ev)}
                            className={`px-2.5 py-1.5 border active:scale-95 font-black text-[9px] rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                              isNonJudicial
                                ? "bg-purple-100 hover:bg-purple-200 text-purple-900 border-purple-200"
                                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-850 border border-emerald-500/10"
                            }`}
                            title="مشاهده/دانلود مدرک الحاقی"
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span>مدرک</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenView(ev)}
                          className={`px-2.5 py-1.5 border active:scale-95 font-black text-[9px] rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                            isNonJudicial
                              ? "bg-purple-100 hover:bg-purple-200 text-purple-900 border-purple-200/80"
                              : "bg-red-100 hover:bg-red-200 text-red-900 border border-red-200/30"
                          }`}
                          title="مشاهده جزئیات"
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0" />
                          <span>مشاهده</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate("add-reminder", null, ev)}
                          className={`px-2.5 py-1.5 border active:scale-95 font-black text-[9px] rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                            isNonJudicial
                              ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border-amber-500/10"
                              : "bg-amber-500/10 hover:bg-amber-500/25 text-amber-800 border border-amber-500/10"
                          }`}
                          title="ویرایش رویداد"
                        >
                          <Edit className="w-3.5 h-3.5 shrink-0" />
                          <span>ویرایش</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEventClick(ev.id)}
                          className={`px-2.5 py-1.5 active:scale-95 font-black text-[9px] rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                            isNonJudicial
                              ? "bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/10"
                              : "bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/10"
                          }`}
                          title="حذف رویداد"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Quick Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in zoom-in duration-150 relative">
            <div
              className={`${modalType === "جلسه دادرسی" ? "bg-emerald-600" : "bg-red-600"} px-6 py-6 pb-10 flex items-center justify-between text-white rounded-b-[2rem] transition-colors duration-200`}
            >
              <div className="flex items-center gap-3">
                {modalType === "جلسه دادرسی" ? (
                  <CalendarDays className="w-5 h-5 text-emerald-100" />
                ) : (
                  <Bell className="w-5 h-5 text-red-100 shrink-0" />
                )}
                <h3 className="font-black text-sm">
                  {modalType === "جلسه دادرسی"
                    ? "ثبت هوشمند جلسه دادرسی"
                    : "ثبت هوشمند یادآوری قضایی"}
                </h3>
              </div>
              <button
                onClick={() => setShowSessionModal(false)}
                className="hover:bg-white/10 p-2 rounded-full transition cursor-pointer"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <form
              onSubmit={handleQuickRegister}
              className="-mt-6 bg-white rounded-t-[2rem] p-6 space-y-5 overflow-y-auto max-h-[80vh]"
            >
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-400 pr-1">
                  عنوان جلسه:
                </label>
                <div className="relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 p-2">
                    <AlignLeft className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder={
                      modalType === "جلسه دادرسی"
                        ? "مثال: جلسه رسیدگی شعبه اول ..."
                        : "مثال: پیگیری لایحه دفاعیه ..."
                    }
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    className={`w-full pr-4 pl-12 py-3.5 bg-white border border-slate-200 ${modalType === "جلسه دادرسی" ? "focus:border-emerald-500" : "focus:border-red-500"} rounded-2xl font-bold outline-none text-slate-800 text-sm shadow-sm`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-400 pr-1">
                    تاریخ (روز/ماه/سال):
                  </label>
                  <div className="relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 p-2">
                      <Calendar className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="۱۴۰۳/۰۵/۱۰"
                      value={sessionDate}
                      onChange={(e) =>
                        setSessionDate(formatDateWithSlash(e.target.value))
                      }
                      className={`w-full pr-4 pl-12 py-3.5 bg-white border border-slate-200 ${modalType === "جلسه دادرسی" ? "focus:border-emerald-500" : "focus:border-red-500"} rounded-2xl font-mono font-bold outline-none text-slate-800 text-sm shadow-sm`}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-400 pr-1">
                    ساعت دقیق:
                  </label>
                  <div className="relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 p-2">
                      <Clock className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="۰۹:۳۰"
                      value={sessionTime}
                      onChange={(e) =>
                        setSessionTime(formatTimeWithColon(e.target.value))
                      }
                      className={`w-full pr-4 pl-12 py-3.5 bg-white border border-slate-200 ${modalType === "جلسه دادرسی" ? "focus:border-emerald-500" : "focus:border-red-500"} rounded-2xl font-mono font-bold outline-none text-slate-800 text-sm shadow-sm text-center`}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 relative">
                <label className="block text-xs font-black text-slate-400 pr-1">
                  انتخاب پرونده مرتبط:
                </label>
                <div className="relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 p-2">
                    <Briefcase className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="جستجوی پرونده (عنوان یا کلاسه)..."
                    value={caseSearchTerm}
                    onChange={(e) => {
                      setCaseSearchTerm(e.target.value);
                      setShowCaseDropdown(true);
                    }}
                    onFocus={() => setShowCaseDropdown(true)}
                    className={`w-full pr-4 pl-12 py-3.5 bg-white border border-slate-200 ${modalType === "جلسه دادرسی" ? "focus:border-emerald-500" : "focus:border-red-500"} rounded-2xl font-bold outline-none text-slate-800 text-sm shadow-sm pr-10`}
                  />
                  <Search className="w-4 h-4 text-slate-300 absolute right-4 top-1/2 -translate-y-1/2" />

                  {showCaseDropdown && (
                    <div className="absolute z-[110] w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-48 overflow-y-auto">
                      {filteredCases.length > 0 ? (
                        filteredCases.map((cs) => (
                          <button
                            key={cs.id}
                            type="button"
                            onClick={() => {
                              setSelectedCaseId(cs.id);
                              setCaseSearchTerm(
                                `${cs.title} (کلاسه دفتر: ${toPersianDigits(cs.archiveNumber || "ندارد")} | شماره ثنا: ${toPersianDigits(cs.caseNumber || "ندارد")})`,
                              );
                              setShowCaseDropdown(false);
                            }}
                            className={`w-full text-right px-4 py-3 text-xs font-bold transition-colors flex flex-col gap-0.5 border-b border-slate-50 last:border-0 ${
                              selectedCaseId === cs.id
                                ? modalType === "جلسه دادرسی"
                                  ? "bg-emerald-50 text-emerald-700 border-r-4 border-emerald-500"
                                  : "bg-red-50 text-red-700 border-r-4 border-red-500"
                                : "text-slate-700 hover:bg-slate-55"
                            }`}
                          >
                            <span>{cs.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              کلاسه دفتر:{" "}
                              {toPersianDigits(cs.archiveNumber || "ندارد")} |
                              شماره ثنا:{" "}
                              {toPersianDigits(cs.caseNumber || "ندارد")}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-center text-slate-400 text-[10px]">
                          موردی یافت نشد
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {showCaseDropdown && (
                  <div
                    className="fixed inset-0 z-[105] cursor-default"
                    onClick={() => setShowCaseDropdown(false)}
                  />
                )}
              </div>

              <div className="pt-2">
                <div
                  className={`border-2 border-dashed border-slate-100 rounded-[2rem] p-6 bg-slate-50 hover:bg-slate-100 ${modalType === "جلسه دادرسی" ? "hover:border-emerald-200" : "hover:border-red-200"} transition-all text-center space-y-2 relative group shadow-inner`}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-1">
                    <Upload
                      className={`w-10 h-10 text-slate-300 ${modalType === "جلسه دادرسی" ? "group-hover:text-emerald-400" : "group-hover:text-red-400"} transition-colors`}
                    />
                    <p className="text-xs font-black text-slate-500">
                      {pdfFile
                        ? `فایل انتخاب شده: ${pdfFile.name}`
                        : "بارگذاری فایل ابلاغیه (PDF)"}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold">
                      (فایل به بخش مدارک پرونده منتخب اضافه می‌شود)
                    </p>
                  </div>
                </div>
              </div>

              {/* Alarm Config */}
              <div
                className={`p-5 bg-white border ${modalType === "جلسه دادرسی" ? "border-emerald-100" : "border-red-100"} rounded-[2rem] space-y-4 shadow-sm`}
              >
                <h4 className="text-[10px] font-black text-slate-400 block text-right mb-1">
                  تنظیم آلارم هشدار و ارسال پیامک:
                </h4>

                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[10px] font-black text-slate-700">
                  {[
                    {
                      label: "۱ ساعت قبل",
                      state: alarm1Hour,
                      set: setAlarm1Hour,
                    },
                    { label: "۱ روز قبل", state: alarm1Day, set: setAlarm1Day },
                    {
                      label: "۳ روز قبل",
                      state: alarm3Days,
                      set: setAlarm3Days,
                    },
                    {
                      label: "۱ هفته قبل",
                      state: alarm1Week,
                      set: setAlarm1Week,
                    },
                  ].map((tg) => (
                    <label
                      key={tg.label}
                      className={`flex items-center justify-between gap-1.5 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-transparent ${modalType === "جلسه دادرسی" ? "hover:border-emerald-200" : "hover:border-red-200"} transition-all`}
                    >
                      <input
                        type="checkbox"
                        checked={tg.state}
                        onChange={(e) => tg.set(e.target.checked)}
                        className={`w-4 h-4 rounded ${modalType === "جلسه دادرسی" ? "text-emerald-600 focus:ring-emerald-500" : "text-red-600 focus:ring-red-500"} cursor-pointer order-2`}
                      />
                      <span className="order-1 text-slate-600 font-black">
                        {tg.label}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="w-full flex justify-center py-2">
                  <label
                    className={`flex items-center gap-3 ${modalType === "جلسه دادرسی" ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-red-700 bg-red-50 border-red-200"} px-5 py-3 rounded-2xl border cursor-pointer shadow-sm hover:shadow-md transition-all`}
                  >
                    <input
                      type="checkbox"
                      checked={smsEnabled}
                      onChange={(e) => setSmsEnabled(e.target.checked)}
                      className={`w-4 h-4 rounded ${modalType === "جلسه دادرسی" ? "text-emerald-600 focus:ring-emerald-500" : "text-red-600 focus:ring-red-500"} cursor-pointer order-2`}
                    />
                    <span className="font-black text-xs order-1">
                      فعال‌سازی ارسال پیام کوتاه (SMS)
                    </span>
                  </label>
                </div>

                {smsEnabled && (
                  <div className="space-y-3 pt-1">
                    <input
                      type="text"
                      placeholder="09144627119"
                      value={smsPhone1}
                      onChange={(e) => setSmsPhone1(e.target.value)}
                      dir="ltr"
                      className={`w-full px-4 py-3.5 bg-slate-50 border border-slate-150 rounded-2xl outline-none text-sm font-bold text-center shadow-inner ${modalType === "جلسه دادرسی" ? "focus:border-emerald-300" : "focus:border-red-300"} transition-all text-slate-700`}
                    />
                    <input
                      type="text"
                      placeholder="09901095393"
                      value={smsPhone2}
                      onChange={(e) => setSmsPhone2(e.target.value)}
                      dir="ltr"
                      className={`w-full px-4 py-3.5 bg-slate-50 border border-slate-150 rounded-2xl outline-none text-sm font-bold text-center shadow-inner ${modalType === "جلسه دادرسی" ? "focus:border-emerald-300" : "focus:border-red-300"} transition-all text-slate-700`}
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={isUploading}
                  className={`w-full ${modalType === "جلسه دادرسی" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" : "bg-red-600 hover:bg-red-700 shadow-red-600/20"} text-white rounded-2xl py-4 text-sm font-black shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-[0.98] cursor-pointer`}
                >
                  {isUploading
                    ? "در حال ثبت اطلاعات..."
                    : modalType === "جلسه دادرسی"
                      ? "تایید و ثبت نهایی جلسه و مدارک"
                      : "تایید و ثبت نهایی یادآوری قضایی"}
                  {!isUploading && <Plus className="w-5 h-5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl py-4 text-sm font-black transition active:scale-[0.98] cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline View Event Modal (Requested by User) */}
      {selectedViewEvent && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[120] animate-in fade-in duration-200"
          dir="rtl"
        >
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in zoom-in duration-150 relative">
            <div
              className={`px-6 py-6 pb-10 flex items-center justify-between text-white rounded-b-[2rem] ${selectedViewEvent.type === "جلسه دادرسی" ? "bg-emerald-600" : selectedViewEvent.type === "یادآوری غیر قضایی" ? "bg-purple-600" : "bg-red-600"}`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-white animate-pulse" />
                <h3 className="font-black text-sm">جزئیات کامل رویداد قضایی</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedViewEvent(null)}
                className="hover:bg-white/10 p-2 rounded-full transition cursor-pointer"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="-mt-6 bg-white rounded-t-[2rem] p-6 space-y-5 overflow-y-auto max-h-[80vh] text-slate-800">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <p className="text-[10px] text-slate-400 font-bold">
                  عنوان یادداشت یا رویداد:
                </p>
                <p className="text-sm font-black text-slate-800">
                  {selectedViewEvent.title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <p className="text-[10px] text-slate-400 font-bold">
                    تاریخ برگزاری (شمسی):
                  </p>
                  <p className="text-xs font-mono font-black text-slate-800">
                    {toPersianDigits(selectedViewEvent.jalaliDate)}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <p className="text-[10px] text-slate-400 font-bold">
                    ساعت دقیق:
                  </p>
                  <p className="text-xs font-mono font-black text-slate-800">
                    {toPersianDigits(selectedViewEvent.time)}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <p className="text-[10px] text-slate-400 font-bold">
                  نوع رویداد:
                </p>
                <span
                  className={`inline-block text-[10px] font-black px-2.5 py-1 rounded-full ${selectedViewEvent.type === "جلسه دادرسی" ? "bg-emerald-100 text-emerald-850" : "bg-red-100 text-red-850"}`}
                >
                  {selectedViewEvent.type}
                </span>
              </div>

              {selectedViewEvent.caseTitle && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <p className="text-[10px] text-slate-400 font-bold">
                    پرونده مرتبط:
                  </p>
                  <p className="text-xs font-extrabold text-slate-800">
                    {selectedViewEvent.caseTitle}
                  </p>
                </div>
              )}

              {selectedViewEvent.clientName && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <p className="text-[10px] text-slate-400 font-bold">
                    موکل مربوطه:
                  </p>
                  <p className="text-xs font-extrabold text-slate-800">
                    {selectedViewEvent.clientName}
                  </p>
                </div>
              )}

              {selectedViewEvent.description && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <p className="text-[10px] text-slate-400 font-bold">
                    جزییات و آدرس/توضیحات جلسه:
                  </p>
                  <p className="text-xs font-bold leading-relaxed whitespace-pre-wrap text-slate-600">
                    {selectedViewEvent.description}
                  </p>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedViewEvent(null)}
                  className="w-full bg-slate-900 hover:bg-slate-850 text-white font-black py-4 rounded-2xl transition active:scale-98 cursor-pointer text-sm"
                >
                  فهمیدم / بستن پنجره
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Document Previewer Modal (Requested by User) */}
      {previewDocEvent && (
        <div
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-[130] animate-in fade-in duration-200"
          dir="rtl"
        >
          <div className="w-full max-w-xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in zoom-in duration-150">
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="bg-white/20 p-2 rounded-xl">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-xs">
                    صندوق هوشمند مدارک الحاقی رویداد
                  </h3>
                  <p className="text-[9px] text-emerald-100 font-medium">
                    مشاهده، چاپ و دانلود اسناد تاییدیه
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDocEvent(null)}
                className="hover:bg-white/15 p-2 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              {/* Document Info Card */}
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-between text-right">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">
                    نام مدرک ذخیره شده پیوست:
                  </span>
                  <span className="text-xs font-black text-slate-800 break-all">
                    {previewDocEvent.documentName || "مدرک رویداد قضایی"}
                  </span>
                </div>
                <div className="text-left shrink-0 pl-1">
                  <span className="text-[10px] text-slate-400 font-bold block">
                    حجم مدرک:
                  </span>
                  <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md mt-1 inline-block">
                    {previewDocEvent.documentSize ||
                      toPersianDigits("0") + " کیلوبایت"}
                  </span>
                </div>
              </div>

              {/* Preview Display Region */}
              <div className="border border-slate-150 rounded-2xl overflow-hidden bg-slate-100 p-2 flex items-center justify-center min-h-[250px] relative">
                {previewDocEvent.documentDataUrl?.startsWith("data:image/") ? (
                  <img
                    src={previewDocEvent.documentDataUrl}
                    alt="Preview"
                    className="max-h-[380px] w-auto max-w-full rounded-xl object-contain shadow-sm"
                  />
                ) : previewDocEvent.documentDataUrl?.startsWith(
                    "data:application/pdf",
                  ) ? (
                  <div className="w-full flex flex-col items-center gap-4 py-8">
                    <iframe
                      src={previewDocEvent.documentDataUrl}
                      className="w-full h-[320px] rounded-xl border border-slate-200 shadow-inner bg-white hidden sm:block"
                      title="PDF Preview"
                    />
                    <div className="sm:hidden flex flex-col items-center gap-2.5 text-center p-4">
                      <FileText className="w-16 h-16 text-slate-400 animate-bounce" />
                      <p className="text-xs font-black text-slate-700">
                        سند PDF آماده است
                      </p>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                        پیش‌نمایش PDF در صفحات موبایل محدود است؛ لطفاً دکمه
                        دانلود یا چاپ را از دکمه‌های زیر انتخاب نمایید.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6 gap-2">
                    <FileText className="w-12 h-12 text-slate-400" />
                    <p className="text-xs font-black text-slate-600">
                      عدم امکان پیش‌نمایش مستقیم این پسوند
                    </p>
                    <p className="text-[9px] text-slate-400">
                      شما همچنان می‌توانید با دکمه‌های زیر این فایل را دریافت یا
                      چاپ کنید.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons Hub */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (previewDocEvent.documentDataUrl) {
                      const link = document.createElement("a");
                      link.href = previewDocEvent.documentDataUrl;
                      link.download =
                        previewDocEvent.documentName || "مدرک_یادآوری.pdf";
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition shadow-md"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>بارگیری / دانلود نسخه اصلی</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const docName = previewDocEvent.documentName || "مدرک.pdf";
                    const dataUrl = previewDocEvent.documentDataUrl;
                    if (!dataUrl) return;

                    let frame = document.getElementById(
                      "print-hidden-iframe",
                    ) as HTMLIFrameElement;
                    if (!frame) {
                      frame = document.createElement("iframe");
                      frame.id = "print-hidden-iframe";
                      frame.style.position = "fixed";
                      frame.style.right = "0";
                      frame.style.bottom = "0";
                      frame.style.width = "0";
                      frame.style.height = "0";
                      frame.style.border = "none";
                      document.body.appendChild(frame);
                    }

                    if (dataUrl.startsWith("data:image/")) {
                      const doc =
                        frame.contentWindow?.document || frame.contentDocument;
                      if (doc) {
                        doc.open();
                        doc.write(`
                          <html>
                            <head>
                              <title>${docName}</title>
                              <style>
                                body { margin: 0; display: flex; justify-content: center; align-items: center; }
                                img { max-width: 100%; max-height: 100%; object-fit: contain; }
                              </style>
                            </head>
                            <body>
                              <img src="${dataUrl}" onload="setTimeout(function(){ window.print(); }, 500);" />
                            </body>
                          </html>
                        `);
                        doc.close();
                      }
                    } else {
                      frame.src = dataUrl;
                      setTimeout(() => {
                        try {
                          frame.contentWindow?.focus();
                          frame.contentWindow?.print();
                        } catch (e) {
                          const w = window.open(dataUrl, "_blank");
                          if (w) {
                            w.print();
                          }
                        }
                      }, 550);
                    }
                  }}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition border border-slate-300"
                >
                  <Printer className="w-4 h-4 shrink-0" />
                  <span>چاپ نسخه هاردکپی</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewDocEvent(null)}
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-xl text-xs cursor-pointer active:scale-98 transition shadow-lg shrink-0"
                >
                  بستن پیش‌نمایش
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline Edit Event Modal (Requested by User) */}
      {selectedEditEvent && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[120] animate-in fade-in duration-200"
          dir="rtl"
        >
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in zoom-in duration-150 relative">
            <div
              className={`px-6 py-6 pb-10 flex items-center justify-between text-white rounded-b-[2rem] ${editType === "جلسه دادرسی" ? "bg-emerald-600" : editType === "یادآوری غیر قضایی" ? "bg-purple-600" : "bg-red-600"}`}
            >
              <div className="flex items-center gap-3">
                <Edit className="w-5 h-5 text-white" />
                <h3 className="font-black text-sm">
                  ویرایش کامل مشخصات رویداد قضایی
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEditEvent(null)}
                className="hover:bg-white/10 p-2 rounded-full transition cursor-pointer"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <form
              onSubmit={handleEditSave}
              className="-mt-6 bg-white rounded-t-[2rem] p-6 space-y-5 overflow-y-auto max-h-[80vh]"
            >
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-400 pr-1">
                  عنوان جلسه:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="عنوان جلسه..."
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full pr-4 pl-4 py-3.5 bg-white border border-slate-200 focus:border-red-600 rounded-2xl font-bold outline-none text-slate-800 text-sm shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-400 pr-1">
                    تاریخ (روز/ماه/سال):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="۱۴۰۳/۰۵/۱۰"
                    value={editDate}
                    onChange={(e) =>
                      setEditDate(formatDateWithSlash(e.target.value))
                    }
                    className="w-full px-4 py-3.5 bg-white border border-slate-200 focus:border-red-600 rounded-2xl font-mono font-bold outline-none text-slate-800 text-sm shadow-sm text-center"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-400 pr-1">
                    ساعت دقیق:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="۰۹:۳۰"
                    value={editTime}
                    onChange={(e) =>
                      setEditTime(formatTimeWithColon(e.target.value))
                    }
                    className="w-full px-4 py-3.5 bg-white border border-slate-200 focus:border-red-600 rounded-2xl font-mono font-bold outline-none text-slate-800 text-sm shadow-sm text-center"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-400 pr-1">
                  نوع یادآور:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditType("جلسه دادرسی")}
                    className={`py-3.5 rounded-2xl font-black text-xs transition cursor-pointer text-center border ${editType === "جلسه دادرسی" ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                  >
                    جلسه دادرسی
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditType("سایر رویدادها")}
                    className={`py-3.5 rounded-2xl font-black text-xs transition cursor-pointer text-center border ${editType !== "جلسه دادرسی" ? "bg-red-600 text-white border-red-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                  >
                    آلارم / سایر موارد
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 relative">
                <label className="block text-xs font-black text-slate-400 pr-1">
                  اصلاح پرونده مرتبط:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="جستجوی پرونده (عنوان یا کلاسه)..."
                    value={editCaseSearchTerm}
                    onChange={(e) => {
                      setEditCaseSearchTerm(e.target.value);
                      setShowEditCaseDropdown(true);
                    }}
                    onFocus={() => setShowEditCaseDropdown(true)}
                    className="w-full pr-10 pl-4 py-3.5 bg-white border border-slate-200 focus:border-red-600 rounded-2xl font-bold outline-none text-slate-800 text-sm shadow-sm"
                  />
                  <Search className="w-4 h-4 text-slate-300 absolute right-4 top-1/2 -translate-y-1/2" />

                  {showEditCaseDropdown && (
                    <div className="absolute z-[130] w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-48 overflow-y-auto">
                      {filteredEditCases.length > 0 ? (
                        filteredEditCases.map((cs) => (
                          <button
                            key={cs.id}
                            type="button"
                            onClick={() => {
                              setEditCaseId(cs.id);
                              setEditCaseSearchTerm(
                                `${cs.title} (کلاسه دفتر: ${toPersianDigits(cs.archiveNumber || "ندارد")} | شماره ثنا: ${toPersianDigits(cs.caseNumber || "ندارد")})`,
                              );
                              setShowEditCaseDropdown(false);
                            }}
                            className={`w-full text-right px-4 py-3 text-xs font-bold hover:bg-slate-50 transition-colors flex flex-col gap-0.5 border-b border-slate-50 last:border-0 ${editCaseId === cs.id ? "bg-[#fef2f2] text-red-600 border-r-4 border-red-600" : "text-slate-700"}`}
                          >
                            <span>{cs.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              کلاسه دفتر:{" "}
                              {toPersianDigits(cs.archiveNumber || "ندارد")} |
                              شماره ثنا:{" "}
                              {toPersianDigits(cs.caseNumber || "ندارد")}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-center text-slate-400 text-[10px]">
                          موردی یافت نشد
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {showEditCaseDropdown && (
                  <div
                    className="fixed inset-0 z-[125] cursor-default"
                    onClick={() => setShowEditCaseDropdown(false)}
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-400 pr-1">
                  توضیحات و جزئیات رویداد:
                </label>
                <textarea
                  placeholder="جزئیات یادآوری یادداشت، مکان و غیره..."
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-red-600 rounded-2xl font-bold outline-none text-slate-800 text-xs shadow-sm h-20 resize-none leading-relaxed"
                />
              </div>

              {/* Alarm Config */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-3">
                <h4 className="text-[9.5px] font-black text-slate-400 block text-right">
                  تنظیم هشدار و برقراری دائم پیامک:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-black">
                  {[
                    {
                      label: "۱ ساعت قبل",
                      state: editAlarm1Hour,
                      set: setEditAlarm1Hour,
                    },
                    {
                      label: "۱ روز قبل",
                      state: editAlarm1Day,
                      set: setEditAlarm1Day,
                    },
                    {
                      label: "۳ روز قبل",
                      state: editAlarm3Days,
                      set: setEditAlarm3Days,
                    },
                    {
                      label: "۱ هفته قبل",
                      state: editAlarm1Week,
                      set: setEditAlarm1Week,
                    },
                  ].map((tg) => (
                    <label
                      key={tg.label}
                      className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-150 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={tg.state}
                        onChange={(e) => tg.set(e.target.checked)}
                        className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer order-2"
                      />
                      <span className="order-1 text-slate-600">{tg.label}</span>
                    </label>
                  ))}
                </div>
                <div className="w-full flex justify-center py-1">
                  <label className="flex items-center gap-2 text-red-700 bg-red-50 px-4 py-2.5 rounded-xl border border-red-100 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={editSmsEnabled}
                      onChange={(e) => setEditSmsEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer order-2"
                    />
                    <span className="font-black order-1">
                      فعال‌سازی سیستم اطلاع‌رسانی پیامک
                    </span>
                  </label>
                </div>
                {editSmsEnabled && (
                  <div className="space-y-2 pt-1">
                    <input
                      type="text"
                      placeholder="09144627119"
                      value={editSmsPhone1}
                      onChange={(e) => setEditSmsPhone1(e.target.value)}
                      dir="ltr"
                      className="w-full px-4 py-2.5 bg-white border border-slate-150 rounded-xl outline-none text-xs font-bold text-center shadow-inner text-slate-700"
                    />
                    <input
                      type="text"
                      placeholder="09901095393"
                      value={editSmsPhone2}
                      onChange={(e) => setEditSmsPhone2(e.target.value)}
                      dir="ltr"
                      className="w-full px-4 py-2.5 bg-white border border-slate-150 rounded-xl outline-none text-xs font-bold text-center shadow-inner text-slate-700"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full bg-[#dc2626] hover:bg-red-700 text-white rounded-2xl py-4 text-xs font-black transition active:scale-[0.98] cursor-pointer text-center"
                >
                  ذخیره و اصلاح رویداد
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEditEvent(null)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl py-4 text-xs font-black transition active:scale-[0.98] cursor-pointer text-center"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
