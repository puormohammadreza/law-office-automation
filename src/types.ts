/**
 * Types and interfaces for Reza Pourmohammad Legal Suite
 */

export interface Client {
  id: string;
  name: string;             // نام و نام خانوادگی موکل
  nationalId: string;       // کد ملی
  phoneNumber: string;      // شماره تماس
  fatherName: string;       // نام پدر
  birthDate?: string;       // تاریخ تولد
  address: string;          // نشانی محل اقامت یا پستی
  description?: string;     // توضیحات پرونده موشکلی یا شخصی
  createdAt: string;        // تاریخ ایجاد
}

export type CaseStage = "بدوی" | "بازپرسی" | "دادیاری" | "تجدید نظر استان" | "دیوان عالی کشور" | "دیوان عدالت اداری" | "شورای حل اختلاف" | "دادگاه صلح" | "دادگاه عمومی حقوقی" | "دادگاه کیفری ۲" | "اجرای احکام کیفری" | "اجرای احکام مدنی" | "سایر";
export type CaseStatus = "جریان دارد" | "مختومه" | "در انتظار رای" | "تجدیدنظر خواهی" | "منتظر ابلاغ";

export type ClientPartyRole = "خواهان" | "خوانده" | "شاکی" | "متشاکی" | "متهم" | "ارسال کننده اظهارنامه" | "دریافت کننده اظهارنامه";

export type CaseCategory = "حقوقی" | "کیفری" | "تعزیرات حکومتی" | "اداره کار" | "سایر مراجع" | "تامین دلیل" | "اظهارنامه" | string;

export interface LegalCase {
  id: string;
  clientId: string;         // شناسه موکل مرتبط
  clientName: string;       // نام موکل (سریع‌تر کردن کوئری‌ها)
  clientRole: ClientPartyRole; // نقش موکل در پرونده
  category?: CaseCategory;  // نوع/دسته پرونده
  opposingPartyName: string; // نام طرف یا طرف‌های مقابل (جدا شده با کاما)
  caseNumber: string;       // شماره پرونده عدل ایران
  declarationTrackingCode?: string; // کد رهگیری اظهارنامه
  declarationSendDate?: string;     // تاریخ ارسال اظهارنامه
  declarationSendGracePeriod?: string; // مهلت ارسال اظهارنامه
  declarationReceiveDate?: string;  // تاریخ دریافت اظهارنامه
  declarationReceiveGracePeriod?: string; // مهلت دریافت اظهارنامه
  courtCaseNumber?: string; // شماره پرونده دادگاه بدوی (در صورت وجود)
  archiveNumber?: string;   // شماره کلاسه بایگانی دفتر
  title: string;            // موضوع دعوی (خواسته / اتهام) 
  stage: CaseStage;         // مرحله پرونده (فعلی)
  stages?: {                // سوابق مراحل رسیدگی
    stage1?: CaseStage;
    stage1ArchiveNumber?: string;
    stage1Branch?: string;
    stage2?: CaseStage;
    stage2ArchiveNumber?: string;
    stage2Branch?: string;
    stage3?: CaseStage;
    stage3ArchiveNumber?: string;
    stage3Branch?: string;
    stage4?: CaseStage;
    stage4ArchiveNumber?: string;
    stage4Branch?: string;
    stage5?: CaseStage;
    stage5ArchiveNumber?: string;
    stage5Branch?: string;
  };
  branch: string;           // شعبه رسیدگی کننده (مثلاً شعبه ۱۰۱ دادگاه عمومی حقوقی)
  status: CaseStatus;       // وضعیت جاری پرونده
  description: string;      // خلاصه وضعیت نهایی پرونده
  appealCaseNumber?: string;    // شماره پرونده تجدید نظر
  rejectionCaseNumber?: string; // شماره پرونده واخواهی
  supremeCaseNumber?: string;   // شماره پرونده فرجام خواهی
  executionCaseNumber?: string; // شماره پرونده اجرای احکام کیفری / عمومی
  executionCivilCaseNumber?: string; // شماره پرونده اجرای احکام مدنی
  insolvencyCaseNumber?: string; // شماره پرونده اعسار
  investigationCaseNumber?: string; // شماره پرونده بازپرسی
  prosecutionCaseNumber?: string; // شماره پرونده دادیاری
  filingDate?: string;      // تاریخ تشکیل پرونده در این سامانه (شمسی)
  closedDate?: string;      // تاریخ مختومه شدن (شمسی)
  courtRegistrationDate?: string; // تاریخ ثبت پرونده در دادگستری (شمسی)
  powerOfAttorneyDate?: string;   // تاریخ اخذ وکالت از موکل (شمسی)
  receivedFee?: number;     // مبلغ حق‌الوکاله دریافتی (تومان)
  contractNumber?: string;  // شماره قرارداد وکالتنامه
  paidExpenses?: number;    // هزینه‌های دادرسی و پرداختی پرونده (تومان)
  totalContractAmount?: number; // کل مبلغ قرارداد (تومان)
  downPayment?: number;     // مبلغ پیش پرداخت (تومان)
  sanaPassword?: string;    // رمز شخصی ثنای موکل
  installments?: { 
    id?: string;
    amount: number; 
    dueDate: string; 
    isPaid?: boolean; 
    paidDate?: string; 
    note?: string;
  }[]; // اقساط
  payments?: {
    id: string;
    title: string; // e.g., "حق الوکاله", "هدیه", "هزینه دادرسی"
    amount: number; // تومان
    type: string; // "نقدی", "کارت به کارت", "چک"
    date: string; // تاریخ پرداخت
    cardNumber?: string; // شماره کارت / شبا
    receiptImage?: string; // تصویر رسید / فیش پرداخت
  }[]; // پرداختی‌های مختلف موکل
  associatedPersons?: { name: string; phone: string; role?: string }[]; // افراد مرتبط
  createdAt: string;        // تاریخ ثبت در سیستم
}

export interface CaseNote {
  id: string;
  caseId: string;           // شناسه پرونده مرتبط
  title: string;            // عنوان یادداشت
  content: string;          // متن اصلی یادداشت پرونده
  createdAt: string;        // تاریخ ثبت یادداشت
}

export interface CaseDocument {
  id: string;
  caseId: string;           // شناسه پرونده مرتبط
  name: string;             // نام فایل سِند
  type: "pdf" | "image" | "doc" | "audio" | "other"; // نوع سند ارسالی
  size: string;             // حجم فایل
  dataUrl?: string;         // داده به صورت base64 یا شبیه‌سازی
  textContent?: string;     // متن خوانده شده از سند (برای فایل های متنی)
  uploadedAt: string;       // تاریخ الحاق سند
  tag?: "محرمانه" | "فوری" | "آرشیو" | "عادی"; // برچسب سند
  lawArticle?: string;      // ماده استنادی مرتبط
  lawText?: string;         // متن ماده یا تبصره استنادی
}

export type EventType = "جلسه دادرسی" | "ملاقات با موکل" | "پیگیری اداری" | "سایر رویدادها" | "یادآوری غیر قضایی";

export interface LegalEvent {
  id: string;
  caseId?: string;          // شناسه پرونده مرتبط (اختیاری)
  caseTitle?: string;       // خواهان پرونده یا موضوع پرونده (اختیاری)
  clientName?: string;      // نام موکل مرتبط (اختیاری)
  title: string;            // عنوان جلسه یا موضوع ملاقات
  type: EventType;          // نوع رویداد
  jalaliDate: string;       // تاریخ شمسی رویداد (قالب: YYYY/MM/DD)
  time: string;             // ساعت رویداد (قالب: HH:MM)
  alarmEnabled: boolean;    // قابلیت زنگ هشدار/آلارم جلسه دادرسی
  description: string;      // یادداشت یا آدرس یا هدف ملاقات
  isArchived?: boolean;     // آیا این رویداد منقضی و بایگانی شده است؟
  alarm1Hour?: boolean;
  alarm1Day?: boolean;
  alarm3Days?: boolean;
  alarm1Week?: boolean;
  repeatSelected?: string;
  endRepeatOption?: string;
  endRepeatDate?: string;
  documentId?: string;       // شناسه مدرک پیوستی (اختیاری)
  documentName?: string;     // نام مدرک پیوستی (اختیاری)
  documentSize?: string;     // حجم مدرک پیوستی (اختیاری)
  documentDataUrl?: string;  // محتوای مدرک (اختیاری)
}

export interface CourtSimulationContext {
  caseType: string;
  userRole: string;
  courtStage: string;
}

export interface SimulationMessage {
  id: string;
  role: "user" | "model";
  text: string;
}

export type EventItem = LegalEvent;
