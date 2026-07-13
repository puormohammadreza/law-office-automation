import { safeStorage } from "../utils/safeStorage";
import { Client, LegalCase, CaseNote, CaseDocument, LegalEvent } from "../types";

// Seed realistic Farsi Legal Data for immediate premium layout
const INITIAL_CLIENTS: Client[] = [
  {
    id: "cl_1",
    name: "زهرا حسینی",
    nationalId: "۰۰۸۷۶۵۴۳۲۱",
    phoneNumber: "۰۹۱۹۸۷۶۵۴۳۲",
    fatherName: "علی",
    address: "تهران، یوسف آباد، خیابان بیست و سوم، پلاک ۱۲، واحد ۴",
    description: "خواهان پرونده مطالبه مهریه و استرداد جهیزیه",
    createdAt: "۱۴۰۳/۱۰/۱۵"
  },
  {
    id: "cl_2",
    name: "مرتضی کریمی",
    nationalId: "۰۰۱۲۳۴۵۶۷۸",
    phoneNumber: "۰۹۱۲۳۴۵۶۷۸۹",
    fatherName: "حسن",
    address: "کرج، عظیمیه، میدان طالقانی، مجتمع البرز، طبقه ۵",
    description: "خوانده پرونده مطالبه وجه سفته به مبلغ ۲ میلیارد ریال",
    createdAt: "۱۴۰۴/۰۲/۲۰"
  },
  {
    id: "cl_3",
    name: "مریم دانا",
    nationalId: "۲۲۹۰۵۴۳۲۱۱",
    phoneNumber: "۰۹۳۵۱۲۳۴۵۶۷",
    fatherName: "رضا",
    address: "تهران، پاسداران، بوستان پنجم، پلاک ۷۸",
    description: "مالک ملک مسکونی تجاری - پرونده الزام به تنظیم سند رسمی",
    createdAt: "۱۴۰۴/۰۳/۰۱"
  }
];

const INITIAL_CASES: LegalCase[] = [
  {
    id: "ca_1",
    clientId: "cl_1",
    clientName: "زهرا حسینی",
    caseNumber: "۱۴۰۳۹۸۷۶۵۴۳۲۱۰۰۱",
    archiveNumber: "ب/۴۰۳/۱۱",
    title: "مطالبه مهریه به نرخ روز و تامین خواسته",
    stage: "بدوی",
    branch: "شعبه ۲۴۴ دادگاه خانواده تهران (مجتمع باهنر)",
    status: "جریان دارد",
    clientRole: "خواهان",
    opposingPartyName: "علی رضایی (زوج)",
    description: "دادخواست توقیف اموال زوج بابت مهریه مشتمل بر ۱۱۰ سکه تمام بهار آزادی انجام شده و در مرحله کارشناسی پلاک ثبتی است.",
    receivedFee: 45000000,
    paidExpenses: 12000000,
    totalContractAmount: 60000000,
    downPayment: 15000000,
    createdAt: "۱۴۰۳/۱۰/۱۶",
    installments: [
      { id: "ins_1", amount: 15000000, dueDate: "۱۴۰۳/۱۱/۱۵", isPaid: true, paidDate: "۱۴۰۳/۱۱/۱۴" },
      { id: "ins_2", amount: 15000000, dueDate: "۱۴۰۳/۱۲/۱۵", isPaid: true, paidDate: "۱۴۰۳/۱۲/۱۲" },
      { id: "ins_3", amount: 15000000, dueDate: "۱۴۰۴/۰۲/۱۵", isPaid: false }
    ],
    payments: [
      { id: "p_1", title: "پیش پرداخت قرارداد", amount: 15000000, type: "کارت به کارت", date: "۱۴۰۳/۱۰/۱۸" },
      { id: "p_2", title: "قسط اول حق الوکاله", amount: 15000000, type: "کارت به کارت", date: "۱۴۰۳/۱۱/۱۴" },
      { id: "p_3", title: "قسط دوم حق الوکاله", amount: 15000000, type: "کارت به کارت", date: "۱۴۰۳/۱۲/۱۲" }
    ]
  },
  {
    id: "ca_2",
    clientId: "cl_2",
    clientName: "مرتضی کریمی",
    caseNumber: "۱۴۰۴۹۱۲۳۴۵۶۷۸۰۰۲",
    archiveNumber: "ک/۴۰۴/۴۵",
    title: "مطالبه وجه سفته واخواست شده",
    stage: "تجدید نظر استان",
    branch: "شعبه ۱۵ دادگاه تجدیدنظر استان البرز",
    status: "تجدیدنظر خواهی",
    clientRole: "خوانده",
    opposingPartyName: "رضا احمدی (خواهان)",
    description: "حکم بدوی مبنی بر محکومیت موکل صادر شده بود. لایحه اعتراض تسلیم و پرونده با ایرادات حقوقی به مرحله تجدیدنظر ارسال شده است.",
    receivedFee: 25000050,
    paidExpenses: 4500000,
    totalContractAmount: 35000000,
    downPayment: 10000000,
    createdAt: "۱۴۰۴/۰۲/۲۱",
    installments: [
      { id: "ins_4", amount: 15000050, dueDate: "۱۴۰۴/۰۳/۱۵", isPaid: true, paidDate: "۱۴۰۴/۰۳/۱۰" },
      { id: "ins_5", amount: 10000000, dueDate: "۱۴۰۴/۰۵/۱۵", isPaid: false }
    ],
    payments: [
      { id: "p_4", title: "پیش پرداخت تسویه اول", amount: 10000000, type: "چک", date: "۱۴۰۴/۰۲/۲۲" },
      { id: "p_5", title: "تسویه قسط اول", amount: 15000050, type: "کارت به کارت", date: "۱۴۰4/۰۳/۱۰" }
    ]
  },
  {
    id: "ca_3",
    clientId: "cl_3",
    clientName: "مریم دانا",
    caseNumber: "۱۴۰۴۳۱۲۳۴۵۶۷۸۹۹۹",
    archiveNumber: "ح/۴۰۴/۷۸",
    title: "الزام به تنظیم سند رسمی و فک رهن ملکی",
    stage: "بدوی",
    branch: "شعبه ۳۲ دادگاه عمومی حقوقی تهران (مجتمع صدر)",
    status: "جریان دارد",
    clientRole: "خواهان",
    opposingPartyName: "شرکت ساختمانی نگین",
    description: "جلسه دادرسی برای استعلام ثبتی و احراز مالکیت اولیه تشکیل می‌شود. مدارک انتقال قرارداد پیش‌فروش ضمیمه پرونده است.",
    receivedFee: 85000200,
    paidExpenses: 19500000,
    totalContractAmount: 120000000,
    downPayment: 30000000,
    createdAt: "۱۴۰۴/۰۳/۰۲",
    installments: [
      { id: "ins_6", amount: 55000200, dueDate: "۱۴۰۴/۰۴/۱۵", isPaid: true, paidDate: "۱۴۰۴/۰۴/۱۲" },
      { id: "ins_7", amount: 35000000, dueDate: "۱۴۰۴/۰۷/۱۵", isPaid: false }
    ],
    payments: [
      { id: "p_6", title: "دریافتی غرامت اولیه", amount: 30000000, type: "کارت به کارت", date: "۱۴۰۴/۰۳/۰۵" },
      { id: "p_7", title: "تسویه قسط سنگین", amount: 55000200, type: "کارت به کارت", date: "۱۴۰۴/۰۴/۱۲" }
    ]
  }
];

const INITIAL_NOTES: CaseNote[] = [
  {
    id: "no_1",
    caseId: "ca_1",
    title: "اظهارنامه توقیف حساب بانکی زوج",
    content: "تحقیقات محلی نشان داد زوج یک دستگاه آپارتمان در غرب تهران دارد که برای جلوگیری از فرار از دین باید بلافاصله تقاضای توقیف فوری (تأمین خواسته) داده شود. لایحه مربوطه به دادستان ارسال شد.",
    createdAt: "۱۴۰۴/۰۲/۰۵"
  },
  {
    id: "no_2",
    caseId: "ca_1",
    title: "ملاقات با شهود زوجه",
    content: "امروز شهود در دفتر حاضر شدند. دو نفر تایید کردند زوج تمکن مالی خرید خانه را داشته ولی عمداً اموال را به نام مادرش منتقل کرده است. استناد به ماده ۲۱ قانون نحوه اجرای محکومیت‌های مالی الزامی است.",
    createdAt: "۱۴۰۴/۰۲/۱۸"
  },
  {
    id: "no_3",
    caseId: "ca_2",
    title: "تحلیل امضای پشت سفته",
    content: "اصالت امضای ضامن در سفته مورد اختلاف است. تقاضای ارجاع به کارشناسی خط و امضا در لایحه تجدیدنظرخواهی گنجانده شده و باید نمونه امضاهای قدیمی موکل ارائه شود.",
    createdAt: "۱404/02/25"
  }
];

const INITIAL_DOCUMENTS: CaseDocument[] = [
  {
    id: "do_1",
    caseId: "ca_1",
    name: "سند_ازدواج_رسمی.pdf",
    type: "pdf",
    size: "۲.۴ مگابایت",
    uploadedAt: "۱۴۰۳/۱۰/۱۶"
  },
  {
    id: "do_2",
    caseId: "ca_1",
    name: "استعلام_ثبتی_ملک_توقیفی.jpg",
    type: "image",
    size: "۸۵۰ کیلوبایت",
    uploadedAt: "۱۴۰۴/۰۱/۱۲"
  }
];

const INITIAL_EVENTS: LegalEvent[] = [
  {
    id: "ev_today_1",
    caseId: "ca_1",
    caseTitle: "مطالبه مهریه زهرا حسینی",
    clientName: "زهرا حسینی",
    title: "جلسه دادرسی و دفاع در برابر ادعای اعسار زوج",
    type: "جلسه دادرسی",
    jalaliDate: "۱۴۰۵/۰۳/۲۴",
    time: "۰۹:۳۰",
    alarmEnabled: true,
    description: "حضور زوجه الزامی است. لایحه مستند به حساب‌های بانکی مخفی زوج ارائه شود. مجتمع باهنر شعبه ۲۴۴"
  },
  {
    id: "ev_today_2",
    caseId: "ca_2",
    caseTitle: "مطالبه وجه سفته مرتضی کریمی",
    clientName: "مرتضی کریمی",
    title: "ملاقات حضوری جهت تنظیم لایحه تجدیدنظرخواهی",
    type: "ملاقات با موکل",
    jalaliDate: "۱۴۰۵/۰۳/۲۴",
    time: "۱۶:۰۰",
    alarmEnabled: false,
    description: "موکل باید اسناد سجلی قدیمی به همراه دسته چک‌های ده سال گذشته را جهت مطابقت امضا بیاورد."
  },
  {
    id: "ev_1",
    caseId: "ca_1",
    caseTitle: "مطالبه مهریه زهرا حسینی",
    clientName: "زهرا حسینی",
    title: "جلسه دادرسی و ارزیابی ملکی آپارتمان زوج",
    type: "جلسه دادرسی",
    jalaliDate: "۱۴۰۵/۰۳/۲۸",
    time: "۱۰:۳۰",
    alarmEnabled: true,
    description: "حضور زوجه الزامی است. مدارک مستندات بانکی و مدارک ثبتی همره باشد. شعبه خانواده مجتمع باهنر"
  },
  {
    id: "ev_2",
    caseId: "ca_2",
    caseTitle: "مطالبه وجه سفته مرتضی کریمی",
    clientName: "مرتضی کریمی",
    title: "جلسه تحویل نمونه امضا به کارشناس خط",
    type: "جلسه دادرسی",
    jalaliDate: "۱۴۰۵/۰۴/۰۵",
    time: "۰۹:۰۰",
    alarmEnabled: true,
    description: "موکل باید اسناد سجلی قدیمی به همراه دسته چک‌های ده سال گذشته را جهت مطابقت امضا بیاورد."
  },
  {
    id: "ev_3",
    caseId: "ca_3",
    caseTitle: "تنظیم سند مریم دانا",
    clientName: "مریم دانا",
    title: "ملاقات حضوری در دفتر جهت بررسی تسویه حساب ثمن",
    type: "ملاقات با موکل",
    jalaliDate: "۱۴۰۵/۰۳/۲۵",
    time: "۱۷:۳۰",
    alarmEnabled: false,
    description: "بررسی فیش‌های واریزی موکل به حساب سازنده و برنامه‌ریزی لایحه فرعی الزام به تنظیم."
  }
];

/**
 * Storage Loaders
 */
export function loadAllData() {
  const clients = safeStorage.getItem("r_clients");
  const cases = safeStorage.getItem("r_cases");
  const notes = safeStorage.getItem("r_notes");
  const documents = safeStorage.getItem("r_documents");
  const events = safeStorage.getItem("r_events");

  if (!clients) {
    // Write defaults
    safeStorage.setItem("r_clients", JSON.stringify(INITIAL_CLIENTS));
    safeStorage.setItem("r_cases", JSON.stringify(INITIAL_CASES));
    safeStorage.setItem("r_notes", JSON.stringify(INITIAL_NOTES));
    safeStorage.setItem("r_documents", JSON.stringify(INITIAL_DOCUMENTS));
    safeStorage.setItem("r_events", JSON.stringify(INITIAL_EVENTS));

    return {
      clients: INITIAL_CLIENTS,
      cases: INITIAL_CASES,
      notes: INITIAL_NOTES,
      documents: INITIAL_DOCUMENTS,
      events: INITIAL_EVENTS,
    };
  }

  const parsedCasesStr = cases || "[]";
  let parsedCases: LegalCase[] = [];
  try {
    const temp = JSON.parse(parsedCasesStr);
    if (Array.isArray(temp)) {
      parsedCases = temp;
    }
  } catch (e) {
    parsedCases = [];
  }

  const migratedCases = parsedCases.map(c => {
    const defaultCase = INITIAL_CASES.find(ic => ic.id === c.id);
    if (defaultCase) {
      return {
        ...c,
        totalContractAmount: c.totalContractAmount ?? defaultCase.totalContractAmount,
        downPayment: c.downPayment ?? defaultCase.downPayment,
        installments: c.installments && c.installments.length > 0 ? c.installments : defaultCase.installments,
        payments: c.payments && c.payments.length > 0 ? c.payments : defaultCase.payments
      };
    }
    return c;
  });

  let parsedClients: any[] = [];
  try {
    const temp = JSON.parse(clients || "[]");
    if (Array.isArray(temp)) parsedClients = temp;
  } catch (e) {}

  let parsedNotes: any[] = [];
  try {
    const temp = JSON.parse(notes || "[]");
    if (Array.isArray(temp)) parsedNotes = temp;
  } catch (e) {}

  let parsedDocuments: any[] = [];
  try {
    const temp = JSON.parse(documents || "[]");
    if (Array.isArray(temp)) parsedDocuments = temp;
  } catch (e) {}

  let parsedEvents: any[] = [];
  try {
    const temp = JSON.parse(events || "[]");
    if (Array.isArray(temp)) parsedEvents = temp;
  } catch (e) {}

  return {
    clients: parsedClients,
    cases: migratedCases,
    notes: parsedNotes,
    documents: parsedDocuments,
    events: parsedEvents,
  };
}

/**
 * Storage Savers
 */
export function saveData(key: string, data: any) {
  safeStorage.setItem(key, JSON.stringify(data));
}
