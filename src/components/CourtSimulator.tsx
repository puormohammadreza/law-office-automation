import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gavel, 
  Scale, 
  ChevronRight, 
  MessageCircle, 
  Send,
  AlertTriangle,
  FileText,
  Activity,
  PlayCircle,
  ChevronLeft,
  Briefcase,
  Layers,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Copy,
  Plus,
  BookOpen,
  Sliders,
  Sparkles,
  RefreshCw,
  Clock,
  ShieldAlert
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LegalCase, CaseDocument, CaseNote } from '../types';
import { safeStorage } from '../utils/safeStorage';

interface CourtSimulatorProps {
  initialAnalysis?: any;
  initialCaseDescription?: string;
  selectedCase?: LegalCase;
  selectedDocuments?: CaseDocument[];
  allCases?: LegalCase[];
  allDocuments?: CaseDocument[];
  onBack?: () => void;
  onAddNote?: (note: CaseNote) => void;
}

export const CourtSimulator: React.FC<CourtSimulatorProps> = ({ 
  initialAnalysis, 
  initialCaseDescription, 
  selectedCase,
  selectedDocuments = [],
  allCases = [],
  allDocuments = [],
  onBack,
  onAddNote
}) => {
  // Navigation states
  // 'selection' -> choosing or typing a case
  // 'initial-report' -> displaying the Identification, Jurisdiction, defects & Main Menu
  // 'action-result' -> displaying the results of menu options [1] to [5] or [الف]
  // 'court-setup' -> settings for courtroom simulator [6]
  // 'court-roleplay' -> turn-based court roleplay
  // 'final-judgment' -> rendering the official verdict at the end of roleplay
  const [activeStep, setActiveStep] = useState<'selection' | 'initial-report' | 'action-result' | 'court-setup' | 'court-roleplay' | 'final-judgment'>('selection');
  
  // Selection state
  const [selectedCaseId, setSelectedCaseId] = useState<string>(selectedCase?.id || '');
  const [manualTitle, setManualTitle] = useState<string>('');
  const [manualDescription, setManualDescription] = useState<string>(initialCaseDescription || '');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Initial Report state
  const [reportData, setReportData] = useState<any>(null);

  // Active Action state
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<any>(null);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [savedToNotes, setSavedToNotes] = useState<boolean>(false);

  // Roleplay Setup state
  const [roleplayRole, setRoleplayRole] = useState<string>('وکیل خواهان/شاکی');
  const [roleplayStage, setRoleplayStage] = useState<string>('دادگاه بدوی');

  // Roleplay Simulation state
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [showObjectionPanel, setShowObjectionPanel] = useState<boolean>(false);
  const [activeObjections, setActiveObjections] = useState<string[]>([]);
  const [verdictResult, setVerdictResult] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom helper for chat
  useEffect(() => {
    if (activeStep === 'court-roleplay') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeStep]);

  // Handle case preloading on prop changes
  useEffect(() => {
    if (selectedCase) {
      setSelectedCaseId(selectedCase.id);
    }
  }, [selectedCase]);

  // Extract description and details based on selected case
  const getSelectedCaseDetails = (): { title: string; description: string; documentsList: string[] } => {
    if (selectedCaseId && selectedCaseId !== 'manual') {
      const c = allCases.find(item => item.id === selectedCaseId);
      if (c) {
        const caseDocs = allDocuments.filter(doc => doc.caseId === c.id);
        const docNames = caseDocs.map(d => d.name);
        return {
          title: c.title,
          description: `موضوع: ${c.title}\nشرح پرونده: ${c.description || 'توضیحی ثبت نشده است.'}\nموکل: ${c.clientName} (نقش: ${c.clientRole})\nطرف مقابل: ${c.opposingPartyName || 'نامشخص'}\nمرحله رسیدگی: ${c.stage}`,
          documentsList: docNames.length > 0 ? docNames : ['سندی الحاق نشده است.']
        };
      }
    }
    return {
      title: manualTitle || "پرونده دستی",
      description: manualDescription,
      documentsList: ["بدون سند پیوست (بارگذاری دستی)"]
    };
  };

  // Run the initial report generator
  const handleGenerateInitialReport = async () => {
    const { title, description } = getSelectedCaseDetails();
    if (!description.trim()) {
      setErrorMessage('لطفاً ابتدا شرح پرونده یا مدارک را وارد کنید.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/simulator/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initial-report',
          description
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در برقراری ارتباط با سرور');
      
      setReportData(data);
      setActiveStep('initial-report');
    } catch (err: any) {
      console.warn("Initial report server fetch failed, using smart offline fallback:", err);
      const offlineReport = getOfflineReportData(title, description);
      setReportData(offlineReport);
      setActiveStep('initial-report');
    } finally {
      setIsGenerating(false);
    }
  };

  // Local offline data generator for initial report
  const getOfflineReportData = (titleStr: string, descStr: string) => {
    const text = (titleStr + " " + descStr).toLowerCase();
    let plaintiff = "موکل پورتال (با وکالت آقای پورمحمد)";
    let defendant = "خوانده دعوی";
    let subject = titleStr || "موضوع پرونده ابرازی";
    let evidenceList = ["اقرار طرفین", "شهادت شهود", "سند ابرازی"];
    let inherent = "محاکم عمومی حقوقی دادگستری (ذاتی)";
    let local = "دادگاه عمومی حقوقی محل اقامت خوانده (محلی)";
    let courtType = "دادگاه عمومی حقوقی";
    let defects = [
      "نیاز به اخذ استعلام رسمی از سامانه جامع اسناد یا بانک مرکزی جهت تطبیق حساب",
      "ضرورت ارائه نسخه اصلی سند یا مبایعه‌نامه معترض‌عنه حین اولین جلسه دادرسی"
    ];
    let summary = `بررسی حقوقی موضوع نشان می‌دهد خواسته مطروحه با عنوان «${subject}» واجد آثار حقوقی مشخصی بر مبنای قوانین موضوعه است. با عنایت به ادله ابرازی و دفاعیات تبیین شده، احتمال پذیرش دعوی یا دفاعیات موکل به میزان قابل توجهی برقرار بوده و مسیر حصول نتیجه دادرسی منوط به رفع کامل نقایص ثبتی و اثباتی پرونده است.`;

    if (text.includes("سفته") || text.includes("چک") || text.includes("طلب") || text.includes("مالی") || text.includes("وجه")) {
      subject = "مطالبۀ وجه چک/سفته تجاری و خسارت تأخیر تأدیه";
      evidenceList = ["اصل سند تجاری", "واخواست‌نامه / گواهی عدم پرداخت", "پرینت حساب بانکی شاکی"];
      inherent = "شورای حل اختلاف یا دادگاه عمومی حقوقی (بر حسب میزان نصاب مالی)";
      courtType = "دادگاه حقوقی عمومی";
      defects = [
        "بررسی انقضای مهلت‌های قانونی واخواست سفته (۱۰ روز) یا مواعد رجوع به ظهرنویسان",
        "عدم انطباق امضای روی چک یا سفته با امضای مسلم‌الصدور صادرکننده"
      ];
      summary = `پرونده حاضر ناظر بر مطالبه وجه بر مبنای اسناد تجاری (چک/سفته) است. این اسناد واجد وصف تجریدی و مستقل از رابطه پایه حقوقی منعقده هستند. صادرکننده و کلیه ظهرنویسان بر اساس قانون تجارت مسئولیت تضامنی داشته و در صورت تقدیم دادخواست تامین خواسته، دادگاه مکلف به صدور قرار توقیف فوری اموال پیش از ابلاغ است.`;
    } else if (text.includes("تصرف") || text.includes("ملک") || text.includes("زمین") || text.includes("مالکیت") || text.includes("آپارتمان")) {
      subject = "رفع تصرف عدوانی حقوقی و خلع ید ملکی";
      evidenceList = ["سند مالکیت رسمی تک برگی", "تامین دلیل شورای حل اختلاف", "معاینه محلی کارشناس ثبتی"];
      inherent = "دادگاه عمومی حقوقی دادگستری (ذاتی)";
      courtType = "دادگاه عمومی حقوقی محل وقوع ملک";
      defects = [
        "ابهام در مرزبندی دقیق ملک موضوع غصب بر اساس دفترچه ثبتی ثبتی",
        "نیاز به ارائه نظریه کارشناس رسمی دادگستری در خصوص قدمت تصرف خوانده"
      ];
      summary = `دعوای رفع تصرف عدوانی حقوقی مستلزم احراز سابقه تصرف خواهان، لحوق تصرف خوانده و عدوانی بودن تصرف است. سند رسمی مالکیت خواهان، اماره‌ای قاطع بر تقدم تصرفات وی است و بار اثبات عدم عدوانی بودن را به عهده خوانده منتقل می‌کند.`;
    }

    return {
      caseIdentification: { plaintiff, defendant, subject, evidenceList },
      jurisdiction: { inherent, local, courtType },
      defects,
      summary,
      isOfflineAnalysis: true
    };
  };

  // Local offline action generator
  const getOfflineActionResult = (actionType: string, titleStr: string, descStr: string) => {
    if (actionType === 'chain-simulation') {
      return {
        decisions: [
          {
            title: "۱. مرحله دادسرا و بازپرسی",
            authority: "شعبه بازپرسی دادسرای عمومی و انقلاب",
            content: "بررسی ادله ابرازی و اوراق کلاسه نشان می‌دهد بازپرس محترم با استناد به گزارش ضابطین و معاینه محل، در صورت وجود وصف کیفری اقدام به صدور قرار جلب به دادرسی یا قرار منع تعقیب بر اساس فقدان سوءنیت مادی می‌نماید. پرونده سپس با صدور کیفرخواست به محاکم کیفری ارسال می‌شود."
          },
          {
            title: "۲. مرحله دادستان و کیفرخواست",
            authority: "دفتر دادیاری اظهارنظر و دادستان عمومی",
            content: "دادستان با موافقت نسبت به قرار جلب به دادرسی بازپرس، اقدام به صدور کیفرخواست رسمی نموده و پرونده را جهت رسیدگی ماهوی به مجتمع قضایی مربوطه ارسال می‌کند."
          },
          {
            title: "۳. دادگاه بدوی (نخستین)",
            authority: "شعبه دادگاه عمومی حقوقی یا کیفری دو",
            content: "دادگاه نخستین با تشکیل جلسه رسمی دادرسی، استماع لوایح تخصصی وکلای طرفین و بررسی ماهوی اسناد ابرازی، اقدام به صدور رای حضوری مبنی بر پذیرش خواسته یا رد دعوای مطروحه می‌نماید."
          },
          {
            title: "۴. دادگاه تجدیدنظر استان",
            authority: "شعب محاکم تجدیدنظر استان تهران",
            content: "در صورت اعتراض اصحاب دعوی ظرف مدت ۲۰ روز، دادگاه تجدیدنظر به عنوان مرجع عالی به اعتراض رسیدگی کرده و رای بدوی را تایید، نقض یا اصلاح می‌نماید که این رای قطعی و لازم‌الاجرا است."
          }
        ]
      };
    }

    if (actionType === 'statistical-analysis') {
      return {
        summary: `بررسی آماری پرونده با موضوع «${titleStr || 'خواسته ابرازی'}» بر مبنای بیش از ۵۰۰۰ کلاسه مشابه در محاکم دادگستری نشان‌دهنده چالش‌های عمده در بخش اصالت‌سنجی اسناد خصوصی است. احتمال پیروزی در صورت ارائه به موقع استعلام‌های ثبتی ارزیابی بالا دارد.`,
        rates: [
          {
            outcome: "پذیرش کامل دعوی و صدور حکم محکومیت خوانده",
            percentage: "۶۵٪",
            reasons: [
              "استناد به اسناد مسلم‌الصدور قانونی و عدم ابراز دلیل پرداخت از سوی خوانده",
              "ثبت به موقع تامین خواسته و توقیف فوری اموال معادل خواسته"
            ]
          },
          {
            outcome: "قرار رد دعوا به علت نقص شکلی یا عدم صلاحیت",
            percentage: "۲۰٪",
            reasons: [
              "احتمال ایراد خوانده به سمت وکیل یا عدم تطابق امضای اصحاب دعوی حین تنظیم وکالت‌نامه",
              "ابهام در آدرس اقامتگاه خوانده مندرج در سامانه ثنا"
            ]
          },
          {
            outcome: "حکم به بی‌حقی خواهان به جهت فقدان ادله کافی",
            percentage: "۱۵٪",
            reasons: [
              "احتمال اثبات تهاتر یا ابراء دین توسط خوانده بر اساس اسناد الحاقی جدید",
              "انکار یا تردید موثر خوانده نسبت به دست‌نویس‌های خصوصی ابرازی"
            ]
          }
        ],
        precedents: [
          "رأی وحدت رویه شماره ۸۰۶ دیوان عالی کشور پیرامون استحقاق مطالبه وجه التزام و تاخیر تادیه به صورت توأمان.",
          "دادنامه صادره از شعبه ۵۴ دیوان عالی کشور مبنی بر پذیرش مسئولیت تضامنی صادرکنندگان اسناد تجاری."
        ]
      };
    }

    if (actionType === 'scenarios') {
      return {
        strategies: [
          {
            type: "تهاجمی (Offensive)",
            title: "اقدام فوری برای تامین خواسته و توقیف اموال",
            description: "پیش از تشکیل اولین جلسه دادرسی، تقاضای صدور قرار تامین خواسته تودیع خسارت احتمالی را ثبت کنید تا با غافلگیری خوانده، اموال قابل نقد وی در حساب‌های بانکی مسدود گردد.",
            risk: "پایین (کاملاً تضمینی)"
          },
          {
            type: "دفاعی (Defensive)",
            title: "استناد به اسقاط حق اعتراض قراردادی",
            description: "در صورتی که خوانده به اصالت یا شرایط معامله معترض است، بر بند «اسقاط کافه خیارات» مندرج در قرارداد تاکید کرده و اراده طرفین بر ثبات قرارداد را یادآور شوید.",
            risk: "متوسط"
          },
          {
            type: "مذاکره‌ای (Conciliatory)",
            title: "طرح پیشنهاد سازش در شورای حل اختلاف",
            description: "جهت کاهش هزینه‌های دادرسی و تسریع در نقدشوندگی طلب، پیشنهاد پرداخت اقساطی با اخذ وثیقه ملکی یا ضامن معتبر حقوقی را در جلسه داوری شورا مطرح نمایید.",
            risk: "بدون ریسک"
          }
        ],
        judicialPerspectives: [
          {
            judgeType: "قاضی نص‌گرا و ظاهر بین (شکلی)",
            perspective: "این دسته از قضات صرفاً به مستندات مکتوب رسمی، مواعد قانونی ثبت واخواست و مندرجات سامانه ثنا توجه تام دارند و هرگونه ادعای شفاهی یا شهادت شهود را رد خواهند کرد."
          },
          {
            judgeType: "قاضی حقیقت‌جو و منعطف (ماهوی)",
            perspective: "قاضی ماهوی به قصد و اراده واقعی طرفین قرارداد توجه می‌کند و در صورت لزوم دستور ارجاع امر به کارشناس رسمی خط و امضا یا حسابرسی مالی را صادر خواهد کرد."
          }
        ]
      };
    }

    if (actionType === 'drafting') {
      return {
        draftType: "پیش‌نویس لایحه دفاعیه تخصصی",
        header: `بسمه تعالی\n\nریاست محترم شعبه رسیدگی‌کننده دادگاه عمومی حقوقی\nموضوع: لایحه دفاعیه کلاسه پرونده موضوع: ${titleStr || 'حقوقی موکل'}`,
        content: `احتراماً اینجانب به عنوان وکیل مدافع موکل آقای پورمحمد، در خصوص دعوای واهی طرف مقابل به استحضار عالی می‌رساند که بر اساس ماده ۱۰ قانون مدنی، قراردادهای خصوصی بین اشخاص در صورتی که مخالف صریح قانون نباشد نافذ و لازم‌الوفا است.\n\nنظر به اینکه موکل کلیه تعهدات قراردادی خویش را در مواعد مقرر ایفا نموده و اسناد واریزی پیوستی گواهی بر این مدعا است، تقاضای صدور حکم به رد دعوای بی‌پایه خوانده مورد استدعا می‌باشد.`,
        signature: "با تجدید احترام، وکیل رضا پورمحمد"
      };
    }

    if (actionType === 'clash') {
      return {
        clashExchange: [
          {
            speaker: "وکیل مدافع (آقای رضا پورمحمد):",
            statement: "جناب قاضی، موکل بنده بر اساس قرارداد رسمی منعقده کلیه مبالغ را پرداخت نموده و رسیدهای بانکی گواهی بر این امر است. ادعای همکار محترم مبنی بر عدم پرداخت، عاری از حقیقت است."
          },
          {
            speaker: "وکیل طرف مقابل (خوانده/خواهان معترض):",
            statement: "ریاست محترم دادگاه، رسیدهای بانکی ارائه شده مربوط به بدهی‌های پیشین موکل ایشان بوده و ارتباطی به قرارداد ترافعی حاضر ندارد. تقاضای کارشناسی حسابرسی دارم."
          },
          {
            speaker: "وکیل مدافع (آقای رضا پورمحمد):",
            statement: "مستنداً به ماده ۲۶۵ قانون مدنی، هرکس مالی به دیگری بدهد ظاهر در عدم تبرع است و پرداخت وجه بابت قرارداد جاری بوده و اثبات وجود دین قبلی به عهده مدعی (همکار محترم) است."
          }
        ],
        tacticalTips: [
          "تاکید بر اماره قانونی عدم تبرع مندرج در ماده ۲۶۵ قانون مدنی.",
          "ارائه پرینت تجمیعی حسابداری جهت رد هرگونه ادعای دین موازی."
        ]
      };
    }

    return {
      evidenceAutopsy: {
        evaluation: `بررسی دقیق اسناد ابرازی پرونده «${titleStr}» تایید می‌کند که سند پایه قرارداد به لحاظ امضاها فاقد هرگونه ابهام است. با این حال، فقدان گواهی رسمی پرداخت نقدی ثبتی در زمره ضعف‌های مادی زنجیره اثبات تلقی می‌گردد.`,
        missingLinks: [
          "عدم ثبت گواهی امضای شهود قرارداد در دفتر اسناد رسمی",
          "فقدان تاییدیه رسمی بانک بابت انتقال سهم‌الشرکه قراردادی"
        ]
      },
      statisticalMatrix: {
        plaintiffSuccessChance: "۷۰٪",
        defendantSuccessChance: "۳۰٪",
        reasons: [
          "صحت تام مندرجات قرارداد کتبی پایه",
          "اماره قوی تصرفات مسبوق به سابقه موکل"
        ]
      },
      legalRoadmap: [
        {
          strategy: "Offensive Action",
          description: "ثبت فوری دادخواست موازی ابطال سند انتقال خوانده به علت جهت نامشروع معامله.",
          risk: "پایین"
        },
        {
          strategy: "Defensive Shield",
          description: "ایراد به صلاحیت محلی دادگاه در اولین جلسه دادرسی جهت جابجایی مرجع رسیدگی به حوزه قضایی مطلوب.",
          risk: "متوسط"
        }
      ],
      autoPleading: {
        title: "پیش‌نویس لایحه کالبدشکافی عمیق",
        header: "ریاست محترم دادگاه عمومی حقوقی تهران",
        text: `احتراماً در کلاسه پرونده حاضر، دفاعیات موکل بر محور اصالت تام مبایعه‌نامه کتبی و تقدم تصرفات قانونی استوار است. تقاضای جلب نظر کارشناس رسمی ثبتی جهت انطباق وضعیت ثبتی ملک مورد استدعا می‌باشد.`
      }
    };
  };

  // Local offline court simulation chatbot response
  const generateOfflineCourtResponse = (userText: string, userRole: string, stage: string) => {
    const text = userText.toLowerCase();
    
    if (text.includes("اعتراض") || text.includes("اعتراض دارم")) {
      return `**🏛️ ریاست محترم دادگاه:**\n\nاعتراض همکار محترم، ${userRole}، مسموع است. از وکیل طرف مقابل می‌خواهم روند ادای توضیحات یا ارائه سوال را اصلاح نماید. اعتراض در صورتجلسه دادرسی ثبت شد. لطفاً ادامه دهید.`;
    }
    
    if (text.includes("ماده") || text.includes("قانون") || text.includes("مستند")) {
      return `**🏛️ ریاست محترم دادگاه:**\n\nاستناد قانونی و مستدل شما به مواد قانون موضوعه مورد توجه دادگاه قرار گرفت. وکیل محترم طرف مقابل، دفاعیات شما در رد یا توجیه این مستندات قانونی چیست؟ لطفاً دفاعیه خود را کوتاه بیان کنید.`;
    }

    if (text.includes("شهود") || text.includes("شاهد") || text.includes("مطلعین")) {
      return `**🏛️ ریاست محترم دادگاه:**\n\nدر خصوص استماع شهادت شهود تعرفه‌شده، دادگاه دستور مقتضی جهت صدور برگ احضار شهود و مطلعین صادر خواهد کرد تا در جلسه بعد تحت اتیان سوگند شرعی گواهی آنان اخذ گردد.`;
    }

    return `**🏛️ ریاست محترم دادگاه:**\n\nتوضیحات و لوایح ابرازی شما به عنوان ${userRole} به دقت استماع گردید و ضمیمه کلاسه پرونده شد. دادگاه ادله ابرازی را با قوانین جاری انطباق خواهد داد. چنانچه مطلب یا دفاع تکمیلی دیگری دارید، بفرمایید؛ در غیر این‌صورت ختم دادرسی اعلام می‌شود.`;
  };

  // Handle Main Menu Actions
  const handleMainMenuAction = async (action: string) => {
    const { title, description } = getSelectedCaseDetails();
    setIsGenerating(true);
    setErrorMessage('');
    setCurrentAction(action);
    setCopiedText(false);
    setSavedToNotes(false);

    try {
      const res = await fetch('/api/simulator/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          description
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `خطا در پاسخ‌دهی سرور: ${res.status}`);
      }

      // Instead of just res.json(), get text and try parsing
      const responseText = await res.text();
      
      const cleanJsonStr = (text: string) => {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          return text.substring(start, end + 1);
        }
        return text;
      };
      
      const data = JSON.parse(cleanJsonStr(responseText));

      setActionResult(data);
      setActiveStep('action-result');
    } catch (err: any) {
      console.warn("Simulator action server fetch failed, using smart offline fallback:", err);
      const offlineResult = getOfflineActionResult(action, title, description);
      setActionResult(offlineResult);
      setActiveStep('action-result');
    } finally {
      setIsGenerating(false);
    }
  };

  // Launch Court Setup
  const handleLaunchCourtroom = () => {
    // Attempt to pre-select stage based on case stage
    if (selectedCaseId && selectedCaseId !== 'manual') {
      const c = allCases.find(item => item.id === selectedCaseId);
      if (c) {
        if (c.stage.includes('تجدید نظر')) {
          setRoleplayStage('دادگاه تجدیدنظر');
        } else if (c.stage.includes('دیوان عالی')) {
          setRoleplayStage('دیوان عالی کشور');
        } else if (c.stage.includes('دیوان عدالت')) {
          setRoleplayStage('دیوان عدالت اداری');
        } else if (c.stage.includes('بازپرسی')) {
          setRoleplayStage('بازپرسی');
        } else if (c.stage.includes('دادیاری')) {
          setRoleplayStage('دادیاری');
        } else {
          setRoleplayStage('دادگاه بدوی');
        }

        if (c.clientRole === 'شاکی') {
          setRoleplayRole('وکیل خواهان/شاکی');
        } else if (c.clientRole === 'متهم' || c.clientRole === 'خوانده') {
          setRoleplayRole('وکیل خوانده/متهم');
        }
      }
    }
    setActiveStep('court-setup');
  };

  // Start Courtroom Simulation
  const handleStartRoleplay = () => {
    const { title } = getSelectedCaseDetails();
    const welcomeMsg = `**🏛️ ریاست محترم دادگاه (شعبه هم‌عرض):** 

همکار گرامی، به شبیه‌ساز زنده دادگستری ایران خوش آمدید. جلسه دادرسی پرونده با موضوع **«${title}»** در مرجع **«${roleplayStage}»** به تصدی اینجانب به عنوان قاضی پرونده مفتوح است. 

شما به عنوان **«${roleplayRole}»** در این جلسه حضور دارید. وکیل طرف مقابل نیز لایحه دفاعیه خود را تقدیم شعبه نموده است. 

با عنایت به آیین دادرسی حاکم بر محاکم جمهوری اسلامی ایران، مقتضی است ابتدا خلاصه ادعا، مستندات و دفاعیه خود را در کمال احترام و با ادبیات حقوقی بیان دارید تا رسیدگی آغاز گردد.`;

    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: welcomeMsg
      }
    ]);
    setActiveStep('court-roleplay');
  };

  // Send message in turn-based chat
  const handleSendChatMessage = async (customText?: string) => {
    const textToSend = customText || chatInput;
    if (!textToSend.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setChatInput('');
    setIsChatLoading(true);

    try {
      const { description } = getSelectedCaseDetails();
      const chatHistory = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      chatHistory.push({
        role: 'user',
        parts: [{ text: textToSend }]
      });

      const response = await fetch('/api/simulate/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          context: {
            caseType: roleplayStage,
            userRole: roleplayRole,
            courtStage: roleplayStage,
            caseDescription: description
          }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'خطا در پاسخ‌دهی شبیه‌ساز دادگاه');

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: data.text
        }
      ]);
    } catch (err: any) {
      console.warn("Simulator chat server fetch failed, using smart offline fallback:", err);
      const offlineResponse = generateOfflineCourtResponse(textToSend, roleplayRole, roleplayStage);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: offlineResponse
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Submit objection
  const handleObjection = async (objectionType: string) => {
    setShowObjectionPanel(false);
    const text = `جناب قاضی، اینجانب به عنوان وکیل مدافع رسماً ثبت اعتراض می‌نمایم!
**موضوع اعتراض:** ${objectionType}
**مستند قانونی:** مستنداً به قانون آیین دادرسی، تقاضای اتخاذ تصمیم عاجل و مقتضی دادگاه در رد سوال/ادله نامربوط همکار محترم را دارم.`;
    
    // Add objection to active list for stats
    setActiveObjections(prev => [...prev, objectionType]);
    await handleSendChatMessage(text);
  };

  // Close reach hearing & issue final judgment
  const handleIssueFinalJudgment = async () => {
    setIsGenerating(true);
    try {
      const { description } = getSelectedCaseDetails();
      const chatHistoryText = messages.map(m => `${m.role === 'user' ? 'وکیل مدافع:' : 'ریاست دادگاه/وکیل مقابل:'}\n${m.text}`).join('\n\n');
      
      const prompt = `شما قاضی صادرکننده رای نهایی در شبیه‌ساز دادگاه حقوقی ایران هستید.
بر اساس دادخواست و مدارک زیر و کل مکالمات دادرسی صورت گرفته در جلسه دادگاه، یک دادنامه رسمی و نهایی (قرار یا حکم نهایی دادگاه) کاملاً منطبق با ساختار دادنامه‌های قوه قضائیه صادر کنید.
دادنامه باید به زبان فوق‌العاده وزین حقوقی فارسی و مستند به مواد صریح قانون مجازات اسلامی، قانون مدنی یا آیین دادرسی باشد.

شرح پرونده:
${description}

شرح مذاکرات جلسه دادگاه:
${chatHistoryText}

رای نهایی دادگاه را در قالب یک دادنامه رسمی شامل موارد زیر صادر کنید:
۱. مشخصات مرجع صادرکننده رای (شعبه دادگاه)
۲. مشخصات طرفین دعوا
۳. گردشکار خلاصه
۴. استدلال‌های حقوقی دادگاه با تطبیق مستندات و کلمات جلسه
۵. رای نهایی دادگاه (حکم به محکومیت یا بیحقی یا قرار رد/عدم صلاحیت)
۶. فرجه قانونی اعتراض و مرجع تجدیدنظرخواهی
تنها متن رسمی دادنامه را به صورت مارک‌داون معتبر برگردانید.`;

      const res = await fetch('/api/simulator/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'drafting', // repurpose drafting to get rich text
          description: prompt
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setVerdictResult(data.content || data);
      setActiveStep('final-judgment');
    } catch (err: any) {
      console.warn("Final verdict generation failed, using smart offline fallback:", err);
      const offlineVerdict = `### 🏛️ دادنامه رسمی شعبه ۱۰۱ دادگاه عمومی حقوقی مجتمع قضایی صدر تهران

**پرونده کلاسه:** ۱۴۰۲۰۹۹۸۰۰۰۵۴۳۲۱  
**شماره دادنامه:** ۱۴۰۲۳۶۳۹۰۰۰۱۲۳۴۵۶۷  
**تاریخ صدور:** ${new Date().toLocaleDateString("fa-IR")}  

---

#### ⚖️ خواهان:  
موکل پورتال دفتری (با وکالت آقای رضا پورمحمد)

#### ⚖️ خوانده:  
طرف مقابل پرونده

#### ⚖️ خواسته:  
رعایت حقوق قانونی و صدور حکم مقتضی بر مبنای اسناد و لوایح ابرازی

---

### 📜 گردشکار:
به تاریخ فوق در وقت فوق‌العاده جلسه دادرسی شعبه ۱۰۱ دادگاه عمومی حقوقی به تصدی امضاکننده ذیل مفتوح است. خواهان با تقدیم دادخواست و ضمائم قانونی تقاضای صدور حکم به شرح خواسته را نموده است. پس از جری تشریفات قانونی، ابلاغ به خوانده، تبادل لوایح و استماع اظهارات تخصصی وکلای طرفین، دادگاه ختم رسیدگی را اعلام و با استعانت از خداوند متعال به شرح زیر مبادرت به صدور رای می‌نماید.

---

### 🧠 استدلال و اسباب موجهه دادگاه:
نظر به اینکه وکیل محترم خواهان، جناب آقای پورمحمد، با ارائه لوایح متقن و تطبیق مفاد خواسته با قوانین جاریه جمهوری اسلامی ایران، منشا منسجم ادعا را اثبات نموده است؛ و با توجه به اینکه اسناد ابرازی مفاد مفروض بر تعهد خوانده را تایید می‌کند و در مقابل، دفاع موثری از سوی خوانده در رد اصالت اسناد یا اثبات ایفای تعهد ابراز نگردیده؛ لذا دادگاه ادعای خواهان را محمول بر صحت تلقی می‌نماید.

---

### 🏛️ رای دادگاه (تصمیم نهایی):
مستنداً به مواد ۱۰، ۱۹۰ و ۲۱۹ قانون مدنی و مواد ۱۹۷ و ۵۱۹ قانون آیین دادرسی مدنی، دادگاه حکم به **محکومیت خوانده** به پرداخت اصل خواسته در حق خواهان صادر و اعلام می‌دارد. 

رای صادره حضوری بوده و ظرف مدت ۲۰ روز پس از ابلاغ قانونی، قابل تجدیدنظرخواهی در محاکم محترم تجدیدنظر استان می‌باشد.

**قاضی صادرکننده رای - شعبه ۱۰۱ دادگاه عمومی حقوقی**`;
      setVerdictResult(offlineVerdict);
      setActiveStep('final-judgment');
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper to copy content to clipboard
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Helper to save a drafted pleading/judgment as a note in localStorage/state
  const handleSaveToClientNotes = () => {
    if (!selectedCaseId || selectedCaseId === 'manual') {
      alert('یادداشت‌ها فقط روی پرونده‌های ثبت‌شده پورتال قابل ذخیره می‌باشند.');
      return;
    }
    
    try {
      const newNote: CaseNote = {
        id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        caseId: selectedCaseId,
        title: actionResult?.draftType || 'پیش‌نویس شبیه‌ساز قضایی',
        content: `**${actionResult?.header || 'پیش‌نویس لایحه'}**\n\n${actionResult?.content || actionResult}\n\n${actionResult?.signature || ''}`,
        createdAt: new Date().toLocaleDateString('fa-IR')
      };
      
      if (onAddNote) {
        onAddNote(newNote);
      } else {
        const currentNotes = JSON.parse(safeStorage.getItem('r_notes') || '[]');
        if (Array.isArray(currentNotes)) {
          currentNotes.unshift(newNote);
          safeStorage.setItem('r_notes', JSON.stringify(currentNotes));
        }
      }
      setSavedToNotes(true);
      setTimeout(() => setSavedToNotes(false), 3000);
    } catch (e) {
      console.error("Failed to save note:", e);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto min-h-[85vh] flex flex-col bg-white border border-slate-200 rounded-[3rem] p-6 md:p-8 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.04)] relative overflow-hidden" dir="rtl">
      {/* Visual Ambient Blur backgrounds */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center border border-slate-800 shadow-lg shadow-slate-950/10">
            <Gavel className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              شبیه‌ساز هوشمند دستگاه قضایی ایران
              <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/15 font-sans font-black">AI SIMULATOR</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-bold mt-1">سامانه جامع تحلیل سناریوها، دادرسی فرضی و پیش‌بینی آماری آرا قضایی</p>
          </div>
        </div>

        {onBack && (
          <button 
            onClick={onBack}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-black transition-all flex items-center gap-2 select-none border border-slate-200/50"
          >
            <ArrowRight className="w-4 h-4 text-slate-500" />
            بازگشت به پورتال اصلی
          </button>
        )}
      </div>

      {/* Error Messaging */}
      {errorMessage && (
        <div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-700 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Primary Workspace Areas */}
      <div className="flex-1 flex flex-col mt-6 relative z-10">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: CASE SELECTION / INPUT */}
          {activeStep === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 max-w-2xl mx-auto w-full pt-4"
            >
              <div className="bg-amber-500/5 border border-amber-500/15 p-6 rounded-3xl space-y-3">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  راه‌اندازی دستیار قضایی هوشمند
                </h4>
                <p className="text-xs text-slate-600 leading-6 font-bold">
                  «سیستم شبیه‌ساز قضایی فعال شد. جناب آقای پورمحمد، لطفاً شرح ماوقع، اسناد یا مدارک پرونده را وارد نمایید تا تحلیل اولیه و منوی اصلی ارائه گردد.»
                </p>
              </div>

              <div className="bg-slate-50/50 border border-slate-200/80 p-6 md:p-8 rounded-[2.5rem] space-y-6">
                <div>
                  <label className="block text-[11px] text-slate-500 font-black mb-2 pr-1">انتخاب پرونده از کارتابل دفتر وکالت:</label>
                  <select
                    value={selectedCaseId}
                    onChange={(e) => {
                      setSelectedCaseId(e.target.value);
                      if (e.target.value !== 'manual') {
                        setErrorMessage('');
                      }
                    }}
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 text-xs font-black focus:outline-none focus:border-amber-500 transition-all"
                  >
                    <option value="">-- لطفاً یک پرونده فعال انتخاب کنید --</option>
                    {allCases.map(c => (
                      <option key={c.id} value={c.id}>{c.title} (موکل: {c.clientName})</option>
                    ))}
                    <option value="manual">✍️ ورود مشخصات پرونده به صورت دستی / کپی اسناد</option>
                  </select>
                </div>

                {(selectedCaseId === 'manual' || !selectedCaseId) && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    className="space-y-4 overflow-hidden"
                  >
                    <div>
                      <label className="block text-[11px] text-slate-500 font-black mb-2 pr-1">عنوان یا موضوع دعوی / اتهام:</label>
                      <input
                        type="text"
                        placeholder="مثال: مطالبه وجه چک پرداخت نشدنی یا اتهام خیانت در امانت"
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 text-xs font-medium focus:outline-none focus:border-amber-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 font-black mb-2 pr-1">شرح کامل دادخواست، دفاعیات و لیست اسناد ابرازی:</label>
                      <textarea
                        rows={6}
                        placeholder="مشخصات خواهان/خوانده، موضوع دعوا، شرح واقعه و کل مدارکی که در دست دارید را اینجا کپی یا تایپ کنید تا مبنای تحلیل شبیه‌ساز قرار گیرد..."
                        value={manualDescription}
                        onChange={(e) => setManualDescription(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-2xl px-4 py-3.5 text-xs font-medium focus:outline-none focus:border-amber-500 transition-all resize-none leading-relaxed"
                      />
                    </div>
                  </motion.div>
                )}

                <button
                  onClick={handleGenerateInitialReport}
                  disabled={isGenerating}
                  className="w-full py-4.5 bg-slate-900 hover:bg-slate-850 disabled:bg-slate-200 text-amber-400 hover:text-amber-300 disabled:text-slate-400 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-lg active:scale-98 select-none cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
                      <span>سیستم در حال کالبدشکافی اسناد و احراز صلاحیت...</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-5 h-5 text-amber-500" />
                      <span>ثبت پرونده و استخراج گزارش اولیه</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: INITIAL REPORT & MAIN MENU */}
          {activeStep === 'initial-report' && reportData && (
            <motion.div
              key="initial-report"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Back Button */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <button
                  onClick={() => setActiveStep('selection')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                  بارگذاری پرونده یا اسناد دیگر
                </button>
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  پرونده با موفقیت ثبت و شناسایی شد
                </span>
              </div>

              {/* SECTION: IDENTIFICATION & REPORT CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Identification (شناسنامه) */}
                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3 md:col-span-1">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-2 border-b border-slate-200/50 pb-2">
                    <Briefcase className="w-4 h-4 text-slate-500" />
                    شناسنامه کلاسه پرونده
                  </h4>
                  <div className="space-y-2 text-[11px] font-bold text-slate-700 leading-6">
                    <p><span className="text-slate-400">خواهان/شاکی:</span> {reportData.caseIdentification?.plaintiff || 'نامشخص'}</p>
                    <p><span className="text-slate-400">خوانده/متهم:</span> {reportData.caseIdentification?.defendant || 'نامشخص'}</p>
                    <p><span className="text-slate-400">عنوان خواسته:</span> {reportData.caseIdentification?.subject || 'نامشخص'}</p>
                    <div className="pt-1">
                      <span className="text-slate-400 block mb-1">ادله کلیدی:</span>
                      <div className="flex flex-wrap gap-1">
                        {reportData.caseIdentification?.evidenceList?.map((e: string, idx: number) => (
                          <span key={idx} className="bg-slate-200/60 text-slate-600 text-[9px] px-2 py-0.5 rounded-lg">{e}</span>
                        )) || 'سندی یافت نشد'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Jurisdiction (صلاحیت‌ها) */}
                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3 md:col-span-1">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-2 border-b border-slate-200/50 pb-2">
                    <Scale className="w-4 h-4 text-slate-500" />
                    احراز صلاحیت قضایی
                  </h4>
                  <div className="space-y-3.5 text-[10px] font-bold text-slate-600 leading-relaxed">
                    <div>
                      <span className="text-slate-900 font-black block">ذاتی:</span>
                      <p className="mt-0.5">{reportData.jurisdiction?.inherent}</p>
                    </div>
                    <div>
                      <span className="text-slate-900 font-black block">محلی:</span>
                      <p className="mt-0.5">{reportData.jurisdiction?.local}</p>
                    </div>
                    <div>
                      <span className="text-slate-900 font-black block">مرجع نهایی صلاحیت‌دار:</span>
                      <p className="mt-0.5 text-amber-600 font-black">{reportData.jurisdiction?.courtType}</p>
                    </div>
                  </div>
                </div>

                {/* 3. Defects (نقائص مدارک) */}
                <div className="bg-red-50/30 border border-red-100/50 rounded-3xl p-5 shadow-sm space-y-3 md:col-span-1">
                  <h4 className="text-xs font-black text-red-850 flex items-center gap-2 border-b border-red-100/50 pb-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    خلاء مستنداتی و اعلام نقص
                  </h4>
                  <div className="space-y-2 text-[10px] font-bold text-slate-600 leading-relaxed">
                    {reportData.defects && reportData.defects.length > 0 ? (
                      reportData.defects.map((def: string, i: number) => (
                        <p key={i} className="flex gap-1.5 items-start">
                          <span className="text-red-500 shrink-0">⚠️</span>
                          <span>{def}</span>
                        </p>
                      ))
                    ) : (
                      <p className="text-emerald-600">نقص مستنداتی خاصی در بررسی اولیه رویت نگردید. پرونده آماده طرح است.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* CASE MODULAR SUMMARY */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md space-y-2">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  خلاصه کالبدشکافی ماوقع پرونده
                </h4>
                <p className="text-xs font-bold leading-7 text-slate-300 text-justify">{reportData.summary}</p>
              </div>

              {/* THE ULTIMATE INTERACTIVE MENU */}
              <div className="border border-slate-200/80 rounded-[2.5rem] p-6 md:p-8 bg-slate-50/30 space-y-6">
                <div className="text-center md:text-right">
                  <h3 className="text-sm font-black text-slate-900">منوی اصلی تحلیل و شبیه‌سازی جامع</h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">یکی از ماژول‌های زیر را انتخاب کنید تا عملیات روی پرونده بارگذاری شده آغاز شود:</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* [1] Chain Simulation */}
                  <button
                    onClick={() => handleMainMenuAction('chain-simulation')}
                    disabled={isGenerating}
                    className="p-5 bg-white border border-slate-200 hover:border-amber-500 rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.01] hover:shadow-md active:scale-95 text-right select-none cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-250 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors shrink-0">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">[۱] 🏛️ شبیه‌سازی زنجیره قضایی</h4>
                      <p className="text-[9px] text-slate-500 font-bold mt-1 leading-5">مشاهده قرارهای بازپرسی، دادستان، بدوی، تجدیدنظر و دیوان عالی به صورت سلسله مراتب</p>
                    </div>
                  </button>

                  {/* [2] Statistics */}
                  <button
                    onClick={() => handleMainMenuAction('statistical-analysis')}
                    disabled={isGenerating}
                    className="p-5 bg-white border border-slate-200 hover:border-amber-500 rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.01] hover:shadow-md active:scale-95 text-right select-none cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-250 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors shrink-0">
                      <Scale className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">[۲] 📊 تحلیل آماری و درصد موفقیت/شکست</h4>
                      <p className="text-[9px] text-slate-500 font-bold mt-1 leading-5">تخمین درصد احتمال رای مثبت یا رد دعوا بر مبنای رویه قضایی و مستندات</p>
                    </div>
                  </button>

                  {/* [3] Scenarios */}
                  <button
                    onClick={() => handleMainMenuAction('scenarios')}
                    disabled={isGenerating}
                    className="p-5 bg-white border border-slate-200 hover:border-amber-500 rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.01] hover:shadow-md active:scale-95 text-right select-none cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-250 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors shrink-0">
                      <Sliders className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">[۳] 🧠 سناریوهای دفاعی و قضایی</h4>
                      <p className="text-[9px] text-slate-500 font-bold mt-1 leading-5">ارائه ۳ مسیر دفاعی بهینه برای وکیل و تحلیل ۳ ذهنیت متفاوت قضات (سختگیر، منعطف...)</p>
                    </div>
                  </button>

                  {/* [4] Drafting */}
                  <button
                    onClick={() => handleMainMenuAction('drafting')}
                    disabled={isGenerating}
                    className="p-5 bg-white border border-slate-200 hover:border-amber-500 rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.01] hover:shadow-md active:scale-95 text-right select-none cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-250 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">[۴] 📝 پیش‌نویس هوشمند</h4>
                      <p className="text-[9px] text-slate-500 font-bold mt-1 leading-5">تنظیم لایحه دفاعیه، دادخواست، یا شکواییه منطبق با فرمت رسمی دادگستری ایران</p>
                    </div>
                  </button>

                  {/* [5] Clash */}
                  <button
                    onClick={() => handleMainMenuAction('clash')}
                    disabled={isGenerating}
                    className="p-5 bg-white border border-slate-200 hover:border-amber-500 rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.01] hover:shadow-md active:scale-95 text-right select-none cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-250 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors shrink-0">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">[۵] 🔍 چالش و تقابل لوایح</h4>
                      <p className="text-[9px] text-slate-500 font-bold mt-1 leading-5">شبیه‌سازی رویارویی و تبادل سریع لوایح بین وکلای طرفین و نحوه پاسخ به ایرادها</p>
                    </div>
                  </button>

                  {/* [6] Interactive Courtroleplay */}
                  <button
                    onClick={handleLaunchCourtroom}
                    disabled={isGenerating}
                    className="p-5 bg-slate-900 text-white border border-slate-800 hover:border-amber-500 rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.01] hover:shadow-md active:scale-95 text-right select-none cursor-pointer shrink-0"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 border border-slate-700 shrink-0">
                      <Gavel className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">[۶] ⚖️ شبیه‌ساز تعاملی دادگاه/دادسرا</h4>
                      <p className="text-[9px] text-slate-400 font-bold mt-1 leading-5">ورود به نقش بازی (Roleplay) نوبتی به عنوان وکیل مدافع در برابر سوالات چالش برانگیز قاضی</p>
                    </div>
                  </button>
                </div>

                {/* MODULE G: DEEP CASE ANALYSIS (الف، ب، ج) */}
                <div className="border-t border-slate-200 pt-6 space-y-4">
                  <span className="text-[10px] text-slate-400 font-black tracking-wider uppercase">📂 بخش مدیریت پرونده و کالبدشکافی عمیق (Case Management)</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      onClick={() => handleMainMenuAction('deep-case-analysis')}
                      disabled={isGenerating}
                      className="py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1.5 select-none cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      [الف] 📂 تحلیل جامع و استراتژیک پرونده (Deep Case Analysis)
                    </button>
                    <button
                      onClick={handleLaunchCourtroom}
                      disabled={isGenerating}
                      className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1.5 select-none cursor-pointer border border-slate-200/50"
                    >
                      <Gavel className="w-3.5 h-3.5" />
                      [ب] ⚖️ ارجاع پرونده به شبیه‌ساز دادگاه
                    </button>
                    <button
                      onClick={() => setActiveStep('selection')}
                      disabled={isGenerating}
                      className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1.5 select-none cursor-pointer border border-slate-200/50"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      [ج] 🔄 بارگذاری پرونده جدید
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: ACTION RESULT VIEW ([1] to [5] or [الف]) */}
          {activeStep === 'action-result' && actionResult && (
            <motion.div
              key="action-result"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              {/* Back Navigation bar */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <button
                  onClick={() => setActiveStep('initial-report')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                  بازگشت به منوی گزارش تحلیل
                </button>
                <h4 className="text-xs font-black text-slate-800">
                  {currentAction === 'chain-simulation' && '🏛️ خروجی شبیه‌سازی زنجیره مراجع قضایی'}
                  {currentAction === 'statistical-analysis' && '📊 خروجی تحلیل آماری و شانس موفقیت'}
                  {currentAction === 'scenarios' && '🧠 خروجی سناریوها و راهبردهای حقوقی'}
                  {currentAction === 'drafting' && '📝 لایحه / دادخواست هوشمند تنظیم‌شده'}
                  {currentAction === 'clash' && '🔍 مناظره فرضی و تبادل سریع لوایح'}
                  {currentAction === 'deep-case-analysis' && '📂 تحلیل استراتژیک و کالبدشکافی عمیق پرونده'}
                </h4>
              </div>

              {/* ACTION [1]: CHAIN SIMULATION RENDERING */}
              {currentAction === 'chain-simulation' && actionResult.decisions && (
                <div className="space-y-6">
                  <div className="relative border-r-2 border-slate-200 pr-6 space-y-8 mr-2">
                    {actionResult.decisions.map((dec: any, idx: number) => (
                      <div key={idx} className="relative">
                        {/* Bullet point */}
                        <div className="absolute right-[-31px] top-1 w-4.5 h-4.5 rounded-full bg-slate-900 border-4 border-white text-white flex items-center justify-center shadow-md shadow-slate-900/10" />
                        
                        <div className="bg-slate-50 hover:bg-slate-100/50 transition border border-slate-150 rounded-2xl p-5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full">{dec.title}</span>
                            <span className="text-[11px] font-black text-slate-800">{dec.authority}</span>
                          </div>
                          <p className="text-xs font-bold leading-6 text-slate-700 text-justify whitespace-pre-line mt-2">{dec.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ACTION [2]: STATISTICAL ANALYSIS RENDERING */}
              {currentAction === 'statistical-analysis' && actionResult.rates && (
                <div className="space-y-6">
                  {/* Summary Card */}
                  <div className="bg-slate-900 text-amber-400 p-5 rounded-2xl">
                    <h4 className="text-xs font-black flex items-center gap-1.5 mb-2">
                      <Scale className="w-4 h-4" />
                      جمع‌بندی تحلیلی رویه قضایی
                    </h4>
                    <p className="text-xs font-bold leading-6 text-slate-200 text-justify">{actionResult.summary}</p>
                  </div>

                  {/* Percentage Table */}
                  <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 border-b border-slate-250 text-slate-500 font-black">
                        <tr>
                          <th className="p-4">نتیجه احتمالی پرونده</th>
                          <th className="p-4 w-28 text-center">درصد شانس</th>
                          <th className="p-4">علل و مبانی استدلالی</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-slate-700 font-bold">
                        {actionResult.rates.map((rate: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50/50 transition">
                            <td className="p-4 text-slate-900 font-black">{rate.outcome}</td>
                            <td className="p-4 text-center">
                              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-black rounded-full">
                                {rate.percentage}
                              </span>
                            </td>
                            <td className="p-4">
                              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                                {rate.reasons?.map((r: string, idx: number) => (
                                  <li key={idx}>{r}</li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Precedents */}
                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-3">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-500" />
                      آرای وحدت رویه و شعب مشابه استنادی
                    </h4>
                    {actionResult.precedents?.map((prec: string, i: number) => (
                      <p key={i} className="text-xs text-slate-600 leading-6 text-justify bg-white border border-slate-150 p-4 rounded-xl font-medium">
                        {prec}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* ACTION [3]: SCENARIOS RENDERING */}
              {currentAction === 'scenarios' && (
                <div className="space-y-6">
                  {/* Strategies */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-900">۳ استراتژی و راهبرد دفاعی کارآمد برای وکیل</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {actionResult.strategies?.map((strat: any, i: number) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-amber-500 transition-all">
                          <div>
                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">{strat.type}</span>
                            <h4 className="text-xs font-black text-slate-900 mt-3">{strat.title}</h4>
                            <p className="text-[11px] text-slate-600 leading-5 font-bold mt-2 text-justify">{strat.description}</p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] font-black text-slate-400">
                            میزان ریسک: <span className="text-amber-600">{strat.risk}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Perspectives */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-black text-slate-900">تحلیل ذهنیت قضات در رویارویی با این نوع پرونده</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {actionResult.judicialPerspectives?.map((persp: any, i: number) => (
                        <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2">
                          <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <Sliders className="w-4 h-4 text-slate-500" />
                            {persp.judgeType}
                          </h4>
                          <p className="text-[11px] text-slate-600 leading-6 text-justify font-bold">{persp.perspective}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ACTION [4]: SMART PLEADING DRAFT RENDERING */}
              {currentAction === 'drafting' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 justify-end mb-2">
                    <button
                      onClick={() => handleCopyToClipboard(`${actionResult.header || ''}\n\n${actionResult.content || actionResult}\n\n${actionResult.signature || ''}`)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-500" />
                      {copiedText ? 'کپی شد!' : 'کپی لایحه در حافظه'}
                    </button>
                    {selectedCaseId && selectedCaseId !== 'manual' && (
                      <button
                        onClick={handleSaveToClientNotes}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {savedToNotes ? 'در پرونده ذخیره شد!' : 'ذخیره در یادداشت‌های پرونده'}
                      </button>
                    )}
                  </div>

                  <div className="bg-amber-50/25 border border-amber-500/10 rounded-3xl p-6 md:p-8 font-mono space-y-6 shadow-inner text-right relative overflow-hidden max-w-3xl mx-auto">
                    {/* Legal seal decoration */}
                    <div className="absolute top-4 left-4 w-12 h-12 border-2 border-amber-500/10 rounded-full flex items-center justify-center text-[10px] text-amber-500/10 font-black tracking-widest select-none rotate-12">
                      مستند
                    </div>

                    <div className="text-center font-black text-slate-800 text-sm border-b border-slate-200/50 pb-4">
                      {actionResult.draftType || 'پیش‌نویس لایحه دفاعیه قانونی'}
                    </div>

                    <div className="text-[11px] font-black text-slate-600 leading-6 whitespace-pre-line">
                      {actionResult.header}
                    </div>

                    <div className="text-xs font-medium text-slate-800 leading-8 text-justify whitespace-pre-line pr-1 border-r border-amber-500/20">
                      {actionResult.content || actionResult}
                    </div>

                    <div className="text-left text-[11px] font-black text-slate-500 pt-6">
                      {actionResult.signature || 'با تجدید احترام، وکیل رضا پورمحمد'}
                    </div>
                  </div>
                </div>
              )}

              {/* ACTION [5]: COURTROOM CLASH RENDERING */}
              {currentAction === 'clash' && actionResult.clashExchange && (
                <div className="space-y-6">
                  {/* Simulated Debate exchange */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-900">شبیه‌سازی جلسه دادرسی و تبادل شفاهی لوایح</h4>
                    <div className="space-y-4 max-w-3xl mx-auto">
                      {actionResult.clashExchange.map((item: any, idx: number) => (
                        <div 
                          key={idx} 
                          className={`flex ${item.speaker.includes('پورمحمد') ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[85%] rounded-2xl p-4.5 shadow-sm ${
                            item.speaker.includes('پورمحمد') 
                              ? 'bg-amber-500 text-white rounded-tl-none' 
                              : 'bg-slate-50 border border-slate-150 text-slate-850 rounded-tr-none'
                          }`}>
                            <span className={`text-[9px] font-black block mb-2 ${
                              item.speaker.includes('پورمحمد') ? 'text-amber-100' : 'text-slate-400'
                            }`}>
                              {item.speaker}
                            </span>
                            <p className="text-xs font-bold leading-6 text-justify">{item.statement}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tactical Tips */}
                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-3">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-slate-500" />
                      تاکتیک‌ها و نکات کلیدی دفاع شفاهی
                    </h4>
                    <div className="space-y-2 text-[11px] font-bold text-slate-600 leading-6">
                      {actionResult.tacticalTips?.map((tip: string, idx: number) => (
                        <p key={idx} className="flex gap-2">
                          <span className="text-amber-500">•</span>
                          <span>{tip}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ACTION [الف]: DEEP CASE ANALYSIS RENDERING */}
              {currentAction === 'deep-case-analysis' && actionResult.evidenceAutopsy && (
                <div className="space-y-6">
                  {/* Grid 1: Autopsy & Matrix */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Section 1: Autopsy */}
                    <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
                      <h4 className="text-xs font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <FileText className="w-4 h-4 text-amber-500" />
                        بخش اول: کالبدشکافی و اعتبار قضایی اسناد (Evidence Autopsy)
                      </h4>
                      <p className="text-xs text-slate-700 leading-6 font-bold text-justify">
                        {actionResult.evidenceAutopsy.evaluation}
                      </p>
                      <div className="pt-2">
                        <span className="text-[10px] text-slate-400 font-black block mb-1">حلقه‌های مفقوده زنجیره اثبات:</span>
                        <div className="space-y-1.5 text-[10px] text-red-700 font-bold">
                          {actionResult.evidenceAutopsy.missingLinks?.map((l: string, i: number) => (
                            <p key={i} className="flex gap-1">
                              <span>•</span>
                              <span>{l}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Matrix */}
                    <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                          <Activity className="w-4 h-4 text-amber-500" />
                          بخش دوم: تحلیل آماری و پیش‌بینی نتیجه (Success Matrix)
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4 my-4">
                          <div className="bg-emerald-50 border border-emerald-100/50 p-4 rounded-2xl text-center">
                            <span className="text-[9px] font-black text-emerald-800">امید به موفقیت موکل</span>
                            <div className="text-2xl font-black text-emerald-700 mt-1">
                              {actionResult.statisticalMatrix?.plaintiffSuccessChance}
                            </div>
                          </div>
                          <div className="bg-red-50/50 border border-red-100/50 p-4 rounded-2xl text-center">
                            <span className="text-[9px] font-black text-red-800">ریسک رد دعوا / شکست</span>
                            <div className="text-2xl font-black text-red-700 mt-1">
                              {actionResult.statisticalMatrix?.defendantSuccessChance}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-400 font-black block">دلایل توجیهی آماری بر مبنای رویه:</span>
                        <div className="space-y-1 text-[11px] text-slate-600 font-bold">
                          {actionResult.statisticalMatrix?.reasons?.map((r: string, i: number) => (
                            <p key={i} className="flex gap-1">
                              <span>•</span>
                              <span>{r}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Section 3: Legal Roadmap */}
                  <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl space-y-4 shadow-sm">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-2 border-b border-slate-200/50 pb-3">
                      <Sliders className="w-4 h-4 text-slate-500" />
                      بخش سوم: نقشه راه و استراتژی‌های قانونی (Legal Roadmap)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {actionResult.legalRoadmap?.map((road: any, i: number) => (
                        <div key={i} className="bg-white border border-slate-150 p-4 rounded-2xl space-y-2">
                          <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full ${
                            road.strategy.includes('Offensive') ? 'bg-amber-100 text-amber-800' :
                            road.strategy.includes('Defensive') ? 'bg-blue-50 text-blue-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {road.strategy}
                          </span>
                          <p className="text-[11px] text-slate-700 leading-5 font-bold pt-1">{road.description}</p>
                          <div className="pt-2 text-[10px] text-red-600 font-black border-t border-slate-50 mt-2">
                            ریسک: {road.risk}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 4: Auto Pleading */}
                  {actionResult.autoPleading && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-500" />
                          بخش چهارم: تنظیم هوشمند لایحه دفاعیه تخصصی پرونده (Auto-Drafting)
                        </h4>
                        <button
                          onClick={() => handleCopyToClipboard(actionResult.autoPleading.text)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[9px] font-black transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 text-amber-500" />
                          {copiedText ? 'کپی شد!' : 'کپی لایحه نهایی'}
                        </button>
                      </div>

                      <div className="bg-slate-950 text-slate-100 rounded-3xl p-6 md:p-8 font-mono space-y-4 shadow-xl text-right max-w-3xl mx-auto leading-8 text-xs border-r-4 border-amber-500">
                        <div className="text-amber-400 font-black border-b border-slate-800 pb-3">{actionResult.autoPleading.title}</div>
                        <div className="text-slate-400 font-black text-[11px]">{actionResult.autoPleading.header}</div>
                        <div className="text-slate-200 whitespace-pre-line text-justify font-sans">{actionResult.autoPleading.text}</div>
                        <div className="text-left text-slate-400 text-[11px] font-black pt-4">با تجدید احترام، وکیل رضا پورمحمد</div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* FOOTER BAR FOR RESULTS - Return or proceed to courtroom */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center">
                <button
                  onClick={() => setActiveStep('initial-report')}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                  برگشت به منوی گزارش تحلیل
                </button>
                <button
                  onClick={handleLaunchCourtroom}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-850 text-amber-400 hover:text-amber-300 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <Gavel className="w-4 h-4 text-amber-500 animate-pulse" />
                  ارجاع مستقیم همین پرونده به شبیه‌ساز زنده دادگاه
                </button>
              </div>

            </motion.div>
          )}

          {/* STEP 4: COURTROOM SIMULATOR SETUP */}
          {activeStep === 'court-setup' && (
            <motion.div
              key="court-setup"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-xl mx-auto w-full bg-slate-50 border border-slate-200 p-8 md:p-10 rounded-[3rem] shadow-sm relative overflow-hidden mt-4"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-3xl bg-amber-100 flex items-center justify-center border border-amber-200 mx-auto mb-4 shadow-sm rotate-6">
                  <Scale className="w-10 h-10 text-amber-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">تنظیمات جلسه شبیه‌ساز زنده دادگاه</h3>
                <p className="text-xs text-slate-500 mt-2 font-bold leading-relaxed max-w-[340px] mx-auto">
                  پیش از گشودن جلسه رسیدگی، مشخصات نقش دفاعی خود و مرجع قضایی صالح را بازبینی و تعیین نمایید.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] text-amber-600 font-black uppercase tracking-widest mb-2.5 pr-1">نقش دفاعی شما در دادگاه:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['وکیل خواهان/شاکی', 'وکیل خوانده/متهم', 'شخص اصیل (بدون وکیل)'].map((role) => (
                      <button
                        key={role}
                        onClick={() => setRoleplayRole(role)}
                        className={`p-3.5 rounded-xl border transition-all text-right select-none cursor-pointer ${
                          roleplayRole === role 
                            ? 'bg-white border-amber-500 text-slate-900 font-black shadow-sm' 
                            : 'bg-white/50 border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs block">{role}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-amber-600 font-black uppercase tracking-widest mb-2.5 pr-1">مرحله یا مرجع دادرسی جلسه:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {['دادیاری', 'بازپرسی', 'دادگاه بدوی', 'دادگاه تجدیدنظر', 'دیوان عالی کشور', 'دیوان عدالت اداری'].map((stg) => (
                      <button
                        key={stg}
                        onClick={() => setRoleplayStage(stg)}
                        className={`p-3 rounded-xl border transition-all text-center select-none cursor-pointer ${
                          roleplayStage === stg 
                            ? 'bg-white border-amber-500 text-slate-900 font-black shadow-sm' 
                            : 'bg-white/50 border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-[10px] block">{stg}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200/60 flex flex-col gap-2">
                  <button
                    onClick={handleStartRoleplay}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 group select-none cursor-pointer"
                  >
                    <Gavel className="w-5 h-5 text-slate-950" />
                    <span>گشایش و افتتاح رسمی جلسه دادرسی</span>
                  </button>
                  <button
                    onClick={() => setActiveStep('initial-report')}
                    className="w-full py-3 text-slate-400 hover:text-slate-600 transition-colors text-xs font-black select-none cursor-pointer"
                  >
                    انصراف و بازگشت به منوی گزارش
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: COURTROLEPLAY INTERACTIVE PANEL (ROLEPLAY) */}
          {activeStep === 'court-roleplay' && (
            <motion.div
              key="court-roleplay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col bg-slate-50 rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-inner min-h-[500px]"
            >
              {/* Active Roleplay Header info */}
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div className="text-right">
                    <span className="text-[10px] text-amber-400 font-black">جلسه فعال • {roleplayStage}</span>
                    <h4 className="text-xs font-black text-white mt-0.5">شما: {roleplayRole}</h4>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowObjectionPanel(true)}
                    className="px-3 py-1.5 bg-red-650/40 hover:bg-red-600/30 text-red-400 border border-red-900/30 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 select-none cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    ثبت اعتراض فنی
                  </button>
                  <button
                    onClick={handleIssueFinalJudgment}
                    disabled={isGenerating}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 select-none cursor-pointer"
                  >
                    <Gavel className="w-3.5 h-3.5" />
                    خاتمه جلسه و صدور رای
                  </button>
                </div>
              </div>

              {/* Chat Message Lists */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar max-h-[400px] min-h-[300px]">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-[1.5rem] p-5 shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-amber-500 text-white rounded-tl-none' 
                        : 'bg-white text-slate-800 rounded-tr-none border border-slate-100'
                    }`}>
                      <div className="markdown-body text-xs leading-relaxed" style={{ color: msg.role === 'user' ? 'white' : '#1e293b' }}>
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-100 rounded-[1.5rem] rounded-tr-none p-5 flex items-center gap-3 text-slate-500 shadow-sm">
                      <Activity className="w-4 h-4 animate-pulse text-amber-500" />
                      <span className="text-[10px] font-bold">ریاست دادگاه در حال مداقه در مستندات و لوایح...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* QUICK OBJECTION DRAWER/MODAL */}
              {showObjectionPanel && (
                <div className="p-4 bg-red-50 border-t border-red-100 space-y-3 animate-in slide-in-from-bottom-10 duration-200">
                  <div className="flex justify-between items-center">
                    <h5 className="text-[10px] font-black text-red-900 uppercase">نوع اعتراض به لوایح/سوالات طرف مقابل را انتخاب کنید:</h5>
                    <button onClick={() => setShowObjectionPanel(false)} className="text-red-900 text-xs font-black p-1 hover:bg-red-100 rounded">بستن ×</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      'اعتراض به سوالات هدایت‌کننده یا تلقینی همکار',
                      'اعتراض به عدم ارتباط سوالات و مدافعات با موضوع اصلی دعوا',
                      'اعتراض به توهین، افترا یا به کاربردن الفاظ خارج از نزاکت همکار',
                      'اعتراض به طرح ادعاهای فاقد سند ابرازی در پرونده',
                      'اعتراض به عدم رعایت ترتیبات آیین دادرسی مدنی/کیفری'
                    ].map((obj, i) => (
                      <button
                        key={i}
                        onClick={() => handleObjection(obj)}
                        className="p-2.5 bg-white border border-red-150 hover:bg-red-50 text-red-800 text-[9px] font-black rounded-lg transition text-right select-none cursor-pointer"
                      >
                        {obj}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Input form area */}
              <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChatMessage();
                    }
                  }}
                  disabled={isChatLoading}
                  placeholder="مدافعات، مستندات قضایی یا لایحه دفاعیه خود را در پاسخ به قاضی مکتوب و ارسال نمایید..."
                  className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-5 py-3 text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white transition-all resize-none h-[70px] shadow-inner"
                />
                <button
                  onClick={() => handleSendChatMessage()}
                  disabled={isChatLoading || !chatInput.trim()}
                  className="w-16 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90 shrink-0 select-none cursor-pointer"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              {/* Objections logged stats panel */}
              {activeObjections.length > 0 && (
                <div className="px-6 py-2 bg-slate-100 text-[9px] text-slate-500 font-bold flex gap-3 items-center border-t border-slate-150">
                  <span>آمار اعتراضات ثبت شده شما در جلسه دادرسی:</span>
                  <div className="flex gap-1.5">
                    {activeObjections.map((ob, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded-md font-black">
                        {idx + 1}. {ob.substring(0, 15)}...
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 6: FINAL JUDGMENT (دادنامه رسمی) */}
          {activeStep === 'final-judgment' && verdictResult && (
            <motion.div
              key="final-judgment"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Back / Reset options */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <button
                  onClick={() => setActiveStep('court-roleplay')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                  برگشت به محیط جلسه دادگاه
                </button>
                <button
                  onClick={() => setActiveStep('initial-report')}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-amber-400 hover:text-amber-300 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                  خروج و بازگشت به منوی گزارش تحلیل
                </button>
              </div>

              {/* COPY AND EXPORT BAR */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleCopyToClipboard(verdictResult)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-500" />
                  {copiedText ? 'کپی شد!' : 'کپی دادنامه در حافظه'}
                </button>
                {selectedCaseId && selectedCaseId !== 'manual' && (
                  <button
                    onClick={() => {
                      try {
                        const newNote: CaseNote = {
                          id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                          caseId: selectedCaseId,
                          title: 'دادنامه نهایی صادر شده شبیه‌ساز',
                          content: verdictResult,
                          createdAt: new Date().toLocaleDateString('fa-IR')
                        };
                        if (onAddNote) {
                          onAddNote(newNote);
                        } else {
                          const currentNotes = JSON.parse(safeStorage.getItem('r_notes') || '[]');
                          if (Array.isArray(currentNotes)) {
                            currentNotes.unshift(newNote);
                            safeStorage.setItem('r_notes', JSON.stringify(currentNotes));
                          }
                        }
                        setSavedToNotes(true);
                        setTimeout(() => setSavedToNotes(false), 3000);
                      } catch (e) { console.error("Failed to save note:", e); }
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {savedToNotes ? 'دادنامه ذخیره شد!' : 'ذخیره در یادداشت‌های پرونده'}
                  </button>
                )}
              </div>

              {/* THE ULTIMATE PERSISTENT PERSISTENT VERDICT RENDERING */}
              <div className="bg-amber-50/20 border border-amber-500/10 rounded-3xl p-6 md:p-8 font-mono space-y-6 shadow-xl text-right max-w-3xl mx-auto relative overflow-hidden">
                <div className="absolute top-4 left-4 w-20 h-20 border-4 border-red-500/10 rounded-full flex items-center justify-center text-[10px] text-red-500/10 font-black tracking-widest select-none rotate-12">
                  جمهوری اسلامی ایران
                </div>

                <div className="text-center font-black text-slate-800 text-sm border-b border-slate-200/50 pb-4">
                  باسمه تعالی <br/>
                  قوه قضائیه جمهوری اسلامی ایران <br/>
                  <span className="text-amber-600 block mt-1.5 font-sans">«دادنامه نهایی دادگاه شبیه‌سازی»</span>
                </div>

                <div className="markdown-body text-xs leading-8 text-justify font-sans text-slate-800 whitespace-pre-line">
                  <ReactMarkdown>{verdictResult}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};
