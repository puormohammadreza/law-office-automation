import React, { useState, useEffect, useRef } from "react";
import { 
  AlignRight, 
  LayoutGrid, 
  CalendarDays, 
  Bell, 
  Repeat, 
  Plus, 
  Droplet, 
  FileText, 
  MapPin, 
  Link, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  Check, 
  X,
  FileUp,
  Image as ImageIcon,
  Upload,
  Clock,
  AlignLeft,
  Calendar,
  Search
} from "lucide-react";
import { getCurrentJalali, JALALI_MONTH_NAMES, toPersianDigits, toEnglishDigits, addDaysToJalali, formatDateWithSlash, formatTimeWithColon } from "../utils/shamsi";
import { LegalEvent, EventType, LegalCase, CaseDocument } from "../types";

const safeRandomUUID = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // ignore
    }
  }
  return "id_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11);
};

interface AddReminderPageProps {
  cases: LegalCase[];
  onAddEvent: (ev: LegalEvent) => void;
  onUpdateEvent?: (ev: LegalEvent) => void;
  onBack: () => void;
  editingEvent?: LegalEvent;
  onAddDocument?: (doc: CaseDocument) => void;
  dataLoaded?: boolean;
}

// Jalali helper arrays
const YEARS = [1403, 1404, 1405, 1406, 1407, 1408, 1409, 1410];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

import { downloadICSFile } from "../utils/icsHelper";

export default function AddReminderPage({ cases, onAddEvent, onUpdateEvent, onBack, editingEvent, onAddDocument, dataLoaded = true }: AddReminderPageProps) {

  const safeCases = cases || [];
  console.log("DEBUG: cases prop in AddReminderPage:", cases);
  console.log("DEBUG: dataLoaded in AddReminderPage:", dataLoaded);
  // TAB/MODE SELECTOR (Judicial vs Non-Judicial)
  const [reminderMode, setReminderMode] = useState<"judicial" | "non-judicial">(() => 
    editingEvent?.type === "یادآوری غیر قضایی" ? "non-judicial" : "judicial"
  );

  // States for Non-Judicial Reminder
  const [njTitle, setNjTitle] = useState(() => editingEvent?.type === "یادآوری غیر قضایی" ? editingEvent.title : "");
  const [njTitleError, setNjTitleError] = useState(false);
  const [njDate, setNjDate] = useState(() => {
    if (editingEvent && editingEvent.type === "یادآوری غیر قضایی") {
      return editingEvent.jalaliDate;
    }
    const rightNow = getCurrentJalali();
    return `${rightNow.jy}/${String(rightNow.jm).padStart(2, "0")}/${String(rightNow.jd).padStart(2, "0")}`;
  });
  const [njTime, setNjTime] = useState(() => editingEvent?.type === "یادآوری غیر قضایی" ? editingEvent.time : "09:00");
  const [njPdfFile, setNjPdfFile] = useState<File | null>(null);
  const [njUploadedDoc, setNjUploadedDoc] = useState<{ name: string; size: string; dataUrl?: string } | null>(() => {
    if (editingEvent && editingEvent.type === "یادآوری غیر قضایی" && editingEvent.documentDataUrl) {
      return {
        name: editingEvent.documentName || "مدرک پیوستی یادآوری",
        size: editingEvent.documentSize || "۰ کیلوبایت",
        dataUrl: editingEvent.documentDataUrl
      };
    }
    return null;
  });

  const [njAlarm1Hour, setNjAlarm1Hour] = useState(() => editingEvent?.type === "یادآوری غیر قضایی" ? !!editingEvent.alarm1Hour : true);
  const [njAlarm1Day, setNjAlarm1Day] = useState(() => editingEvent?.type === "یادآوری غیر قضایی" ? !!editingEvent.alarm1Day : true);
  const [njAlarm3Days, setNjAlarm3Days] = useState(() => editingEvent?.type === "یادآوری غیر قضایی" ? !!editingEvent.alarm3Days : false);
  const [njAlarm1Week, setNjAlarm1Week] = useState(() => editingEvent?.type === "یادآوری غیر قضایی" ? !!editingEvent.alarm1Week : false);
  const [njSmsEnabled, setNjSmsEnabled] = useState(false);
  const [smsPhone1, setSmsPhone1] = useState("09144627119");
  const [smsPhone2, setSmsPhone2] = useState("09901095393");
  const [syncToCalendar, setSyncToCalendar] = useState(false);

  const isJudicial = reminderMode === "judicial";
  
  // Theme Configs: Judicial is RED, Non-Judicial is PURPLE
  const themeHeaderBg = isJudicial ? "bg-red-600" : "bg-purple-600";
  const themeHeaderHover = isJudicial ? "hover:bg-red-700" : "hover:bg-purple-700";
  const themeHeaderBell = isJudicial ? "text-red-100" : "text-purple-100";
  const themeButtonSubmitBg = isJudicial ? "bg-red-600 hover:bg-red-700 shadow-red-600/10" : "bg-purple-600 hover:bg-purple-700 shadow-purple-600/10";
  const themeButtonCancelBorder = isJudicial ? "border-red-500 text-red-600 hover:bg-red-50" : "border-purple-500 text-purple-600 hover:bg-purple-50";
  const themeButtonBorder = isJudicial ? "border-red-500 text-red-600" : "border-purple-500 text-purple-600";
  const themeAccentBorder = isJudicial ? "border-red-600" : "border-purple-600";
  const themeCheckBg = isJudicial ? "bg-red-600 border-red-600" : "bg-purple-600 border-purple-600";
  const themeDotBg = isJudicial ? "bg-red-600" : "bg-purple-600";
  const themeVisualDialBg = isJudicial ? "bg-red-600 shadow-red-600/20 border-red-600/10" : "bg-purple-600 shadow-purple-600/20 border-purple-600/10";
  const themeBannerBg = isJudicial ? "bg-red-50 border-red-100" : "bg-purple-50 border-purple-100";
  const themeBannerText1 = isJudicial ? "text-red-700" : "text-purple-700";
  const themeBannerText2 = isJudicial ? "text-red-600" : "text-purple-600";

  // Additional dynamic inputs styling helper classes as planned
  const themeFocusBorder = isJudicial ? "focus-within:border-red-500" : "focus-within:border-purple-500";
  const themeHoverBorder = isJudicial ? "hover:border-red-400" : "hover:border-purple-400";
  const themeGroupHoverText = isJudicial ? "group-hover:text-red-650" : "group-hover:text-purple-600";
  const themeTabSelectedClass = isJudicial 
    ? "bg-red-50 border-red-300 text-red-700 shadow-sm font-black" 
    : "bg-purple-50 border-purple-300 text-purple-700 shadow-sm font-black";


  const handleNjFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNjPdfFile(file);

    const isPdf = file.type === "application/pdf";
    const sizeKb = (file.size / 1024).toFixed(1);
    const sizeStr = sizeKb + " کیلوبایت";

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setNjUploadedDoc({
        name: file.name,
        size: toPersianDigits(sizeStr),
        dataUrl
      });
    };
    reader.readAsDataURL(file);
  };

  // Base states
  const [title, setTitle] = useState(() => editingEvent ? editingEvent.title : "");
  const [titleError, setTitleError] = useState(false);

  // States for physical summon notice document upload (ابلاغیه یا اخطاریه)
  const [dragActive, setDragActive] = useState(false);
  const [uploadedNotices, setUploadedNotices] = useState<CaseDocument[]>([]);
  const [uploadError, setUploadError] = useState("");
  
  // Dynamic current date initialization
  const now = getCurrentJalali();

  const initDate = (() => {
    if (editingEvent && editingEvent.jalaliDate) {
      const parts = editingEvent.jalaliDate.split("/");
      if (parts.length === 3) {
        const y = parseInt(toEnglishDigits(parts[0]), 10);
        const m = parseInt(toEnglishDigits(parts[1]), 10);
        const d = parseInt(toEnglishDigits(parts[2]), 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          return { y, m, d };
        }
      }
    }
    return { y: now.jy, m: now.jm, d: now.jd };
  })();

  const initTime = (() => {
    if (editingEvent && editingEvent.time) {
      const parts = editingEvent.time.split(":");
      if (parts.length === 2) {
        const h = parseInt(toEnglishDigits(parts[0]), 10);
        const m = parseInt(toEnglishDigits(parts[1]), 10);
        if (!isNaN(h) && !isNaN(m)) {
          return { h, m };
        }
      }
    }
    return { h: 9, m: 0 };
  })();

  const [year, setYear] = useState(initDate.y);
  const [month, setMonth] = useState(JALALI_MONTH_NAMES[(initDate.m - 1) % 12] || "خرداد");
  const [day, setDay] = useState(initDate.d);
  const [hour, setHour] = useState(initTime.h);
  const [minute, setMinute] = useState(initTime.m);

  // Expanded fields toggles
  const [isMoreInfoExpanded, setIsMoreInfoExpanded] = useState(true);
  
  // Values representing form entries
  const [descriptionValue, setDescriptionValue] = useState(() => {
    if (editingEvent && editingEvent.description) {
      const parts = editingEvent.description.split(" \n | ");
      const descPart = parts.find(p => p.startsWith("توضیحات: "));
      if (descPart) return descPart.replace("توضیحات: ", "");
    }
    return "";
  });

  const [locationValue, setLocationValue] = useState(() => {
    if (editingEvent && editingEvent.description) {
      const parts = editingEvent.description.split(" \n | ");
      const locPart = parts.find(p => p.startsWith("مکان: "));
      if (locPart) return locPart.replace("مکان: ", "");
    }
    return "";
  });

  const [linkValue, setLinkValue] = useState(() => {
    if (editingEvent && editingEvent.description) {
      const parts = editingEvent.description.split(" \n | ");
      const linkPart = parts.find(p => p.startsWith("لینک: "));
      if (linkPart) return linkPart.replace("لینک: ", "");
    }
    return "";
  });

  const [selectedCaseId, setSelectedCaseId] = useState(() => {
    if (editingEvent && editingEvent.caseId) {
      return editingEvent.caseId;
    }
    return "";
  });

  const [showCaseSelectionDropdown, setShowCaseSelectionDropdown] = useState(false);
  const [caseSearchQuery, setCaseSearchQuery] = useState("");

  const [showDescription, setShowDescription] = useState(() => !!descriptionValue);
  const [showLocation, setShowLocation] = useState(() => !!locationValue);
  const [showLink, setShowLink] = useState(() => !!linkValue);

  // Popup & modal controls
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAlertPicker, setShowAlertPicker] = useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);

  // Selection states (for drawers)
  const [tempYear, setTempYear] = useState(year);
  const [tempMonth, setTempMonth] = useState(month);
  const [tempDay, setTempDay] = useState(day);
  const [tempHour, setTempHour] = useState(hour);
  const [tempMinute, setTempMinute] = useState(minute);

  // Alerts selection (multi-select checklist style as shown in Image 3)
  const [alerts, setAlerts] = useState<string[]>(() => {
    if (editingEvent && editingEvent.description) {
      const parts = editingEvent.description.split(" \n | ");
      const alertPart = parts.find(p => p.startsWith("هشدارها: "));
      if (alertPart) {
        const listStr = alertPart.replace("هشدارها: ", "");
        return listStr.split(", ").filter(Boolean);
      }
    }
    return ["در همان لحظه"];
  });

  const alertOptions = [
    "در همان لحظه",
    "۱۰ دقیقه قبل",
    "۳۰ دقیقه قبل",
    "۱ ساعت قبل",
    "۲ ساعت قبل",
    "۱ روز قبل",
    "۱ هفته قبل"
  ];

  // Repeat state (Image 4)
  const [repeatSelected, setRepeatSelected] = useState(() => {
    if (editingEvent && editingEvent.description) {
      const parts = editingEvent.description.split(" \n | ");
      const repeatPart = parts.find(p => p.startsWith("تکرار: "));
      if (repeatPart) {
        const val = repeatPart.replace("تکرار: ", "");
        if (val.includes("بدون تکرار")) return "بدون تکرار";
        if (val.includes("روزانه")) return "روزانه";
        if (val.includes("هفتگی")) return "هفتگی";
        if (val.includes("ماهانه")) return "ماهانه";
        if (val.includes("سالانه")) return "سالانه";
      }
    }
    return "بدون تکرار";
  });

  const [endRepeatOption, setEndRepeatOption] = useState(() => {
    if (editingEvent && editingEvent.description) {
      const parts = editingEvent.description.split(" \n | ");
      const repeatPart = parts.find(p => p.startsWith("تکرار: "));
      if (repeatPart) {
        const val = repeatPart.replace("تکرار: ", "");
        if (val.includes("تکرار برای همیشه")) return "تکرار برای همیشه";
        if (val.includes("تا تاریخ")) return "تا تاریخ";
        if (val.includes("بعد از")) return "بعد از";
      }
    }
    return "تکرار برای همیشه";
  });

  const todaySlashDate = `${now.jy}/${now.jm.toString().padStart(2, "0")}/${now.jd.toString().padStart(2, "0")}`;
  const [endRepeatDate, setEndRepeatDate] = useState(() => {
    if (editingEvent && editingEvent.description) {
      const parts = editingEvent.description.split(" \n | ");
      const repeatPart = parts.find(p => p.startsWith("تکرار: "));
      if (repeatPart && repeatPart.includes("تا تاریخ")) {
        // Find date like YYYY/MM/DD
        const m = repeatPart.match(/\d{4}\/\d{2}\/\d{2}/);
        if (m) return toPersianDigits(m[0]);
      }
    }
    return toPersianDigits(todaySlashDate);
  });

  const [endRepeatCount, setEndRepeatCount] = useState(() => {
    if (editingEvent && editingEvent.description) {
      const parts = editingEvent.description.split(" \n | ");
      const repeatPart = parts.find(p => p.startsWith("تکرار: "));
      if (repeatPart && repeatPart.includes("بعد از")) {
        const m = repeatPart.match(/بعد از (\d+) دفعه/);
        if (m) return m[1];
      }
    }
    return "۱۰";
  });

  // Temporary drawer states
  const [tempAlerts, setTempAlerts] = useState<string[]>([]);
  const [tempRepeat, setTempRepeat] = useState("");
  const [tempEndRepeatOption, setTempEndRepeatOption] = useState("");
  const [tempEndRepeatDate, setTempEndRepeatDate] = useState("");
  const [tempEndRepeatCount, setTempEndRepeatCount] = useState("");

  // Increment and Decrement functions for High-Fidelity DateTime columns
  const incrementTempDay = () => {
    setTempDay(prev => (prev >= 31 ? 1 : prev + 1));
  };
  const decrementTempDay = () => {
    setTempDay(prev => (prev <= 1 ? 31 : prev - 1));
  };

  const incrementTempMonth = () => {
    const curIdx = JALALI_MONTH_NAMES.indexOf(tempMonth);
    const nextIdx = (curIdx + 1) % 12;
    setTempMonth(JALALI_MONTH_NAMES[nextIdx]);
  };
  const decrementTempMonth = () => {
    const curIdx = JALALI_MONTH_NAMES.indexOf(tempMonth);
    const prevIdx = (curIdx - 1 + 12) % 12;
    setTempMonth(JALALI_MONTH_NAMES[prevIdx]);
  };

  const incrementTempYear = () => {
    const curIdx = YEARS.indexOf(tempYear);
    const nextIdx = (curIdx + 1) % YEARS.length;
    setTempYear(YEARS[nextIdx]);
  };
  const decrementTempYear = () => {
    const curIdx = YEARS.indexOf(tempYear);
    const prevIdx = (curIdx - 1 + YEARS.length) % YEARS.length;
    setTempYear(YEARS[prevIdx]);
  };

  const incrementTempHour = () => {
    setTempHour(prev => (prev >= 23 ? 0 : prev + 1));
  };
  const decrementTempHour = () => {
    setTempHour(prev => (prev <= 0 ? 23 : prev - 1));
  };

  const incrementTempMinute = () => {
    setTempMinute(prev => (prev >= 59 ? 0 : prev + 1));
  };
  const decrementTempMinute = () => {
    setTempMinute(prev => (prev <= 0 ? 59 : prev - 1));
  };

  // Automated date formatting separator for repeat rule date typing: yyyy/mm/dd
  const handleRepeatDateChange = (val: string) => {
    const digits = toEnglishDigits(val).replace(/\D/g, "");
    
    let formatted = "";
    if (digits.length > 0) {
      formatted += digits.substring(0, 4);
      if (digits.length >= 5) {
        formatted += "/" + digits.substring(4, 6);
      } else if (val.endsWith("/")) {
        formatted += "/";
      }
      
      if (digits.length >= 7) {
        formatted += "/" + digits.substring(6, 8);
      } else if (digits.length >= 5 && val.endsWith("/")) {
        formatted += "/";
      }
    }
    setTempEndRepeatDate(toPersianDigits(formatted));
  };

  // High-fidelity cylindrical time-wheel renderer
  const renderVisualDial = (
    label: string,
    currentValue: any,
    options: any[],
    onIncrement: () => void,
    onDecrement: () => void,
    onSelect: (val: any) => void,
    formatter: (val: any) => string = (v) => v.toString()
  ) => {
    const currentIndex = options.indexOf(currentValue);
    const len = options.length;
    if (currentIndex === -1) return null;

    const prevVal = options[(currentIndex - 1 + len) % len];
    const nextVal = options[(currentIndex + 1) % len];

    return (
      <div className="flex flex-col items-center flex-1 min-w-0" key={label}>
        <span className="text-[10px] font-black text-slate-450 mb-1.5 truncate max-w-full">{label}</span>
        
        {/* Increment (Button Up) */}
        <button 
          type="button" 
          onClick={onIncrement}
          className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 active:scale-95 flex items-center justify-center border border-slate-150 transition-all text-slate-500 cursor-pointer"
        >
          <ChevronUp className="w-4 h-4 text-slate-600" />
        </button>

        {/* Carousel Visual wrapper */}
        <div className="flex flex-col items-center justify-center w-full h-24 my-1 select-none overflow-hidden relative">
          
          {/* Cylinder top and bottom fading overlays */}
          <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-white to-transparent pointer-events-none z-[5]" />
          <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-white to-transparent pointer-events-none z-[5]" />

          {/* Previous item */}
          <button
            type="button"
            onClick={() => onSelect(prevVal)}
            className="text-[10px] font-semibold text-slate-350 hover:text-slate-500 transition-all h-6 overflow-hidden truncate px-0.5 text-center cursor-pointer scale-90 opacity-60"
          >
            {toPersianDigits(formatter(prevVal))}
          </button>

          {/* Center Active selection */}
          <div className={`h-9 w-full max-w-[46px] ${themeVisualDialBg} text-white rounded-xl flex items-center justify-center font-black text-xs shadow-md z-10 transition-all scale-105 border shrink-0`}>
            {toPersianDigits(formatter(currentValue))}
          </div>

          {/* Next item */}
          <button
            type="button"
            onClick={() => onSelect(nextVal)}
            className="text-[10px] font-semibold text-slate-350 hover:text-slate-500 transition-all h-6 overflow-hidden truncate px-0.5 text-center cursor-pointer scale-90 opacity-60"
          >
            {toPersianDigits(formatter(nextVal))}
          </button>

        </div>

        {/* Decrement (Button Down) */}
        <button 
          type="button" 
          onClick={onDecrement}
          className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 active:scale-95 flex items-center justify-center border border-slate-150 transition-all text-slate-500 cursor-pointer"
        >
          <ChevronDown className="w-4 h-4 text-slate-600" />
        </button>
      </div>
    );
  };

  // Color circle picker state (Blue, Yellow, Green, Red)
  const [selectedColor, setSelectedColor] = useState("red");
  const themeColors = [
    { name: "blue", hex: "#3b82f6", bg: "bg-blue-600", dotClass: "bg-blue-500 ring-blue-500/30" },
    { name: "yellow", hex: "#eab308", bg: "bg-yellow-600", dotClass: "bg-amber-400 ring-amber-400/30" },
    { name: "green", hex: "#22c55e", bg: "bg-green-600", dotClass: "bg-emerald-500 ring-emerald-500/30" },
    { name: "red", hex: "#ef4444", bg: "bg-red-600", dotClass: "bg-red-600 ring-red-600/30" },
  ];

  // Initialize temporary drawers value on open
  useEffect(() => {
    if (showDatePicker) {
      setTempYear(year);
      setTempMonth(month);
      setTempDay(day);
      setTempHour(hour);
      setTempMinute(minute);
    }
  }, [showDatePicker]);

  useEffect(() => {
    if (showAlertPicker) {
      setTempAlerts([...alerts]);
    }
  }, [showAlertPicker]);

  useEffect(() => {
    if (showRepeatPicker) {
      setTempRepeat(repeatSelected);
      setTempEndRepeatOption(endRepeatOption);
      setTempEndRepeatDate(endRepeatDate);
      setTempEndRepeatCount(endRepeatCount);
    }
  }, [showRepeatPicker]);

  // Formatter for main date picker trigger display
  const getDisplayDateString = () => {
    return `${toPersianDigits(day)} ${month} ${toPersianDigits(year)} ساعت ${toPersianDigits(hour.toString().padStart(2, "0"))}:${toPersianDigits(minute.toString().padStart(2, "0"))}`;
  };

  // Helper to resolve day of week for selected Jalali date
  const getWeekdayName = (y: number, mName: string, d: number) => {
    const mIdx = JALALI_MONTH_NAMES.indexOf(mName) + 1;
    // Simple mock estimation of Persian weekday for aesthetic placement
    const names = ["پنج‌شنبه", "جمعه", "شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه"];
    const sum = (y + mIdx * 31 + d) % 7;
    return names[sum];
  };

  // File upload handlers for court notifications/summons (ابلاغیه یا اخطاریه)
  const handleNoticeDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleNoticeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadNoticeFile(e.dataTransfer.files[0]);
    }
  };

  const handleNoticeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadNoticeFile(e.target.files[0]);
    }
  };

  const uploadNoticeFile = (file: File) => {
    if (!selectedCaseId) {
      setUploadError("خطا: برای الصاق فایل ابلاغیه یا اخطاریه، ابتدا باید از بخش پرونده مرتبط (در پایین)، یک پرونده انتخاب کنید.");
      return;
    }
    setUploadError("");

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + " مگابایت";

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newDoc: CaseDocument = {
        id: "do_" + Date.now(),
        caseId: selectedCaseId,
        name: `ابلاغیه رویداد - ${file.name}`,
        type: isPdf ? "pdf" : isImage ? "image" : "other",
        size: toPersianDigits(sizeStr),
        dataUrl,
        uploadedAt: new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
      };
      
      if (onAddDocument) {
        onAddDocument(newDoc);
        setUploadedNotices(prev => [newDoc, ...prev]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveReminder = () => {
    if (reminderMode === "non-judicial") {
      if (!njTitle.trim()) {
        setNjTitleError(true);
        return;
      }

      const docFields = njUploadedDoc ? {
        documentId: "do_" + Date.now(),
        documentName: njUploadedDoc.name,
        documentSize: njUploadedDoc.size,
        documentDataUrl: njUploadedDoc.dataUrl
      } : {};

      const targetEndStr = toEnglishDigits(endRepeatDate);

      const extraDetails = [
        "یادآوری غیر قضایی شخصی",
        njSmsEnabled ? `ارسال پیامک به: ${smsPhone1} و ${smsPhone2}` : "بدون پیامک",
        `هشدارها: ${alerts.join(", ")}`,
        `تکرار: ${repeatSelected !== "بدون تکرار" ? `${repeatSelected} (تا تاریخ ${targetEndStr})` : "بدون تکرار"}`
      ].filter(Boolean).join("\n | ");

      if (editingEvent) {
        const updatedEvent: LegalEvent = {
          ...editingEvent,
          isArchived: false,
          title: njTitle,
          type: "یادآوری غیر قضایی",
          jalaliDate: njDate,
          time: njTime,
          alarmEnabled: alerts.length > 0,
          description: extraDetails,
          caseId: undefined,
          alarm1Hour: alerts.includes("۱ ساعت قبل"),
          alarm1Day: alerts.includes("۱ روز قبل"),
          alarm1Week: alerts.includes("۱ هفته قبل"),
          repeatSelected,
          endRepeatOption,
          endRepeatDate: (repeatSelected !== "بدون تکرار" && endRepeatOption === "تا تاریخ") ? targetEndStr : undefined,
          ...docFields
        };
        if (onUpdateEvent) {
          onUpdateEvent(updatedEvent);
        }
        if (syncToCalendar) downloadICSFile([updatedEvent], "reminder.ics");
      } else {
        const newEvent: LegalEvent = {
          id: safeRandomUUID(),
          title: njTitle,
          type: "یادآوری غیر قضایی",
          jalaliDate: njDate,
          time: njTime,
          alarmEnabled: alerts.length > 0,
          description: extraDetails,
          caseId: undefined,
          alarm1Hour: alerts.includes("۱ ساعت قبل"),
          alarm1Day: alerts.includes("۱ روز قبل"),
          alarm1Week: alerts.includes("۱ هفته قبل"),
          repeatSelected,
          endRepeatOption,
          endRepeatDate: (repeatSelected !== "بدون تکرار" && endRepeatOption === "تا تاریخ") ? targetEndStr : undefined,
          ...docFields
        };
        onAddEvent(newEvent);
        if (syncToCalendar) downloadICSFile([newEvent], "reminder.ics");
      }
      onBack();
      return;
    }

    if (!title.trim()) {
      setTitleError(true);
      return;
    }

    const monthNum = JALALI_MONTH_NAMES.indexOf(month) + 1;
    const formattedJalaliDate = `${year}/${monthNum.toString().padStart(2, "0")}/${day.toString().padStart(2, "0")}`;
    const formattedTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

    const targetEndStr = toEnglishDigits(endRepeatDate);

    const matchedCase = selectedCaseId ? safeCases.find(c => c.id === selectedCaseId) : undefined;

    // Compile descriptions
    const extraDetails = [
      descriptionValue ? `توضیحات: ${descriptionValue}` : "",
      locationValue ? `مکان: ${locationValue}` : "",
      linkValue ? `لینک: ${linkValue}` : "",
      selectedCaseId ? `مرتبط با پرونده: ${matchedCase?.title || ""}` : "",
      `هشدارها: ${alerts.join(", ")}`,
      `تکرار: ${repeatSelected !== "بدون تکرار" ? `${repeatSelected} (تا تاریخ ${targetEndStr})` : "بدون تکرار"}`
    ].filter(Boolean).join("\n | ");

    const docFields = uploadedNotices.length > 0 ? {
      documentId: uploadedNotices[0].id,
      documentName: uploadedNotices[0].name,
      documentSize: uploadedNotices[0].size,
      documentDataUrl: uploadedNotices[0].dataUrl
    } : {};

    if (editingEvent) {
      const updatedEvent: LegalEvent = {
        ...editingEvent,
        isArchived: false,
        title,
        jalaliDate: formattedJalaliDate,
        time: formattedTime,
        type: "پیگیری اداری",
        alarmEnabled: alerts.length > 0,
        description: extraDetails,
        caseId: selectedCaseId || undefined,
        caseTitle: matchedCase?.title || undefined,
        clientName: matchedCase?.clientName || undefined,
        alarm1Hour: alerts.includes("۱ ساعت قبل"),
        alarm1Day: alerts.includes("۱ روز قبل"),
        alarm1Week: alerts.includes("۱ هفته قبل"),
        repeatSelected,
        endRepeatOption,
        endRepeatDate: (repeatSelected !== "بدون تکرار" && endRepeatOption === "تا تاریخ") ? targetEndStr : undefined,
        ...docFields
      };
      if (onUpdateEvent) {
        onUpdateEvent(updatedEvent);
      }
      if (syncToCalendar) downloadICSFile([updatedEvent], "reminder.ics");
    } else {
      const newEvent: LegalEvent = {
        id: safeRandomUUID(),
        title,
        type: "پیگیری اداری",
        jalaliDate: formattedJalaliDate,
        time: formattedTime,
        caseTitle: matchedCase?.title || undefined,
        clientName: matchedCase?.clientName || undefined,
        alarmEnabled: alerts.length > 0,
        description: extraDetails,
        caseId: selectedCaseId || undefined,
        alarm1Hour: alerts.includes("۱ ساعت قبل"),
        alarm1Day: alerts.includes("۱ روز قبل"),
        alarm1Week: alerts.includes("۱ هفته قبل"),
        repeatSelected,
        endRepeatOption,
        endRepeatDate: (repeatSelected !== "بدون تکرار" && endRepeatOption === "تا تاریخ") ? targetEndStr : undefined,
        ...docFields
      };
      onAddEvent(newEvent);
      if (syncToCalendar) downloadICSFile([newEvent], "reminder.ics");
    }
    onBack();
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-slate-50 min-h-screen pb-12 flex flex-col font-sans select-none" dir="rtl">
      
      {/* Title Header matching original native photo but with premium dynamic tones */}
      <div className={`${themeHeaderBg} shadow-md flex items-center justify-between px-6 py-4.5 text-white transition-colors duration-300`}>
        <div className="flex items-center gap-3">
          <Bell className={`w-5 h-5 ${themeHeaderBell} shrink-0`} />
          <h2 className="font-extrabold text-sm tracking-tight text-white leading-none">
            {editingEvent ? "ویرایش یادآوری" : "افزودن یادآوری"}
          </h2>
        </div>
        <button 
          onClick={onBack} 
          className={`p-1.5 ${themeHeaderHover} rounded-full transition-all active:scale-95 cursor-pointer`}
        >
          <ArrowRight className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Dynamic Segmented Switcher for Judicial vs Non-Judicial */}
      {!editingEvent && (
        <div className="bg-white border-b border-slate-200 p-3 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => setReminderMode("judicial")}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all border ${
              reminderMode === "judicial"
                ? "bg-red-50 border-red-500 text-red-700 shadow-sm"
                : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
            } cursor-pointer text-center`}
          >
            یادآوری قضایی
          </button>
          <button
            type="button"
            onClick={() => setReminderMode("non-judicial")}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all border ${
              reminderMode === "non-judicial"
                ? "bg-purple-50 border-purple-500 text-purple-700 shadow-sm"
                : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
            } cursor-pointer text-center`}
          >
            یادآوری غیر قضایی
          </button>
        </div>
      )}

      {reminderMode === "judicial" ? (
        <div className="flex-1 p-5 space-y-6">
        
        {/* Row 1: Title Input (Floating Label, Rounded Design) */}
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex items-center gap-4">
            <div className={`flex-1 relative border ${titleError ? "border-red-500 bg-red-50/10 focus-within:border-red-500" : `border-slate-200 ${themeFocusBorder}`} rounded-2xl h-15 bg-white transition-all shadow-sm`}>
              <label className={`absolute -top-2.5 right-4 bg-white px-2 text-[10px] font-black ${titleError ? "text-red-500" : "text-slate-450"}`}>عنوان</label>
              <input
                type="text"
                required
                placeholder="عنوان یادداشت یا پیگیری..."
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (e.target.value.trim()) {
                    setTitleError(false);
                  }
                }}
                className="w-full h-full bg-transparent outline-none px-4 text-xs font-black text-slate-700 text-right"
              />
            </div>
            <div className="w-6 flex justify-center text-slate-400">
              <AlignRight className="w-5 h-5" />
            </div>
          </div>
          {titleError && (
            <span className="text-[10px] text-red-600 font-bold pr-2 animate-in fade-in duration-150">
              * درج عنوان برای ثبت یادآوری الزامی است.
            </span>
          )}
        </div>

        {/* Row 3: Date & Time Trigger Picker */}
        <div className="flex items-center gap-4">
          <div 
            onClick={() => setShowDatePicker(true)}
            className={`flex-1 relative border border-slate-200 ${themeHoverBorder} rounded-2xl h-15 bg-white transition-all shadow-sm cursor-pointer flex items-center justify-between px-4`}
          >
            <label className="absolute -top-2.5 right-4 bg-white px-2 text-[10px] font-black text-slate-400">تاریخ</label>
            <span className="text-xs font-black text-slate-700 font-sans mt-1">
              {getDisplayDateString()}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
          <div className="w-6 flex justify-center text-slate-400">
            <CalendarDays className="w-5 h-5" />
          </div>
        </div>

        {/* Chevron Separator for collapsible/expandable: اطلاعات بیشتر */}
        <div 
          onClick={() => setIsMoreInfoExpanded(!isMoreInfoExpanded)}
          className="flex items-center justify-between border-t border-slate-200 pt-5 mt-2 cursor-pointer group"
        >
          <span className={`text-xs font-black text-slate-500 ${themeGroupHoverText} transition-colors`}>اطلاعات بیشتر</span>
          <div className="flex-1 border-t border-slate-200/60 mx-4 h-0"></div>
          {isMoreInfoExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>

        {/* Expandable Section */}
        {isMoreInfoExpanded && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-1 duration-200">
            
            {/* Alert Option Field */}
            <div className="flex items-center gap-4">
              <div 
                onClick={() => setShowAlertPicker(true)}
                className={`flex-1 relative border border-slate-200 ${themeHoverBorder} rounded-2xl h-15 bg-white transition-all shadow-sm cursor-pointer flex items-center justify-between px-4`}
              >
                <label className="absolute -top-2.5 right-4 bg-white px-2 text-[10px] font-black text-slate-400">هشدار</label>
                <span className="text-xs font-black text-slate-700">
                  {alerts.length === 0 ? "بدون هشدار" : alerts.join("، ")}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
              <div className="w-6 flex justify-center text-slate-400">
                <Bell className="w-5 h-5" />
              </div>
            </div>

            {/* Repeat Option Field */}
            <div className="flex items-center gap-4">
              <div 
                onClick={() => setShowRepeatPicker(true)}
                className={`flex-1 relative border border-slate-200 ${themeHoverBorder} rounded-2xl h-15 bg-white transition-all shadow-sm cursor-pointer flex items-center justify-between px-4`}
              >
                <label className="absolute -top-2.5 right-4 bg-white px-2 text-[10px] font-black text-slate-400">تکرار</label>
                <span className="text-xs font-black text-slate-700">
                  {repeatSelected}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
              <div className="w-6 flex justify-center text-slate-400">
                <Repeat className="w-5 h-5" />
              </div>
            </div>

            {/* Buttons for optional extra data row: توضیحات، مکان، لینک */}
            <div className="flex items-center gap-4">
              <div className="flex-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDescription(!showDescription)}
                  className={`flex-1 py-3 px-3 rounded-2xl text-[10px] font-extrabold transition-all border ${
                    showDescription || descriptionValue 
                      ? themeTabSelectedClass 
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  توضیحات
                </button>
                <button
                  type="button"
                  onClick={() => setShowLocation(!showLocation)}
                  className={`flex-1 py-3 px-3 rounded-2xl text-[10px] font-extrabold transition-all border ${
                    showLocation || locationValue 
                      ? themeTabSelectedClass 
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  مکان
                </button>
                <button
                  type="button"
                  onClick={() => setShowLink(!showLink)}
                  className={`flex-1 py-3 px-3 rounded-2xl text-[10px] font-extrabold transition-all border ${
                    showLink || linkValue 
                      ? themeTabSelectedClass 
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  لینک
                </button>
              </div>
              <div className="w-6 flex justify-center text-slate-400">
                <Plus className="w-5 h-5" />
              </div>
            </div>

            {/* Conditional input: Description */}
            {(showDescription || descriptionValue) && (
              <div className="flex items-center gap-4 animate-in slide-in-from-top-1 duration-150">
                <div className={`flex-1 relative border border-slate-200 ${themeFocusBorder} rounded-2xl bg-white transition-all shadow-sm`}>
                  <label className="absolute -top-2.5 right-4 bg-white px-2 text-[10px] font-black text-slate-400">توضیحات تکمیلی</label>
                  <textarea
                    rows={2}
                    placeholder="متن دلخواه خود را بنویسید..."
                    value={descriptionValue}
                    onChange={(e) => setDescriptionValue(e.target.value)}
                    className="w-full bg-transparent outline-none p-4 text-xs font-bold text-slate-700 text-right resize-none"
                  />
                </div>
                <div className="w-6 flex justify-center text-slate-400">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            )}

            {/* Conditional input: Location */}
            {(showLocation || locationValue) && (
              <div className="flex items-center gap-4 animate-in slide-in-from-top-1 duration-150">
                <div className={`flex-1 relative border border-slate-200 ${themeFocusBorder} rounded-2xl h-15 bg-white transition-all shadow-sm`}>
                  <label className="absolute -top-2.5 right-4 bg-white px-2 text-[10px] font-black text-slate-400">مکان / آدرس</label>
                  <input
                    type="text"
                    placeholder="موقعیت مکانی، آدرس دادگاه، شعبه وغیره..."
                    value={locationValue}
                    onChange={(e) => setLocationValue(e.target.value)}
                    className="w-full h-full bg-transparent outline-none px-4 text-xs font-bold text-slate-705 text-right"
                  />
                </div>
                <div className="w-6 flex justify-center text-slate-400">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>
            )}

            {/* Conditional input: Link */}
            {(showLink || linkValue) && (
              <div className="flex items-center gap-4 animate-in slide-in-from-top-1 duration-150">
                <div className={`flex-1 relative border border-slate-200 ${themeFocusBorder} rounded-2xl h-15 bg-white transition-all shadow-sm`}>
                  <label className="absolute -top-2.5 right-4 bg-white px-2 text-[10px] font-black text-slate-400">لینک مرتبط</label>
                  <input
                    type="text"
                    placeholder="https://example.com"
                    value={linkValue}
                    onChange={(e) => setLinkValue(e.target.value)}
                    className="w-full h-full bg-transparent outline-none px-4 text-xs font-semibold text-slate-700 text-left"
                    dir="ltr"
                  />
                </div>
                <div className="w-6 flex justify-center text-slate-400">
                  <Link className="w-5 h-5" />
                </div>
              </div>
            )}

            {/* Case Selector inside "More info" to maximize workspace capability with search box */}
            <div className="flex items-center gap-4">
              <div className={`flex-1 relative border border-slate-200 ${themeFocusBorder} rounded-2xl h-15 bg-white transition-all shadow-sm`}>
                <label className="absolute -top-2.5 right-4 bg-white px-2 text-[10px] font-black text-slate-400">پرونده مرتبط (اختیاری)</label>
                
                {/* Trigger Button */}
                <button
                  type="button"
                  onClick={() => setShowCaseSelectionDropdown(!showCaseSelectionDropdown)}
                  className="w-full h-full bg-transparent flex items-center justify-between px-4 text-xs font-bold text-slate-700 text-right focus:outline-none"
                >
                  <span className="truncate pr-1">
                    {selectedCaseId ? (
                      (() => {
                        const cs = safeCases.find(c => c.id === selectedCaseId);
                        return cs ? cs.title : "درحال بارگذاری...";
                      })()
                    ) : (
                      "بدون ارتباط با پرونده خاص"
                    )}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
                </button>
              </div>
              <div className="w-6 flex justify-center text-slate-400">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            {/* File Upload Zone for Notices (ابلاغیه یا اخطاریه) */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black text-slate-400 block pr-1">بارگذاری فایل ابلاغیه یا اخطاریه</span>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  {!selectedCaseId ? (
                    <div className="border border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50/50">
                      <p className="text-[10px] font-bold text-amber-600">
                        برای بارگذاری فایل ابلاغیه یا اخطاریه، ابتدا باید از گزینه‌ی بالا یک پرونده مرتبط انتخاب نمایید.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div
                        onDragEnter={handleNoticeDrag}
                        onDragOver={handleNoticeDrag}
                        onDragLeave={handleNoticeDrag}
                        onDrop={handleNoticeDrop}
                        className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition relative ${
                          dragActive
                            ? "border-amber-500 bg-amber-50/50"
                            : "border-slate-200 hover:border-amber-400 bg-slate-50/50"
                        }`}
                      >
                        <input
                          type="file"
                          id="notice_file_upload"
                          multiple={false}
                          onChange={handleNoticeChange}
                          className="hidden"
                          accept=".pdf, image/*"
                        />
                        <label htmlFor="notice_file_upload" className="cursor-pointer block space-y-2">
                          <FileUp className="w-6 h-6 text-slate-400 mx-auto animate-bounce" />
                          <div className="text-[10px] font-bold text-slate-700">رها کردن فایل ابلاغیه در این ناحیه یا کلیک جهت بارگذاری</div>
                          <p className="text-[8px] text-slate-400">فرمت‌های مجاز: PDF، تصاویر اسکن شده (بدون محدودیت تا ۲۰ مکابایت)</p>
                        </label>
                      </div>

                      {uploadError && (
                        <p className="text-[10px] font-bold text-red-500 text-right pr-1">{uploadError}</p>
                      )}

                      {/* Uploaded files list */}
                      {uploadedNotices.length > 0 && (
                        <div className="space-y-1.5 mt-2">
                          <div className="text-[9px] font-extrabold text-emerald-600 block pr-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            ابلاغیه‌های الحاق‌شده به پرونده جاری ({toPersianDigits(uploadedNotices.length)} سند):
                          </div>
                          <div className="space-y-1 max-h-36 overflow-y-auto">
                            {uploadedNotices.map((doc) => (
                              <div key={doc.id} className="p-2 bg-emerald-50/40 border border-emerald-100 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  {doc.type === "image" && doc.dataUrl ? (
                                    <img src={doc.dataUrl} alt={doc.name} className="w-6 h-6 rounded object-cover border border-emerald-200 shrink-0" />
                                  ) : (
                                    <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                      <FileText className="w-3.5 h-3.5" />
                                    </div>
                                  )}
                                  <span className="text-[10px] font-black text-slate-700 truncate max-w-[200px]" dir="ltr">
                                    {doc.name}
                                  </span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 shrink-0 pl-1">{doc.size}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="w-6 flex justify-center text-slate-400 mt-3 shrink-0">
                  <FileUp className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Colors picker row (As shown in image 1: red, green, yellow, blue circles) */}
            <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center justify-start gap-3 mt-1 pr-1">
                {themeColors.map((color) => {
                  const isSelected = selectedColor === color.name;
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color.name)}
                      className={`w-8 h-8 rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center ${color.dotClass} ${
                        isSelected 
                          ? "ring-4 scale-110 border-2 border-white" 
                          : "hover:scale-105"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  );
                })}
              </div>
              <div className="w-6 flex justify-center text-slate-400">
                <Droplet className="w-5 h-5" />
              </div>
            </div>

            <div className="w-full flex justify-center py-2 border-t border-slate-200 mt-2 pt-4">
              <label className="flex items-center gap-3 text-emerald-700 bg-emerald-50 border-emerald-200 px-5 py-3 rounded-2xl border cursor-pointer shadow-sm hover:shadow-md transition-all select-none">
                <input
                  type="checkbox"
                  checked={syncToCalendar}
                  onChange={(e) => setSyncToCalendar(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer order-2"
                />
                <span className="font-black text-xs order-1">ثبت در تقویم گوشی</span>
              </label>
            </div>

          </div>
        )}

      </div>
      ) : (
        <div className="flex-1 p-5 space-y-6 bg-slate-50 animate-in fade-in duration-200" dir="rtl">
          
          {/* Row 1: Title Input (Label matches description, icon aligned) */}
          <div className="space-y-1.5 flex flex-col gap-1.5 w-full">
            <label className="block text-xs font-black text-slate-400 pr-1">عنوان رویداد:</label>
            <div className="relative border border-slate-200 focus-within:border-purple-500 rounded-2xl h-15 bg-white transition-all shadow-sm">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 p-1">
                <AlignLeft className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="text"
                required
                placeholder=""
                value={njTitle}
                onChange={(e) => {
                  setNjTitle(e.target.value);
                  if (e.target.value.trim()) {
                    setNjTitleError(false);
                  }
                }}
                className="w-full pr-12 pl-4 py-4 bg-transparent font-bold outline-none text-slate-800 text-xs h-full"
              />
            </div>
            {njTitleError && (
              <span className="text-[10px] text-red-600 font-bold pr-2 animate-in fade-in duration-150">
                * درج عنوان برای ثبت یادآوری الزامی است.
              </span>
            )}
          </div>

          {/* Row 2: Date & Time in grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-400 pr-1">تاریخ (روز/ماه/سال):</label>
              <div className="relative border border-slate-200 focus-within:border-purple-500 rounded-2xl h-15 bg-white transition-all shadow-sm">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 p-1">
                  <Calendar className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="۱۴۰۳/۰۵/۱۰"
                  value={njDate}
                  onChange={(e) => setNjDate(formatDateWithSlash(e.target.value))}
                  className="w-full pr-12 pl-4 py-4 bg-transparent font-mono font-bold outline-none text-slate-800 text-xs text-center h-full"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-400 pr-1">ساعت دقیق:</label>
              <div className="relative border border-slate-200 focus-within:border-purple-500 rounded-2xl h-15 bg-white transition-all shadow-sm">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 p-1">
                  <Clock className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="۰۹:۳۰"
                  value={njTime}
                  onChange={(e) => setNjTime(formatTimeWithColon(e.target.value))}
                  className="w-full pr-12 pl-4 py-4 bg-transparent font-mono font-bold outline-none text-slate-800 text-xs text-center h-full"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Alarm Setup like in New Court Session details */}
          <div className="p-5 bg-white border border-slate-100 rounded-[2rem] space-y-5 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 block text-right mb-1">تنظیم آلارم هشدار و ارسال پیامک:</h4>
            
            {/* Alert Option Field */}
            <div className="flex items-center gap-4">
              <div 
                onClick={() => setShowAlertPicker(true)}
                className={`flex-1 relative border border-slate-200 ${themeHoverBorder} rounded-2xl h-15 bg-white transition-all shadow-sm cursor-pointer flex items-center justify-between px-4`}
              >
                <label className="absolute -top-2.5 right-4 bg-white px-2 text-[10px] font-black text-slate-400">زمان هشدار</label>
                <span className="text-xs font-black text-slate-700 text-right w-full pr-1">
                  {alerts.length === 0 ? "بدون هشدار" : alerts.join("، ")}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
              <div className="w-6 flex justify-center text-slate-400 shrink-0">
                <Bell className="w-5 h-5" />
              </div>
            </div>

            {/* Repeat Option Field */}
            <div className="flex items-center gap-4">
              <div 
                onClick={() => setShowRepeatPicker(true)}
                className={`flex-1 relative border border-slate-200 ${themeHoverBorder} rounded-2xl h-15 bg-white transition-all shadow-sm cursor-pointer flex items-center justify-between px-4`}
              >
                <label className="absolute -top-2.5 right-4 bg-white px-2 text-[10px] font-black text-slate-400">تکرار</label>
                <span className="text-xs font-black text-slate-700 text-right w-full pr-1">
                  {repeatSelected}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
              <div className="w-6 flex justify-center text-slate-400 shrink-0">
                <Repeat className="w-5 h-5" />
              </div>
            </div>

            <div className="w-full flex justify-center py-2">
              <label className="flex items-center gap-3 text-purple-700 bg-purple-50 border-purple-200 px-5 py-3 rounded-2xl border cursor-pointer shadow-sm hover:shadow-md transition-all select-none">
                <input
                  type="checkbox"
                  checked={njSmsEnabled}
                  onChange={(e) => setNjSmsEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer order-2"
                />
                <span className="font-black text-xs order-1">فعال‌سازی ارسال پیام کوتاه (SMS)</span>
              </label>
            </div>

            {njSmsEnabled && (
              <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                <input
                  type="text"
                  placeholder="09144627119"
                  value={smsPhone1}
                  onChange={(e) => setSmsPhone1(e.target.value)}
                  dir="ltr"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-150 rounded-2xl outline-none text-xs font-bold text-center shadow-inner focus:border-purple-350 transition-all text-slate-700 font-sans"
                />
                <input
                  type="text"
                  placeholder="09901095393"
                  value={smsPhone2}
                  onChange={(e) => setSmsPhone2(e.target.value)}
                  dir="ltr"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-150 rounded-2xl outline-none text-xs font-bold text-center shadow-inner focus:border-purple-350 transition-all text-slate-700 font-sans"
                />
              </div>
            )}
            
            <div className="w-full flex justify-center py-2 border-t border-slate-100 mt-2 pt-4">
              <label className="flex items-center gap-3 text-emerald-700 bg-emerald-50 border-emerald-200 px-5 py-3 rounded-2xl border cursor-pointer shadow-sm hover:shadow-md transition-all select-none">
                <input
                  type="checkbox"
                  checked={syncToCalendar}
                  onChange={(e) => setSyncToCalendar(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer order-2"
                />
                <span className="font-black text-xs order-1">ثبت در تقویم گوشی</span>
              </label>
            </div>
          </div>

        </div>
      )}

      {/* Primary footer buttons as shown in Image 1 */}
      <div className="p-5 border-t border-slate-200 bg-white grid grid-cols-2 gap-4">
        {/* Submit on the right (actually left in layout, right in Persian sequence) */}
        <button
          onClick={handleSaveReminder}
          className={`w-full h-13 rounded-2xl ${themeButtonSubmitBg} text-white font-extrabold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer pb-0.5`}
        >
          <span>{editingEvent ? "ذخیره تغییرات" : "ثبت"}</span>
        </button>
        {/* Cancel */}
        <button
          onClick={onBack}
          className={`w-full h-13 rounded-2xl border ${themeButtonCancelBorder} font-extrabold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer pb-0.5`}
        >
          <span>انصراف</span>
        </button>
      </div>

      {/* ========================================== */}
      {/* 1. DATE & TIME PICKER BOTTOM SHEET (Image 2) */}
      {/* ========================================== */}
      {showDatePicker && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-[2px] z-[200] flex items-end justify-center animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white rounded-t-[2.5rem] shadow-2xl flex flex-col p-6 animate-in slide-in-from-bottom duration-300 max-h-[90vh]">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-800">{editingEvent ? "ویرایش زمان و تاریخ" : "تنظیم تاریخ و زمان"}</h3>
              <button 
                onClick={() => setShowDatePicker(false)} 
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selected feedback banner */}
            <div className={`rounded-2xl p-4 my-4 border flex flex-col items-center justify-center ${themeBannerBg}`}>
              <div className={`text-xs font-black mb-0.5 ${themeBannerText1}`}>
                {getWeekdayName(tempYear, tempMonth, tempDay)} {toPersianDigits(tempDay)} {tempMonth} {toPersianDigits(tempYear)}
              </div>
              <div className={`text-xl font-black tracking-wider ${themeBannerText2}`}>
                {toPersianDigits(tempHour.toString().padStart(2, "0"))}:{toPersianDigits(tempMinute.toString().padStart(2, "0"))}
              </div>
            </div>

            {/* Interactive Picker Scroller Simulation */}
            <div className="flex items-center justify-between gap-1 bg-slate-50/50 rounded-[2rem] p-4 my-3 border border-slate-100">
              
              {/* Day */}
              {renderVisualDial("روز", tempDay, DAYS, incrementTempDay, decrementTempDay, setTempDay)}

              {/* Month */}
              {renderVisualDial("ماه", tempMonth, JALALI_MONTH_NAMES, incrementTempMonth, decrementTempMonth, setTempMonth)}

              {/* Year */}
              {renderVisualDial("سال", tempYear, YEARS, incrementTempYear, decrementTempYear, setTempYear)}

              {/* Vertical divider */}
              <div className="flex flex-col items-center justify-center h-14 text-slate-300 font-extrabold px-1 text-sm mt-5 shrink-0">:</div>

              {/* Hour */}
              {renderVisualDial("ساعت", tempHour, HOURS, incrementTempHour, decrementTempHour, setTempHour, (h) => h.toString().padStart(2, "0"))}

              {/* Minute */}
              {renderVisualDial("دقیقه", tempMinute, MINUTES, incrementTempMinute, decrementTempMinute, setTempMinute, (m) => m.toString().padStart(2, "0"))}

            </div>

            {/* Bottom buttons */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setYear(tempYear);
                  setMonth(tempMonth);
                  setDay(tempDay);
                  setHour(tempHour);
                  setMinute(tempMinute);
                  setShowDatePicker(false);
                }}
                className={`w-full py-4.5 rounded-2xl ${themeButtonSubmitBg} text-white font-black text-sm active:scale-95 transition-all text-center pb-1 cursor-pointer`}
              >
                انتخاب
              </button>
              <button
                type="button"
                onClick={() => setShowDatePicker(false)}
                className={`w-full py-4.5 rounded-2xl border ${themeButtonCancelBorder} font-extrabold text-sm active:scale-95 transition-all text-center pb-1 cursor-pointer`}
              >
                انصراف
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 2. ALERT TIME PICKER BOTTOM SHEET (Image 3) */}
      {/* ========================================== */}
      {showAlertPicker && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-[2px] z-[200] flex items-end justify-center animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white rounded-t-[2.5rem] shadow-2xl flex flex-col p-6 animate-in slide-in-from-bottom duration-300 max-h-[85vh]">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-2">
              <h3 className="font-extrabold text-base text-slate-800">زمان هشدار</h3>
              <button 
                onClick={() => setShowAlertPicker(false)} 
                className="p-1 hover:bg-slate-100 text-slate-400 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Checklist */}
            <div className="overflow-y-auto max-h-[45vh] py-3 pr-1 space-y-1">
              {alertOptions.map((opt) => {
                const isSelected = tempAlerts.includes(opt);
                return (
                  <label 
                    key={opt}
                    onClick={() => {
                      if (isSelected) {
                        setTempAlerts(tempAlerts.filter(x => x !== opt));
                      } else {
                        setTempAlerts([...tempAlerts, opt]);
                      }
                    }}
                    className="flex items-center justify-between py-3 px-4 rounded-xl cursor-pointer hover:bg-slate-50 text-slate-700 font-bold text-xs select-none transition-colors border border-transparent hover:border-slate-100"
                  >
                    <span>{opt}</span>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      isSelected 
                        ? `${themeCheckBg} text-white` 
                        : "border-slate-300 bg-white"
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={() => {
                  setAlerts(tempAlerts);
                  setShowAlertPicker(false);
                }}
                className={`w-full py-4.5 rounded-2xl ${themeButtonSubmitBg} text-white font-black text-sm active:scale-95 transition-all text-center pb-1 cursor-pointer`}
              >
                ثبت
              </button>
              <button
                type="button"
                onClick={() => setShowAlertPicker(false)}
                className={`w-full py-4.5 rounded-2xl border ${themeButtonCancelBorder} font-extrabold text-sm active:scale-95 transition-all text-center pb-1 cursor-pointer`}
              >
                انصراف
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. REPEAT PICKER BOTTOM SHEET (Image 4)     */}
      {/* ========================================== */}
      {showRepeatPicker && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-[2px] z-[200] flex items-end justify-center animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white rounded-t-[2.5rem] shadow-2xl flex flex-col p-6 animate-in slide-in-from-bottom duration-300 max-h-[88vh]">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-2">
              <h3 className="font-extrabold text-base text-slate-800">تکرار</h3>
              <button 
                onClick={() => setShowRepeatPicker(false)} 
                className="p-1 hover:bg-slate-100 text-slate-400 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options list */}
            <div className="overflow-y-auto max-h-[55vh] py-3 pr-1 space-y-4">
              
              {/* Main frequency radio buttons list */}
              <div className="space-y-1">
                {["بدون تکرار", "هر روز", "هر هفته", "هر ماه", "هر سال"].map((opt) => (
                  <label
                    key={opt}
                    onClick={() => setTempRepeat(opt)}
                    className="flex items-center justify-between py-2.5 px-4 rounded-xl cursor-pointer hover:bg-slate-50 text-slate-700 font-bold text-xs select-none border border-transparent hover:border-slate-100"
                  >
                    <span>{opt}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      tempRepeat === opt 
                        ? themeAccentBorder 
                        : "border-slate-300 bg-white"
                    }`}>
                      {tempRepeat === opt && <div className={`w-2.5 h-2.5 rounded-full ${themeDotBg}`} />}
                    </div>
                  </label>
                ))}
              </div>

              {/* End of repeat subsection if frequency selected */}
              {tempRepeat !== "بدون تکرار" && (
                <div className="pt-4 border-t border-slate-100 mt-2 space-y-3">
                  <span className="text-[11px] font-black text-slate-400 block pr-1">پایان تکرار</span>
                  
                  {/* Option 1: Forever */}
                  <label
                    onClick={() => setTempEndRepeatOption("تکرار برای همیشه")}
                    className="flex items-center justify-between py-2 px-4 rounded-xl cursor-pointer hover:bg-slate-50 text-slate-600 font-extrabold text-xs select-none"
                  >
                    <span>تکرار برای همیشه</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      tempEndRepeatOption === "تکرار برای همیشه" 
                        ? themeAccentBorder 
                        : "border-slate-300 bg-white"
                    }`}>
                      {tempEndRepeatOption === "تکرار برای همیشه" && <div className={`w-2.5 h-2.5 rounded-full ${themeDotBg}`} />}
                    </div>
                  </label>

                  {/* Option 2: Until Date */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2.5 px-4 rounded-xl hover:bg-slate-50 text-slate-600 font-extrabold text-xs">
                    <div className="flex items-center gap-2">
                      <div 
                        onClick={() => setTempEndRepeatOption("تا تاریخ")}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                          tempEndRepeatOption === "تا تاریخ" 
                            ? themeAccentBorder 
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {tempEndRepeatOption === "تا تاریخ" && <div className={`w-2.5 h-2.5 rounded-full ${themeDotBg}`} />}
                      </div>
                      <label
                        onClick={() => setTempEndRepeatOption("تا تاریخ")}
                        className="cursor-pointer select-none font-black text-slate-700"
                      >
                        تا تاریخ مشخص
                      </label>
                    </div>
                    
                    {tempEndRepeatOption === "تا تاریخ" && (
                      <div className="flex flex-col items-end gap-1 select-none animate-in fade-in duration-200">
                        <div className={`flex items-center gap-1.5 border rounded-xl px-2 py-1 transition-all ${
                          isJudicial 
                            ? "bg-red-50 border-red-200 focus-within:border-red-500" 
                            : "bg-purple-50 border-purple-200 focus-within:border-purple-500"
                        }`}>
                          <input
                            type="text"
                            maxLength={10}
                            value={tempEndRepeatDate}
                            onChange={(e) => handleRepeatDateChange(e.target.value)}
                            placeholder="۱۴۰۵/۰۳/۲۸"
                            className={`bg-transparent text-xs font-black outline-none w-24 text-center placeholder-slate-300 font-sans ${
                              isJudicial ? "text-red-600" : "text-purple-600"
                            }`}
                            dir="ltr"
                          />
                          <CalendarDays className={`w-3.5 h-3.5 shrink-0 ${isJudicial ? "text-red-500" : "text-purple-500"}`} />
                        </div>
                        <span className="text-[9px] text-slate-400 font-medium" dir="rtl">درج خودکار جداکننده فعال است</span>
                      </div>
                    )}
                  </div>

                  {/* Option 3: After Count */}
                  <div className="flex items-center justify-between py-2 px-4 rounded-xl hover:bg-slate-50 text-slate-600 font-extrabold text-xs">
                    <label
                      onClick={() => setTempEndRepeatOption("بعد از count")}
                      className="flex-1 flex items-center justify-between cursor-pointer select-none"
                    >
                      <span>بعد از تعداد تکرار مشخص</span>
                    </label>
                    
                    <div className="flex items-center gap-2">
                      {tempEndRepeatOption === "بعد از count" && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={tempEndRepeatCount}
                            onChange={(e) => setTempEndRepeatCount(e.target.value)}
                            className={`p-1 px-1.5 border text-[11px] font-black rounded-lg focus:outline-none w-12 text-center ${
                              isJudicial 
                                ? "bg-red-50 border-red-200 text-red-700" 
                                : "bg-purple-50 border-purple-200 text-purple-700"
                            }`}
                            min="1"
                          />
                          <span className="text-[10px] font-bold text-slate-400">تکرار</span>
                        </div>
                      )}
                      <div 
                        onClick={() => setTempEndRepeatOption("بعد از count")}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                          tempEndRepeatOption === "بعد از count" 
                            ? themeAccentBorder 
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {tempEndRepeatOption === "بعد از count" && <div className={`w-2.5 h-2.5 rounded-full ${themeDotBg}`} />}
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Footer Buttons */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={() => {
                  setRepeatSelected(tempRepeat);
                  setEndRepeatOption(tempEndRepeatOption);
                  setEndRepeatDate(tempEndRepeatDate);
                  setEndRepeatCount(tempEndRepeatCount);
                  setShowRepeatPicker(false);
                }}
                className={`w-full py-4.5 rounded-2xl ${themeButtonSubmitBg} text-white font-black text-sm active:scale-95 transition-all text-center pb-1 cursor-pointer`}
              >
                ذخیره
              </button>
              <button
                type="button"
                onClick={() => setShowRepeatPicker(false)}
                className={`w-full py-4.5 rounded-2xl border ${themeButtonCancelBorder} font-extrabold text-sm active:scale-95 transition-all text-center pb-1 cursor-pointer`}
              >
                انصراف
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Dropdown container - Centered Premium Select Modal to match the photo precisely */}
      {showCaseSelectionDropdown && (
        <>
          {/* Dark backdrop with blur to match the photo */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[1000] transition-opacity animate-in fade-in duration-200" 
            onClick={() => {
              setShowCaseSelectionDropdown(false);
              setCaseSearchQuery("");
            }} 
          />
          
          {/* Centered Modal Card matching the ultra-rounded premium style from the photo */}
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:max-w-lg md:mx-auto bg-white rounded-[32px] shadow-2xl z-[1010] overflow-hidden flex flex-col max-h-[80vh] border border-slate-100 animate-in fade-in zoom-in-95 duration-200 text-right">
            
            {/* Search box input on top of the list as requested by the user */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-2">
              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-xs font-black text-slate-850">انتخاب پرونده مرتبط</span>
                <span className="text-[10px] font-bold text-slate-400">یک مورد را علامت بزنید</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="جستجو بر اساس نام موکل، شماره ثنا، کلاسه یا موضوع پرونده..."
                  value={caseSearchQuery}
                  onChange={(e) => setCaseSearchQuery(e.target.value)}
                  className={`w-full bg-white border border-slate-250 rounded-2xl pr-10 pl-4 py-2.5 text-xs font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400 placeholder:font-semibold text-right ${
                    isJudicial ? "focus:border-red-600 focus:ring-1 focus:ring-red-650" : "focus:border-purple-600 focus:ring-1 focus:ring-purple-650"
                  }`}
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                {caseSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCaseSearchQuery("")}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Cases Options List with Radio buttons exactly matching the sent photo */}
            <div className="overflow-y-auto flex-1 max-h-[50vh] divide-y divide-slate-100">
              {/* Option: No association ("بدون ارتباط با پرونده خاص") */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCaseId("");
                  setCaseSearchQuery("");
                  setShowCaseSelectionDropdown(false);
                }}
                className="w-full text-right px-6 py-4 text-sm font-bold transition-all flex items-center justify-between hover:bg-slate-50/50"
              >
                {/* Radial indicator on the left side to match the photo */}
                <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedCaseId === "" 
                    ? (isJudicial ? "border-red-600" : "border-purple-600") 
                    : "border-slate-300"
                }`}>
                  {selectedCaseId === "" && (
                    <div className={`w-2.5 h-2.5 rounded-full ${isJudicial ? "bg-red-600" : "bg-purple-600"}`} />
                  )}
                </div>

                {/* Persian content on the right side */}
                <div className="flex flex-col gap-0.5 text-right flex-1 pr-4">
                  <span className={`text-[13px] font-black ${selectedCaseId === "" ? (isJudicial ? "text-red-700" : "text-purple-700") : "text-slate-700"}`}>
                    بدون ارتباط با پرونده خاص
                  </span>
                </div>
              </button>

              {/* Filtered options list matching layout */}
              {(() => {
                const query = caseSearchQuery.trim().toLowerCase();
                console.log("DEBUG: safeCases in modal:", safeCases);
                const filtered = safeCases.filter(cs => {
                  if (!cs) return false;
                  if (!query) return true;
                  const title = (cs.title || "").toLowerCase();
                  const client = (cs.clientName || "").toLowerCase();
                  const archive = (cs.archiveNumber || "").toLowerCase();
                  const court = (cs.courtCaseNumber || "").toLowerCase();
                  const sana = (cs.caseNumber || "").toLowerCase();
                  return title.includes(query) || 
                         client.includes(query) || 
                         archive.includes(query) || 
                         court.includes(query) || 
                         sana.includes(query);
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-400 text-xs font-bold">
                      {dataLoaded ? "پرونده‌ای با این مشخصات یافت نشد!" : "در حال بارگذاری پرونده‌ها..."}
                    </div>
                  );
                }

                return filtered.map((cs) => {
                  const isSelected = selectedCaseId === cs.id;
                  const archiveText = cs.archiveNumber ? ` (کلاسه: ${toPersianDigits(cs.archiveNumber)})` : "";
                  const sanaText = cs.caseNumber ? ` (شماره ثنا: ${toPersianDigits(cs.caseNumber)})` : "";
                  
                  return (
                    <button
                      key={cs.id}
                      type="button"
                      onClick={() => {
                        setSelectedCaseId(cs.id);
                        setCaseSearchQuery("");
                        setShowCaseSelectionDropdown(false);
                      }}
                      className="w-full text-right px-6 py-4 text-sm font-bold transition-all flex items-center justify-between hover:bg-slate-50/50"
                    >
                      {/* Radial indicator on the left side to match the photo exactly */}
                      <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected 
                          ? (isJudicial ? "border-red-650" : "border-purple-650") 
                          : "border-slate-300"
                      }`}>
                        {isSelected && (
                          <div className={`w-2.5 h-2.5 rounded-full ${isJudicial ? "bg-red-650" : "bg-purple-650"}`} />
                        )}
                      </div>

                      {/* Case details text on the right side */}
                      <div className="flex flex-col gap-1 text-right flex-1 pr-4">
                        <span className={`text-[13px] font-black leading-relaxed ${
                          isSelected 
                            ? (isJudicial ? "text-red-750" : "text-purple-750") 
                            : "text-slate-800"
                        }`}>
                          {cs.title} {archiveText}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold block">
                          موکل: {cs.clientName} {sanaText ? ` | ${sanaText}` : ""}
                        </span>
                      </div>
                    </button>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCaseSelectionDropdown(false);
                  setCaseSearchQuery("");
                }}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${
                  isJudicial 
                    ? "bg-red-50 text-red-600 hover:bg-red-100/70" 
                    : "bg-purple-50 text-purple-600 hover:bg-purple-100/70"
                }`}
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
