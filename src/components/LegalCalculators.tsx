import { safeStorage } from "../utils/safeStorage";
import { useState, useEffect } from "react";
import { toPersianDigits, toEnglishDigits, formatPersianCurrency, formatJalaliDate, getCurrentJalali, jalaliToGregorian, getJalaliMonthDays, JALALI_MONTH_NAMES, getJalaliFirstWeekday, adjustDateForHolidays, getPersianDayName } from "../utils/shamsi";
import {
  calculateMehrieh,
  calculateDiyeh,
  calculateCourtFees,
  calculateLawyerFinance,
  calculateJudicialDeadline,
  calculateErth,
  calculateDelayInterest,
  CBI_INFLATION_INDICES,
  DIYEH_RATES
} from "../utils/calculators";
import { Calculator, Award, Calendar, DollarSign, FileText, Printer, CheckCircle2, AlertCircle, Clock, Search, Lock, ChevronDown, Check, Info, ArrowLeft, Plus, Trash2, Globe, RefreshCw, Users, TrendingUp, ChevronLeft, ChevronRight, X } from "lucide-react";
import { numberToPersianWords, persianWordsToNumber, formatThousandsSeparator, persianToEnglishDigits, englishToPersianDigits } from "../utils/numberWordsConverter";

import { INJURY_DATABASE } from "../data/injuryDatabase";

export default function LegalCalculators({ onCalculateDeadline }: { onCalculateDeadline?: (data: any) => void }) {
  const lawyerName = safeStorage.getItem("r_lawyer_name") || "";
  const [activeTab, setActiveTab] = useState<"age" | "mehrieh" | "diyeh" | "court" | "lawyer" | "lawyer_comprehensive" | "deadlines" | "erth" | "delay_interest" | "execution_fees" | "num_to_word" | "financial_assistant">("age");

  // Convert Persian/Arabic digits from input to ASCII numbers
  const parsePersianInput = (str: string): number => {
    if (!str) return 0;
    const english = str.toString().replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString());
    const cleaned = english.replace(/[^0-9]/g, "");
    return cleaned ? parseInt(cleaned) : 0;
  };

  // --- Number/Words Converter States ---
  const [conversionDirection, setConversionDirection] = useState<"toman_to_rial" | "rial_to_toman">("toman_to_rial");
  const [convertInput, setConvertInput] = useState<string>("");
  const [convertResult, setConvertResult] = useState<string>("");
  const [convertResultWords, setConvertResultWords] = useState<string>("");
  const [numToWordResult, setNumToWordResult] = useState<any>(null);

  const handleConvertNumberInput = (val: string) => {
    // Only allow numbers and Persian numbers
    const digits = val.replace(new RegExp("[^0-9۰-۹]", "g"), "");
    if (!digits) {
      setConvertInput("");
      return;
    }
    
    // Auto formatted with slashes as thousands separator
    const formatted = formatThousandsSeparator(digits, true).replace(/,/g, '/');
    setConvertInput(formatted);
  };

  const handleCalculateNumToWord = () => {
    if (!convertInput) return;
    
    // Clean input and get only English digits
    const digitsOnly = convertInput.replace(new RegExp("[^0-9۰-۹]", "g"), "");
    const engDigits = persianToEnglishDigits(digitsOnly);
    
    if (!engDigits) return;

    let result = "";
    let words = "";
    let wordsInput = "";
    
    try {
      if (conversionDirection === "toman_to_rial") {
          // Toman to Rial: Multiply by 10 (Add a zero)
          result = engDigits + "0";
          words = numberToPersianWords(result) + " ریال";
          wordsInput = numberToPersianWords(engDigits) + " تومان";
      } else {
          // Rial to Toman: Divide by 10 (Remove last digit)
          if (engDigits.length <= 1) {
              result = "0";
          } else {
              result = engDigits.slice(0, -1);
          }
          words = numberToPersianWords(result) + " تومان";
          wordsInput = numberToPersianWords(engDigits) + " ریال";
      }
      
      const formattedResult = formatThousandsSeparator(result, true).replace(/,/g, '/');
      
      setConvertResult(formattedResult);
      setConvertResultWords(words);
      setNumToWordResult({
        input: convertInput,
        result: formattedResult,
        words: words,
        wordsInput: wordsInput,
        direction: conversionDirection
      });
    } catch (e) {
      console.error("Conversion error:", e);
      setConvertResult("");
      setConvertResultWords("");
      setNumToWordResult(null);
    }
  };

  const handleConvertWordsInput = (val: string) => {
    setConvertInput(val);
    setConvertResult("");
  };

  const isInputNumeric = (val: string): boolean => {
    if (!val) return false;
    const clean = persianToEnglishDigits(val).replace(new RegExp("[^0-9]", "g"), "");
    return clean.length > 0 && !isNaN(Number(clean));
  };

  // Get current date for defaults
  const today = getCurrentJalali();

  // --- Age States ---
  const [ageSubject, setAgeSubject] = useState<"age" | "difference">("age");
  const [ageBirthYear, setAgeBirthYear] = useState<number>(1375);
  const [ageBirthMonth, setAgeBirthMonth] = useState<number>(4);
  const [ageBirthDay, setAgeBirthDay] = useState<number>(1);
  const [ageEndYear, setAgeEndYear] = useState<number>(today.jy);
  const [ageEndMonth, setAgeEndMonth] = useState<number>(today.jm);
  const [ageEndDay, setAgeEndDay] = useState<number>(today.jd);
  const [ageResult, setAgeResult] = useState<any>({
    test: true,
    totalDays: 10957,
    solar: { years: 29, months: 11, days: 30 },
    lunar: { years: 30, months: 11, days: 1 }
  });
  const [isAgeDropdownOpen, setIsAgeDropdownOpen] = useState<boolean>(false);

  // --- Financial Assistant States ---
  const [finMarketTab, setFinMarketTab] = useState<"currencies" | "gold" | "coins" | "crypto" | "global_domestic">("currencies");
  const [finAmount, setFinAmount] = useState<string>("");
  const [finCurrency, setFinCurrency] = useState<string>("USD");
  const [finRates, setFinRates] = useState<any>({
    currencies: { USD: 650000, EUR: 702000, AED: 177000, TRY: 20000, GBP: 825000 },
    gold: { geram18: 34000000, geram24: 45330000, mesghal: 147200000, abshodeh: 147200000 },
    coins: { sekke: 405000000, bahar: 372000000, nim: 232000000, rob: 152000000, gerami: 6900000, sekke_retail: 409050000, parsian100: 4070000, parsian500: 17800000, parsian1000: 36700000, sekke_bubble: 67000000 },
    crypto: { btc: 64250, eth: 3480, usdt: 651000, sol: 142 },
    global_domestic: { ons_gold: 2331.4, ons_silver: 29.5, brent_oil: 85.2, tedpix: 2085000 }
  });
  const [finLastUpdate, setFinLastUpdate] = useState<string>("۱۴۰۵/۰۴/۰۴ ۱۰:۳۰");
  const [finResult, setFinResult] = useState<any>(null);
  const [isUpdatingRates, setIsUpdatingRates] = useState<boolean>(false);

  const getAssetRate = (assetKey: string, ratesObj: any) => {
    if (!ratesObj) return 1;
    const keyLower = assetKey.toLowerCase();
    const keyUpper = assetKey.toUpperCase();

    // Check currencies
    if (ratesObj.currencies) {
      if (ratesObj.currencies[keyUpper] !== undefined) return ratesObj.currencies[keyUpper];
      if (ratesObj.currencies[keyLower] !== undefined) return ratesObj.currencies[keyLower];
    }
    // Check gold
    if (ratesObj.gold) {
      if (ratesObj.gold[keyLower] !== undefined) return ratesObj.gold[keyLower];
      if (ratesObj.gold[keyUpper] !== undefined) return ratesObj.gold[keyUpper];
    }
    // Check coins
    if (ratesObj.coins) {
      if (ratesObj.coins[keyLower] !== undefined) return ratesObj.coins[keyLower];
      if (ratesObj.coins[keyUpper] !== undefined) return ratesObj.coins[keyUpper];
    }
    // Check cryptos
    if (keyLower === "usdt") {
      return ratesObj.crypto?.usdt || ratesObj.crypto?.USDT || ratesObj.currencies?.USD || ratesObj.currencies?.usd || 650000;
    }
    if (ratesObj.crypto) {
      const cryptoVal = ratesObj.crypto[keyLower] !== undefined ? ratesObj.crypto[keyLower] : ratesObj.crypto[keyUpper];
      if (cryptoVal !== undefined) {
        const usdRate = ratesObj.currencies?.USD || ratesObj.currencies?.usd || 650000;
        return cryptoVal * usdRate;
      }
    }
    return 1;
  };

  const handleUpdateRates = async () => {
    setIsUpdatingRates(true);
    try {
      const now = new Date();
      const formattedTime = now.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
      const jDate = getCurrentJalali();
      const jalaliString = `${jDate.jy}/${String(jDate.jm).padStart(2, "0")}/${String(jDate.jd).padStart(2, "0")} ${formattedTime}`;

      let response: Response | null = null;
      let retries = 3;
      let delay = 1000;
      while (retries > 0) {
        try {
          response = await fetch("/api/currency/rates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientTime: jalaliString })
          });
          if (response.ok) break;
        } catch (fetchErr) {
          console.warn(`Fetch rates failed, retries left: ${retries - 1}`, fetchErr);
        }
        retries--;
        if (retries > 0 && (!response || !response.ok)) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 1.5;
        }
      }

      if (!response || !response.ok) {
        throw new Error("API server is currently unreachable");
      }
      if (response.ok) {
        const data = await response.json();
        if (data && (data.currencies || data.USD)) {
          const updatedRates = data.currencies ? data : {
            currencies: { USD: data.USD || 650000, TRY: data.TRY || 20000, EUR: 702000, AED: 177000, GBP: 825000 },
            gold: { geram18: 34000000, geram24: 45330000, mesghal: 147200000, abshodeh: 147200000 },
            coins: { sekke: 405000000, bahar: 372000000, nim: 232000000, rob: 152000000, gerami: 6900000, sekke_retail: 409050000, parsian100: 4070000, parsian500: 17800000, parsian1000: 36700000, sekke_bubble: 67000000 },
            crypto: { btc: 64250, eth: 3480, usdt: data.USD || 650000, sol: 142 },
            global_domestic: { ons_gold: 2331.4, ons_silver: 29.5, brent_oil: 85.2, tedpix: 2085000 }
          };
          setFinRates(updatedRates);
          setFinLastUpdate(data.date || jalaliString);
          
          if (finAmount) {
            const amountStr = persianToEnglishDigits(finAmount.replace(/[^\d۰-۹]/g, ""));
            const amount = Number(amountStr);
            if (amount) {
              const rate = getAssetRate(finCurrency, updatedRates);
              const irr = finCurrency === "IRR" ? amount : amount * rate;
              const toman = Math.floor(irr / 10);
              setFinResult({
                amount,
                currency: finCurrency,
                irr,
                toman,
                wordsIrr: numberToPersianWords(irr.toString()) + " ریال",
                wordsToman: numberToPersianWords(toman.toString()) + " تومان",
                rateUsed: rate
              });
            }
          }
        }
      }
    } catch (e) {
      console.log("Unable to update rates:", e);
    } finally {
      setIsUpdatingRates(false);
    }
  };

  useEffect(() => {
    handleUpdateRates();
  }, []);

  const calculateFinancial = (val: string, curr: string) => {
    let targetCurr = curr;
    const lowerVal = val.toLowerCase();
    if (lowerVal.includes("usd") || lowerVal.includes("دلار")) targetCurr = "USD";
    else if (lowerVal.includes("try") || lowerVal.includes("لیر")) targetCurr = "TRY";
    else if (lowerVal.includes("eur") || lowerVal.includes("یورو")) targetCurr = "EUR";
    else if (lowerVal.includes("irr") || lowerVal.includes("ریال")) targetCurr = "IRR";

    const amountStr = persianToEnglishDigits(val.replace(/[^\d۰-۹]/g, ""));
    const amount = Number(amountStr);
    if (!amount) {
      setFinResult(null);
      return;
    }

    const rate = getAssetRate(targetCurr, finRates);
    const irr = targetCurr === "IRR" ? amount : amount * rate;
    const toman = Math.floor(irr / 10);

    setFinResult({
      amount,
      currency: targetCurr,
      irr,
      toman,
      wordsIrr: numberToPersianWords(irr.toString()) + " ریال",
      wordsToman: numberToPersianWords(toman.toString()) + " تومان",
      rateUsed: rate
    });
    setFinCurrency(targetCurr);
  };

  // --- Judicial Deadline States ---
  const [judicialDaysInput, setJudicialDaysInput] = useState<string>("");
  const [judicialResult, setJudicialResult] = useState<any>(null);
  const [deadlineView, setDeadlineView] = useState<'form' | 'result'>('form');
  const [isAgeCalendarOpen, setIsAgeCalendarOpen] = useState<boolean>(false);
  const [isAgeEndCalendarOpen, setIsAgeEndCalendarOpen] = useState<boolean>(false);

  const handleClearDeadline = () => {
    setDeadlineBaseYear(today.jy);
    setDeadlineBaseMonth(today.jm);
    setDeadlineBaseDay(today.jd);
    setDeadlineType(civilDeadlines[0].title);
    setDeadlineResult(null);
    setJudicialDaysInput("");
    setJudicialResult(null);
    setDeadlineView('form');
  };

  const handleCalculateAge = () => {
    const startY = Number(ageBirthYear);
    const startM = Number(ageBirthMonth);
    const startD = Number(ageBirthDay);

    const endY = ageSubject === "difference" ? Number(ageEndYear) : today.jy;
    const endM = ageSubject === "difference" ? Number(ageEndMonth) : today.jm;
    const endD = ageSubject === "difference" ? Number(ageEndDay) : today.jd;

    const gBirth = jalaliToGregorian(startY, startM, startD);
    const gEnd = jalaliToGregorian(endY, endM, endD);

    let dBirth = new Date(Date.UTC(gBirth.gy, gBirth.gm - 1, gBirth.gd));
    let dEnd = new Date(Date.UTC(gEnd.gy, gEnd.gm - 1, gEnd.gd));

    let isNegative = false;
    if (dEnd.getTime() < dBirth.getTime()) {
      // Swap dates for calculation so diff is positive, and track that it's a backward difference
      const tempDate = dBirth;
      dBirth = dEnd;
      dEnd = tempDate;
      isNegative = true;
    }

    const diffTime = dEnd.getTime() - dBirth.getTime();
    const totalDays = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));

    // Solar calculation based on swapped/positive dates
    let calcEndYear = isNegative ? startY : endY;
    let calcEndMonth = isNegative ? startM : endM;
    let calcEndDay = isNegative ? startD : endD;

    let calcStartYear = isNegative ? endY : startY;
    let calcStartMonth = isNegative ? endM : startM;
    let calcStartDay = isNegative ? endD : startD;

    let years = calcEndYear - calcStartYear;
    let months = calcEndMonth - calcStartMonth;
    let days = calcEndDay - calcStartDay;

    if (days < 0) {
      months -= 1;
      let prevMonth = calcEndMonth - 1;
      let prevYear = calcEndYear;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear -= 1;
      }
      days += getJalaliMonthDays(prevYear, prevMonth);
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    // Lunar mapping
    const lunarYears = Math.floor(totalDays / 354.3672);
    const remainingDays = totalDays - (lunarYears * 354.3672);
    const lunarMonths = Math.floor(remainingDays / 29.53059);
    // Smooth transition offset that correctly aligns solar-lunar boundary transitions (including astronomical borrows) for larger ages
    const offset = totalDays > 30 ? 0.55 : 0;
    const lunarDays = Math.round(remainingDays - (lunarMonths * 29.53059) + offset);

    setAgeResult({
      test: true,
      totalDays,
      isNegative,
      solar: { years, months, days },
      lunar: { years: lunarYears, months: lunarMonths, days: lunarDays }
    });
  };

  // --- Mehrieh States ---
  const [mehriehTab, setMehriehTab] = useState<"cash" | "coin">("cash");
  const [mehriehAmount, setMehriehAmount] = useState<string>("۱۰۰۰۰۰۰۰"); // 10,000,000 Rial default
  const [marriageYear, setMarriageYear] = useState<number | string>(1380);
  const [paymentYear, setPaymentYear] = useState<number | string>(today.jy);
  
  const [mehriehCoinCount, setMehriehCoinCount] = useState<string>("۱۰۰");
  const [mehriehCoinType, setMehriehCoinType] = useState<string>("sekke");
  
  const [mehriehResult, setMehriehResult] = useState<any>(null);

  // --- Diyeh States ---
  const [diyehYear, setDiyehYear] = useState<number | string>(1405);
  const [diyehMonth, setDiyehMonth] = useState<number>(today.jm);
  const [diyehDay, setDiyehDay] = useState<number | string>(today.jd);
  const [diyehFraction, setDiyehFraction] = useState<string>("1"); // Complete Diyeh
  const [diyehCustomFraction, setDiyehCustomFraction] = useState<string>("0");
  const [isSacredMonth, setIsSacredMonth] = useState<boolean>(false);
  const [diyehResult, setDiyehResult] = useState<any>(null);

  // New beautiful UI matching states for Screen 1 and Screen 2
  const [diyehPercentInput, setDiyehPercentInput] = useState<string>("۱۰۰");
  const [selectedMethod, setSelectedMethod] = useState<string>("درصدی");
  const [isMethodModalOpen, setIsMethodModalOpen] = useState<boolean>(false);
  const [diyehSearchQuery, setDiyehSearchQuery] = useState<string>("");
  const [premiumModalOpen, setPremiumModalOpen] = useState<boolean>(false);
  const [premiumModalTitle, setPremiumModalTitle] = useState<string>("");

  // New calculation methods states
  const [diyehFractionNumerator, setDiyehFractionNumerator] = useState<string>("۱");
  const [diyehFractionDenominator, setDiyehFractionDenominator] = useState<string>("۲");
  const [fractionInputs, setFractionInputs] = useState<string[]>(["", ""]);
  const [activeFractionIndex, setActiveFractionIndex] = useState<number | null>(null);
  const [murderType, setMurderType] = useState<string>("man");
  const [murderCount, setMurderCount] = useState<string>("۱");
  const [fetusSelection, setFetusSelection] = useState<string>("j1");
  const [corpseSelection, setCorpseSelection] = useState<string>("d1");
  const [corpseLivingPercentage, setCorpseLivingPercentage] = useState<string>("۱۰");
  const [selectedInjuries, setSelectedInjuries] = useState<any[]>([]);
  const [injurySearchText, setInjurySearchText] = useState<string>("");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>("فصل اول: جراحات سر و صورت (ماده ۷۰۹)");

  // --- Court Fee States ---
  const [claimAmountForCourt, setClaimAmountForCourt] = useState<string>("۵۰۰۰۰۰۰۰۰"); // 500 Million Rial
  const [courtStage, setCourtStage] = useState<"first_instance" | "appeal" | "supreme_court" | "non_financial">("first_instance");
  const [courtResult, setCourtResult] = useState<any>(null);

  // --- Lawyer States ---
  const [lawyerSubject, setLawyerSubject] = useState<"fee" | "tax_stamp_bar" | "tax_stamp_center">("fee");
  const [lawyerTaxBasis, setLawyerTaxBasis] = useState<"tariff" | "fee_amount" | "tax_stamp_amount">("tariff");
  const [lawyerCaseType, setLawyerCaseType] = useState<string>("financial");
  const [lawyerResultType, setLawyerResultType] = useState<string>("-");
  const [lawyerHasSpecialty, setLawyerHasSpecialty] = useState<boolean>(false);
  const [lawyerInsideProvinceDays, setLawyerInsideProvinceDays] = useState<string>("");
  const [lawyerOutsideProvinceDays, setLawyerOutsideProvinceDays] = useState<string>("");
  const [lawyerAfterAnnulment, setLawyerAfterAnnulment] = useState<boolean>(false);
  const [lawyerFreeAid, setLawyerFreeAid] = useState<boolean>(false);
  const [lawyerClaimAmount, setLawyerClaimAmount] = useState<string>("۲,۵۰۰,۰۰۰,۰۰۰");
  const [lawyerResult, setLawyerResult] = useState<any>(null);

  // --- Comprehensive Lawyer & Court States ---
  const [compClaimAmount, setCompClaimAmount] = useState<string>("");
  const [compStage, setCompStage] = useState<"first_instance" | "appeal">("first_instance");
  const [compHasSpecialty, setCompHasSpecialty] = useState<boolean>(false);
  const [compIsFinancial, setCompIsFinancial] = useState<boolean>(true);
  const [compResult, setCompResult] = useState<any>(null);

  // Helper to format string inputs like a numeric currency with Persian digits
  const handleAmountFormat = (val: string, setter: (val: string) => void) => {
    const digits = val.replace(/[^0-9۰-۹]/g, "");
    if (!digits) {
      setter("");
      return;
    }
    const englishDigits = digits.replace(/[۰-۹]/g, c => "۰۱۲۳۴۵۶۷۸۹".indexOf(c).toString());
    const withCommas = Number(englishDigits).toLocaleString("en-US");
    setter(toPersianDigits(withCommas));
  };

  // --- Judicial Deadlines States ---
  const [deadlineCategory, setDeadlineCategory] = useState<"civil" | "criminal" | "execution">("civil");
  const [deadlineBaseYear, setDeadlineBaseYear] = useState<number | string>(today.jy);
  const [deadlineBaseMonth, setDeadlineBaseMonth] = useState<number>(today.jm);
  const [deadlineBaseDay, setDeadlineBaseDay] = useState<number | string>(today.jd);
  const civilDeadlines = [
    { title: "فاصله ابلاغ تا جلسه رسیدگی", days: 5, article: "ماده ۶۴ ق.آ.د.م", lawText: "فاصله بین ابلاغ دادخواست و وقت جلسه نباید کمتر از پنج روز باشد." },
    { title: "رفع نقص دادخواست", days: 10, article: "ماده ۵۴ ق.آ.د.م", lawText: "مدیر دفتر دادگاه ظرف دو روز نقایص دادخواست را به خواهان اطلاع داده و از تاریخ ابلاغ، ده روز به او مهلت می‌دهد تا نقایص را رفع نماید." },
    { title: "اعتراض به قرار رد دادخواست", days: 10, article: "تبصره ماده ۵۴ و ماده ۵۳ ق.آ.د.م", lawText: "قرار رد دادخواست ظرف ده روز از تاریخ ابلاغ قابل اعتراض در همان دادگاه می‌باشد." },
    { title: "تبادل لوایح", days: 10, article: "ماده ۳۴۶ ق.آ.د.م", lawText: "مدیر دفتر دادگاه بدوی ظرف دو روز از تاریخ وصول دادخواست تجدیدنظر، یک نسخه از آن را برای طرف دیگر دعوا ارسال می‌دارد تا ظرف ده روز پاسخ خود را تسلیم نماید." },
    { title: "توقف دادرسی در صورت استعفای وکیل", days: 30, article: "ماده ۴۳ ق.آ.د.م", lawText: "در صورت استعفای وکیل، دادرسی حداکثر به مدت یک ماه برای تعیین وکیل جدید یا حضور موکل توقف می‌یابد." },
    { title: "فاصله ابلاغ به گواه و جلسه رسیدگی", days: 7, article: "ماده ۲۴۲ ق.آ.د.م", lawText: "فاصله بین ابلاغ احضاریه به گواه و روز جلسه رسیدگی نباید کمتر از هفت روز باشد." },
    { title: "ایداع دستمزد کارشناس", days: 7, article: "ماده ۲۵۹ ق.آ.د.م", lawText: "ایداع دستمزد کارشناس ظرف یک هفته از تاریخ ابلاغ اخطاریه می‌باشد." },
    { title: "اعتراض به نظر کارشناس", days: 7, article: "ماده ۲۶۰ ق.آ.د.م", lawText: "طرفین دعوا می‌توانند ظرف یک هفته از تاریخ ابلاغ، به نظریه کارشناس اعتراض نمایند." },
    { title: "تسلیم سند موضوع ادعای جعل", days: 10, article: "ماده ۲۲۰ ق.آ.د.م", lawText: "مدعی جعل مکلف است ظرف ده روز از تاریخ ادعا، اصل سند را به دفتر دادگاه تسلیم نماید." },
    { title: "مطالبه خسارت ناشی از اجرای قرار تامین", days: 20, article: "ماده ۱۲۰ ق.آ.د.م", lawText: "درخواست مطالبه خسارت ناشی از اجرای قرار تامین خواسته ظرف بیست روز از تاریخ ابلاغ حکم قطعی مبنی بر بی‌حقی خواهان می‌باشد." },
    { title: "طرح دعوا پس از صدور قرار اناطه", days: 30, article: "ماده ۱۹ ق.آ.د.م", lawText: "ذینفع مکلف است ظرف یک ماه از تاریخ ابلاغ قرار اناطه، در دادگاه صالح اقامه دعوا کرده و گواهی آن را تسلیم نماید." },
    { title: "دادخواست ادعای مالکیت مورد حکم تصرف عدوانی", days: 30, article: "ماده ۱۷۵ ق.آ.د.م", lawText: "درخواست تجدیدنظر در مورد حکم رفع تصرف عدوانی مانع اجرا نیست مگر در صورت ادعای مالکیت که مهلت آن یک ماه است." },
    { title: "انشاء و اعلام رأی", days: 7, article: "ماده ۲۹۵ ق.آ.د.م", lawText: "دادگاه پس از اعلام ختم دادرسی، در صورت امکان در همان جلسه وگرنه حداکثر ظرف یک هفته رای صادر می‌کند." },
    { title: "پاکنویس و امضای رأی", days: 5, article: "ماده ۲۹۶ ق.آ.د.م", lawText: "رای دادگاه باید ظرف پنج روز از تاریخ صدور، پاکنویس شده و به امضای دادرس و مدیر دفتر برسد." },
    { title: "درخواست جلب شخص ثالث", days: 3, article: "ماده ۱۳۵ ق.آ.د.م", lawText: "هریک از اصحاب دعوا که جلب شخص ثالث را لازم بداند، باید تا پایان اولین جلسه دادرسی جهات آن را اعلام و ظرف سه روز دادخواست تقدیم کند." },
    { title: "اعتراض ثالث اصلی", days: 0, article: "ماده ۴۲۲ ق.آ.د.م", lawText: "اعتراض شخص ثالث قبل از اجرای حکم قطعی محدود به زمان نیست." },
    { title: "اعتراض ثالث تبعی", days: 0, article: "ماده ۴۲۱ ق.آ.د.م", lawText: "اعتراض شخص ثالث تبعی در جریان دادرسی پرونده مطروحه." },
    { title: "واخواهی", days: 20, article: "ماده ۳۰۶ ق.آ.د.م", lawText: "مهلت واخواهی از احکام غیابی برای کسانی که مقیم ایران می‌باشند بیست روز از تاریخ ابلاغ واقعی است." },
    { title: "تجدیدنظرخواهی", days: 20, article: "ماده ۳۳۶ ق.آ.د.م", lawText: "مهلت درخواست تجدیدنظر اصحاب دعوا، برای اشخاص مقیم ایران بیست روز از تاریخ ابلاغ یا انقضای مدت واخواهی است." },
    { title: "واخواهی + تجدیدنظر", days: 40, article: "مواد ۳۰۶ و ۳۳۶ ق.آ.د.م", lawText: "مجموع مهلت واخواهی (۲۰ روز) و تجدیدنظرخواهی (۲۰ روز) برای احکام غیابی قابل تجدیدنظر." },
    { title: "فرجام خواهی اصلی", days: 20, article: "ماده ۳۹۷ ق.آ.د.م", lawText: "مهلت درخواست فرجام‌خواهی برای اشخاص مقیم ایران بیست روز از تاریخ ابلاغ رای قابل فرجام است." },
    { title: "تجدیدنظر + فرجام‌خواهی", days: 40, article: "مواد ۳۳۶ و ۳۹۷ ق.آ.د.م", lawText: "مجموع مهلت تجدیدنظرخواهی (۲۰ روز) و فرجام‌خواهی (۲۰ روز)." },
    { title: "فرجام تبعی", days: 20, article: "ماده ۴۱۳ ق.آ.د.م", lawText: "فرجام تبعی را می‌توان ضمن لایحه پاسخ به فرجام اصلی ظرف ۲۰ روز مطرح کرد." },
    { title: "اعاده دادرسی", days: 20, article: "مواد ۴۲۷ و ۴۳۰ ق.آ.د.م", lawText: "مهلت درخواست اعاده دادرسی برای اشخاص مقیم ایران بیست روز از تاریخ ابلاغ حکم قطعی است." },
    { title: "اعاده دادرسی طاری", days: 3, article: "ماده ۴۳۲ ق.آ.د.م", lawText: "در اعاده دادرسی طاری، درخواست باید ظرف سه روز به دادگاهی که حکم در آنجا به عنوان دلیل ابراز شده تقدیم گردد." },
    { title: "معرفی یا اظهارنظر در مورد داور", days: 10, article: "مواد ۴۵۹ و ۴۶۰ ق.آ.د.م", lawText: "مهلت معرفی داور یا اظهارنظر درباره داور طرف مقابل ده روز از تاریخ ابلاغ اخطاریه است." },
    { title: "داوری", days: 90, article: "تبصره ماده ۴۸۴ ق.آ.د.م", lawText: "در صورتی که مدت داوری تعیین نشده باشد، مدت آن سه ماه است." },
    { title: "تصحیح رأی داور", days: 20, article: "ماده ۴۸۷ ق.آ.د.م", lawText: "درخواست تصحیح رای داور ظرف بیست روز از تاریخ ابلاغ رای داوری مقدور است." },
    { title: "اجرای رأی داور", days: 20, article: "ماده ۴۸۸ ق.آ.د.م", lawText: "محکوم‌علیه رای داور مکلف است ظرف بیست روز از تاریخ ابلاغ، نسبت به اجرای آن اقدام نماید." },
    { title: "درخواست ابطال رأی داور", days: 20, article: "ماده ۴۹۰ ق.آ.د.م", lawText: "درخواست ابطال رای داوری برای اشخاص مقیم ایران ظرف بیست روز از تاریخ ابلاغ رای داور است." }
  ];

  const criminalDeadlines = [
    { title: "استفاده از تخفیف جزای نقدی", days: 10, article: "تبصره ۳ م ۵۲۹ / م ۴۴۲ ق.آ.د.ک", lawText: "در صورت اسقاط حق تجدیدنظرخواهی یا تسلیم به رای، دادگاه می‌تواند تا یک چهارم مجازات حبس یا جزای نقدی را تخفیف دهد." },
    { title: "اعلام تصمیم درباره اجرای حکم", days: 0, article: "مواد ۴۸۹، ۴۹۶ یا ۵۰۲ ق.آ.د.ک", lawText: "اعلام تصمیم مرجع قضایی درباره نحوه و زمان اجرای حکم." },
    { title: "اعلام اجرای حکم سلب حیات", days: 2, article: "ماده ۴۸۴ ق.آ.د.ک", lawText: "زمان اجرای حکم سلب حیات باید حداقل ۴۸ ساعت قبل به وکیل و خانواده اطلاع داده شود." },
    { title: "پیشنهاد کاهش مدت تعلیق", days: 0, article: "ماده ۵۵۲ ق.آ.د.ک", lawText: "در صورت رعایت شرایط تعلیق، قاضی اجرای احکام می‌تواند پیشنهاد کاهش مدت تعلیق را به دادگاه بدهد." },
    { title: "اعتراض به قرار تأمینی شخص حقوقی", days: 10, article: "ماده ۶۹۰ ق.آ.د.ک", lawText: "قرار تامین خواسته یا قرار نظارت قضایی علیه شخص حقوقی ظرف ده روز قابل اعتراض است." },
    { title: "واخواهی + تجدیدنظر یا فرجام", days: 40, article: "مواد ۴۰۶، ۴۲۷ و ۴۲۸ ق.آ.د.ک", lawText: "مجموع مهلت واخواهی و تجدیدنظرخواهی در امور کیفری." },
    { title: "اعتراض به قرار رد ایراد رد دادرس", days: 10, article: "ماده ۴۷ ق.آ.د.ک / ماده ۹۲ ق.آ.د.م", lawText: "قرار رد ایراد رد دادرس ظرف ده روز قابل اعتراض در دادگاه هم‌عرض است." },
    { title: "تجدیدنظر یا فرجام", days: 20, article: "مواد ۴۲۷ و ۴۲۸ ق.آ.د.ک", lawText: "مهلت اعتراض به آراء کیفری برای اشخاص مقیم ایران بیست روز از تاریخ ابلاغ رای است." },
    { title: "رفع نقص دادخواست تجدیدنظر/فرجام", days: 10, article: "ماده ۳۵۰ ق.آ.د.م / ماده ۴۳۹ ق.آ.د.ک", lawText: "مهلت رفع نقص از دادخواست تجدیدنظر یا فرجام ده روز از تاریخ ابلاغ اخطاریه دفتر است." },
    { title: "صدور رأی در دادگاه تجدیدنظر", days: 7, article: "ماده ۴۵۵ ق.آ.د.ک", lawText: "دادگاه تجدیدنظر پس از اعلام ختم رسیدگی ظرف یک هفته اقدام به صدور رای می‌نماید." },
    { title: "اعتراض به رأی غیابی دادگاه تجدیدنظر", days: 20, article: "ماده ۴۰۶ ق.آ.د.ک", lawText: "رای غیابی دادگاه تجدیدنظر ظرف بیست روز از تاریخ ابلاغ واقعی قابل واخواهی است." },
    { title: "درخواست انتشار حکم برائت", days: 30, article: "ماده ۵۱۲ ق.آ.د.ک", lawText: "در صورت صدور حکم برائت قطعی، ذینفع می‌تواند ظرف ۳۰ روز درخواست انتشار آن را بدهد." },
    { title: "انتخاب وکیل در جرایم مهم", days: 10, article: "مواد ۳۰۲، ۳۴۸ و ۳۸۴ ق.آ.د.ک", lawText: "در جرایم با مجازات‌های سنگین، متهم باید ظرف ده روز نسبت به معرفی وکیل اقدام نماید." },
    { title: "تسلیم ایرادها و اعتراض‌ها (کیفری یک)", days: 10, article: "مواد ۳۸۷ و ۳۸۸ ق.آ.د.ک", lawText: "طرفین پرونده در دادگاه کیفری یک می‌توانند ظرف ده روز از تاریخ ابلاغ، ایرادها و اعتراض‌های خود را تسلیم کنند." },
    { title: "تهیه گزارش مبسوط پرونده", days: 0, article: "ماده ۳۸۹ ق.آ.د.ک", lawText: "گزارش مبسوط از وضعیت پرونده جهت طرح در جلسه مقدماتی دادگاه کیفری یک." },
    { title: "صدور رأی در دادگاه کیفری یک", days: 7, article: "مواد ۳۸۲ تا ۴۰۴ ق.آ.د.ک", lawText: "دادگاه کیفری یک پس از پایان دادرسی ظرف یک هفته رای صادر می‌کند." },
    { title: "واخواهی", days: 20, article: "ماده ۴۰۶ ق.آ.د.ک", lawText: "مهلت واخواهی از احکام غیابی کیفری برای اشخاص مقیم ایران بیست روز از تاریخ ابلاغ واقعی است." },
    { title: "بررسی پرونده پس از ارجاع به دادگاه", days: 0, article: "مواد ۳۴۰، ۳۸۶ و ۳۸۷ ق.آ.د.ک", lawText: "مرحله بررسی اولیه پرونده توسط دادرس دادگاه پس از وصول از دادسرا." },
    { title: "فاصله ابلاغ و جلسه رسیدگی", days: 7, article: "ماده ۳۴۳ ق.آ.د.ک / ماده ۶۴ ق.آ.د.م", lawText: "فاصله بین ابلاغ احضاریه و وقت جلسه رسیدگی در امور کیفری نباید کمتر از هفت روز باشد." },
    { title: "فاصله انتشار آگهی تا روز رسیدگی", days: 30, article: "ماده ۳۴۴ ق.آ.د.ک / ماده ۷۳ ق.آ.د.م", lawText: "در موارد ابلاغ از طریق آگهی، فاصله انتشار تا روز جلسه نباید کمتر از یک ماه باشد." },
    { title: "انشای رأی", days: 7, article: "ماده ۳۷۴ ق.آ.د.ک / ماده ۲۹۵ ق.آ.د.م", lawText: "دادگاه کیفری پس از اعلام ختم دادرسی، حداکثر ظرف یک هفته اقدام به انشای رای می‌کند." },
    { title: "پاکنویس یا تایپ رأی", days: 3, article: "ماده ۳۷۸ ق.آ.د.ک / ماده ۲۹۷ ق.آ.د.م", lawText: "رای دادگاه کیفری باید ظرف سه روز از تاریخ صدور، پاکنویس و امضا شود." },
    { title: "اعتراض به رد درخواست جبران خسارت", days: 20, article: "ماده ۲۶۰ ق.آ.د.ک", lawText: "اعتراض به تصمیم کمیسیون استانی جبران خسارت ایام بازداشت ظرف بیست روز قابل طرح است." },
    { title: "اظهارنظر بازپرس پس از پایان تحقیقات", days: 3, article: "ماده ۲۶۲ ق.آ.د.ک", lawText: "بازپرس مکلف است ظرف سه روز از پایان تحقیقات، درباره اتهام اظهارنظر کند." },
    { title: "اظهارنظر دادستان در مورد قرار بازپرس", days: 3, article: "ماده ۲۶۵ ق.آ.د.ک", lawText: "دادستان باید ظرف سه روز از وصول پرونده، نظر خود را درباره قرار بازپرس اعلام کند." },
    { title: "صدور کیفرخواست", days: 2, article: "ماده ۲۶۸ ق.آ.د.ک", lawText: "در صورت موافقت دادستان با جلب به دادرسی، کیفرخواست ظرف دو روز صادر می‌شود." },
    { title: "اعتراض به قرارهای قابل اعتراض بازپرس", days: 10, article: "ماده ۲۷۰ ق.آ.د.ک", lawText: "قرارهای بازپرس در موارد مقرر قانونی، ظرف ده روز از تاریخ ابلاغ قابل اعتراض در دادگاه صالح است." },
    { title: "اظهارنظر در فک یا تبدیل قرار بازداشت", days: 10, article: "ماده ۲۴۲ ق.آ.د.ک", lawText: "بازپرس مکلف است هر ماه ضرورت ابقاء قرار بازداشت موقت را بررسی و اظهارنظر کند." },
    { title: "اعتراض به رد فک/تبدیل بازداشت", days: 10, article: "ماده ۲۴۲ ق.آ.د.ک", lawText: "اعتراض به تصمیم بازپرس مبنی بر ابقاء قرار بازداشت ظرف ده روز قابل طرح است." },
    { title: "اعتراض به ابقاء قرار بازداشت موقت", days: 10, article: "مواد ۲۴۲ یا ۲۴۶ ق.آ.د.ک", lawText: "اعتراض به ادامه بازداشت موقت متهم در دادگاه صالح." },
    { title: "اعتراض به قرار نظارت قضایی", days: 10, article: "تبصره ۲ ماده ۲۴۷ ق.آ.د.ک", lawText: "اعتراض به قرار نظارت قضایی بازپرس ظرف ده روز از تاریخ ابلاغ مقدور است." },
    { title: "درخواست جبران خسارت از کمیسیون", days: 180, article: "مواد ۲۵۷ و ۲۵۸ ق.آ.د.ک", lawText: "مهلت درخواست جبران خسارت ایام بازداشت بی‌گناهی، شش ماه از تاریخ ابلاغ رای قطعی برائت است." },
    { title: "اعتراض به قرار منتهی به بازداشت", days: 10, article: "تبصره ماده ۲۲۶ ق.آ.د.ک", lawText: "اعتراض به قرارهای تامین منتهی به بازداشت متهم ظرف ده روز از تاریخ ابلاغ ممکن است." },
    { title: "اعتراض به اخذ وجه‌الکفاله/ضبط وثیقه", days: 10, article: "ماده ۲۳۵ ق.آ.د.ک", lawText: "اعتراض به دستور دادستان مبنی بر ضبط وثیقه یا اخذ وجه‌الکفاله ظرف ده روز قابل طرح در دادگاه است." },
    { title: "تحویل متهم توسط کفیل یا وثیقه‌گذار", days: 0, article: "ماده ۲۲۸ ق.آ.د.ک", lawText: "کفیل یا وثیقه‌گذار می‌تواند در هر مرحله با معرفی و تحویل متهم، رفع مسئولیت خود را بخواهد." },
    { title: "واریز وجه قرار تأمین به صندوق دولت", days: 30, article: "مواد ۲۳۰ و ۲۳۶ ق.آ.د.ک", lawText: "مهلت واریز وجه پس از ابلاغ واقعی اخطاریه به کفیل یا وثیقه‌گذار یک ماه است." },
    { title: "حل اختلاف بازپرس و دادستان در بازداشت", days: 0, article: "ماده ۲۴۴ ق.آ.د.ک", lawText: "در صورت اختلاف نظر بین بازپرس و دادستان در مورد بازداشت، حل اختلاف با دادگاه است." },
    { title: "تقدیم دادخواست ضرر و زیان", days: 0, article: "قسمت اخیر ماده ۸۶ ق.آ.د.ک", lawText: "شاکی می‌تواند تا قبل از اعلام ختم دادرسی، دادخواست ضرر و زیان خود را به دادگاه تسلیم کند." },
    { title: "اعتراض به رد درخواست دسترسی به پرونده", days: 3, article: "تبصره ۱ م ۱۰۰ / م ۱۹۱ ق.آ.د.ک", lawText: "اعتراض به تصمیم بازپرس مبنی بر عدم دسترسی به پرونده ظرف سه روز قابل طرح در دادگاه است." }
  ];

  const executionDeadlines = [
    { title: "اجرای حکم غیابی پس از انجام آگهی", days: 30, article: "ماده ۴۴ ق.ا.ا.م", lawText: "چنانچه محکوم‌علیه غایب باشد، اجرای حکم پس از انجام آگهی صورت می‌گیرد." },
    { title: "اجرای مفاد اجرائیه", days: 10, article: "ماده ۳۴ ق.ا.ا.م", lawText: "محکوم‌علیه مکلف است ظرف ده روز از تاریخ ابلاغ اجراییه، مفاد آن را به موقع اجرا بگذارد یا مالی معرفی کند." },
    { title: "پرداخت بدهی پس از تمکن", days: 10, article: "قانون اجرای احکام مدنی", lawText: "محکوم‌علیه مکلف است پس از رفع عسرت و تمکن، ظرف ده روز بدهی خود را بپردازد." },
    { title: "تسلیم قرار تاخیر اجرای حکم", days: 0, article: "قانون اجرای احکام مدنی", lawText: "ارائه و تسلیم قرار تاخیر اجرای حکم صادر شده از مرجع ذی‌صلاح." },
    { title: "شکایت نسبت به صورت برداری اموال منقول", days: 7, article: "قانون اجرای احکام مدنی", lawText: "شکایت از اقدامات دادورز در خصوص صورت‌برداری اموال." },
    { title: "اعتراض به نظریه ارزیاب اموال منقول", days: 3, article: "ماده ۷۳ ق.ا.ا.م", lawText: "طرفین می‌توانند ظرف سه روز از تاریخ ابلاغ نظریه ارزیاب، به آن اعتراض نمایند." },
    { title: "پرداخت حق الزحمه ارزیاب اموال منقول", days: 3, article: "ماده ۷۶ ق.ا.ا.م", lawText: "حق‌الزحمه ارزیاب باید در مهلت مقرر پرداخت گردد." },
    { title: "پرداخت اجرت حافظ اموال منقول", days: 0, article: "قانون اجرای احکام مدنی", lawText: "پرداخت اجرت حافظ اموال توقیف شده." },
    { title: "انکار وجود تمام یا قسمتی از مال یا طلب یا اجور و عواید محکوم علیه نزد ثالث", days: 10, article: "ماده ۸۹ ق.ا.ا.م", lawText: "شخص ثالث باید ظرف ده روز از تاریخ ابلاغ، مراتب انکار خود را به قسمت اجرا اطلاع دهد." },
    { title: "شکایت نسبت به تنظیم صورت اموال غیرمنقول", days: 7, article: "ماده ۱۴۲ ق.ا.ا.م", lawText: "شکایت نسبت به تنظیم صورت اموال ظرف یک هفته مسموع است." },
    { title: "موعد فروش اموال منقول (حداقل)", days: 10, article: "ماده ۱۱۹ ق.ا.ا.م", lawText: "موعد فروش باید طوری معین شود که فاصله بین انتشار آگهی و روز فروش کمتر از ده روز نباشد." },
    { title: "موعد فروش اموال منقول (حداکثر)", days: 30, article: "ماده ۱۱۹ ق.ا.ا.م", lawText: "موعد فروش باید طوری معین شود که فاصله بین انتشار آگهی و روز فروش بیشتر از یک ماه نباشد." },
    { title: "شکایت راجع به تخلف از مقررات مزایده", days: 7, article: "ماده ۱۴۲ ق.ا.ا.م", lawText: "شکایت راجع به تخلف از مقررات مزایده ظرف یک هفته از تاریخ وقوع آن مسموع است." },
    { title: "شکایت راجع به تنظیم صورت ملک و ارزیابی آن و تخلف از مقررات مزایده و سایر اقدامات دادورز", days: 7, article: "ماده ۱۴۲ ق.ا.ا.م", lawText: "شکایت راجع به اقدامات دادورز ظرف یک هفته از تاریخ وقوع مسموع است." },
    { title: "جلوگیری از انتقال ملک مالک به محکوم له", days: 60, article: "ماده ۱۴۳ ق.ا.ا.م", lawText: "مالک می‌تواند ظرف دو ماه با پرداخت محکوم‌به و هزینه‌های اجرایی از انتقال ملک جلوگیری کند." },
    { title: "شکایت طلبکاران نسبت به ترتیب تقسیم", days: 7, article: "ماده ۱۷۱ ق.ا.ا.م", lawText: "طلبکاران می‌توانند ظرف یک هفته از تاریخ اخطار نسبت به ترتیب تقسیم شکایت کنند." },
    { title: "پرداخت حق اجرا", days: 10, article: "ماده ۱۶۰ ق.ا.ا.م", lawText: "حق اجرای احکام مدنی باید مطابق مقررات پرداخت شود." },
    { title: "پژوهش از قرار رد تقاضای اجرای احکام و اسناد لازم الاجرای کشورهای خارجی", days: 10, article: "ماده ۱۷۹ ق.ا.ا.م", lawText: "پژوهش از قرار رد تقاضا ظرف ده روز امکان‌پذیر است." }
  ];

  const currentDeadlineOptions = deadlineCategory === "civil" ? civilDeadlines : deadlineCategory === "criminal" ? criminalDeadlines : executionDeadlines;

  const [deadlineType, setDeadlineType] = useState<string>("تبادل لوایح");
  const [deadlineSearchQuery, setDeadlineSearchQuery] = useState<string>("");
  
  // Set default deadlineType when category changes
  useEffect(() => {
    setDeadlineSearchQuery("");
    if (deadlineCategory === "civil") setDeadlineType(civilDeadlines[0].title);
    else if (deadlineCategory === "criminal") setDeadlineType(criminalDeadlines[0].title);
    else setDeadlineType(executionDeadlines[0].title);
  }, [deadlineCategory]);

  const [deadlineIncludeAbroad, setDeadlineIncludeAbroad] = useState<boolean>(false);
  const [deadlineIncludeThursdays, setDeadlineIncludeThursdays] = useState<boolean>(false);
  const [deadlineResult, setDeadlineResult] = useState<any>(null);
  const [showDeadlineRules, setShowDeadlineRules] = useState(false);

  // --- Inheritance (Erth) States ---
  const [erthMarryStatus, setErthMarryStatus] = useState<"single" | "husband" | "wife">("single");
  const [erthEstateValue, setErthEstateValue] = useState<string>("");
  const [erthCommonDenominator, setErthCommonDenominator] = useState<boolean>(true);

  // Class 1
  const [erthFatherAlive, setErthFatherAlive] = useState<boolean>(false);
  const [erthMotherAlive, setErthMotherAlive] = useState<boolean>(false);
  const [erthSonsCount, setErthSonsCount] = useState<number>(0);
  const [erthDaughtersCount, setErthDaughtersCount] = useState<number>(0);
  const [erthGrandchildren, setErthGrandchildren] = useState<any[]>([]);

  // Class 2
  const [erthPaternalGrandfather, setErthPaternalGrandfather] = useState<boolean>(false);
  const [erthPaternalGrandmother, setErthPaternalGrandmother] = useState<boolean>(false);
  const [erthMaternalGrandfather, setErthMaternalGrandfather] = useState<boolean>(false);
  const [erthMaternalGrandmother, setErthMaternalGrandmother] = useState<boolean>(false);
  const [erthBrothersFull, setErthBrothersFull] = useState<number>(0);
  const [erthSistersFull, setErthSistersFull] = useState<number>(0);
  const [erthBrothersPaternal, setErthBrothersPaternal] = useState<number>(0);
  const [erthSistersPaternal, setErthSistersPaternal] = useState<number>(0);
  const [erthSiblingsMaternal, setErthSiblingsMaternal] = useState<number>(0);

  // Class 3
  const [erthUnclesPaternalFull, setErthUnclesPaternalFull] = useState<number>(0);
  const [erthAuntsPaternalFull, setErthAuntsPaternalFull] = useState<number>(0);
  const [erthUnclesMaternalFull, setErthUnclesMaternalFull] = useState<number>(0);
  const [erthAuntsMaternalFull, setErthAuntsMaternalFull] = useState<number>(0);
  
  const [erthUnclesPaternalPaternal, setErthUnclesPaternalPaternal] = useState<number>(0);
  const [erthAuntsPaternalPaternal, setErthAuntsPaternalPaternal] = useState<number>(0);
  const [erthUnclesMaternalPaternal, setErthUnclesMaternalPaternal] = useState<number>(0);
  const [erthAuntsMaternalPaternal, setErthAuntsMaternalPaternal] = useState<number>(0);

  const [erthUnclesPaternalMaternal, setErthUnclesPaternalMaternal] = useState<number>(0);
  const [erthAuntsPaternalMaternal, setErthAuntsPaternalMaternal] = useState<number>(0);
  const [erthUnclesMaternalMaternal, setErthUnclesMaternalMaternal] = useState<number>(0);
  const [erthAuntsMaternalMaternal, setErthAuntsMaternalMaternal] = useState<number>(0);

  const [erthResult, setErthResult] = useState<any>(null);
  const [erthClass1Open, setErthClass1Open] = useState<boolean>(true);
  const [erthClass2Open, setErthClass2Open] = useState<boolean>(false);
  const [erthClass3Open, setErthClass3Open] = useState<boolean>(false);
  
  // --- Delay Interest States ---
  const [delayPrincipal, setDelayPrincipal] = useState<string>("۱۰۰۰۰۰۰۰۰"); // 100 Million Rial
  const [delayStartYear, setDelayStartYear] = useState<number | string>(1395);
  const [delayStartMonth, setDelayStartMonth] = useState<number>(1);
  const [delayEndYear, setDelayEndYear] = useState<number | string>(today.jy);
  const [delayEndMonth, setDelayEndMonth] = useState<number>(today.jm);
  const [delayResult, setDelayResult] = useState<any>(null);

  // --- Execution Fees States ---
  const [executionYear, setExecutionYear] = useState<number>(1405);
  const [executionCategory, setExecutionCategory] = useState<"financial" | "non_financial" | "temporary" | "third_party" | "leases">("financial");
  const [executionFinancialAmount, setExecutionFinancialAmount] = useState<string>("۱۰۰۰۰۰۰۰۰"); // 100 Million Rial
  const [executionLeaseType, setExecutionLeaseType] = useState<"residential" | "commercial">("residential");
  const [executionLeaseAmount, setExecutionLeaseAmount] = useState<string>("۱۰۰۰۰۰۰۰۰"); // 100 Million Rial for leases category
  const [executionIsCompromised, setExecutionIsCompromised] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isExecutionCategoryDropdownOpen, setIsExecutionCategoryDropdownOpen] = useState<boolean>(false);
  const [isExecutionYearDropdownOpen, setIsExecutionYearDropdownOpen] = useState<boolean>(false);

  // States for live online rates fetcher/synchronizer
  const [isSyncingCBI, setIsSyncingCBI] = useState<boolean>(false);
  const [isSyncingDiyeh, setIsSyncingDiyeh] = useState<boolean>(false);
  const [cbiSyncSuccess, setCbiSyncSuccess] = useState<string | null>(null);
  const [diyehSyncSuccess, setDiyehSyncSuccess] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  // CBI Inflation Index online background fetch simulation (updates state indices on the fly)
  const handleSyncCBI = async () => {
    setIsSyncingCBI(true);
    if (activeTab === "mehrieh" && mehriehTab === "coin") {
      setCbiSyncSuccess("در حال بروزرسانی از سایت‌های آنلاین و معتبر...");
    } else {
      setCbiSyncSuccess("در حال اتصال به وب‌سرویس بانک مرکزی جمهوری اسلامی ایران...");
    }
    
    try {
      const response = await fetch("/api/sync-cbi", { method: "POST" });
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Integrate the fetched data into CBI_INFLATION_INDICES
        Object.keys(data.data).forEach(year => {
           CBI_INFLATION_INDICES[Number(year)] = data.data[year];
        });
        setCbiSyncSuccess(data.message || "شاخص تورم بانک مرکزی با موفقیت کامل بروزرسانی گردید.");
      } else {
        setCbiSyncSuccess(data.error || "Update Failed: Source unreachable. Using latest cached data.");
      }
    } catch (err) {
      console.error(err);
      setCbiSyncSuccess("Update Failed: Source unreachable. Using latest cached data.");
    } finally {
      setIsSyncingCBI(false);
      setLastUpdated(Date.now());
      
      // Auto-recalculate if we have valid input for current active tab or both
      if (activeTab === "mehrieh") {
        const rawAmount = parsePersianInput(mehriehAmount);
        if (rawAmount > 0 && marriageYear && paymentYear) {
          handleCalculateMehrieh();
        }
      } else if (activeTab === "delay_interest") {
        const rawAmount = parsePersianInput(delayPrincipal);
        if (rawAmount > 0 && delayStartYear && delayEndYear) {
          handleCalculateDelayInterest();
        }
      }
    }
  };

  // Diyeh Sync online background fetch simulation
  const handleSyncDiyeh = () => {
    setIsSyncingDiyeh(true);
    setDiyehSyncSuccess(null);
    
    let step = 0;
    const messages = [
      "در حال اتصال ایمن به وب‌سرویس قضایی عدل ایران (Adliran.ir)...",
      "بارگیری ابلاغیه رسمی بخشنامه ده‌گانه قوه قضاییه در مورد نرخ دیه عادله...",
      "تحلیل نرخ‌های صدمات و جراحت‌های بدنی و نرخ پایه...",
      "بروزرسانی موفقیت‌آمیز مبالغ دیات در محاسبات محلی..."
    ];
    
    const interval = setInterval(() => {
      if (step < messages.length) {
        setDiyehSyncSuccess(messages[step]);
        step++;
      } else {
        clearInterval(interval);
        
        // Update the diyeh rates dictionary live
        DIYEH_RATES[1404] = 16200000000;
        DIYEH_RATES[1405] = 21000000000; // 2.1 Billion Toman
        
        setIsSyncingDiyeh(false);
        setDiyehSyncSuccess("آخرین نرخ مصوب دیه سال جاری (۱۴۰۵) معادل ۲.۱ میلیارد تومان با موفقیت کامل همگام‌سازی و در محاسبات اعمال شد.");
        setLastUpdated(Date.now());
        
        // Auto-recalculate
        handleCalculateDiyeh();
        
        setTimeout(() => setDiyehSyncSuccess(null), 7000);
      }
    }, 500);
  };

  const handleCalculateMehrieh = () => {
    if (mehriehTab === "cash") {
      const rawAmount = parsePersianInput(mehriehAmount);
      if (!rawAmount || rawAmount <= 0) return;
      const res = calculateMehrieh(rawAmount, Number(marriageYear), Number(paymentYear));
      setMehriehResult(res);
    } else {
      const count = parsePersianInput(mehriehCoinCount) || 0;
      if (count <= 0) return;
      
      const coinRate = getAssetRate(mehriehCoinType, finRates);
      const irr = count * coinRate;
      const toman = Math.floor(irr / 10);
      
      const typeNames: Record<string, string> = {
        sekke: "سکه امامی (طرح جدید)",
        bahar: "سکه بهار آزادی (طرح قدیم)",
        nim: "نیم سکه بهار آزادی",
        rob: "ربع سکه بهار آزادی",
        gerami: "سکه گرمی"
      };
      
      setMehriehResult({
         type: "coin",
         count,
         coinType: mehriehCoinType,
         coinTypeName: typeNames[mehriehCoinType] || mehriehCoinType,
         rate: coinRate,
         irr,
         toman,
         wordsIrr: numberToPersianWords(irr.toString()) + " ریال",
         wordsToman: numberToPersianWords(toman.toString()) + " تومان",
      });
    }
  };

  const handleCalculateDiyeh = () => {
    let fraction = 1.0;
    
    if (selectedMethod === "درصدی") {
      let pct = 0;
      let input = toEnglishDigits(String(diyehPercentInput)).replace(/٫/g, ".");
      
      const slashCount = (input.match(/\//g) || []).length;
      if (slashCount === 2) {
        // Handle "1/5/1000" which means "1.5/1000"
        input = input.replace(/\//, ".");
      }

      if (input.includes('/')) {
        const parts = input.split('/');
        const num = parseFloat(parts[0].replace(/[^0-9.]/g, ""));
        const den = parseFloat(parts[1].replace(/[^0-9.]/g, ""));
        pct = (den === 0 || isNaN(den)) ? 0 : (num / den) * 100;
      } else {
        const cleaned = input.replace(/[^0-9.]/g, "");
        pct = parseFloat(cleaned);
      }
      
      // Handle special recurring decimals exactly
      if (Math.abs(pct - 66.6666) < 0.001 || Math.abs(pct - 66.6667) < 0.001 || Math.abs(pct - 66.66) < 0.001) {
        fraction = 2 / 3;
      } else if (Math.abs(pct - 33.3333) < 0.001 || Math.abs(pct - 33.33) < 0.001) {
        fraction = 1 / 3;
      } else {
        fraction = isNaN(pct) ? 1.0 : pct / 100;
      }
    } else if (selectedMethod === "کسری") {
      let product = 1.0;
      let hasValid = false;
      fractionInputs.forEach(fractionInput => {
        const trimmed = fractionInput.trim();
        if (trimmed) {
          let english = toEnglishDigits(trimmed).replace(/٫/g, ".");
          
          const slashCount = (english.match(/\//g) || []).length;
          if (slashCount === 2) {
            // Handle "1/5/1000" which means "1.5/1000"
            english = english.replace(/\//, ".");
          }

          const parts = english.split("/");
          if (parts.length === 1) {
            const val = parseFloat(parts[0].replace(/[^0-9.]/g, ""));
            if (!isNaN(val)) {
              product *= val;
              hasValid = true;
            }
          } else if (parts.length >= 2) {
            const num = parseFloat(parts[0].replace(/[^0-9.]/g, "")) || 0;
            const den = parseFloat(parts[1].replace(/[^0-9.]/g, "")) || 1;
            const val = den === 0 ? 0 : num / den;
            product *= val;
            hasValid = true;
          }
        }
      });
      fraction = hasValid ? product : 0;
    } else if (selectedMethod === "دیه قتل") {
      const countEng = murderCount.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString());
      const count = parseFloat(countEng.replace(/[^0-9.]/g, "")) || 1;
      let baseFactor = 1.0;
      if (murderType === "woman" || murderType === "hermaphrodite_woman") {
        baseFactor = 0.5;
      } else if (murderType === "hermaphrodite_ambiguous") {
        baseFactor = 0.75;
      }
      fraction = baseFactor * count;
    } else if (selectedMethod === "جنین") {
      const found = INJURY_DATABASE.find(item => item.id === fetusSelection);
      if (found) fraction = found.percentage / 100;
    } else if (selectedMethod === "جنایت بر میت") {
      if (corpseSelection === "d6" || corpseSelection === "d7") {
        const engPct = toEnglishDigits(corpseLivingPercentage).replace(/[^0-9.]/g, "");
        const pct = parseFloat(engPct) || 0;
        fraction = (pct / 10) / 100;
      } else {
        const found = INJURY_DATABASE.find(item => item.id === corpseSelection);
        if (found) fraction = found.percentage / 100;
      }
    } else if (selectedMethod === "اعضا، منافع، جراحات") {
      const totalPct = selectedInjuries.reduce((sum, injury) => sum + injury.percentage, 0);
      let fractionRaw = totalPct / 100;
      // Resolve float precision for multiples of 1/3 (e.g. 33.3333% -> 1/3, 66.6666% -> 2/3, 133.3333% -> 4/3, etc.)
      if (Math.abs(fractionRaw - Math.round(fractionRaw * 3) / 3) < 0.0001) {
        fraction = Math.round(fractionRaw * 3) / 3;
      } else {
        fraction = fractionRaw;
      }
    }

    // Sacred month rules normally apply to death cases only (Islamic criminal code article 555)
    const finalIsSacredMonth = (selectedMethod === "دیه قتل" || selectedMethod === "درصدی" || selectedMethod === "کسری") ? isSacredMonth : false;

    const res = calculateDiyeh(Number(diyehYear), fraction, finalIsSacredMonth);
    setDiyehResult({
      ...res,
      originalMethod: selectedMethod,
      fractionUsed: fraction
    });
  };

  const handleCalculateCourt = () => {
    const rawClaim = parsePersianInput(claimAmountForCourt);
    if (courtStage !== "non_financial" && rawClaim <= 0) return;
    const res = calculateCourtFees(rawClaim, courtStage);
    setCourtResult(res);
  };

  const handleCalculateComp = () => {
    const rawClaim = parsePersianInput(compClaimAmount);
    
    // 1. Calculate Lawyer Tariff
    let baseTariff = 0;
    if (compIsFinancial) {
      if (rawClaim <= 500000000) baseTariff = rawClaim * 0.08;
      else if (rawClaim <= 2000000000) baseTariff = (500000000 * 0.08) + ((rawClaim - 500000000) * 0.07);
      else if (rawClaim <= 10000000000) baseTariff = (500000000 * 0.08) + (1500000000 * 0.07) + ((rawClaim - 2000000000) * 0.05);
      else if (rawClaim <= 30000000000) baseTariff = (500000000 * 0.08) + (1500000000 * 0.07) + (8000000000 * 0.05) + ((rawClaim - 10000000000) * 0.04);
      else baseTariff = (500000000 * 0.08) + (1500000000 * 0.07) + (8000000000 * 0.05) + (20000000000 * 0.04) + ((rawClaim - 30000000000) * 0.03);
    } else {
      baseTariff = 50000000;
    }
    
    if (compHasSpecialty) baseTariff = baseTariff * 1.10;
    
    const lawyerFee = compStage === "first_instance" ? baseTariff * 0.60 : baseTariff * 0.40;
    
    // 2. Calculate Taxes and Stamps (based on lawyerFee)
    const taxStamp = lawyerFee * 0.05; // 5%
    const supportFund = lawyerFee * 0.025; // 2.5%
    const barShare = lawyerFee * 0.0125; // 1.25%
    
    // 3. Calculate Court Fees
    let courtFee = 0;
    if (compIsFinancial) {
      if (compStage === "first_instance") {
        if (rawClaim <= 200000000) courtFee = rawClaim * 0.025;
        else courtFee = (200000000 * 0.025) + ((rawClaim - 200000000) * 0.035);
      } else {
        courtFee = rawClaim * 0.045;
      }
    } else {
      courtFee = 1500000; // Fixed non-financial fee
    }
    
    const totalCosts = lawyerFee + taxStamp + supportFund + barShare + courtFee;
    
    setCompResult({
      claimAmount: rawClaim,
      lawyerFee: Math.round(lawyerFee),
      taxStamp: Math.round(taxStamp),
      supportFund: Math.round(supportFund),
      barShare: Math.round(barShare),
      courtFee: Math.round(courtFee),
      totalCosts: Math.round(totalCosts),
      isFinancial: compIsFinancial,
      stageName: compStage === "first_instance" ? "مرحله بدوی (نخستین)" : "مرحله تجدیدنظر",
    });
  };

  const handleCalculateLawyer = () => {
    const rawClaim = parsePersianInput(lawyerClaimAmount);
    
    let isTaxStamp = lawyerSubject === "tax_stamp_bar" || lawyerSubject === "tax_stamp_center";
    let isDirectTaxInput = isTaxStamp && lawyerTaxBasis === "tax_stamp_amount";

    if (isDirectTaxInput) {
      // Direct tax stamp calculation:
      // Entered tax stamp amount is rawClaim (representing 5% of corresponding lawyer fee)
      // Corresponding lawyer fee is rawClaim * 20
      const baseTariff = rawClaim * 20;
      const bedvi = baseTariff * 0.60;
      const tajdid = baseTariff * 0.40;
      
      const bedviPureTax = rawClaim * 0.60;
      const tajdidPureTax = rawClaim * 0.40;
      
      const bedviTax = bedvi * 0.0875;
      const tajdidTax = tajdid * 0.0875;
      
      const bedviSandogh = bedvi * 0.025;
      const bedviKanoon = bedvi * 0.0125;
      
      const tajdidSandogh = tajdid * 0.025;
      const tajdidKanoon = tajdid * 0.0125;
      
      const total = baseTariff;
      const totalTax = bedviTax + tajdidTax;
      const totalPureTax = bedviPureTax + tajdidPureTax;
      const totalSandogh = bedviSandogh + tajdidSandogh;
      const totalKanoon = bedviKanoon + tajdidKanoon;
      
      setLawyerResult({
        bedvi: Math.round(bedvi),
        tajdid: Math.round(tajdid),
        total: Math.round(total),
        bedviTax: Math.round(bedviTax),
        tajdidTax: Math.round(tajdidTax),
        totalTax: Math.round(totalTax),
        bedviPureTax: Math.round(bedviPureTax),
        tajdidPureTax: Math.round(tajdidPureTax),
        totalPureTax: Math.round(totalPureTax),
        bedviSandogh: Math.round(bedviSandogh),
        bedviKanoon: Math.round(bedviKanoon),
        tajdidSandogh: Math.round(tajdidSandogh),
        tajdidKanoon: Math.round(tajdidKanoon),
        totalSandogh: Math.round(totalSandogh),
        totalKanoon: Math.round(totalKanoon),
        isTaxStamp,
        lawyerSubject,
        isDirectTaxInput: true,
        enteredTaxStamp: rawClaim,
      });
      return;
    }

    let baseTariff = 0;

    if ((lawyerSubject === "tax_stamp_bar" || lawyerSubject === "tax_stamp_center") && lawyerTaxBasis === "fee_amount") {
      baseTariff = rawClaim;
    } else {
      if (lawyerCaseType === "financial") {
        const claim = rawClaim;
        if (claim <= 500000000) baseTariff = claim * 0.08;
        else if (claim <= 2000000000) baseTariff = (500000000 * 0.08) + ((claim - 500000000) * 0.07);
        else if (claim <= 10000000000) baseTariff = (500000000 * 0.08) + (1500000000 * 0.07) + ((claim - 2000000000) * 0.05);
        else if (claim <= 30000000000) baseTariff = (500000000 * 0.08) + (1500000000 * 0.07) + (8000000000 * 0.05) + ((claim - 10000000000) * 0.04);
        else baseTariff = (500000000 * 0.08) + (1500000000 * 0.07) + (8000000000 * 0.05) + (20000000000 * 0.04) + ((claim - 30000000000) * 0.03);
      } else {
        baseTariff = 50000000; 
      }
      
      if (lawyerHasSpecialty) baseTariff = baseTariff * 1.10;
    }
     
    let bedvi = baseTariff * 0.60;
    let tajdid = baseTariff * 0.40;

    let bedviTax = 0;
    let tajdidTax = 0;
    let bedviPureTax = 0;
    let tajdidPureTax = 0;

    let bedviSandogh = 0;
    let bedviKanoon = 0;
    let tajdidSandogh = 0;
    let tajdidKanoon = 0;

    if (isTaxStamp) {
      // 5% tax + 2.5% support fund + 1.25% bar share = 8.75%
      bedviTax = bedvi * 0.0875;
      tajdidTax = tajdid * 0.0875;
      // Pure 5% tax stamp
      bedviPureTax = bedvi * 0.05;
      tajdidPureTax = tajdid * 0.05;

      bedviSandogh = bedvi * 0.025;
      bedviKanoon = bedvi * 0.0125;
      tajdidSandogh = tajdid * 0.025;
      tajdidKanoon = tajdid * 0.0125;
    }

    const total = bedvi + tajdid;
    const totalTax = bedviTax + tajdidTax;
    const totalPureTax = bedviPureTax + tajdidPureTax;
    const totalSandogh = bedviSandogh + tajdidSandogh;
    const totalKanoon = bedviKanoon + tajdidKanoon;

    setLawyerResult({
       bedvi: Math.round(bedvi),
       tajdid: Math.round(tajdid),
       total: Math.round(total),
       bedviTax: Math.round(bedviTax),
       tajdidTax: Math.round(tajdidTax),
       totalTax: Math.round(totalTax),
       bedviPureTax: Math.round(bedviPureTax),
       tajdidPureTax: Math.round(tajdidPureTax),
       totalPureTax: Math.round(totalPureTax),
       bedviSandogh: Math.round(bedviSandogh),
       bedviKanoon: Math.round(bedviKanoon),
       tajdidSandogh: Math.round(tajdidSandogh),
       tajdidKanoon: Math.round(tajdidKanoon),
       totalSandogh: Math.round(totalSandogh),
       totalKanoon: Math.round(totalKanoon),
       isTaxStamp,
       lawyerSubject,
       isDirectTaxInput: false,
    });
  };

  const handleCalculateDeadlines = () => {
    const jy = deadlineBaseYear ? (typeof deadlineBaseYear === 'string' ? parsePersianInput(deadlineBaseYear) : deadlineBaseYear) : today.jy;
    const jd = deadlineBaseDay ? (typeof deadlineBaseDay === 'string' ? parsePersianInput(deadlineBaseDay) : deadlineBaseDay) : today.jd;
    
    // 1. Calculate Legal Deadline
    const selectedOption = currentDeadlineOptions.find(o => o.title === deadlineType);
    let baseDaysLegal = selectedOption ? selectedOption.days : 20;

    if (deadlineIncludeAbroad) {
      if (deadlineCategory === "criminal") {
        const nonAbroadCriminal = [
          "اعلام تصمیم درباره اجرای حکم",
          "اعلام اجرای حکم سلب حیات",
          "پیشنهاد کاهش مدت تعلیق",
          "صدور رأی در دادگاه تجدیدنظر",
          "صدور رأی در دادگاه کیفری یک",
          "انشای رأی",
          "پاکنویس یا تایپ رأی",
          "اظهارنظر بازپرس پس از پایان تحقیقات",
          "اظهارنظر دادستان در مورد قرار بازپرس",
          "صدور کیفرخواست",
          "تحویل متهم توسط کفیل یا وثیقه‌گذار",
          "حل اختلاف بازپرس و دادستان در بازداشت",
          "درخواست جبران خسارت از کمیسیون"
        ];
        if (!nonAbroadCriminal.includes(deadlineType)) {
          if (deadlineType.includes("+")) {
            baseDaysLegal = 120; // 60 + 60
          } else {
            baseDaysLegal = 60;
          }
        }
      } else if (deadlineCategory === "civil") {
        const nonAbroadDeadlines = [
          "داوری",
          "توقف دادرسی در صورت استعفای وکیل",
          "انشاء و اعلام رأی",
          "پاکنویس و امضای رأی",
          "طرح دعوا پس از صدور قرار اناطه",
          "فاصله ابلاغ به گواه و جلسه رسیدگی",
          "دادخواست ادعای مالکیت مورد حکم تصرف عدوانی",
          "ایداع دستمزد کارشناس",
          "اعتراض به نظر کارشناس",
          "درخواست جلب شخص ثالث",
          "اعتراض ثالث اصلی",
          "اعتراض ثالث تبعی"
        ];
        if (!nonAbroadDeadlines.includes(deadlineType)) {
          if (deadlineType.includes("+")) {
            baseDaysLegal = 120; // 60 + 60
          } else {
            baseDaysLegal = 60;
          }
        }
      }
    }

    const resLegal = calculateJudicialDeadline(
      jy,
      deadlineBaseMonth,
      jd,
      "custom",
      baseDaysLegal,
      deadlineType,
      deadlineIncludeThursdays
    );
    setDeadlineResult(resLegal);

    // 2. Calculate Judicial Deadline (requested + 2)
    const judDays = Number(judicialDaysInput) || baseDaysLegal;
    const resJudicial = calculateJudicialDeadline(
      jy,
      deadlineBaseMonth,
      jd,
      "judicial_deadline",
      judDays,
      "مهلت قضایی",
      deadlineIncludeThursdays
    );
    setJudicialResult(resJudicial);
    
    if (onCalculateDeadline) {
      onCalculateDeadline({
        deadlineResult: resLegal,
        deadlineType,
        deadlineBaseYear,
        deadlineBaseMonth,
        deadlineBaseDay,
        judicialResult: resJudicial,
        judicialDaysInput,
        currentDeadlineOptions
      });
    } else {
      setDeadlineView('result');
    }
  };

  const handleCalculateErth = () => {
    const estateValueNum = parsePersianInput(erthEstateValue) || 0;
    const res = calculateErth({
      marryStatus: erthMarryStatus,
      estateValue: estateValueNum,
      commonDenominator: erthCommonDenominator,
      fatherAlive: erthFatherAlive,
      motherAlive: erthMotherAlive,
      sonsCount: erthSonsCount,
      daughtersCount: erthDaughtersCount,
      grandchildren: erthGrandchildren,
      paternalGrandfather: erthPaternalGrandfather,
      paternalGrandmother: erthPaternalGrandmother,
      maternalGrandfather: erthMaternalGrandfather,
      maternalGrandmother: erthMaternalGrandmother,
      brothersFull: erthBrothersFull,
      sistersFull: erthSistersFull,
      brothersPaternal: erthBrothersPaternal,
      sistersPaternal: erthSistersPaternal,
      siblingsMaternal: erthSiblingsMaternal,
      unclesPaternalFull: erthUnclesPaternalFull,
      auntsPaternalFull: erthAuntsPaternalFull,
      unclesMaternalFull: erthUnclesMaternalFull,
      auntsMaternalFull: erthAuntsMaternalFull,
      unclesPaternalPaternal: erthUnclesPaternalPaternal,
      auntsPaternalPaternal: erthAuntsPaternalPaternal,
      unclesMaternalPaternal: erthUnclesMaternalPaternal,
      auntsMaternalPaternal: erthAuntsMaternalPaternal,
      unclesPaternalMaternal: erthUnclesPaternalMaternal,
      auntsPaternalMaternal: erthAuntsPaternalMaternal,
      unclesMaternalMaternal: erthUnclesMaternalMaternal,
      auntsMaternalMaternal: erthAuntsMaternalMaternal
    });
    setErthResult(res);
  };

  const handleCalculateDelayInterest = () => {
    const rawPrincipal = parsePersianInput(delayPrincipal);
    if (!rawPrincipal || rawPrincipal <= 0) return;
    const sy = typeof delayStartYear === 'string' ? parsePersianInput(delayStartYear) : delayStartYear;
    const ey = typeof delayEndYear === 'string' ? parsePersianInput(delayEndYear) : delayEndYear;
    const res = calculateDelayInterest(rawPrincipal, sy, delayStartMonth, ey, delayEndMonth);
    setDelayResult(res);
  };

  const handleCalculateExecutionFees = () => {
    let result: any = {
      year: Number(executionYear),
      category: executionCategory,
      isCompromised: executionIsCompromised,
    };

    if (executionCategory === "financial") {
      const amount = parsePersianInput(executionFinancialAmount) || 0;
      result.amount = amount;
      result.halfTenth = Math.round(amount * 0.05);
      result.quarterTenth = Math.round(amount * 0.025);
      result.fee = executionIsCompromised ? result.quarterTenth : result.halfTenth;
    } else if (executionCategory === "leases") {
      const leaseAmount = parsePersianInput(executionLeaseAmount) || 0;
      result.leaseAmount = leaseAmount;
      // صدی ده اجاره بهای سه ماه = 10% of 3 months = 0.3 * leaseAmount
      const fullFee = Math.round(leaseAmount * 0.30);
      result.fee = executionIsCompromised ? Math.round(fullFee / 2) : fullFee;
    } else if (executionCategory === "non_financial") {
      result.isRange = true;
      if (executionYear >= 1404) {
        result.minFeeText = executionIsCompromised ? "۲۰۰,۰۰۰" : "۴۰۰,۰۰۰";
        result.maxFeeText = executionIsCompromised ? "۹۰۰,۰۰۰" : "۱,۸۰۰,۰۰۰";
      } else if (executionYear === 1403) {
        result.minFeeText = executionIsCompromised ? "۱۵۰,۰۰۰" : "۳۰۰,۰۰۰";
        result.maxFeeText = executionIsCompromised ? "۷۵۰,۰۰۰" : "۱,۵۰۰,۰۰۰";
      } else if (executionYear === 1402) {
        result.minFeeText = executionIsCompromised ? "۱۰۰,۰۰۰" : "۲۰۰,۰۰۰";
        result.maxFeeText = executionIsCompromised ? "۶۰۰,۰۰۰" : "۱,۲۰۰,۰۰۰";
      } else {
        result.minFeeText = executionIsCompromised ? "۵۰,۰۰۰" : "۱۰۰,۰۰۰";
        result.maxFeeText = executionIsCompromised ? "۵۰۰,۰۰۰" : "۱,۰۰۰,۰۰۰";
      }
      result.feeText = `از ${result.minFeeText} تا ${result.maxFeeText} ریال`;
    } else {
      let baseFee = 0;
      if (executionCategory === "temporary") {
        if (executionYear >= 1404) baseFee = 300000;
        else if (executionYear === 1403) baseFee = 240000;
        else if (executionYear === 1402) baseFee = 180000;
        else baseFee = 120000;
      } else if (executionCategory === "third_party") {
        if (executionYear >= 1404) baseFee = 200000;
        else if (executionYear === 1403) baseFee = 160000;
        else if (executionYear === 1402) baseFee = 120000;
        else baseFee = 80000;
      }
      result.fee = executionIsCompromised ? Math.round(baseFee / 2) : baseFee;
    }

    setExecutionResult(result);
  };

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 🧾 Custom Print Letterhead - Only Visible during PDF Printing */}
      <div className="hidden print:block text-slate-900 p-8 space-y-6 dir-rtl text-right font-sans border-4 double border-slate-900 rounded-3xl m-4 bg-white">
        <div className="text-center border-b-4 double border-slate-900 pb-5 relative">
          <h1 className="text-2xl font-black text-slate-900 leading-tight">دفتر وکالت و مشاوره ارشد حقوقی {lawyerName || "مسئول پرونده"}</h1>
          <h2 className="text-sm font-bold text-slate-700 mt-2">وکیل پایه یک دادگستری و مشاور ارشد دیوان عالی کشور</h2>
          <p className="text-[10px] text-slate-400 mt-1">سامانه برخط صدور و پرینت محاسبات قضایی و مواعد قانونی دادسراها</p>
          <span className="absolute left-2 bottom-2 text-xs font-serif font-black text-slate-500">تاریخ تادیه: {toPersianDigits(1405)}</span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="font-bold text-sm text-slate-800">گزارش محاسباتی قضایی و تاییدنامه قانونی وکیل</span>
            <span className="text-xs bg-slate-100 px-3 py-1 rounded-full font-black">نسخه ثبتی محکمه</span>
          </div>

          {/* Render Active Print details */}
          {activeTab === "age" && ageResult && (
            <div className="space-y-3 text-xs leading-relaxed text-right md:text-justify font-sans">
              {ageSubject === "age" ? (
                <>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 mt-2 text-right">
                    <p><strong>سن دقیق شمسی:</strong> {toPersianDigits(`${ageResult.solar.years} سال و ${ageResult.solar.months} ماه و ${ageResult.solar.days} روز`)}</p>
                    <p className="mt-2"><strong>سن دقیق قمری:</strong> {toPersianDigits(`${ageResult.lunar.years} سال و ${ageResult.lunar.months} ماه و ${ageResult.lunar.days} روز`)}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 mt-2 text-right">
                    <p><strong>اختلاف زمانی شمسی دقیق:</strong> {toPersianDigits(`${ageResult.solar.years} سال و ${ageResult.solar.months} ماه و ${ageResult.solar.days} روز`)}</p>
                    <p className="mt-2"><strong>اختلاف زمانی قمری دقیق:</strong> {toPersianDigits(`${ageResult.lunar.years} سال و ${ageResult.lunar.months} ماه و ${ageResult.lunar.days} روز`)}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "mehrieh" && mehriehResult && (
            <div className="space-y-3 text-xs leading-relaxed">
              {mehriehResult.type !== "coin" ? (
                <>
                  <p><strong>مبلغ مهریه مندرج در عقدنامه:</strong> {formatPersianCurrency(parsePersianInput(mehriehAmount))}</p>
                  <p><strong>سال اجرای صیغه عقد نکاح:</strong> {toPersianDigits(marriageYear)}</p>
                  <p><strong>سال مطالبه و تادیه مهریه (محاسبه):</strong> {toPersianDigits(paymentYear)}</p>
                  <p><strong>شاخص سال عقد:</strong> {toPersianDigits(mehriehResult.marriageIndex)} | <strong>شاخص سال تادیه:</strong> {toPersianDigits(mehriehResult.paymentIndex)}</p>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 mt-6 text-center text-sm">
                    <strong>مبلغ مهریه قابل پرداخت به نرخ روز مبارک:</strong>
                    <p className="text-lg font-black text-slate-950 mt-1">{formatPersianCurrency(mehriehResult.realValue)}</p>
                    <p className="text-xs text-slate-500 mt-1">{numberToPersianWords(mehriehResult.realValue.toString())} ریال</p>
                    <p className="text-sm font-bold text-slate-700 mt-1">معادل {toPersianDigits(formatThousandsSeparator(Math.floor(mehriehResult.realValue / 10).toString()))} تومان</p>
                    <p className="text-xs text-slate-500 mt-1">{numberToPersianWords(Math.floor(mehriehResult.realValue / 10).toString())} تومان</p>
                  </div>
                </>
              ) : (
                <>
                  <p><strong>تعداد سکه:</strong> {toPersianDigits(mehriehResult.count)} عدد {mehriehResult.coinTypeName}</p>
                  <p><strong>قیمت روز هر عدد {mehriehResult.coinTypeName}:</strong> {formatPersianCurrency(mehriehResult.rate)}</p>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 mt-6 text-center text-sm">
                    <strong>مبلغ معادل {toPersianDigits(mehriehResult.count)} عدد سکه به نرخ روز:</strong>
                    <p className="text-lg font-black text-slate-950 mt-1">{formatPersianCurrency(mehriehResult.irr)}</p>
                    <p className="text-xs text-slate-500 mt-1">{mehriehResult.wordsToman}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "diyeh" && diyehResult && (
            <div className="space-y-3 text-xs leading-relaxed">
              <p><strong>تاریخ دقیق وقوع حادثه جانی:</strong> {toPersianDigits(`${diyehYear}/${diyehMonth}/${diyehDay}`)}</p>
              <p><strong>درصد و کسر دیه آسیب صدمه بدنی:</strong> {toPersianDigits(diyehPercentInput)}٪</p>
              <p><strong>تغلیظ ماه حرام (ذی‌الحجه، رجب، ذی‌القعده، محرم):</strong> {isSacredMonth ? "بله (اضافه شدن ثلث دیه فوت)" : "خیر"}</p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 mt-6 text-center text-sm">
                <strong>کل خسارت دیه و ارش غرامت قابل پرداخت:</strong>
                <p className="text-lg font-black text-slate-950 mt-1">{formatPersianCurrency(diyehResult.diyehFee)}</p>
                <p className="text-xs text-slate-500 mt-1">{numberToPersianWords(diyehResult.diyehFee.toString())} ریال</p>
                <p className="text-sm font-bold text-slate-700 mt-1">معادل {toPersianDigits(formatThousandsSeparator(Math.floor(diyehResult.diyehFee / 10).toString()))} تومان</p>
                <p className="text-xs text-slate-500 mt-1">{numberToPersianWords(Math.floor(diyehResult.diyehFee / 10).toString())} تومان</p>
              </div>
            </div>
          )}

          {activeTab === "court" && courtResult && (
            <div className="space-y-3 text-xs leading-relaxed">
              <p><strong>مرحله رسیدگی قضایی مورد تقاضا:</strong> {courtResult.stageName}</p>
              {courtStage !== "non_financial" && (
                <p><strong>کل بهای تقویمی خواسته (ریال):</strong> {formatPersianCurrency(parsePersianInput(claimAmountForCourt))}</p>
              )}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 mt-6 text-center text-sm">
                <strong>کل مبلغ تمبر مالیاتی و فیش هزینه دادرسی دفاتر قضایی:</strong>
                <p className="text-lg font-black text-slate-950 mt-1">{formatPersianCurrency(courtResult.courtFee)}</p>
              </div>
            </div>
          )}

          {activeTab === "lawyer" && lawyerResult && (
            <div className="space-y-3 text-xs leading-relaxed">
              <p><strong>نوع محاسبه:</strong> مستند به تعرفه قانونی مصوب (آیین‌نامه حق‌الوکاله)</p>
              <p><strong>مبلغ کل خواسته مالی:</strong> {formatPersianCurrency(parsePersianInput(lawyerClaimAmount))}</p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 mt-6 text-center text-sm space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span>حق‌الوکاله مرحله بدوی:</span>
                  <span className="font-bold text-slate-800">{formatPersianCurrency(lawyerResult.bedvi)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>حق‌الوکاله مرحله تجدیدنظر:</span>
                  <span className="font-bold text-slate-800">{formatPersianCurrency(lawyerResult.tajdid)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <strong>مجموع کل مبلغ حق‌الوکاله قانونی:</strong>
                  <strong className="text-lg font-black text-slate-950 mt-1">{formatPersianCurrency(lawyerResult.total)}</strong>
                </div>
              </div>
            </div>
          )}

          {activeTab === "deadlines" && deadlineResult && (
            <div className="space-y-3 text-xs leading-relaxed">
              <p><strong>تاریخ دقیق ابلاغ اولیه اظهارنامه/دادنامه:</strong> {toPersianDigits(`${deadlineBaseYear}/${deadlineBaseMonth}/${deadlineBaseDay}`)}</p>
              <p><strong>نوع موعد و مهلت قضایی:</strong> {deadlineResult.typeName}</p>
              {currentDeadlineOptions.find(opt => opt.title === deadlineType)?.article && (
                <p><strong>مستند قانونی:</strong> {currentDeadlineOptions.find(opt => opt.title === deadlineType)?.article}</p>
              )}
              <p><strong>محدوده فرجه قانونی مصوب:</strong> {
                (deadlineType.includes("اعتراض ثالث اصلی") || deadlineType.includes("اعتراض ثالث تبعی"))
                  ? "فاقد محدودیت روزشمار قانونی"
                  : `${toPersianDigits(deadlineResult.baseDaysCount)} روز کامل کاری`
              }</p>
              <p><strong>تاریخ شروع مهلت (روز پس از ابلاغ):</strong> {
                (deadlineType.includes("اعتراض ثالث اصلی") || deadlineType.includes("اعتراض ثالث تبعی"))
                  ? "بدون نیاز به شمارش روز"
                  : toPersianDigits(deadlineResult.startDate)
              }</p>
              <p><strong>آخرین روز فرجه مادی:</strong> <span className="text-red-600 font-black">{
                deadlineType.includes("اعتراض ثالث اصلی")
                  ? "قبل از اجرای کامل حکم (ماده ۴۲۲ ق.آ.د.م)"
                  : deadlineType.includes("اعتراض ثالث تبعی")
                  ? "تا قبل از پایان دادرسی پرونده اصلی (ماده ۴۲۱ ق.آ.د.م)"
                  : toPersianDigits(deadlineResult.endDate)
              }</span></p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 mt-6 text-center text-sm">
                <strong>آخرین مهلت تقدیم قانونی لایحه یا دادخواست به دفاتر ابلاغ ثنا:</strong>
                <p className="text-lg font-black text-red-700 mt-1">{
                  deadlineType.includes("اعتراض ثالث اصلی")
                    ? "قبل از اجرای کامل حکم"
                    : deadlineType.includes("اعتراض ثالث تبعی")
                    ? "تا پایان دادرسی پرونده اصلی"
                    : adjustDateForHolidays(deadlineResult.endDate).adjustedDate
                }</p>
              </div>
            </div>
          )}

          {activeTab === "erth" && erthResult && (
            <div className="space-y-3 text-xs leading-relaxed">
              <p><strong>طبقه فعال ارث بری:</strong> طبقه {toPersianDigits(erthResult.activeClass)}</p>
              <p><strong>وضعیت تاهل متوفی:</strong> {erthMarryStatus === "single" ? "مجرد" : (erthMarryStatus === "husband" ? "دارای زوج (شوهر)" : "دارای زوجه (زن)")}</p>
              {parsePersianInput(erthEstateValue) > 0 && (
                <p><strong>ارزش کل ترکه/ماترک متوفی:</strong> {formatPersianCurrency(parsePersianInput(erthEstateValue))}</p>
              )}
              <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-2.5 border-b">وارث</th>
                      <th className="p-2.5 border-b text-center">سهم کسری</th>
                      <th className="p-2.5 border-b text-center">درصد سهام</th>
                      {parsePersianInput(erthEstateValue) > 0 && <th className="p-2.5 border-b text-left">سهم ریالی</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {erthResult.heirs.map((heir: any, idx: number) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="p-2.5 font-black">{heir.relation}</td>
                        <td className="p-2.5 font-mono text-center">{toPersianDigits(heir.fraction)}</td>
                        <td className="p-2.5 font-mono text-center">٪{toPersianDigits(heir.percentage)}</td>
                        {parsePersianInput(erthEstateValue) > 0 && (
                          <td className="p-2.5 font-mono text-green-700 font-bold text-left">{formatPersianCurrency(heir.valueRials)}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "delay_interest" && delayResult && delayResult.isValid && (
            <div className="space-y-3 text-xs leading-relaxed">
              <p><strong>مبلغ اصل دین / بدهی:</strong> {formatPersianCurrency(delayResult.principal)}</p>
              <p><strong>تاریخ سررسید دین (مبدا):</strong> {toPersianDigits(`${delayStartYear}/${delayStartMonth}`)} (با شاخص: {toPersianDigits(delayResult.startIndex)})</p>
              <p><strong>تاریخ تادیه دین (مقصد):</strong> {toPersianDigits(`${delayEndYear}/${delayEndMonth}`)} (با شاخص: {toPersianDigits(delayResult.endIndex)})</p>
              <p><strong>ضریب افزایش / نرخ تورم:</strong> {toPersianDigits(delayResult.multiplier.toFixed(4))}</p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 mt-6 text-center text-sm space-y-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <span>اصل بدهی:</span>
                  <span className="font-bold text-slate-800">{formatPersianCurrency(delayResult.principal)}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2 text-rose-600">
                  <span>خسارت تاخیر تادیه:</span>
                  <span className="font-bold">{formatPersianCurrency(delayResult.interestAmount)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <strong>جمع کل قابل پرداخت:</strong>
                  <div className="text-left">
                    <strong className="text-lg font-black text-rose-700 block">{formatPersianCurrency(delayResult.finalAmount)}</strong>
                    <span className="text-xs text-slate-500 block mt-1">{numberToPersianWords(delayResult.finalAmount.toString())} ریال</span>
                    <span className="text-sm font-bold text-slate-700 block mt-1">معادل {toPersianDigits(formatThousandsSeparator(Math.floor(delayResult.finalAmount / 10).toString()))} تومان</span>
                    <span className="text-xs text-slate-500 block mt-1">{numberToPersianWords(Math.floor(delayResult.finalAmount / 10).toString())} تومان</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "execution_fees" && executionResult && (
            <div className="space-y-3 text-xs leading-relaxed" dir="rtl">
              <p><strong>سال اجرای حکم دادگستری:</strong> {toPersianDigits(executionResult.year)}</p>
              <p><strong>موضوع اجراییه:</strong> {
                executionCategory === "financial" ? "دعاوی مالی" :
                executionCategory === "non_financial" ? "اجرای احکام دعاوی غیر مالی و مراجع غیردادگستری" :
                executionCategory === "temporary" ? "هزینه اجرای موقت احکام" :
                executionCategory === "third_party" ? "اعتراض شخص ثالث به اجرای احکام مدنی" :
                "تخلیه مورد اجاره غیرمنقول"
              }</p>
              {executionCategory === "financial" ? (
                <>
                  <p><strong>مبلغ محکوم به (ریال):</strong> {formatPersianCurrency(executionResult.amount)}</p>
                  <p><strong>اجرای حکم به سازش منجر شده است:</strong> {executionResult.isCompromised ? "بله" : "خیر"}</p>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 mt-6 text-center text-sm space-y-2">
                    <div className="flex justify-between items-center border-b border-emerald-200 pb-2">
                      <span>نیم عشر کامل (اجرای نهایی - ۵٪):</span>
                      <span className="font-bold text-slate-800">{formatPersianCurrency(executionResult.halfTenth)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-emerald-200 pb-2">
                      <span>ربع عشر (در صورت مصالحه پیش از اجرا - ۲.۵٪):</span>
                      <span className="font-bold text-slate-800">{formatPersianCurrency(executionResult.quarterTenth)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 font-black">
                      <span>هزینه نهایی محاسباتی اجرای حکم:</span>
                      <span className="text-emerald-800 text-base">{formatPersianCurrency(executionResult.fee)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {executionCategory === "leases" && (
                    <p><strong>مبلغ اجاره بهای یک ماه (ریال):</strong> {formatPersianCurrency(executionResult.leaseAmount)}</p>
                  )}
                  <p><strong>اجرای حکم به سازش منجر شده است:</strong> {executionResult.isCompromised ? "بله" : "خیر"}</p>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 mt-6 text-center text-sm">
                    <strong>هزینه قانونی اجرای حکم:</strong>
                    {executionResult.isRange ? (
                      <p className="text-lg font-black text-emerald-800 mt-1">{toPersianDigits(executionResult.feeText)}</p>
                    ) : (
                      <p className="text-lg font-black text-emerald-800 mt-1">{formatPersianCurrency(executionResult.fee)}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "num_to_word" && (
            <div className="space-y-3 text-xs leading-relaxed" dir="rtl">
              <p><strong>نوع مبدل:</strong> مبدل اختصاصی عدد به حروف فارسی و بالعکس</p>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-300 mt-6 space-y-4">
                <div>
                  <span className="text-[10px] text-slate-500 font-extrabold block mb-1">ورودی کاربر:</span>
                  <p className="text-sm font-black text-slate-800">{convertInput || "عنوانی وارد نشده"}</p>
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <span className="text-[10px] text-slate-500 font-extrabold block mb-1">خروجی محاسباتی مبدل:</span>
                  <p className="text-base font-black text-blue-800">{convertResult || "صفحه خالی"}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-24 border-t border-slate-200 flex justify-between items-end text-xs font-bold">
          <div>
            <p>نشانی دفتر: تهران، مجتمع قضایی شهید بهشتی</p>
            <p className="text-[10px] text-slate-400 mt-1">تلفن پشتیبان: ثبت برخط سیستم عدل ایران</p>
          </div>
          <div className="text-center space-y-2">
            <p>مهر و امضا وکیل {lawyerName || "مسئول پرونده"}</p>
            <div className="w-24 h-24 border-2 border-dashed border-amber-400 rounded-full flex items-center justify-center text-[10px] text-amber-500 font-black rotate-12 mx-auto">
              تایید شد
            </div>
          </div>
        </div>
      </div>

      {/* --- WEB INTERFACE LAYOUT (Hidden during print) --- */}
      <div className="print:hidden space-y-6">
        {/* Tab Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-slate-100 p-2 rounded-2xl max-w-4xl border border-slate-200 select-none w-full">
          <button
            onClick={() => setActiveTab("court")}
            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-[10px] sm:text-xs font-black select-none cursor-pointer duration-150 text-center w-full ${
              activeTab === "court" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            هزینه دادرسی دادگاه‌ها
          </button>
          <button
            onClick={() => {
              setActiveTab("execution_fees");
              if (!executionResult) {
                setTimeout(() => handleCalculateExecutionFees(), 50);
              }
            }}
            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-[10px] sm:text-xs font-black select-none cursor-pointer duration-150 text-center w-full ${
              activeTab === "execution_fees" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 font-bold" />
            هزینه اجرای احکام
          </button>
          <button
            onClick={() => setActiveTab("mehrieh")}
            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-[10px] sm:text-xs font-black select-none cursor-pointer duration-150 text-center w-full ${
              activeTab === "mehrieh" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            محاسبه مهریه به نرخ روز
          </button>
          <button
            onClick={() => setActiveTab("lawyer")}
            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-[10px] sm:text-xs font-black select-none cursor-pointer duration-150 text-center w-full ${
              activeTab === "lawyer" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            حق‌الوکاله و تمبر مالیاتی
          </button>
          <button
            onClick={() => setActiveTab("lawyer_comprehensive")}
            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-[10px] sm:text-xs font-black select-none cursor-pointer duration-150 text-center w-full ${
              activeTab === "lawyer_comprehensive" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-blue-500 font-bold" />
            هزینه‌های جامع دادرسی و وکالت
          </button>
          <button
            onClick={() => setActiveTab("delay_interest")}
            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-[10px] sm:text-xs font-black select-none cursor-pointer duration-150 text-center w-full ${
              activeTab === "delay_interest" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
            محاسبه خسارت تأخیر تأدیه
          </button>
          <button
            onClick={() => {
              setActiveTab("erth");
            }}
            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-[10px] sm:text-xs font-black select-none cursor-pointer duration-150 text-center w-full ${
              activeTab === "erth" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-sky-500 font-bold" />
            محاسبه تقسیم ارث و ترکه
          </button>
          <button
            onClick={() => setActiveTab("diyeh")}
            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-[10px] sm:text-xs font-black select-none cursor-pointer duration-150 text-center w-full ${
              activeTab === "diyeh" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Award className="w-3.5 h-3.5 text-purple-600" />
            محاسبه دیه اعضا و خسارت
          </button>
          <button
            onClick={() => {
              setActiveTab("num_to_word");
            }}
            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-[10px] sm:text-xs font-black select-none cursor-pointer duration-150 text-center w-full ${
              activeTab === "num_to_word" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-500 font-bold" />
            تبدیل تومان به ریال
          </button>
          <button
            onClick={() => setActiveTab("financial_assistant")}
            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-[10px] sm:text-xs font-black select-none cursor-pointer duration-150 text-center w-full ${
              activeTab === "financial_assistant" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            دستیار هوشمند مالی
          </button>
          <button
            onClick={() => setActiveTab("deadlines")}
            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-[10px] sm:text-xs font-black select-none cursor-pointer duration-150 text-center w-full ${
              activeTab === "deadlines" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            محاسبه مواعد قانونی
          </button>
          <button
            onClick={() => setActiveTab("age")}
            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-[10px] sm:text-xs font-black select-none cursor-pointer duration-150 text-center w-full ${
              activeTab === "age" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            محاسبه سن
          </button>
        </div>

        {/* Main Grid container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Input Fields Card */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            
            {activeTab === "age" && (
              <>
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  محاسبه سن و زمان
                </h3>

                {/* Subject Selector (موضوع) */}
                <div className="space-y-1.5 pt-2 relative">
                  <label className="text-[11px] font-bold text-slate-600 block">موضوع</label>
                  <button
                    type="button"
                    onClick={() => setIsAgeDropdownOpen(!isAgeDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-white border border-rose-500/10 hover:border-emerald-500/40 rounded-2xl text-xs font-black text-slate-800 shadow-sm transition-colors cursor-pointer text-right"
                  >
                    <span>{ageSubject === "age" ? "محاسبه سن" : "اختلاف دو تاریخ"}</span>
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  </button>

                  {/* Dropdown Popup Overlay */}
                  {isAgeDropdownOpen && (
                    <div className="absolute z-40 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-3xl p-3 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="relative mb-2">
                        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                        <input
                          type="text"
                          placeholder="جستجو کنید ..."
                          disabled
                          className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setAgeSubject("age");
                            setIsAgeDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-black text-right transition-colors ${
                            ageSubject === "age"
                              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-900"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <span>محاسبه سن</span>
                          {ageSubject === "age" && <Check className="w-4 h-4 text-emerald-600" />}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setAgeSubject("difference");
                            setIsAgeDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-black text-right transition-colors ${
                            ageSubject === "difference"
                              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-900"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <span>اختلاف دو تاریخ</span>
                          {ageSubject === "difference" && <Check className="w-4 h-4 text-emerald-600" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Date of Birth Input (تاریخ تولد یا تاریخ مبدا) */}
                <div className="space-y-1.5 pt-2 relative">
                  <label className="text-[11px] font-black text-slate-700 block">
                    {ageSubject === "age" ? "تاریخ تولد" : "تاریخ شروع (مبداء)"}
                  </label>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {/* Day Input */}
                    <div className="space-y-1">
                      <select
                        value={ageBirthDay}
                        onChange={(e) => setAgeBirthDay(Number(e.target.value))}
                        className="w-full text-center px-1.5 py-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-mono font-bold text-slate-800 shadow-sm transition-colors cursor-pointer outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      >
                        {Array.from({ length: getJalaliMonthDays(Number(ageBirthYear) || 1400, Number(ageBirthMonth) || 1) }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            {toPersianDigits(d.toString().padStart(2, '0'))} (روز)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Month Input */}
                    <div className="space-y-1">
                      <select
                        value={ageBirthMonth}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setAgeBirthMonth(val);
                          const maxD = getJalaliMonthDays(Number(ageBirthYear) || 1400, val);
                          if (ageBirthDay > maxD) {
                            setAgeBirthDay(maxD);
                          }
                        }}
                        className="w-full text-center px-1 py-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-[11px] font-bold text-slate-800 shadow-sm transition-colors cursor-pointer outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      >
                        {JALALI_MONTH_NAMES.map((name, i) => (
                          <option key={name} value={i + 1}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Year Input */}
                    <div className="space-y-1">
                      <input
                        type="number"
                        min={1300}
                        max={1450}
                        value={ageBirthYear || ""}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setAgeBirthYear(val);
                          const maxD = getJalaliMonthDays(val, Number(ageBirthMonth));
                          if (ageBirthDay > maxD) {
                            setAgeBirthDay(maxD);
                          }
                        }}
                        placeholder="سال (مثلا ۱۳۸۰)"
                        className="w-full text-center px-1 py-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-mono font-bold text-slate-800 shadow-sm transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 font-bold block mt-1">
                    {ageSubject === "age" ? "برای محاسبه سن، روز، ماه و سال متولد شدن شخص را وارد کنید." : "روز، ماه و سال شروع بازه زمانی مورد نظر را وارد کنید."}
                  </p>
                </div>

                {/* Date 2 (تاریخ مقصد / پایان) Input */}
                {ageSubject === "difference" && (
                  <div className="space-y-1.5 pt-2 relative">
                    <label className="text-[11px] font-black text-slate-700 block">تاریخ پایان (مقصد)</label>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {/* Day Input */}
                      <div className="space-y-1">
                        <select
                          value={ageEndDay}
                          onChange={(e) => setAgeEndDay(Number(e.target.value))}
                          className="w-full text-center px-1.5 py-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-mono font-bold text-slate-800 shadow-sm transition-colors cursor-pointer outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        >
                          {Array.from({ length: getJalaliMonthDays(Number(ageEndYear) || 1405, Number(ageEndMonth) || 1) }, (_, i) => i + 1).map((d) => (
                            <option key={d} value={d}>
                              {toPersianDigits(d.toString().padStart(2, '0'))} (روز)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Month Input */}
                      <div className="space-y-1">
                        <select
                          value={ageEndMonth}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setAgeEndMonth(val);
                            const maxD = getJalaliMonthDays(Number(ageEndYear) || 1405, val);
                            if (ageEndDay > maxD) {
                              setAgeEndDay(maxD);
                            }
                          }}
                          className="w-full text-center px-1 py-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-[11px] font-bold text-slate-800 shadow-sm transition-colors cursor-pointer outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        >
                          {JALALI_MONTH_NAMES.map((name, i) => (
                            <option key={name} value={i + 1}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Year Input */}
                      <div className="space-y-1">
                        <input
                          type="number"
                          min={1300}
                          max={1450}
                          value={ageEndYear || ""}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setAgeEndYear(val);
                            const maxD = getJalaliMonthDays(val, Number(ageEndMonth));
                            if (ageEndDay > maxD) {
                              setAgeEndDay(maxD);
                            }
                          }}
                          placeholder="سال (مثلا ۱۴۰۵)"
                          className="w-full text-center px-1 py-3.5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-mono font-bold text-slate-800 shadow-sm transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-slate-300"
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 font-bold block mt-1">
                      روز، ماه و سال پایان بازه زمانی مورد نظر را وارد کنید.
                    </p>
                  </div>
                )}

                {/* Calculate Actions button */}
                <button
                  type="button"
                  onClick={handleCalculateAge}
                  className="w-full mt-6 py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-2xl text-sm font-black transition-all shadow-md shadow-emerald-500/20 cursor-pointer select-none text-center"
                >
                  محاسبه
                </button>
              </>
            )}

            {activeTab === "mehrieh" && (
              <>
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                  مشخصات مهریه زوجه
                </h3>
                
                {/* Mehrieh Type Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => { setMehriehTab("cash"); setMehriehResult(null); }}
                    className={`flex-1 py-2 rounded-lg transition-all ${mehriehTab === "cash" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    وجه رایج
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMehriehTab("coin"); setMehriehResult(null); }}
                    className={`flex-1 py-2 rounded-lg transition-all ${mehriehTab === "coin" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    سکه طلا
                  </button>
                </div>

                {mehriehTab === "cash" ? (
                  <>
                    <p className="text-[10px] text-slate-400 font-bold mb-2">بر اساس شاخص تورمی رسمی سالانه بانک مرکزی جمهوری اسلامی ایران</p>
                    <div className="space-y-1.5 pt-2">
                      <label className="text-[11px] font-bold text-slate-500">مبلغ مهریه مصوب در عقدنامه (ریال)</label>
                      <input
                        type="text"
                        value={mehriehAmount}
                        onChange={(e) => handleAmountFormat(e.target.value, setMehriehAmount)}
                        placeholder="مثال: ۱۰,۰۰۰,۰۰۰"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500">سال عقد</label>
                        <select
                          value={marriageYear}
                          onChange={(e) => setMarriageYear(parseInt(e.target.value))}
                          className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                        >
                          {Object.keys(CBI_INFLATION_INDICES).map((year) => (
                            <option key={year} value={year}>
                              {toPersianDigits(year)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500">سال تادیه (مطالبه)</label>
                        <select
                          value={paymentYear}
                          onChange={(e) => setPaymentYear(parseInt(e.target.value))}
                          className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                        >
                          {Object.keys(CBI_INFLATION_INDICES).map((year) => (
                            <option key={year} value={year}>
                              {toPersianDigits(year)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] text-slate-400 font-bold mb-2">محاسبه به نرخ لحظه‌ای بازار طلا و سکه</p>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500">تعداد سکه</label>
                        <input
                          type="text"
                          value={mehriehCoinCount}
                          onChange={(e) => handleAmountFormat(e.target.value, setMehriehCoinCount)}
                          placeholder="مثال: ۱۰۰"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500">نوع سکه</label>
                        <select
                          value={mehriehCoinType}
                          onChange={(e) => setMehriehCoinType(e.target.value)}
                          className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-1 focus:ring-slate-900"
                        >
                          <option value="sekke">سکه امامی (طرح جدید)</option>
                          <option value="bahar">سکه بهار آزادی (طرح قدیم)</option>
                          <option value="nim">نیم سکه</option>
                          <option value="rob">ربع سکه</option>
                          <option value="gerami">سکه گرمی</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <button
                  onClick={handleCalculateMehrieh}
                  className="w-full mt-4 py-3 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white rounded-xl text-xs font-black select-none cursor-pointer transition duration-150"
                >
                  {mehriehTab === "cash" ? "محاسبه به نرخ روز بانک مرکزی" : "محاسبه قیمت سکه به نرخ روز"}
                </button>

                <button
                  type="button"
                  onClick={handleSyncCBI}
                  disabled={isSyncingCBI}
                  className={`w-full mt-2 py-2.5 px-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 border select-none cursor-pointer transition-all duration-150 ${
                    isSyncingCBI
                      ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-100 hover:border-sky-200"
                  }`}
                >
                  <Globe className={`w-3.5 h-3.5 text-sky-600 ${isSyncingCBI ? "animate-spin" : ""}`} />
                  {isSyncingCBI ? (mehriehTab === "coin" ? "در حال بروزرسانی از سایت‌های آنلاین..." : "در حال اتصال به بانک مرکزی و بروزرسانی...") : (mehriehTab === "cash" ? "بروزرسانی شاخص ها" : "بروزرسانی قیمت‌ها از سایت‌های معتبر")}
                </button>

                {cbiSyncSuccess && (
                  <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-green-850 text-[10px] font-bold text-right mt-2 leading-relaxed animate-fadeIn" dir="rtl">
                    <CheckCircle2 className="w-3.5 h-3.5 inline-block text-green-600 ml-1.5 align-middle" />
                    <span>{cbiSyncSuccess}</span>
                  </div>
                )}
              </>
            )}

            {activeTab === "diyeh" && (
              <>
                {/* 🌟 Screen 1: Header (Light Blue theme, back arrow, title) */}
                <div className="bg-[#0ea5e9] text-white px-5 py-3.5 -mx-6 -mt-6 rounded-t-3xl flex items-center justify-between shadow-sm select-none mb-4">
                  <button
                    onClick={() => setActiveTab("mehrieh")}
                    className="p-1 hover:bg-white/10 rounded-full transition flex items-center justify-center shrink-0"
                    title="بازگشت"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                  <h3 className="text-sm font-black text-white font-sans select-none">محاسبه دیه</h3>
                  <div className="w-5"></div>
                </div>

                {/* 🔍 نوار جستجوی اختصاصی دیات */}
                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-4 mb-4 space-y-2 relative" dir="rtl">
                  <label className="text-xs font-black text-slate-800 flex justify-start gap-1.5 items-center">
                    <Search className="w-4 h-4 text-[#0ea5e9] shrink-0" />
                    جستجوی سریع جراحات و مواد قانونی
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={injurySearchText}
                      onChange={(e) => setInjurySearchText(e.target.value)}
                      placeholder="نام عضو (مثلاً: بینی، چشم، دندان) یا شماره ماده (مثلاً: ۷۰۹)"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-right outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] shadow-sm"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                    {injurySearchText && (
                      <button
                        onClick={() => setInjurySearchText("")}
                        className="absolute left-3.5 top-3 text-slate-400 hover:text-slate-600 font-sans text-sm select-none cursor-pointer p-1"
                        type="button"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold text-right leading-relaxed mt-0.5">
                    با جستجوی عضو یا ماده قانونی، می‌توانید مستقیم جراحت مورد نظر خود را یافته و به لیست اضافه کنید.
                  </p>

                  {/* 📋 نتایج جستجو */}
                  {injurySearchText.trim().length >= 1 && (() => {
                    const norm = injurySearchText.trim();
                    const eng = toEnglishDigits(norm).toLowerCase();
                    const per = toPersianDigits(norm).toLowerCase();
                    const filtered = INJURY_DATABASE.filter(item => 
                      item.name.toLowerCase().includes(eng) ||
                      item.name.toLowerCase().includes(per) ||
                      item.category.toLowerCase().includes(eng) ||
                      item.category.toLowerCase().includes(per)
                    );

                    return (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-[280px] overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
                        {filtered.length > 0 ? (
                          filtered.map((injury) => {
                            const isAlreadySelected = selectedInjuries.some(x => x.id === injury.id);
                            return (
                              <div key={injury.id} className="p-3 hover:bg-slate-50 flex items-center justify-between text-right gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="text-[11px] font-black text-slate-800 line-clamp-2">{injury.name}</div>
                                  <div className="text-[9px] font-bold text-slate-400 mt-0.5">{injury.category}</div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] font-black bg-sky-50 text-[#0ea5e9] px-2 py-0.5 rounded-lg">
                                    {toPersianDigits(injury.percentage)}٪
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!isAlreadySelected) {
                                        setSelectedInjuries([...selectedInjuries, injury]);
                                      }
                                      if (selectedMethod !== "جنین" && selectedMethod !== "جنایت بر میت") {
                                        setSelectedMethod("اعضا، منافع، جراحات");
                                      }
                                      setInjurySearchText("");
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer select-none ${
                                      isAlreadySelected
                                        ? "bg-slate-100 text-slate-400"
                                        : "bg-[#0ea5e9] hover:bg-[#0284c7] text-white active:scale-95"
                                    }`}
                                  >
                                    {isAlreadySelected ? "افزوده شده" : "افزودن +"}
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-4 text-center text-xs font-bold text-slate-400">
                            موردی با این مشخصات یافت نشد.
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>



                {/* 📅 Date selection & Year (With editable day) */}
                <div className="space-y-3 pt-1">
                  {/* Years Select ("سال") */}
                  <div className="space-y-1" dir="rtl">
                    <label className="text-xs font-black text-slate-800 flex justify-start">سال وقوع حادثه</label>
                    <div className="relative">
                      <select
                        value={diyehYear}
                        onChange={(e) => setDiyehYear(parseInt(e.target.value))}
                        className="w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-right appearance-none outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] shadow-sm cursor-pointer"
                      >
                        {Object.keys(DIYEH_RATES).map(Number).sort((a, b) => b - a).map((yr) => {
                          let formattedLabel = "";
                          if (yr === 1405) {
                            formattedLabel = "۱۴۰۵ (سال جاری - ۲.۱ میلیارد تومان)";
                          } else {
                            const tomanAmount = DIYEH_RATES[yr] / 10000000;
                            formattedLabel = `${toPersianDigits(yr)} (${toPersianDigits(tomanAmount.toLocaleString("fa-IR"))} میلیون تومان)`;
                          }
                          return (
                            <option key={yr} value={yr}>
                              {formattedLabel}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed text-right mt-1">
                      با تغییر دادن این گزینه می توانید محاسبات خود را بر اساس مقررات سالهای مختلف انجام بدهید.
                    </p>
                  </div>

                  {/* Day & Month Selects (Editable accident day) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1" dir="rtl">
                      <label className="text-xs font-bold text-slate-700 flex justify-start">ماه وقوع حادثه</label>
                      <div className="relative">
                        <select
                          value={diyehMonth}
                          onChange={(e) => setDiyehMonth(parseInt(e.target.value))}
                          className="w-full pl-8 pr-3 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-right appearance-none outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] shadow-sm cursor-pointer"
                        >
                          <option value={1}>فروردین</option>
                          <option value={2}>اردیبهشت</option>
                          <option value={3}>خرداد</option>
                          <option value={4}>تیر</option>
                          <option value={5}>مرداد</option>
                          <option value={6}>شهریور</option>
                          <option value={7}>مهر</option>
                          <option value={8}>آبان</option>
                          <option value={9}>آذر</option>
                          <option value={10}>دی</option>
                          <option value={11}>بهمن</option>
                          <option value={12}>اسفند</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1" dir="rtl">
                      <label className="text-xs font-bold text-slate-700 flex justify-start">روز وقوع حادثه (قابل ویرایش)</label>
                      <input
                        type="text"
                        value={toPersianDigits(diyehDay.toString())}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            setDiyehDay("");
                          } else {
                            const cleaned = val.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString()).replace(/[^0-9]/g, "");
                            if (cleaned !== "") {
                              const parsed = parseInt(cleaned);
                              setDiyehDay(parsed > 31 ? 31 : (parsed < 1 ? 1 : parsed));
                            }
                          }
                        }}
                        onBlur={() => {
                          if (diyehDay === "" || isNaN(parseInt(diyehDay as string))) {
                            setDiyehDay(today.jd);
                          }
                        }}
                        placeholder="روز حادثه"
                        className="w-full px-3 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-center outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* ⚙️ Method dropdown trigger */}
                <div className="space-y-1" dir="rtl">
                  <label className="text-xs font-black text-slate-800 flex justify-start font-sans">نوع و روش</label>
                  <button
                    type="button"
                    onClick={() => {
                      setDiyehSearchQuery("");
                      setIsMethodModalOpen(true);
                    }}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-extrabold text-right flex items-center justify-between shadow-sm hover:border-slate-300 transition-all cursor-pointer select-none"
                  >
                    <span className="text-slate-800">{selectedMethod}</span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {/* 📝 Custom Inputs based on Method */}
                {selectedMethod === "درصدی" && (
                  <div className="space-y-1.5" dir="rtl">
                    <label className="text-xs font-bold text-slate-700 flex justify-start">درصد دیه مورد نظر (مثال: ۱۰۰ یا ۲.۵)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={diyehPercentInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDiyehPercentInput(toPersianDigits(val));
                        }}
                        placeholder="درصد مورد نظر از دیه کامل"
                        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-extrabold text-center placeholder-slate-400 outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] shadow-sm"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed text-center mt-1">
                      برای وارد کردن اعداد اعشاری می توانید از نقطه استفاده کنید. مثال : ۱.۵ (یک و نیم درصد)
                    </p>
                  </div>
                )}

                {selectedMethod === "کسری" && (
                  <div className="space-y-4" dir="rtl">
                    <label className="text-xs font-bold text-slate-700 flex justify-start">کسرهای مورد نظر از دیه کامل</label>
                    
                    {/* Outline container matching blue style */}
                    <div className="border border-sky-500/20 bg-sky-500/5 rounded-3xl p-5 space-y-4">
                      
                      {/* Dynamic fraction inputs list inside the container */}
                      <div className={`grid ${fractionInputs.length === 1 ? "grid-cols-1" : "grid-cols-2"} gap-3`}>
                        {fractionInputs.map((input, idx) => (
                          <div key={idx} className="relative">
                            <input
                              type="text"
                              value={input}
                              onFocus={() => setActiveFractionIndex(idx)}
                              onChange={(e) => {
                                const val = toPersianDigits(e.target.value);
                                setFractionInputs((prev) => {
                                  const next = [...prev];
                                  next[idx] = val;
                                  return next;
                                });
                              }}
                              placeholder={toPersianDigits("مثلاً ۱/۲")}
                              className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] rounded-2xl text-xs font-extrabold text-center outline-none shadow-sm transition"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Add and Remove buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setFractionInputs((prev) => [...prev, ""]);
                          }}
                          className="py-2.5 bg-[#0ea5e9] hover:bg-sky-600 active:scale-95 transition-all text-white font-extrabold text-xl rounded-2xl flex items-center justify-center shadow-sm select-none"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFractionInputs((prev) => {
                              if (prev.length <= 1) return prev;
                              return prev.slice(0, -1);
                            });
                          }}
                          className="py-2.5 bg-[#0ea5e9] hover:bg-sky-600 active:scale-95 transition-all text-white font-extrabold text-xl rounded-2xl flex items-center justify-center shadow-sm select-none"
                        >
                          −
                        </button>
                      </div>

                      {/* Quick Presets matching Screen 2: ۳/۱۰, ۸/۱۰, ۲/۱۰, ۲/۱۰۰۰, ۱.۵/۱۰۰۰ */}
                      <div className="space-y-1 mt-1">
                        <span className="text-[10px] font-extrabold text-slate-500 block text-right mb-1">انتخاب سریع از کسرهای قانونی:</span>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {[
                            { label: "۱.۵/۱۰۰۰", val: "۱.۵/۱۰۰۰" },
                            { label: "۲/۱۰۰۰", val: "۲/۱۰۰۰" },
                            { label: "۲/۱۰", val: "۲/۱۰" },
                            { label: "۸/۱۰", val: "۸/۱۰" },
                            { label: "۳/۱۰", val: "۳/۱۰" },
                            { label: "۱/۲ (نصف)", val: "۱/۲" },
                            { label: "۱/۳ (ثلث)", val: "۱/۳" },
                            { label: "۱/۴ (ربع)", val: "۱/۴" },
                            { label: "۱/۵ (خمس)", val: "۱/۵" },
                            { label: "۱/۱۰ (عشر)", val: "۱/۱۰" },
                            { label: "۱/۱۰۰", val: "۱/۱۰۰" },
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => {
                                setFractionInputs((prev) => {
                                  const next = [...prev];
                                  if (activeFractionIndex !== null && activeFractionIndex < next.length) {
                                    next[activeFractionIndex] = toPersianDigits(preset.val);
                                  } else {
                                    const emptyIdx = next.findIndex(v => !v.trim());
                                    if (emptyIdx !== -1) {
                                      next[emptyIdx] = toPersianDigits(preset.val);
                                    } else {
                                      next.push(toPersianDigits(preset.val));
                                    }
                                  }
                                  return next;
                                });
                              }}
                              className="px-2.5 py-1.5 text-[10px] font-extrabold border border-slate-200 rounded-full bg-white text-slate-700 hover:bg-sky-50 hover:border-sky-200 hover:text-sky-700 shadow-sm transition active:scale-95"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {selectedMethod === "دیه قتل" && (
                  <div className="space-y-3" dir="rtl">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 flex justify-start">جنسیت و نوع متوفی</label>
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col space-y-3">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input type="radio" name="murder_type" value="man" checked={murderType === "man"} onChange={(e) => setMurderType(e.target.value)} className="w-4 h-4 mt-0.5 text-[#0ea5e9] border-slate-300 focus:ring-[#0ea5e9]" />
                          <span className="text-xs font-bold text-slate-800">مرد</span>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input type="radio" name="murder_type" value="woman" checked={murderType === "woman"} onChange={(e) => setMurderType(e.target.value)} className="w-4 h-4 mt-0.5 text-[#0ea5e9] border-slate-300 focus:ring-[#0ea5e9]" />
                          <span className="text-xs font-bold text-slate-800">زن</span>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input type="radio" name="murder_type" value="hermaphrodite_man" checked={murderType === "hermaphrodite_man"} onChange={(e) => setMurderType(e.target.value)} className="w-4 h-4 mt-0.5 text-[#0ea5e9] border-slate-300 focus:ring-[#0ea5e9]" />
                          <span className="text-xs font-bold text-slate-800">خنثی ملحق به مرد</span>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input type="radio" name="murder_type" value="hermaphrodite_woman" checked={murderType === "hermaphrodite_woman"} onChange={(e) => setMurderType(e.target.value)} className="w-4 h-4 mt-0.5 text-[#0ea5e9] border-slate-300 focus:ring-[#0ea5e9]" />
                          <span className="text-xs font-bold text-slate-800">خنثی ملحق به زن</span>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input type="radio" name="murder_type" value="hermaphrodite_ambiguous" checked={murderType === "hermaphrodite_ambiguous"} onChange={(e) => setMurderType(e.target.value)} className="w-4 h-4 mt-0.5 text-[#0ea5e9] border-slate-300 focus:ring-[#0ea5e9]" />
                          <span className="text-xs font-bold text-slate-800">خنثی مشکل</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex justify-start">تعداد فقره های فوت (تعداد نفوس)</label>
                      <input
                        type="text"
                        value={murderCount}
                        onChange={(e) => setMurderCount(toPersianDigits(e.target.value))}
                        className="w-full px-3 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-center outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] shadow-sm"
                      />
                    </div>
                  </div>
                )}

                {selectedMethod === "جنین" && (
                  <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50" dir="rtl">
                    {INJURY_DATABASE.filter(item => item.id.startsWith("j")).map(item => (
                      <label key={item.id} className="flex items-start gap-2.5 cursor-pointer p-2 hover:bg-white rounded-xl transition">
                        <input
                          type="radio"
                          name="fetus_type"
                          value={item.id}
                          checked={fetusSelection === item.id}
                          onChange={(e) => setFetusSelection(e.target.value)}
                          className="w-4 h-4 mt-0.5 text-[#0ea5e9] border-slate-300 focus:ring-[#0ea5e9]"
                        />
                        <span className="text-xs font-bold text-slate-800 leading-relaxed">{item.name}</span>
                      </label>
                    ))}
                  </div>
                )}

                {selectedMethod === "جنایت بر میت" && (
                  <div className="space-y-3" dir="rtl">
                    <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50">
                      {INJURY_DATABASE.filter(item => item.id.startsWith("d")).map(item => (
                        <label key={item.id} className="flex items-start gap-2.5 cursor-pointer p-2 hover:bg-white rounded-xl transition">
                          <input
                            type="radio"
                            name="corpse_type"
                            value={item.id}
                            checked={corpseSelection === item.id}
                            onChange={(e) => setCorpseSelection(e.target.value)}
                            className="w-4 h-4 mt-0.5 text-[#0ea5e9] border-slate-300 focus:ring-[#0ea5e9]"
                          />
                          <span className="text-xs font-bold text-slate-800 leading-relaxed">{item.name}</span>
                        </label>
                      ))}
                    </div>

                    {(corpseSelection === "d6" || corpseSelection === "d7") && (
                      <div className="border border-blue-200 bg-blue-50/50 p-4 rounded-2xl space-y-2 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-extrabold text-blue-900 block">
                            درصد دیه یا ارش این آسیب در انسان زنده:
                          </label>
                          <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-md">
                            ماده ۷۲۳ قانون مجازات
                          </span>
                        </div>
                        <div className="relative group">
                          <input
                            type="text"
                            value={corpseLivingPercentage}
                            onChange={(e) => setCorpseLivingPercentage(e.target.value)}
                            placeholder="مثلاً: ۱۰"
                            className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-blue-600 transition-all text-right"
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">
                            درصد (٪)
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                          طبق ماده ۷۲۳ قانون مجازات اسلامی، دیه این جنایت بر میت معادل <span className="font-bold text-blue-700">یک‌دهم (۱/۱۰)</span> دیه یا ارش آن در انسان زنده خواهد بود که برابر است با:{" "}
                          <span className="font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                            {(() => {
                              const engPct = toEnglishDigits(corpseLivingPercentage).replace(/[^0-9.]/g, "");
                              const pct = parseFloat(engPct) || 0;
                              return toPersianDigits((pct / 10).toString());
                            })()}٪ دیه کامل
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedMethod === "اعضا، منافع، جراحات" && (
                  <div className="space-y-3" dir="rtl">
                    {/* Added Injuries List */}
                    {selectedInjuries.length > 0 ? (
                      <div className="border border-slate-150 rounded-2xl p-2.5 bg-slate-50 space-y-2 max-h-[160px] overflow-y-auto">
                        {selectedInjuries.map((injury) => (
                          <div key={injury.id} className="flex items-center justify-between bg-white px-2.5 py-2 rounded-xl border border-slate-100 text-[10.5px] font-bold text-right gap-1.5 animate-fadeIn">
                            <button
                              type="button"
                              onClick={() => setSelectedInjuries(selectedInjuries.filter(x => x.id !== injury.id))}
                              className="p-1 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-slate-700 flex-1 truncate">{injury.name}</span>
                            <span className="text-sky-600 font-extrabold shrink-0 bg-sky-50 px-1.5 py-0.5 rounded-md">
                              {toPersianDigits(injury.percentage)}٪
                            </span>
                          </div>
                        ))}
                        <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[11px] font-extrabold text-slate-800 px-1">
                          <span>جمع کل درصد آسیب بدنی:</span>
                          <span className="text-[#0ea5e9]">
                            {toPersianDigits(parseFloat((selectedInjuries.reduce((s, i) => s + i.percentage, 0)).toFixed(4)))} درصد
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-5 text-center text-[10px] text-slate-400 font-bold bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                        هیچ جراحت یا آسیبی اضافه نشده است. آسیب‌های مورد نظر را از طریق جستجوی بالا انتخاب کنید.
                      </div>
                    )}
                  </div>
                )}

                {/* 🕋 Sacred month toggle/notice box */}
                <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-100 flex items-start gap-2.5" dir="rtl">
                  <input
                    type="checkbox"
                    id="sacred_month"
                    checked={isSacredMonth}
                    onChange={(e) => setIsSacredMonth(e.target.checked)}
                    className="mt-1 font-sans text-[#0ea5e9] rounded focus:ring-[#0ea5e9] w-4 h-4 border-slate-300 accent-[#0ea5e9] cursor-pointer shrink-0"
                  />
                  <div className="text-[10.5px] leading-relaxed text-slate-650 font-bold text-right">
                    <label htmlFor="sacred_month" className="font-extrabold cursor-pointer text-amber-950">
                      جنایت در ماه‌های حرام رخ داده است؟ (تغلیظ دیه)
                    </label>
                    <p className="mt-0.5 text-slate-500 font-semibold text-[9.5px]">
                      بر اساس قانون مجازات اسلامی، ماه‌های رجب، ذی‌القعده، ذی‌الحجه، و محرم ماه‌های حرام هستند که در صورت فوت متوفی، ثلث دیه کامل (۷۰۰ میلیون تومان در سال ۱۴۰۵) به دیه اصلی افزوده می‌شود (جمعاً ۲.۸ میلیارد تومان).
                    </p>
                  </div>
                </div>

                {/* 🚀 Active calculate button */}
                <button
                  onClick={handleCalculateDiyeh}
                  className="w-full py-3.5 bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-2xl text-xs font-extrabold shadow-md hover:shadow-lg transition duration-200 cursor-pointer select-none"
                >
                  محاسبه
                </button>

                <button
                  type="button"
                  onClick={handleSyncDiyeh}
                  disabled={isSyncingDiyeh}
                  className={`w-full mt-2 py-2.5 px-3 rounded-2xl text-[11px] font-black flex items-center justify-center gap-1.5 border select-none cursor-pointer transition-all duration-150 ${
                    isSyncingDiyeh
                      ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "bg-[#f0fcfd] text-[#008394] hover:bg-[#e0f7fa] border-[#b2ebf2] hover:border-[#80deea]"
                  }`}
                >
                  <Globe className={`w-3.5 h-3.5 text-[#008394] ${isSyncingDiyeh ? "animate-spin" : ""}`} />
                  {isSyncingDiyeh ? "در حال استعلام نرخ دیه..." : "استعلام و بروزرسانی خودکار مبلغ دیه از پورتال عدل ایران (بدون خروج)"}
                </button>

                {diyehSyncSuccess && (
                  <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl text-teal-850 text-[10px] font-bold text-right mt-2 leading-relaxed animate-fadeIn" dir="rtl">
                    <CheckCircle2 className="w-3.5 h-3.5 inline-block text-teal-600 ml-1.5 align-middle" />
                    <span>{diyehSyncSuccess}</span>
                  </div>
                )}


                {/* 🔍 Screen 2: METHOD POPOVER MODAL */}
                {isMethodModalOpen && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
                    <div className="bg-white rounded-[32px] w-full max-w-sm border border-slate-100 shadow-2xl overflow-hidden p-5 relative animate-scaleIn">
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                        <span className="text-xs font-extrabold text-slate-800">روش محاسبه را انتخاب کنید</span>
                        <button
                          onClick={() => setIsMethodModalOpen(false)}
                          className="p-1.5 hover:bg-slate-100 rounded-full transition text-[18px] text-slate-400 hover:text-slate-600 outline-none"
                          title="بستن"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Dropdown search field */}
                      <div className="relative mb-3.5">
                        <input
                          type="text"
                          value={diyehSearchQuery}
                          onChange={(e) => setDiyehSearchQuery(e.target.value)}
                          placeholder="جستجو کنید ... "
                          className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold text-right outline-none focus:bg-white focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                      </div>

                      {/* Selectable Items (ALL UNLOCKED) */}
                      <div className="space-y-2 max-h-[250px] overflow-y-auto">
                        {[
                          { id: "درصدی", label: "درصدی" },
                          { id: "کسری", label: "کسری" },
                          { id: "دیه قتل", label: "دیه قتل" },
                          { id: "جنین", label: "جنین" },
                          { id: "جنایت بر میت", label: "جنایت بر میت" },
                          { id: "اعضا، منافع، جراحات", label: "اعضا، منافع، جراحات" }
                        ]
                          .filter(m => m.label.includes(diyehSearchQuery))
                          .map((item) => {
                            const isSelected = selectedMethod === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setSelectedMethod(item.id);
                                  setIsMethodModalOpen(false);
                                }}
                                className={`w-full p-4 rounded-2xl border text-right flex items-center justify-between transition-all duration-150 hover:bg-slate-50 cursor-pointer select-none outline-none ${
                                  isSelected
                                    ? "border-[#0ea5e9] bg-[#f0f9ff] text-[#0369a1]"
                                    : "border-slate-200 bg-white text-slate-700"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isSelected && <Check className="w-4 h-4 text-[#0ea5e9]" />}
                                </div>
                                <span className="text-[11.5px] font-black">{item.label}</span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "court" && (
              <>
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-500 shrink-0" />
                  مشخصات خواسته دعوی
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">محاسبه دقیق هزینه‌های دادرسی بر اساس نرخ روز قوه قضاییه</p>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] font-bold text-slate-500">نوع دعوی و مرحله دادرسی</label>
                  <select
                    value={courtStage}
                    onChange={(e) => setCourtStage(e.target.value as any)}
                    className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="first_instance">مرحله بدوی حقوقی (۲.۵٪ الی ۳.۵٪)</option>
                    <option value="appeal">واخواهی و تجدیدنظر خواهی (۴.۵٪)</option>
                    <option value="supreme_court">دیوان عالی، اعاده دادرسی و ثالث (۵.۵٪)</option>
                    <option value="non_financial">خواسته بدون تقویم مالی (هزینه ثابت ثبتی)</option>
                  </select>
                </div>

                {courtStage !== "non_financial" && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">بهای خواسته / ارزش مالی پرونده (ریال)</label>
                    <input
                      type="text"
                      value={claimAmountForCourt}
                      onChange={(e) => handleAmountFormat(e.target.value, setClaimAmountForCourt)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                      placeholder="مثلاً: ۵۰۰,۰۰۰,۰۰۰"
                    />
                  </div>
                )}

                <button
                  onClick={handleCalculateCourt}
                  className="w-full py-3 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white rounded-xl text-xs font-black select-none cursor-pointer transition duration-150"
                >
                  محاسبه هزینه دادرسی
                </button>
              </>
            )}

            {activeTab === "lawyer_comprehensive" && (
              <>
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-500 shrink-0" />
                  محاسبه جامع هزینه دادرسی و حق‌الوکاله
                </h3>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] font-bold text-slate-500">مرحله رسیدگی</label>
                  <select
                    value={compStage}
                    onChange={(e) => setCompStage(e.target.value as any)}
                    className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="first_instance">مرحله بدوی (نخستین)</option>
                    <option value="appeal">مرحله تجدیدنظر</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">نوع دعوا</label>
                    <select
                      value={compIsFinancial ? "yes" : "no"}
                      onChange={(e) => setCompIsFinancial(e.target.value === "yes")}
                      className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="yes">مالی</option>
                      <option value="no">غیرمالی</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">تخصص وکیل</label>
                    <select
                      value={compHasSpecialty ? "yes" : "no"}
                      onChange={(e) => setCompHasSpecialty(e.target.value === "yes")}
                      className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="no">عادی</option>
                      <option value="yes">دارای گواهی تخصصی (۱۰٪ اضافه)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100">
                  <label className="text-[11px] font-bold text-slate-500">
                    بهای خواسته / مبلغ (ریال)
                  </label>
                  <input
                    type="text"
                    value={compClaimAmount}
                    onChange={(e) => handleAmountFormat(e.target.value, setCompClaimAmount)}
                    className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:ring-1 focus:ring-slate-900 text-left dir-ltr"
                    placeholder="مثلاً: ۲,۵۰۰,۰۰۰,۰۰۰"
                    disabled={!compIsFinancial}
                  />
                </div>

                <button
                  onClick={handleCalculateComp}
                  className="w-full py-3.5 mt-2 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white rounded-xl text-xs font-black select-none cursor-pointer transition duration-150"
                >
                  محاسبه هزینه‌های قانونی
                </button>
              </>
            )}

            {activeTab === "lawyer" && (
              <>
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-500 shrink-0" />
                  محاسبه حق‌الوکاله و تمبر مالیاتی
                </h3>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] font-bold text-slate-500">موضوع</label>
                  <select
                    value={lawyerSubject}
                    onChange={(e) => setLawyerSubject(e.target.value as any)}
                    className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="fee">حق الوکاله</option>
                    <option value="tax_stamp_bar">تمبر مالیاتی کانون وکلای دادگستری</option>
                    <option value="tax_stamp_center">تمبر مالیاتی مرکز وکلا قوه قضاییه</option>
                  </select>
                </div>

                {(lawyerSubject === "tax_stamp_bar" || lawyerSubject === "tax_stamp_center") && (
                  <div className="space-y-1.5 mt-2">
                    <label className="text-[11px] font-bold text-slate-500">محاسبه براساس:</label>
                    <select
                      value={lawyerTaxBasis}
                      onChange={(e) => setLawyerTaxBasis(e.target.value as any)}
                      className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="tariff">تعرفه (درصد قانونی بر مبنای بهای خواسته)</option>
                      <option value="fee_amount">مبلغ کل حق‌الوکاله تعینی</option>
                      <option value="tax_stamp_amount">ورود مستقیم مبلغ تمبر مالیاتی ابطالی</option>
                    </select>
                  </div>
                )}

                {lawyerTaxBasis !== "tax_stamp_amount" && (
                  <>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500">نوع دعوا</label>
                        <select
                          value={lawyerCaseType}
                          onChange={(e) => setLawyerCaseType(e.target.value)}
                          className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                        >
                          <option value="financial">مالی</option>
                          <option value="family_non_financial">امور حسبی، دعاوی خانوادگی و غیرمالی</option>
                          <option value="criminal">کیفری</option>
                          <option value="other">سایر</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500">نتیجه دعوا</label>
                        <select
                          value={lawyerResultType}
                          onChange={(e) => setLawyerResultType(e.target.value)}
                          className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-1 focus:ring-slate-900"
                        >
                          <option value="-">-</option>
                          <option value="order_cancel_before_defense">قرار ابطال دادخواست پیش از پاسخ و دفاع از دعوا</option>
                          <option value="order_cancel_after_defense">قرار ابطال دادخواست پس از پاسخ و دفاع از دعوا</option>
                          <option value="order_fall_before_defense">قرار سقوط دعوا تجدیدنظر قبل از پاسخ و دفاع از دعوا</option>
                          <option value="order_fall_after_defense">قرار سقوط دعوا تجدیدنظر پس از پاسخ و دفاع از دعوا</option>
                          <option value="order_reject_timeout">قرار رد دعوا به علت قبول ایراد مرور زمان</option>
                          <option value="order_reject_retrial">قرار رد تقاضای اعاده دادرسی</option>
                          <option value="order_reject_res_judicata">قرار رد دعوا بعلت اعتبار امر مختومه</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5 mt-3">
                      <label className="text-[11px] font-bold text-slate-500">گواهی تخصصی</label>
                      <select
                        value={lawyerHasSpecialty ? "yes" : "no"}
                        onChange={(e) => setLawyerHasSpecialty(e.target.value === "yes")}
                        className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                      >
                        <option value="no">وکیل گواهی وکالت تخصصی ندارد.</option>
                        <option value="yes">وکیل دارای گواهی وکالت تخصصی است.</option>
                      </select>
                    </div>

                    <div className="space-y-3 mt-3">
                      <div className="space-y-1.5 border-b border-slate-100 pb-2">
                        <label className="text-[11px] font-black text-slate-600 block">تعداد روزهای ماموریت داخل استان:</label>
                        <input
                          type="text"
                          value={lawyerInsideProvinceDays}
                          onChange={(e) => setLawyerInsideProvinceDays(toPersianDigits(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900 text-center"
                          placeholder="به طور مثال: ۵"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-slate-600 block">تعداد روزهای ماموریت خارج استان:</label>
                        <input
                          type="text"
                          value={lawyerOutsideProvinceDays}
                          onChange={(e) => setLawyerOutsideProvinceDays(toPersianDigits(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900 text-center"
                          placeholder="به طور مثال: ۵"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 mt-3 pt-2">
                      <div
                        role="button"
                        tabIndex={0}
                        className="flex items-center gap-3 cursor-pointer group outline-none"
                        onClick={() => setLawyerAfterAnnulment(!lawyerAfterAnnulment)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLawyerAfterAnnulment(!lawyerAfterAnnulment); } }}
                      >
                        <div className={`relative w-8 h-4 rounded-full transition-colors duration-200 ease-in-out ${lawyerAfterAnnulment ? 'bg-amber-500' : 'bg-slate-300'}`}>
                          <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ease-in-out ${lawyerAfterAnnulment ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 group-hover:text-slate-900">پس از نقض در دیوانعالی کشور یا مرجع تجدیدنظر</span>
                      </div>

                      <div
                        role="button"
                        tabIndex={0}
                        className="flex items-center gap-3 cursor-pointer group outline-none"
                        onClick={() => setLawyerFreeAid(!lawyerFreeAid)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLawyerFreeAid(!lawyerFreeAid); } }}
                      >
                        <div className={`relative w-8 h-4 rounded-full transition-colors duration-200 ease-in-out ${lawyerFreeAid ? 'bg-amber-500' : 'bg-slate-300'}`}>
                          <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ease-in-out ${lawyerFreeAid ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 group-hover:text-slate-900">وکالت تسخیری / معاضدتی</span>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100">
                  <label className="text-[11px] font-bold text-slate-500">
                    {lawyerTaxBasis === "fee_amount" 
                      ? "مبلغ حق‌الوکاله (ریال)" 
                      : lawyerTaxBasis === "tax_stamp_amount"
                      ? "مبلغ ابطالی تمبر مالیاتی مستقیم (ریال)"
                      : "بهای خواسته / مبلغ (ریال)"}
                  </label>
                  <input
                    type="text"
                    value={lawyerClaimAmount}
                    onChange={(e) => handleAmountFormat(e.target.value, setLawyerClaimAmount)}
                    className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:ring-1 focus:ring-slate-900 text-left dir-ltr"
                    placeholder={lawyerTaxBasis === "tax_stamp_amount" ? "مثلاً: ۴۳۵,۰۰۰,۰۰۰" : "مثلاً: ۲,۵۰۰,۰۰۰,۰۰۰"}
                  />
                </div>

                <button
                  onClick={handleCalculateLawyer}
                  className="w-full py-3.5 mt-2 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white rounded-xl text-xs font-black select-none cursor-pointer transition duration-150"
                >
                  محاسبه
                </button>
              </>
            )}

            {activeTab === "deadlines" && (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    محاسبه مواعد قانونی و قضایی
                  </h3>
                  <button 
                    onClick={() => setShowDeadlineRules(true)}
                    className="text-[10px] text-amber-600 hover:text-amber-800 hover:bg-amber-100 transition-colors font-bold bg-amber-50 px-2 py-1 rounded-md"
                  >
                    مقررات محاسبه
                  </button>
                </div>

                <div className="space-y-1.5 mt-2">
                  <label className="text-[11px] font-bold text-slate-500">دسته بندی</label>
                  <select
                    value={deadlineCategory}
                    onChange={(e) => {
                      const newCat = e.target.value as "civil" | "criminal" | "execution";
                      setDeadlineCategory(newCat);
                      if (newCat === "civil") setDeadlineType(civilDeadlines[0].title);
                      else if (newCat === "criminal") setDeadlineType(criminalDeadlines[0].title);
                      else setDeadlineType(executionDeadlines[0].title);
                    }}
                    className="w-full px-2 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900 appearance-none"
                  >
                    <option value="civil">آئین دادرسی مدنی</option>
                    <option value="criminal">آئین دادرسی کیفری</option>
                    <option value="execution">اجرای احکام مدنی</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-slate-500">نوع مهلت قانونی</label>
                      <div className="flex items-center gap-2">
                        {deadlineSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setDeadlineSearchQuery("")}
                            className="text-[9px] text-slate-400 hover:text-slate-600 font-bold"
                          >
                            پاک کردن جستجو
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleClearDeadline}
                          className="text-[10px] text-red-600 hover:text-red-700 font-bold px-2 py-0.5 rounded border border-red-200 bg-red-50"
                        >
                          پاک کردن
                        </button>
                      </div>
                    </div>
                    {/* Search input above the select box */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="جستجو کردن در مهلت‌ها..."
                        value={deadlineSearchQuery}
                        onChange={(e) => {
                          const query = e.target.value;
                          setDeadlineSearchQuery(query);
                          // Auto-select first matching option if available
                          const filtered = currentDeadlineOptions.filter(opt =>
                            opt.title.toLowerCase().includes(query.toLowerCase())
                          );
                          if (filtered.length > 0 && !filtered.some(f => f.title === deadlineType)) {
                            setDeadlineType(filtered[0].title);
                          }
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                    <select
                      value={deadlineType}
                      onChange={(e) => {
                        setDeadlineType(e.target.value);
                        setJudicialDaysInput("");
                      }}
                      className="w-full px-2 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900 appearance-none"
                    >
                      {currentDeadlineOptions.filter(opt =>
                        opt.title.toLowerCase().includes(deadlineSearchQuery.toLowerCase())
                      ).length > 0 ? (
                        currentDeadlineOptions.filter(opt =>
                          opt.title.toLowerCase().includes(deadlineSearchQuery.toLowerCase())
                        ).map((opt) => (
                          <option key={opt.title} value={opt.title}>{opt.title}</option>
                        ))
                      ) : (
                        <option value="">موردی یافت نشد</option>
                      )}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 text-amber-600">مهلت قضایی (سفارشی)</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="عدد روز ..."
                        value={judicialDaysInput}
                        onChange={(e) => {
                          const val = toEnglishDigits(e.target.value).replace(/\D/g, "");
                          setJudicialDaysInput(val);
                          if (val) setDeadlineType("judicial_deadline_custom");
                        }}
                        className="w-full px-2 py-3 bg-white border border-amber-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-amber-500 text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 mt-2">
                   <label className="text-[11px] font-bold text-slate-500">تاریخ ابلاغ</label>
                   <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">روز</label>
                      <input
                        type="text"
                        value={deadlineBaseDay}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || /^[0-9۰-۹]+$/.test(val)) {
                            setDeadlineBaseDay(val);
                          }
                        }}
                        className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">ماه</label>
                      <select
                        value={deadlineBaseMonth}
                        onChange={(e) => setDeadlineBaseMonth(parseInt(e.target.value))}
                        className="w-full px-1 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-1 focus:ring-slate-900"
                      >
                        <option value={1}>فروردین</option>
                        <option value={2}>اردیبهشت</option>
                        <option value={3}>خرداد</option>
                        <option value={4}>تیر</option>
                        <option value={5}>مرداد</option>
                        <option value={6}>شهریور</option>
                        <option value={7}>مهر</option>
                        <option value={8}>آبان</option>
                        <option value={9}>آذر</option>
                        <option value={10}>دی</option>
                        <option value={11}>بهمن</option>
                        <option value={12}>اسفند</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">سال</label>
                      <input
                        type="text"
                        value={deadlineBaseYear}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || /^[0-9۰-۹]+$/.test(val)) {
                            setDeadlineBaseYear(val);
                          }
                        }}
                        className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mt-4 pt-2 border-t border-slate-100">
                  <div
                    role="button"
                    tabIndex={0}
                    id="deadline-include-abroad-toggle"
                    className="flex items-center gap-3 cursor-pointer group outline-none select-none"
                    onClick={() => setDeadlineIncludeAbroad(!deadlineIncludeAbroad)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDeadlineIncludeAbroad(!deadlineIncludeAbroad); } }}
                  >
                    <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ease-in-out ${deadlineIncludeAbroad ? 'bg-amber-500' : 'bg-slate-300'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${deadlineIncludeAbroad ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">حداقل یکی از مخاطبین مقیم خارج است</span>
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    id="deadline-include-thursdays-toggle"
                    className="flex items-center gap-3 cursor-pointer group outline-none select-none"
                    onClick={() => setDeadlineIncludeThursdays(!deadlineIncludeThursdays)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDeadlineIncludeThursdays(!deadlineIncludeThursdays); } }}
                  >
                    <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ease-in-out ${deadlineIncludeThursdays ? 'bg-amber-500' : 'bg-slate-300'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${deadlineIncludeThursdays ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">پنجشنبه ها روز تعطیل محسوب شود</span>
                  </div>
                </div>

                <button
                  onClick={handleCalculateDeadlines}
                  className="w-full mt-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl text-xs font-black select-none cursor-pointer transition duration-150"
                >
                  محاسبه
                </button>
              </>
            )}

            {activeTab === "erth" && (
              <>
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-500 shrink-0" />
                  محاسبه تقسیم ارث و ترکه (قانون مدنی)
                </h3>


                {/* Marital Status dropdown section */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] font-bold text-slate-500">تاهل متوفی</label>
                  <select
                    value={erthMarryStatus}
                    onChange={(e) => setErthMarryStatus(e.target.value as any)}
                    className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="single">مجرد</option>
                    <option value="husband">دارای زوج (شوهر)</option>
                    <option value="wife">دارای زوجه (زن)</option>
                  </select>
                </div>

                {/* --- CLASS 1 Accordion --- */}
                <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setErthClass1Open(!erthClass1Open)}
                    className="w-full bg-slate-50 px-3.5 py-3 flex items-center justify-between text-xs font-black text-slate-800 border-b border-slate-150 select-none cursor-pointer hover:bg-slate-100/75 duration-100"
                  >
                    <span>طبقه اول ارث (پدر، مادر، فرزند و نوه)</span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${erthClass1Open ? "rotate-180" : ""}`} />
                  </button>
                  {erthClass1Open && (
                    <div className="p-3 bg-white space-y-3.5 animate-fadeIn">
                      {/* Father Alive Switch */}
                      <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl border border-slate-150">
                        <span className="text-[11px] font-bold text-slate-700">پدر متوفی زنده است</span>
                        <button
                          type="button"
                          onClick={() => setErthFatherAlive(!erthFatherAlive)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                            erthFatherAlive ? "bg-sky-500" : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
                              erthFatherAlive ? "translate-x-[-16px]" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Mother Alive Switch */}
                      <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl border border-slate-150">
                        <span className="text-[11px] font-bold text-slate-700">مادر متوفی زنده است</span>
                        <button
                          type="button"
                          onClick={() => setErthMotherAlive(!erthMotherAlive)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                            erthMotherAlive ? "bg-sky-500" : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
                              erthMotherAlive ? "translate-x-[-16px]" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Sons counter */}
                      <div className="flex items-center justify-between gap-4 py-1">
                        <div className="flex-1">
                          <span className="text-[11px] font-bold text-slate-700 block">تعداد پسران</span>
                          <span className="text-[9px] text-slate-400 block font-semibold">پسران زنده متوفی</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setErthSonsCount(Math.max(0, erthSonsCount - 1))}
                            type="button"
                            className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-black font-mono bg-slate-50 border border-slate-200 py-1 rounded-md">{toPersianDigits(erthSonsCount)}</span>
                          <button
                            onClick={() => setErthSonsCount(erthSonsCount + 1)}
                            type="button"
                            className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Daughters counter */}
                      <div className="flex items-center justify-between gap-4 py-1">
                        <div className="flex-1">
                          <span className="text-[11px] font-bold text-slate-700 block">تعداد دختران</span>
                          <span className="text-[9px] text-slate-400 block font-semibold">دختران زنده متوفی</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setErthDaughtersCount(Math.max(0, erthDaughtersCount - 1))}
                            type="button"
                            className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-black font-mono bg-slate-50 border border-slate-200 py-1 rounded-md">{toPersianDigits(erthDaughtersCount)}</span>
                          <button
                            onClick={() => setErthDaughtersCount(erthDaughtersCount + 1)}
                            type="button"
                            className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Grandchildren representation list (ارث نوه) */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <span className="text-[10px] font-black text-slate-600 block">ارث نوه (قائم مقامی)</span>
                        <p className="text-[9px] text-slate-400 font-bold leading-relaxed">این بخش برای حالت قائم مقامی (ارث نوه) است. برای هر فرزند فوت شده متوفی یک شاخه اضافه کنید و تعداد نوه‌های همان شاخه را وارد نمایید.</p>
                        
                        {erthGrandchildren.map((branch, index) => (
                          <div key={branch.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2 relative">
                            <span className="text-[10px] font-bold text-slate-600 block">شاخه فرزند فوت شده {toPersianDigits(index + 1)}:</span>
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={branch.gender}
                                onChange={(e) => {
                                  const updated = [...erthGrandchildren];
                                  updated[index].gender = e.target.value as any;
                                  setErthGrandchildren(updated);
                                }}
                                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold outline-none"
                              >
                                <option value="son">فرزند(پسر) فوت شده</option>
                                <option value="daughter">فرزند(دختر) فوت شده</option>
                              </select>
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-[9px] text-slate-400 font-bold ml-1">تعداد نوه:</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...erthGrandchildren];
                                      updated[index].grandchildrenCount = Math.max(1, branch.grandchildrenCount - 1);
                                      setErthGrandchildren(updated);
                                    }}
                                    className="w-5 h-5 bg-slate-200 rounded flex items-center justify-center text-[10px] font-bold text-slate-700 hover:bg-slate-300 select-none cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={toPersianDigits(branch.grandchildrenCount)}
                                    onChange={(e) => {
                                      const val = parsePersianInput(e.target.value);
                                      if (!isNaN(val)) {
                                        const updated = [...erthGrandchildren];
                                        updated[index].grandchildrenCount = val;
                                        setErthGrandchildren(updated);
                                      }
                                    }}
                                    className="w-7 p-0 bg-white border border-slate-200 rounded text-[11px] font-black text-center outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...erthGrandchildren];
                                      updated[index].grandchildrenCount = branch.grandchildrenCount + 1;
                                      setErthGrandchildren(updated);
                                    }}
                                    className="w-5 h-5 bg-slate-200 rounded flex items-center justify-center text-[10px] font-bold text-slate-700 hover:bg-slate-300 select-none cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = erthGrandchildren.filter(g => g.id !== branch.id);
                                setErthGrandchildren(updated);
                              }}
                              className="absolute top-2 left-2 text-red-500 hover:text-red-700 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => {
                            setErthGrandchildren([
                              ...erthGrandchildren,
                              { id: `g_${Date.now()}_${Math.random()}`, gender: "son", grandchildrenCount: 1 }
                            ]);
                          }}
                          className="w-full py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-dashed border-sky-200 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer duration-100"
                        >
                          <Plus className="w-3.5 h-3.5 shrink-0" />
                          افزودن شاخه فرزند فوت شده
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* --- CLASS 2 Accordion --- */}
                <div className="border border-slate-200/80 rounded-2xl overflow-hidden mt-2">
                  <button
                    type="button"
                    onClick={() => setErthClass2Open(!erthClass2Open)}
                    className="w-full bg-slate-50 px-3.5 py-3 flex items-center justify-between text-xs font-black text-slate-800 border-b border-slate-150 select-none cursor-pointer hover:bg-slate-100/75 duration-100"
                  >
                    <span>طبقه دوم ارث (اجداد و خواهر/برادران)</span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${erthClass2Open ? "rotate-180" : ""}`} />
                  </button>
                  {erthClass2Open && (
                    <div className="p-3 bg-white space-y-3 animate-fadeIn">
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {/* Paternal Grandfather */}
                        <div className="flex flex-col p-2 bg-slate-50/50 rounded-xl border border-slate-150 gap-1.5">
                          <span className="text-[10px] font-bold text-slate-700 leading-tight">پدربزرگ پدری (جد ابی)</span>
                          <button
                            type="button"
                            onClick={() => setErthPaternalGrandfather(!erthPaternalGrandfather)}
                            className={`w-full py-1 rounded-lg text-[10px] font-bold duration-150 ${
                              erthPaternalGrandfather ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {erthPaternalGrandfather ? "زنده است" : "فوت کرده"}
                          </button>
                        </div>

                        {/* Paternal Grandmother */}
                        <div className="flex flex-col p-2 bg-slate-50/50 rounded-xl border border-slate-150 gap-1.5">
                          <span className="text-[10px] font-bold text-slate-700 leading-tight">مادربزرگ پدری (جده ابی)</span>
                          <button
                            type="button"
                            onClick={() => setErthPaternalGrandmother(!erthPaternalGrandmother)}
                            className={`w-full py-1 rounded-lg text-[10px] font-bold duration-150 ${
                              erthPaternalGrandmother ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {erthPaternalGrandmother ? "زنده است" : "فوت کرده"}
                          </button>
                        </div>

                        {/* Maternal Grandfather */}
                        <div className="flex flex-col p-2 bg-slate-50/50 rounded-xl border border-slate-150 gap-1.5">
                          <span className="text-[10px] font-bold text-slate-700 leading-tight">پدربزرگ مادری (جد امی)</span>
                          <button
                            type="button"
                            onClick={() => setErthMaternalGrandfather(!erthMaternalGrandfather)}
                            className={`w-full py-1 rounded-lg text-[10px] font-bold duration-150 ${
                              erthMaternalGrandfather ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {erthMaternalGrandfather ? "زنده است" : "فوت کرده"}
                          </button>
                        </div>

                        {/* Maternal Grandmother */}
                        <div className="flex flex-col p-2 bg-slate-50/50 rounded-xl border border-slate-150 gap-1.5">
                          <span className="text-[10px] font-bold text-slate-700 leading-tight">مادربزرگ مادری (جده امی)</span>
                          <button
                            type="button"
                            onClick={() => setErthMaternalGrandmother(!erthMaternalGrandmother)}
                            className={`w-full py-1 rounded-lg text-[10px] font-bold duration-150 ${
                              erthMaternalGrandmother ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {erthMaternalGrandmother ? "زنده است" : "فوت کرده"}
                          </button>
                        </div>
                      </div>

                      {/* brothersFull counter */}
                      <div className="flex items-center justify-between gap-4 py-1 border-t border-slate-100 pt-2">
                        <div className="flex-1">
                          <span className="text-[11px] font-bold text-slate-700 block">برادر ابوینی (پدر و مادر مشترک)</span>
                          <span className="text-[9px] text-slate-400 block font-semibold">تعداد برادران ابوینی زنده</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setErthBrothersFull(Math.max(0, erthBrothersFull - 1))}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <span className="w-7 text-center text-xs font-black font-mono bg-slate-50 border border-slate-200 py-0.5 rounded">{toPersianDigits(erthBrothersFull)}</span>
                          <button
                            onClick={() => setErthBrothersFull(erthBrothersFull + 1)}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* sistersFull counter */}
                      <div className="flex items-center justify-between gap-4 py-1">
                        <div className="flex-1">
                          <span className="text-[11px] font-bold text-slate-700 block">خواهر ابوینی (پدر و مادر مشترک)</span>
                          <span className="text-[9px] text-slate-400 block font-semibold">تعداد خواهران ابوینی زنده</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setErthSistersFull(Math.max(0, erthSistersFull - 1))}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <span className="w-7 text-center text-xs font-black font-mono bg-slate-50 border border-slate-200 py-0.5 rounded">{toPersianDigits(erthSistersFull)}</span>
                          <button
                            onClick={() => setErthSistersFull(erthSistersFull + 1)}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* brothersPaternal counter */}
                      <div className="flex items-center justify-between gap-4 py-1">
                        <div className="flex-1">
                          <span className="text-[11px] font-bold text-slate-700 block">برادر ابی (پدر مشترک)</span>
                          <span className="text-[9px] text-slate-400 block font-semibold">تعداد برادران ابی زنده</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setErthBrothersPaternal(Math.max(0, erthBrothersPaternal - 1))}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <span className="w-7 text-center text-xs font-black font-mono bg-slate-50 border border-slate-200 py-0.5 rounded">{toPersianDigits(erthBrothersPaternal)}</span>
                          <button
                            onClick={() => setErthBrothersPaternal(erthBrothersPaternal + 1)}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* sistersPaternal counter */}
                      <div className="flex items-center justify-between gap-4 py-1">
                        <div className="flex-1">
                          <span className="text-[11px] font-bold text-slate-700 block">خواهر ابی (پدر مشترک)</span>
                          <span className="text-[9px] text-slate-400 block font-semibold">تعداد خواهران ابی زنده</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setErthSistersPaternal(Math.max(0, erthSistersPaternal - 1))}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <span className="w-7 text-center text-xs font-black font-mono bg-slate-50 border border-slate-200 py-0.5 rounded">{toPersianDigits(erthSistersPaternal)}</span>
                          <button
                            onClick={() => setErthSistersPaternal(erthSistersPaternal + 1)}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* siblingsMaternal counter */}
                      <div className="flex items-center justify-between gap-4 py-1">
                        <div className="flex-1">
                          <span className="text-[11px] font-bold text-slate-700 block">خواهر/برادر امی (مادر مشترک)</span>
                          <span className="text-[9px] text-slate-400 block font-semibold">تعداد کلاله امی زنده</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setErthSiblingsMaternal(Math.max(0, erthSiblingsMaternal - 1))}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <span className="w-7 text-center text-xs font-black font-mono bg-slate-50 border border-slate-200 py-0.5 rounded">{toPersianDigits(erthSiblingsMaternal)}</span>
                          <button
                            onClick={() => setErthSiblingsMaternal(erthSiblingsMaternal + 1)}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 select-none cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* --- CLASS 3 Accordion --- */}
                <div className="border border-slate-200/80 rounded-2xl overflow-hidden mt-2">
                  <button
                    type="button"
                    onClick={() => setErthClass3Open(!erthClass3Open)}
                    className="w-full bg-slate-50 px-3.5 py-3 flex items-center justify-between text-xs font-black text-slate-800 border-b border-slate-150 select-none cursor-pointer hover:bg-slate-100/75 duration-100"
                  >
                    <span>طبقه سوم ارث (عمو، عمه، دایی و خاله)</span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${erthClass3Open ? "rotate-180" : ""}`} />
                  </button>
                  {erthClass3Open && (
                    <div className="p-3 bg-white space-y-3 animate-fadeIn">
                      <p className="text-[9px] text-slate-400 font-bold leading-relaxed">تعداد عموها، عمه‌ها، دایی‌ها و خاله‌های زنده متوفی را وارد کنید:</p>
                      
                      {/* Uncles Count */}
                      <div className="flex items-center justify-between gap-4 py-1">
                        <span className="text-[11px] font-bold text-slate-700">تعداد عموی ابوینی/ابی</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setErthUnclesPaternalFull(Math.max(0, erthUnclesPaternalFull - 1))}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <span className="w-7 text-center text-xs font-mono">{toPersianDigits(erthUnclesPaternalFull)}</span>
                          <button
                            onClick={() => setErthUnclesPaternalFull(erthUnclesPaternalFull + 1)}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Aunts Count */}
                      <div className="flex items-center justify-between gap-4 py-1">
                        <span className="text-[11px] font-bold text-slate-700">تعداد عمه ابوینی/ابی</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setErthAuntsPaternalFull(Math.max(0, erthAuntsPaternalFull - 1))}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <span className="w-7 text-center text-xs font-mono">{toPersianDigits(erthAuntsPaternalFull)}</span>
                          <button
                            onClick={() => setErthAuntsPaternalFull(erthAuntsPaternalFull + 1)}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Maternal Uncles Count */}
                      <div className="flex items-center justify-between gap-4 py-1">
                        <span className="text-[11px] font-bold text-slate-700">تعداد دایی متوفی (کل)</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setErthUnclesMaternalFull(Math.max(0, erthUnclesMaternalFull - 1))}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <span className="w-7 text-center text-xs font-mono">{toPersianDigits(erthUnclesMaternalFull)}</span>
                          <button
                            onClick={() => setErthUnclesMaternalFull(erthUnclesMaternalFull + 1)}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Maternal Aunts Count */}
                      <div className="flex items-center justify-between gap-4 py-1">
                        <span className="text-[11px] font-bold text-slate-700">تعداد خاله متوفی (کل)</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setErthAuntsMaternalFull(Math.max(0, erthAuntsMaternalFull - 1))}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <span className="w-7 text-center text-xs font-mono">{toPersianDigits(erthAuntsMaternalFull)}</span>
                          <button
                            onClick={() => setErthAuntsMaternalFull(erthAuntsMaternalFull + 1)}
                            type="button"
                            className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* Estate value input (optional) */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-slate-500">ارزش ریالی ارث (ریال - اختیاری)</label>
                  <input
                    type="text"
                    value={erthEstateValue}
                    onChange={(e) => handleAmountFormat(e.target.value, setErthEstateValue)}
                    placeholder="مثال: ۱,۲۰۰,۰۰۰,۰۰۰"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <p className="text-[9px] text-slate-400 font-medium">وارد کردن این مقدار اختیاری است. در صورت وارد کردن این مقدار، سهم ریالی دقیق هر وارث نیز نمایش داده می شود.</p>
                </div>

                {/* Common denominator toggle */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl border border-slate-150">
                  <div className="flex-1">
                    <span className="text-[10px] font-black text-slate-700 block">نمایش کسرها با مخرج مشترک</span>
                    <p className="text-[9px] text-slate-400 font-bold leading-tight mt-0.5">مثال: ۱/۶ و ۲/۶ به جای ۱/۶ و ۱/۳</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErthCommonDenominator(!erthCommonDenominator)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                      erthCommonDenominator ? "bg-sky-500" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
                        erthCommonDenominator ? "translate-x-[-16px]" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Calculate Button (Styled light blue per request) */}
                <button
                  onClick={handleCalculateErth}
                  className="w-full py-3 bg-sky-100 hover:bg-sky-200/90 text-sky-800 border border-sky-300 font-black rounded-xl text-xs select-none cursor-pointer transition duration-150 active:scale-[0.99] shadow-sm mt-3"
                >
                  محاسبه و تقسیم نهایی ارثیه متوفی
                </button>
              </>
            )}

            {activeTab === "delay_interest" && (
              <>
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-rose-500 shrink-0" />
                  محاسبه خسارت تأخیر تأدیه
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">بر اساس شاخص تورم اعلامی بانک مرکزی (موضوع ماده ۵۲۲ ق.آ.د.م)</p>
                
                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] font-bold text-slate-500">مبلغ اصل دین / بدهی (ریال)</label>
                  <input
                    type="text"
                    value={delayPrincipal}
                    onChange={(e) => handleAmountFormat(e.target.value, setDelayPrincipal)}
                    placeholder="مثال: ۱۰۰,۰۰۰,۰۰۰"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">سال سررسید (شروع)</label>
                    <select
                      value={delayStartYear}
                      onChange={(e) => setDelayStartYear(parseInt(e.target.value))}
                      className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      {Object.keys(CBI_INFLATION_INDICES).map((year) => (
                        <option key={year} value={year}>
                          {toPersianDigits(year)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">ماه سررسید</label>
                    <select
                      value={delayStartMonth}
                      onChange={(e) => setDelayStartMonth(parseInt(e.target.value))}
                      className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                        <option key={m} value={m}>
                          {["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"][m-1]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">سال تادیه (پایان)</label>
                    <select
                      value={delayEndYear}
                      onChange={(e) => setDelayEndYear(parseInt(e.target.value))}
                      className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      {Object.keys(CBI_INFLATION_INDICES).map((year) => (
                        <option key={year} value={year}>
                          {toPersianDigits(year)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">ماه تادیه</label>
                    <select
                      value={delayEndMonth}
                      onChange={(e) => setDelayEndMonth(parseInt(e.target.value))}
                      className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                        <option key={m} value={m}>
                          {["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"][m-1]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleCalculateDelayInterest}
                  className="w-full mt-2 py-3 bg-slate-900 hover:bg-rose-500 hover:text-white text-white rounded-xl text-xs font-black select-none cursor-pointer transition duration-150"
                >
                  محاسبه خسارت قانونی
                </button>

                <button
                  type="button"
                  onClick={handleSyncCBI}
                  disabled={isSyncingCBI}
                  className={`w-full mt-2 py-2.5 px-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 border select-none cursor-pointer transition-all duration-150 ${
                    isSyncingCBI
                      ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-100 hover:border-sky-200"
                  }`}
                >
                  <Globe className={`w-3.5 h-3.5 text-sky-600 ${isSyncingCBI ? "animate-spin" : ""}`} />
                  {isSyncingCBI ? "در حال اتصال و بروزرسانی شاخص‌ها..." : "بروزرسانی شاخص ها"}
                </button>

                {cbiSyncSuccess && (
                  <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-green-850 text-[10px] font-bold text-right mt-2 leading-relaxed animate-fadeIn" dir="rtl">
                    <CheckCircle2 className="w-3.5 h-3.5 inline-block text-green-600 ml-1.5 align-middle" />
                    <span>{cbiSyncSuccess}</span>
                  </div>
                )}
              </>
            )}

            {activeTab === "execution_fees" && (
              <>
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  محاسبه هزینه اجرای احکام دادگستری
                </h3>

                <div className="space-y-1.5 mt-2">
                  <label className="text-[11px] font-bold text-slate-500">سال اجرای حکم/ابلاغ اجراییه</label>
                  <select
                    value={executionYear}
                    onChange={(e) => {
                      setExecutionYear(Number(e.target.value));
                    }}
                    className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                  >
                    {[1405, 1404, 1403, 1402, 1401, 1400].map((y) => (
                      <option key={y} value={y}>
                        {toPersianDigits(y)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500">موضوع اجراییه / نوع دعوی</label>
                  <select
                    value={executionCategory}
                    onChange={(e) => {
                      setExecutionCategory(e.target.value as any);
                    }}
                    className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 animate-in fade-in"
                  >
                    <option value="financial">دعاوی مالی</option>
                    <option value="non_financial">اجرای احکام دعاوی غیر مالی و احکامی که محکوم به آن تقویم نشده و هزینه اجرای آراء و تصمیمات مراجع غیردادگستری</option>
                    <option value="temporary">هزینه اجرای موقت احکام در کلیه مراجع قضایی</option>
                    <option value="third_party">اعتراض شخص ثالث به اجرای احکام مدنی</option>
                    <option value="leases">تخلیه مورد اجاره غیرمنقول</option>
                  </select>
                </div>

                {executionCategory === "financial" && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500">مبلغ محکوم به (ریال)</label>
                    <input
                      type="text"
                      value={executionFinancialAmount}
                      onChange={(e) => handleAmountFormat(e.target.value, setExecutionFinancialAmount)}
                      placeholder="مثال: ۱۰۰,۰۰۰,۰۰۰"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                    />
                  </div>
                )}

                 {executionCategory === "leases" && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-1">
                    <label className="text-[11px] font-bold text-slate-500">مبلغ اجاره بهای یک ماه (ریال)</label>
                    <input
                      type="text"
                      value={executionLeaseAmount}
                      onChange={(e) => handleAmountFormat(e.target.value, setExecutionLeaseAmount)}
                      placeholder="مثال: ۱۰۰,۰۰۰,۰۰۰"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                    />
                  </div>
                )}

                <div className="pt-2 pb-1.5 flex flex-col gap-1.5 border-t border-slate-100 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600">اجرای حکم به سازش منجر شده است</span>
                    <button
                      type="button"
                      onClick={() => setExecutionIsCompromised(!executionIsCompromised)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        executionIsCompromised ? "bg-amber-500" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          executionIsCompromised ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    چنانچه طرفین سازش کرده اند یا ترتیبی برای اجرای حکم داده اند این گزینه را انتخاب نمایید.
                  </p>
                </div>

                <button
                  onClick={handleCalculateExecutionFees}
                  className="w-full mt-2 py-3 bg-slate-900 hover:bg-emerald-600 hover:text-white text-white rounded-xl text-xs font-black select-none cursor-pointer transition duration-150"
                >
                  محاسبه حق‌الاجرا
                </button>
              </>
            )}

            {activeTab === "financial_assistant" && (
              <>
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-blue-600 shrink-0" />
                  دستیار هوشمند محاسبات مالی
                </h3>

                <div className="space-y-4 pt-1">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 block">مقدار / تعداد ورودی</label>
                    <div className="relative group">
                      <input
                        type="text"
                        value={finAmount}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFinAmount(val);
                        }}
                        placeholder={`مثلاً: ۱۰`}
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-850 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-right"
                      />
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    {(() => {
                      const displayNames: Record<string, string> = {
                        USD: "دلار آمریکا", EUR: "یورو", TRY: "لیر", AED: "درهم", GBP: "پوند", IRR: "ریال",
                        geram18: "طلای ۱۸ عیار", geram24: "طلای ۲۴ عیار", mesghal: "مثقال طلا", abshodeh: "آبشده",
                        sekke: "سکه امامی", bahar: "سکه بهار آزادی", nim: "نیم سکه", rob: "ربع سکه", gerami: "سکه گرمی",
                        parsian100: "پارسیان ۱۰۰mg", parsian500: "پارسیان ۵۰۰mg", parsian1000: "پارسیان ۱۰۰۰mg",
                        btc: "بیت‌کوین", eth: "اتریوم", sol: "سولانا", USDT: "تتر"
                      };
                      const rateVal = getAssetRate(finCurrency, finRates);
                      const isUSDValue = ["btc", "eth", "sol"].includes(finCurrency);
                      return (
                        <div className="flex justify-between items-center bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/60 mt-1">
                          <span className="text-[10px] font-bold text-slate-600">ارز / دارایی فعال:</span>
                          <span className="text-[11px] font-black text-blue-700 flex items-center gap-1">
                            <span>{displayNames[finCurrency] || finCurrency}</span>
                            <span className="font-mono text-[9px] text-slate-400 bg-slate-200/50 px-1 rounded">({isUSDValue ? `$${formatThousandsSeparator(getAssetRate(finCurrency, { currencies: { USD: 1 }, gold: {}, coins: {}, crypto: finRates.crypto }).toString())}` : `${formatPersianCurrency(rateVal)}`})</span>
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 space-y-2">
                    <button
                      type="button"
                      onClick={handleUpdateRates}
                      disabled={isUpdatingRates}
                      className="w-full flex justify-between items-center text-[10px] text-blue-800 font-bold cursor-pointer hover:bg-blue-100/50 p-2 rounded-xl transition-all select-none border-none outline-none text-right"
                      title="کلیک کنید تا قیمت‌ها مطابق با تاریخ و زمان گوشی از سایت‌های معتبر بروزرسانی شوند"
                    >
                      <div className="flex items-center gap-1.5">
                        <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingRates ? "animate-spin text-emerald-600" : "animate-spin-slow text-blue-600"}`} />
                        <span className="underline decoration-dotted underline-offset-4">آخرین بروزرسانی نرخ‌ها (لمس برای بروزرسانی آنلاین):</span>
                      </div>
                      <span className="font-mono bg-blue-100 px-1.5 py-0.5 rounded text-blue-900 shrink-0">
                        {isUpdatingRates ? "در حال دریافت..." : finLastUpdate}
                      </span>
                    </button>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[9px] font-black">
                      <div className="bg-white/60 p-2 rounded-xl border border-slate-100 text-center text-slate-600">
                        <div>دلار</div>
                        <div className="text-blue-600 mt-1 font-mono">{formatPersianCurrency(finRates.currencies?.USD || 650000).replace(" ریال", "")}</div>
                      </div>
                      <div className="bg-white/60 p-2 rounded-xl border border-slate-100 text-center text-slate-600">
                        <div>طلا ۱۸ عیار</div>
                        <div className="text-amber-600 mt-1 font-mono">{formatPersianCurrency(finRates.gold?.geram18 || 34000000).replace(" ریال", "")}</div>
                      </div>
                      <div className="bg-white/60 p-2 rounded-xl border border-slate-100 text-center text-slate-600">
                        <div>سکه امامی</div>
                        <div className="text-emerald-600 mt-1 font-mono">{formatPersianCurrency(finRates.coins?.sekke || 405000000).replace(" ریال", "")}</div>
                      </div>
                      <div className="bg-white/60 p-2 rounded-xl border border-slate-100 text-center text-slate-600">
                        <div>سکه طرح قدیم</div>
                        <div className="text-emerald-600 mt-1 font-mono">{formatPersianCurrency(finRates.coins?.bahar || 375000000).replace(" ریال", "")}</div>
                      </div>
                      <div className="bg-white/60 p-2 rounded-xl border border-slate-100 text-center text-slate-600">
                        <div>نیم سکه</div>
                        <div className="text-emerald-600 mt-1 font-mono">{formatPersianCurrency(finRates.coins?.nim || 225000000).replace(" ریال", "")}</div>
                      </div>
                      <div className="bg-white/60 p-2 rounded-xl border border-slate-100 text-center text-slate-600">
                        <div>ربع سکه</div>
                        <div className="text-emerald-600 mt-1 font-mono">{formatPersianCurrency(finRates.coins?.rob || 145000000).replace(" ریال", "")}</div>
                      </div>
                      <div className="bg-white/60 p-2 rounded-xl border border-slate-100 text-center text-slate-600 col-span-2 sm:col-span-1">
                        <div>سکه گرمی</div>
                        <div className="text-emerald-600 mt-1 font-mono">{formatPersianCurrency(finRates.coins?.gerami || 70000000).replace(" ریال", "")}</div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const amountToUse = finAmount || "1";
                      if (!finAmount) {
                        setFinAmount("1");
                      }
                      calculateFinancial(amountToUse, finCurrency);
                    }}
                    className="w-full mt-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black select-none cursor-pointer transition duration-150 shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                  >
                    محاسبه و تبدیل دارایی
                  </button>
                </div>
              </>
            )}

            {activeTab === "num_to_word" && (
              <>
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4">
                  تبدیل تومان به ریال و بالعکس
                </h3>

                <div className="space-y-4 pt-1">
                  {/* Mode Selector Toggle */}
                  <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 gap-1 select-none">
                    <button
                      type="button"
                      onClick={() => {
                        setConversionDirection("toman_to_rial");
                        setConvertInput("");
                        setConvertResult("");
                        setConvertResultWords("");
                        setNumToWordResult(null);
                      }}
                      className={`flex-1 py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer text-center ${
                        conversionDirection === "toman_to_rial"
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      تبدیل تومان به ریال
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConversionDirection("rial_to_toman");
                        setConvertInput("");
                        setConvertResult("");
                        setConvertResultWords("");
                        setNumToWordResult(null);
                      }}
                      className={`flex-1 py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer text-center ${
                        conversionDirection === "rial_to_toman"
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      تبدیل ریال به تومان
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <div className="relative">
                      <input
                        type="text"
                        value={convertInput}
                        onChange={(e) => handleConvertNumberInput(e.target.value)}
                        placeholder={conversionDirection === "toman_to_rial" ? "مبلغ به تومان" : "مبلغ به ریال"}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-850 outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all text-right"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleCalculateNumToWord}
                    className="w-full mt-2 py-3 bg-slate-900 hover:bg-blue-600 hover:text-white text-white rounded-xl text-xs font-black select-none cursor-pointer transition duration-150"
                  >
                    محاسبه و تبدیل
                  </button>
                  
                </div>
              </>
            )}

          </div>

          {/* Right Output results Card */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[350px] flex flex-col justify-between">
            <div>
              {/* 0. AGE RECEIPTS */}
              {activeTab === "age" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {!ageResult ? (
                    <div className="py-20 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2">
                      <Clock className="w-8 h-8 text-slate-300 stroke-1" />
                      <span>جهت مشاهده سن دقیق شمسی و قمری، بر روی کلید محاسبه کلیک کنید.</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Solar Age Card */}
                      <div className="border border-emerald-205 border-emerald-200 rounded-3xl overflow-hidden shadow-emerald-50/50 shadow-sm bg-white">
                        <div className="bg-emerald-50 px-5 py-4 border-b border-emerald-200 flex items-center justify-between">
                          <span className="text-sm font-black text-emerald-800">
                            {ageSubject === "age" ? "سن شمسی" : "اختلاف زمانی شمسی"}
                          </span>
                        </div>
                        <div className="p-5">
                          <p className="text-base md:text-lg font-black text-slate-800 text-right leading-loose">
                            {toPersianDigits(
                              `${ageResult.solar.years} سال و ${ageResult.solar.months} ماه و ${ageResult.solar.days} روز`
                            )}
                            <span className="text-sm font-bold text-slate-500 mr-2">
                              ({toPersianDigits(ageResult.totalDays)} روز{ageResult.isNegative ? " قبل" : ""})
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Lunar Age Card */}
                      <div className="border border-emerald-205 border-emerald-200 rounded-3xl overflow-hidden shadow-emerald-50/50 shadow-sm bg-white">
                        <div className="bg-emerald-50 px-5 py-4 border-b border-emerald-200 flex items-center justify-between">
                          <span className="text-sm font-black text-emerald-990 text-emerald-800">
                            {ageSubject === "age" ? "سن قمری" : "اختلاف زمانی قمری"}
                          </span>
                        </div>
                        <div className="p-5">
                          <p className="text-base md:text-lg font-black text-slate-800 text-right leading-loose">
                            {toPersianDigits(
                                `${ageResult.lunar.years} سال و ${ageResult.lunar.months} ماه و ${ageResult.lunar.days} روز`
                            )}
                            <span className="text-sm font-bold text-slate-500 mr-2">
                              ({toPersianDigits(ageResult.totalDays)} روز)
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 1.5 NUM_TO_WORD RESULT */}

              {/* 1. MEHRIEH RECEIPT */}
              {activeTab === "mehrieh" && !mehriehResult && (
                <div className="py-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2">
                  <Calendar className="w-8 h-8 text-slate-350 stroke-1" />
                  <span>جهت مشاهده غرامت مهریه تورمی زوجه، کلید محاسبه را بفشارید.</span>
                </div>
              )}
              {activeTab === "mehrieh" && mehriehResult && mehriehResult.type !== "coin" && (
                <div className="py-2 space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-xl border border-green-100 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>محاسبه غرامت مهریه زوجه به فرآیند نرخ روز درگاه مرکزی انجام شد.</span>
                  </div>

                  <h3 className="text-xs font-black text-slate-800 bg-slate-50 p-2 rounded">شاخص‌های تورم سالانه ملاک دادگاه خانواده:</h3>

                  <div className="space-y-2 text-xs text-slate-600 font-bold">
                    <div className="flex justify-between">
                      <span>شاخص تورمی سال وقوع عقد زوجه ({toPersianDigits(marriageYear)}):</span>
                      <span className="font-mono text-slate-900 font-extrabold">{toPersianDigits(mehriehResult.marriageIndex)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>شاخص تورمی سال قبل از تادیه ({toPersianDigits((Number(paymentYear) - 1).toString())}):</span>
                      <span className="font-mono text-slate-900 font-extrabold">{toPersianDigits(mehriehResult.paymentIndex)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2 text-slate-800">
                      <span>ضریب تورم موازنه ازدواج:</span>
                      <span className="font-bold text-slate-900">{toPersianDigits(mehriehResult.inflationRate.toFixed(4))}</span>
                    </div>

                    <div className="mt-8 bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">مبلغ مهریه قابل تادیه مادی در سال {toPersianDigits(paymentYear)}:</span>
                        <p className="text-sm font-black text-amber-400 mt-1">{formatPersianCurrency(mehriehResult.realValue)}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{numberToPersianWords(mehriehResult.realValue.toString())} ریال</p>
                        <p className="text-sm font-bold text-emerald-400 mt-2">معادل {toPersianDigits(formatThousandsSeparator(Math.floor(mehriehResult.realValue / 10).toString()))} تومان</p>
                        <p className="text-[10px] text-slate-400 mt-1">{numberToPersianWords(Math.floor(mehriehResult.realValue / 10).toString())} تومان</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "mehrieh" && mehriehResult && mehriehResult.type === "coin" && (
                <div className="py-2 space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-xl border border-green-100 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>محاسبه قیمت {toPersianDigits(mehriehResult.count)} عدد {mehriehResult.coinTypeName} با نرخ روز انجام شد.</span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 font-bold">
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span>قیمت روز هر عدد {mehriehResult.coinTypeName}:</span>
                      <span className="font-mono text-slate-900 font-extrabold">{formatPersianCurrency(mehriehResult.rate)}</span>
                    </div>

                    <div className="mt-8 bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">مبلغ معادل {toPersianDigits(mehriehResult.count)} عدد سکه به نرخ روز:</span>
                        <p className="text-sm font-black text-amber-400 mt-1">{formatPersianCurrency(mehriehResult.irr)}</p>
                        <p className="text-[9px] text-slate-400 mt-1">{mehriehResult.wordsToman}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. DIYEH RECEIPT */}
              {activeTab === "diyeh" && !diyehResult && (
                <div className="py-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2 animate-fadeIn" dir="rtl">
                  <Award className="w-8 h-8 text-slate-350 stroke-1 animate-pulse" />
                  <span>جهت محاسبه دیه و مشاهده جزئیات پرداخت به ریال و تومان، روی دکمه محاسبه کلیک کنید.</span>
                </div>
              )}
              {activeTab === "diyeh" && diyehResult && (
                <div className="py-2 space-y-4 animate-fadeIn" dir="rtl">
                  <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50/70 p-3 rounded-xl border border-emerald-150 text-xs text-right">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>محاسبه با موفقیت بر مبنای نرخ مصوب دیه سال {toPersianDigits(diyehYear)} انجام شد.</span>
                  </div>

                  <h3 className="text-xs font-black text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-right">مبانی محاسباتی دیه صادر شده ({toPersianDigits(diyehYear)}):</h3>

                  <div className="space-y-3.5 text-xs text-slate-600 font-bold">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-500">تاریخ وقوع حادثه صدمه:</span>
                      <span className="text-slate-900 font-extrabold">{toPersianDigits(`${diyehYear}/${diyehMonth}/${diyehDay}`)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-500">مبنای دیه کامل در ماه عادی:</span>
                      <span className="font-mono text-slate-900 font-extrabold">{formatPersianCurrency(diyehResult.baseFullRate)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-500">مبنای دیه کامل با تغلیظ هلال ماه حرام:</span>
                      <span className="font-mono text-emerald-600 font-extrabold">{formatPersianCurrency(diyehResult.customFullRate)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-500">روش محاسباتی انتخابی شما:</span>
                      <span className="font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {selectedMethod}
                      </span>
                    </div>

                    {/* Conditional sub-details depending on method */}
                    {selectedMethod === "درصدی" && (
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-slate-500">درصد اعمال شده از دیه کامل:</span>
                        <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-150">
                          {toPersianDigits(diyehPercentInput)}٪ دیه کامل
                        </span>
                      </div>
                    )}

                    {selectedMethod === "کسری" && (
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-slate-500">کسر اعمال شده از دیه کامل:</span>
                        <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-150 text-xs">
                          {fractionInputs.filter(Boolean).map(toPersianDigits).join(" × ")} (معادل {toPersianDigits((diyehResult.fractionUsed * 100).toFixed(4))}٪ دیه کامل)
                        </span>
                      </div>
                    )}

                    {selectedMethod === "دیه قتل" && (
                      <div className="space-y-2 pb-2 border-b border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">تعداد نفوس (فقره دیه):</span>
                          <span className="font-extrabold text-slate-900">{toPersianDigits(murderCount)} فقره فوت</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">جنسیت متوفی:</span>
                          <span className="font-extrabold text-slate-900">
                            {murderType === "man" && "مرد"}
                            {murderType === "woman" && "زن"}
                            {murderType === "hermaphrodite_man" && "خنثی ملحق به مرد"}
                            {murderType === "hermaphrodite_woman" && "خنثی ملحق به زن"}
                            {murderType === "hermaphrodite_ambiguous" && "خنثی مشکل"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">ضریب کل حاصله دیه:</span>
                          <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-150">
                            {toPersianDigits(diyehResult.fractionUsed.toFixed(2))} برابر دیه کامل
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedMethod === "اعضا، منافع، جراحات" && (
                      <div className="space-y-2 pb-2 border-b border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">تعداد صدمات وارده به شاکی:</span>
                          <span className="font-extrabold text-slate-900">{toPersianDigits(selectedInjuries.length)} مورد آسیب پزشکی قانونی</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">جمع کل درصدهای ارش و دیه منتخب:</span>
                          <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-150">
                            {toPersianDigits(parseFloat((selectedInjuries.reduce((sum, i) => sum + i.percentage, 0)).toFixed(4)))}٪ دیه کامل
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedMethod === "جنین" && (
                      <div className="space-y-2 pb-2 border-b border-slate-100">
                        <div className="flex justify-between items-start gap-4">
                          <span className="text-slate-500 shrink-0">نوع صدمه جنین:</span>
                          <span className="font-extrabold text-slate-900 text-left text-[11px] leading-relaxed">
                            {INJURY_DATABASE.find(item => item.id === fetusSelection)?.name || "نامشخص"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">درصد دیه منتخب:</span>
                          <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-150">
                            {toPersianDigits(INJURY_DATABASE.find(item => item.id === fetusSelection)?.percentage || 0)}٪ دیه کامل
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedMethod === "جنایت بر میت" && (
                      <div className="space-y-2 pb-2 border-b border-slate-100">
                        <div className="flex justify-between items-start gap-4">
                          <span className="text-slate-500 shrink-0">نوع جنایت بر میت:</span>
                          <span className="font-extrabold text-slate-900 text-left text-[11px] leading-relaxed">
                            {INJURY_DATABASE.find(item => item.id === corpseSelection)?.name || "نامشخص"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">درصد دیه منتخب:</span>
                          <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-150">
                            {(() => {
                              if (corpseSelection === "d6" || corpseSelection === "d7") {
                                const engPct = toEnglishDigits(corpseLivingPercentage).replace(/[^0-9.]/g, "");
                                const pct = parseFloat(engPct) || 0;
                                const finalPct = pct / 10;
                                return `${toPersianDigits(finalPct.toString())}٪ (یک‌دهمِ ${toPersianDigits(pct.toString())}٪ دیه زنده)`;
                              }
                              return `${toPersianDigits(INJURY_DATABASE.find(item => item.id === corpseSelection)?.percentage || 0)}٪`;
                            })()} دیه کامل
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-500">وضعیت تغلیظ ماه الحرام:</span>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] ${isSacredMonth ? "bg-amber-50 text-amber-700 border border-amber-200 font-extrabold" : "bg-slate-100 text-slate-500"}`}>
                        {isSacredMonth ? "شامل تغلیظ (ماه‌های حرام: افزایش یک‌سوم)" : "بدون تغلیظ (ماه‌های عادی)"}
                      </span>
                    </div>

                    <div className="mt-6 bg-slate-950 text-white p-5 rounded-2xl space-y-3 shadow-md">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-extrabold block mb-1">مجموع بدهی غرامت جانی صدمه به ریال:</span>
                        <p className="text-base font-black text-emerald-400 leading-none">{formatPersianCurrency(diyehResult.diyehFee)}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{numberToPersianWords(diyehResult.diyehFee.toString())} ریال</p>
                      </div>
                      <div className="text-right pt-2.5 border-t border-slate-800">
                        <span className="text-[10px] text-slate-400 font-extrabold block mb-1">معادل وجه به تومان ایران:</span>
                        <p className="text-base font-black text-green-400 leading-none">
                          {formatPersianCurrency(Math.round(diyehResult.diyehFee / 10)).replace("ریال", "تومان")}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">{numberToPersianWords(Math.round(diyehResult.diyehFee / 10).toString())} تومان</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 10. NUM_TO_WORD RECEIPT */}
              {activeTab === "num_to_word" && !numToWordResult && (
                <div className="py-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2 animate-fadeIn" dir="rtl">
                  <RefreshCw className="w-8 h-8 text-slate-350 stroke-1" />
                  <span>جهت تبدیل مبلغ به ریال و تومان و مشاهده معادل حروفی، روی دکمه محاسبه کلیک کنید.</span>
                </div>
              )}
              {activeTab === "num_to_word" && numToWordResult && (
                <div className="py-2 space-y-5 animate-fadeIn text-right font-bold" dir="rtl">
                  <div className="flex items-center gap-2 text-blue-800 bg-blue-50/70 p-3 rounded-xl border border-blue-100 text-xs text-right animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
                    <span>تبدیل واحد پولی با موفقیت انجام شد.</span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6">
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 font-extrabold block">مبلغ ورودی ({numToWordResult.direction === "toman_to_rial" ? "تومان" : "ریال"}):</span>
                      <p className="text-lg font-black text-slate-700 tracking-tight">{toPersianDigits(numToWordResult.input)} {numToWordResult.direction === "toman_to_rial" ? "تومان" : "ریال"}</p>
                      <div className="text-[11px] font-black text-slate-500 mt-1">
                        {numToWordResult.direction === "toman_to_rial" ? "معادل حروفی مبلغ ورودی" : "معادل حروفی مبلغ"}: {toPersianDigits(numToWordResult.wordsInput)}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <span className="text-[10px] text-slate-400 font-extrabold block">خروجی تبدیل شده ({numToWordResult.direction === "toman_to_rial" ? "ریال" : "تومان"}):</span>
                      <p className="text-2xl font-black text-blue-600 tracking-tight">{toPersianDigits(numToWordResult.result)} {numToWordResult.direction === "toman_to_rial" ? "ریال" : "تومان"}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <span className="text-[10px] text-slate-400 font-extrabold block">معادل حروفی مبلغ خروجی:</span>
                      <p className="text-sm font-black text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{toPersianDigits(numToWordResult.words)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. COURT RECEIPT */}
              {activeTab === "court" && !courtResult && (
                <div className="py-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2">
                  <DollarSign className="w-8 h-8 text-slate-350 stroke-1" />
                  <span>برآورد ارزش اوراق و هزینه فرآوری پرونده در مراجع حقوقی.</span>
                </div>
              )}
              {activeTab === "court" && courtResult && (
                <div className="py-2 space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-xl border border-green-100 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>محاسبه هزینه‌های ثبتی دادگاه بدوی/حقوقی نهایی گردید.</span>
                  </div>

                  <h3 className="text-xs font-black text-slate-800 bg-slate-50 p-2 rounded">محاسبه فیش هزینه دادرسی و تمبر دادخواست:</h3>

                  <div className="space-y-2 text-xs text-slate-600 font-bold">
                    <div className="flex justify-between">
                      <span>مرحله دادرسی مورد تقاضا:</span>
                      <span className="font-bold text-slate-900">{courtResult.stageName}</span>
                    </div>
                    {courtStage !== "non_financial" && (
                      <div className="flex justify-between">
                        <span>کل مبلغ بهای خواسته (ارزش پرونده):</span>
                        <span className="font-bold text-slate-900">{formatPersianCurrency(parsePersianInput(claimAmountForCourt))}</span>
                      </div>
                    )}

                    <div className="mt-8 bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">کل فیش هزینه دادرسی (تمبرها و مراجع قضایی):</span>
                        <p className="text-sm font-black text-amber-400 mt-1">{formatPersianCurrency(courtResult.courtFee)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* COMPREHENSIVE LAWYER RECEIPT */}
              {activeTab === "lawyer_comprehensive" && !compResult && (
                <div className="py-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2">
                  <Calculator className="w-8 h-8 text-slate-350 stroke-1" />
                  <span>محاسبه جامع هزینه‌های دادرسی، حق‌الوکاله و مالیات پرداختی.</span>
                </div>
              )}
              {activeTab === "lawyer_comprehensive" && compResult && (
                <div className="py-2 space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-xl border border-green-100 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>محاسبه جامع هزینه‌های دادرسی و وکالت انجام شد.</span>
                  </div>

                  <h3 className="text-xs font-black text-slate-800 bg-slate-50 p-2 rounded border border-slate-100 mt-4 mb-2">نتیجه محاسبه</h3>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-2 p-3 bg-white border border-slate-100 rounded-xl text-xs font-bold shadow-sm">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span className="text-slate-600">مرحله رسیدگی:</span>
                        <span className="text-slate-900 font-black">{compResult.stageName}</span>
                      </div>
                      {compResult.isFinancial && (
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-slate-600">بهای خواسته:</span>
                          <span className="text-slate-900 font-black font-mono text-sm">
                            {formatPersianCurrency(compResult.claimAmount)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span className="text-slate-600">حق‌الوکاله وکیل:</span>
                        <span className="text-slate-900 font-black font-mono text-sm">
                          {formatPersianCurrency(compResult.lawyerFee)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span className="text-slate-600">تمبر مالیاتی (۵٪ حق‌الوکاله):</span>
                        <span className="text-slate-900 font-black font-mono text-sm">
                          {formatPersianCurrency(compResult.taxStamp)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span className="text-slate-600">سهم صندوق حمایت (۲.۵٪):</span>
                        <span className="text-slate-900 font-black font-mono text-sm">
                          {formatPersianCurrency(compResult.supportFund)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span className="text-slate-600">سهم کانون وکلا (۱.۲۵٪):</span>
                        <span className="text-slate-900 font-black font-mono text-sm">
                          {formatPersianCurrency(compResult.barShare)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-1">
                        <span className="text-slate-600">هزینه دادرسی (تمبرها):</span>
                        <span className="text-slate-900 font-black font-mono text-sm">
                          {formatPersianCurrency(compResult.courtFee)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between shadow-md">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">مجموع هزینه‌های دادرسی و وکالت:</span>
                        <div className="flex flex-col gap-1">
                          <span className="text-base font-black text-amber-400">
                            {formatPersianCurrency(compResult.totalCosts)}
                          </span>
                          <span className="text-xs font-bold text-slate-300">
                            معادل {formatPersianCurrency(Math.round(compResult.totalCosts / 10)).replace("ریال", "تومان")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. LAWYER RECEIPT */}
              {activeTab === "lawyer" && !lawyerResult && (
                <div className="py-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2">
                  <Calculator className="w-8 h-8 text-slate-350 stroke-1" />
                  <span>محاسبه حق‌الوکاله و سهم مراجع مالی کانون و مرکز وکلاین.</span>
                </div>
              )}
              {activeTab === "lawyer" && lawyerResult && (
                <div className="py-2 space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-xl border border-green-100 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>برآورد حق‌الوکاله و تمبر مالیاتی بهای وکالت انجام شد.</span>
                  </div>

                  <h3 className="text-xs font-black text-slate-800 bg-slate-50 p-2 rounded border border-slate-100 mt-4 mb-2">نتیجه محاسبه</h3>

                  <div className="space-y-4">
                    {!lawyerResult.isTaxStamp ? (
                      <div className="flex flex-col gap-2 p-3 bg-white border border-slate-100 rounded-xl text-xs font-bold shadow-sm">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-slate-600">حق الوکاله در مرحله بدوی:</span>
                          <span className="text-slate-900 font-black font-mono text-sm">
                            {formatPersianCurrency(lawyerResult.bedvi)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-slate-600">حق الوکاله در مرحله تجدید نظر:</span>
                          <span className="text-slate-900 font-black font-mono text-sm">
                            {formatPersianCurrency(lawyerResult.tajdid)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 rounded-lg p-2 mt-1">
                          <span className="text-slate-800">جمع کل:</span>
                          <span className="text-[#0ea5e9] font-black font-mono text-[15px]">
                            {formatPersianCurrency(lawyerResult.total)}
                          </span>
                        </div>
                      </div>
                    ) : lawyerResult.isDirectTaxInput ? (
                      <div className="space-y-4 font-bold">
                        {/* Direct Tax Calculation Box / کادر محاسباتی مستقیم */}
                        <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 text-xs shadow-sm space-y-3">
                          <div className="flex items-center gap-2 text-amber-800 font-extrabold pb-2 border-b border-amber-100">
                            <Calculator className="w-4 h-4 text-amber-600" />
                            <span>کادر محاسباتی مستقیم بر مبنای مبلغ تمبر مالیاتی</span>
                          </div>

                          <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-amber-100">
                            <span className="text-slate-700">مبلغ ابطال تمبر مالیاتی ورودی (۵٪):</span>
                            <span className="text-amber-900 font-black font-mono text-sm">
                              {formatPersianCurrency(lawyerResult.enteredTaxStamp)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100">
                            <div>
                              <span className="text-slate-700">سهم صندوق حمایت وکلا (۲.۵٪):</span>
                              <span className="text-[10px] text-slate-400 block font-normal">(معادل نصف مبلغ تمبر مالیاتی ورودی)</span>
                            </div>
                            <span className="text-slate-900 font-black font-mono text-sm">
                              {formatPersianCurrency(Math.round(lawyerResult.enteredTaxStamp * 0.5))}
                            </span>
                          </div>

                          <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100 font-bold">
                            <div>
                              <span className="text-slate-700">
                                {lawyerResult.lawyerSubject === "tax_stamp_bar" 
                                  ? "سهم کانون وکلای دادگستری (۱.۲۵٪):" 
                                  : "سهم مرکز وکلای قوه قضاییه (۱.۲۵٪):"}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-normal">(معادل یک چهارم مبلغ تمبر مالیاتی ورودی)</span>
                            </div>
                            <span className="text-slate-900 font-black font-mono text-sm">
                              {formatPersianCurrency(Math.round(lawyerResult.enteredTaxStamp * 0.25))}
                            </span>
                          </div>

                          <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                            <div>
                              <span className="text-emerald-800 font-extrabold">مجموع تمبر مالیاتی و سهم صندوق و کانون (۸.۷۵٪):</span>
                              <span className="text-[10px] text-emerald-600 block font-normal">(شامل تمبر مالیاتی + سهم صندوق + سهم کانون/مرکز)</span>
                            </div>
                            <span className="text-emerald-950 font-black font-mono text-base">
                              {formatPersianCurrency(Math.round(lawyerResult.enteredTaxStamp * 1.75))}
                            </span>
                          </div>

                          <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-100">
                            <div>
                              <span className="text-blue-800 font-extrabold">حق‌الوکاله معادل و متناظر (۱۰۰٪):</span>
                              <span className="text-[10px] text-blue-600 block font-normal">(مبنای محاسبه ۲۰ برابر مبلغ تمبر مالیاتی ابطال شده)</span>
                            </div>
                            <span className="text-blue-900 font-black font-mono text-base">
                              {formatPersianCurrency(Math.round(lawyerResult.enteredTaxStamp * 20))}
                            </span>
                          </div>
                        </div>

                        {/* Traditional Stages breakdown for comparison/clarification */}
                        <div className="bg-white border border-slate-200 rounded-xl text-xs shadow-sm overflow-hidden opacity-90">
                          <div className="bg-slate-500 text-white px-4 py-2 w-max rounded-bl-3xl min-w-[50%]">
                            تسهیم فرضی مراحل (۶۰٪ بدوی و ۴۰٪ تجدیدنظر)
                          </div>
                          <div className="p-4 space-y-3">
                            <div className="flex justify-between">
                              <span className="text-slate-600">حق‌الوکاله سهم بدوی (۶۰٪):</span>
                              <span className="font-mono text-slate-800">{formatPersianCurrency(lawyerResult.bedvi)}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-100 pt-2">
                              <span className="text-slate-600">تمبر خالص بدوی (۵٪):</span>
                              <span className="font-mono text-emerald-800">{formatPersianCurrency(lawyerResult.bedviPureTax)}</span>
                            </div>
                            <div className="border-t border-slate-100 pt-2 space-y-1 text-[11px] text-slate-500 font-semibold">
                              <div className="flex justify-between">
                                <span>سهم صندوق حمایت بدوی (۲.۵٪):</span>
                                <span className="font-mono">{formatPersianCurrency(lawyerResult.bedviSandogh || Math.round(lawyerResult.bedvi * 0.025))}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>سهم {lawyerResult.lawyerSubject === "tax_stamp_bar" ? "کانون" : "مرکز"} بدوی (۱.۲۵٪):</span>
                                <span className="font-mono">{formatPersianCurrency(lawyerResult.bedviKanoon || Math.round(lawyerResult.bedvi * 0.0125))}</span>
                              </div>
                            </div>
                            <div className="flex justify-between border-t border-slate-100 pt-2">
                              <span className="text-slate-800 font-bold">تمبر مالیاتی، سهم صندوق و {lawyerResult.lawyerSubject === "tax_stamp_bar" ? "کانون" : "مرکز"} بدوی:</span>
                              <span className="font-mono text-slate-700 font-bold">{formatPersianCurrency(lawyerResult.bedviTax)}</span>
                            </div>

                            <div className="border-t-2 border-dashed border-slate-100 my-2" />

                            <div className="flex justify-between">
                              <span className="text-slate-600">حق‌الوکاله سهم تجدیدنظر (۴۰٪):</span>
                              <span className="font-mono text-slate-800">{formatPersianCurrency(lawyerResult.tajdid)}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-100 pt-2">
                              <span className="text-slate-600">تمبر خالص تجدیدنظر (۵٪):</span>
                              <span className="font-mono text-emerald-800">{formatPersianCurrency(lawyerResult.tajdidPureTax)}</span>
                            </div>
                            <div className="border-t border-slate-100 pt-2 space-y-1 text-[11px] text-slate-500 font-semibold">
                              <div className="flex justify-between">
                                <span>سهم صندوق حمایت تجدیدنظر (۲.۵٪):</span>
                                <span className="font-mono">{formatPersianCurrency(lawyerResult.tajdidSandogh || Math.round(lawyerResult.tajdid * 0.025))}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>سهم {lawyerResult.lawyerSubject === "tax_stamp_bar" ? "کانون" : "مرکز"} تجدیدنظر (۱.۲۵٪):</span>
                                <span className="font-mono">{formatPersianCurrency(lawyerResult.tajdidKanoon || Math.round(lawyerResult.tajdid * 0.0125))}</span>
                              </div>
                            </div>
                            <div className="flex justify-between border-t border-slate-100 pt-2">
                              <span className="text-slate-800 font-bold">تمبر مالیاتی، سهم صندوق و {lawyerResult.lawyerSubject === "tax_stamp_bar" ? "کانون" : "مرکز"} تجدیدنظر:</span>
                              <span className="font-mono text-slate-700 font-bold">{formatPersianCurrency(lawyerResult.tajdidTax)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 font-bold">
                        <div className="bg-white border border-slate-200 rounded-xl text-xs shadow-sm overflow-hidden">
                          <div className="bg-slate-600 text-white px-4 py-2.5 w-max rounded-bl-3xl min-w-[50%]">
                            در مرحله بدوی
                          </div>
                          <div className="p-4 space-y-4">
                            <div>
                              <div className="text-slate-800">حق الوکاله:</div>
                              <div className="text-left font-mono mt-1 text-slate-600">{formatPersianCurrency(lawyerResult.bedvi)}</div>
                            </div>
                            <div className="border-t border-slate-100 pt-3">
                              <div className="text-emerald-700 font-extrabold">مبلغ ابطال تمبر مالیاتی:</div>
                              <div className="text-left font-mono mt-1 text-emerald-800 font-black">{formatPersianCurrency(lawyerResult.bedviPureTax)}</div>
                            </div>
                            <div className="border-t border-slate-100 pt-3 space-y-1 text-[11px] text-slate-500 font-semibold">
                              <div className="flex justify-between">
                                <span>سهم صندوق حمایت (۲.۵٪):</span>
                                <span className="font-mono">{formatPersianCurrency(lawyerResult.bedviSandogh || Math.round(lawyerResult.bedvi * 0.025))}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>سهم {lawyerResult.lawyerSubject === "tax_stamp_bar" ? "کانون" : "مرکز"} وکلا (۱.۲۵٪):</span>
                                <span className="font-mono">{formatPersianCurrency(lawyerResult.bedviKanoon || Math.round(lawyerResult.bedvi * 0.0125))}</span>
                              </div>
                            </div>
                            <div className="border-t border-slate-100 pt-3">
                              <div className="text-slate-800 font-bold">{lawyerResult.lawyerSubject === "tax_stamp_bar" ? "جمع تمبر مالیاتی، سهم صندوق و کانون:" : "جمع تمبر مالیاتی، سهم صندوق و مرکز:"}</div>
                              <div className="text-left font-mono mt-1 text-slate-900 font-black">{formatPersianCurrency(lawyerResult.bedviTax)}</div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl text-xs shadow-sm overflow-hidden">
                          <div className="bg-slate-600 text-white px-4 py-2.5 w-max rounded-bl-3xl min-w-[50%]">
                            در مرحله تجدید نظر
                          </div>
                          <div className="p-4 space-y-4">
                            <div>
                              <div className="text-slate-800">حق الوکاله:</div>
                              <div className="text-left font-mono mt-1 text-slate-600">{formatPersianCurrency(lawyerResult.tajdid)}</div>
                            </div>
                            <div className="border-t border-slate-100 pt-3">
                              <div className="text-emerald-700 font-extrabold">مبلغ ابطال تمبر مالیاتی:</div>
                              <div className="text-left font-mono mt-1 text-emerald-800 font-black">{formatPersianCurrency(lawyerResult.tajdidPureTax)}</div>
                            </div>
                            <div className="border-t border-slate-100 pt-3 space-y-1 text-[11px] text-slate-500 font-semibold">
                              <div className="flex justify-between">
                                <span>سهم صندوق حمایت (۲.۵٪):</span>
                                <span className="font-mono">{formatPersianCurrency(lawyerResult.tajdidSandogh || Math.round(lawyerResult.tajdid * 0.025))}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>سهم {lawyerResult.lawyerSubject === "tax_stamp_bar" ? "کانون" : "مرکز"} وکلا (۱.۲۵٪):</span>
                                <span className="font-mono">{formatPersianCurrency(lawyerResult.tajdidKanoon || Math.round(lawyerResult.tajdid * 0.0125))}</span>
                              </div>
                            </div>
                            <div className="border-t border-slate-100 pt-3">
                              <div className="text-slate-800 font-bold">{lawyerResult.lawyerSubject === "tax_stamp_bar" ? "جمع تمبر مالیاتی، سهم صندوق و کانون:" : "جمع تمبر مالیاتی، سهم صندوق و مرکز:"}</div>
                              <div className="text-left font-mono mt-1 text-slate-900 font-black">{formatPersianCurrency(lawyerResult.tajdidTax)}</div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 text-[13px] space-y-4">
                          <div className="text-emerald-700 font-black">
                            مبلغ ابطال تمبر مالیاتی (کل):
                            <div className="text-left text-emerald-800 font-mono text-sm mt-1">{formatPersianCurrency(lawyerResult.totalPureTax)}</div>
                          </div>
                          <div className="border-t border-slate-100 pt-3 space-y-1 text-xs text-slate-500 font-semibold">
                            <div className="flex justify-between">
                              <span>جمع کل سهم صندوق حمایت (۲.۵٪):</span>
                              <span className="font-mono text-slate-850 font-bold">{formatPersianCurrency(lawyerResult.totalSandogh || Math.round(lawyerResult.total * 0.025))}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>جمع کل سهم {lawyerResult.lawyerSubject === "tax_stamp_bar" ? "کانون" : "مرکز"} وکلا (۱.۲۵٪):</span>
                              <span className="font-mono text-slate-850 font-bold">{formatPersianCurrency(lawyerResult.totalKanoon || Math.round(lawyerResult.total * 0.0125))}</span>
                            </div>
                          </div>
                          <div className="text-blue-600 border-t border-slate-100 pt-3">
                            جمع کل پرداخت تمبر در مرحله بدوی و تجدید نظر (شامل سهم صندوق و کانون):
                            <div className="text-left text-slate-705 font-mono text-sm mt-1">{formatPersianCurrency(lawyerResult.totalTax)}</div>
                          </div>
                          <div className="text-blue-600 border-t border-slate-100 pt-3">
                            جمع کل حق الوکاله:
                            <div className="text-left text-slate-705 font-mono text-sm mt-1">{formatPersianCurrency(lawyerResult.total)}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 5. FINANCIAL ASSISTANT RECEIPT */}
              {activeTab === "financial_assistant" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  
                  {/* Results section if available */}
                  {finResult && (
                    <div id="financial-result-box" className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4 animate-in fade-in duration-300">
                      <div className="flex items-center gap-3 bg-blue-100/50 p-4 rounded-2xl border border-blue-200">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                          <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-blue-700 mb-0.5">نتیجه محاسبه و تبدیل</div>
                          <div className="text-sm font-black text-blue-900 font-mono">
                            {toPersianDigits(formatThousandsSeparator(finResult.amount.toString()))} {
                              finResult.currency === "USD" ? "دلار" : finResult.currency === "TRY" ? "لیر" : finResult.currency === "EUR" ? "یورو" : finResult.currency === "GBP" ? "پوند" : finResult.currency === "AED" ? "درهم" : finResult.currency
                            }
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                          <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                            <span className="text-[11px] font-black text-slate-500">معادل به ریال ایران:</span>
                            <span className="text-base font-black text-slate-900 font-mono">{formatPersianCurrency(finResult.irr)}</span>
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 leading-relaxed text-right">
                            {finResult.wordsIrr}
                          </div>
                        </div>

                        <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2 border border-slate-800">
                          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                            <span className="text-[11px] font-black text-slate-400">معادل به تومان (رایج):</span>
                            <span className="text-base font-black text-emerald-400 font-mono">{formatPersianCurrency(finResult.toman).replace("ریال", "تومان")}</span>
                          </div>
                          <div className="text-[10px] font-bold text-slate-300 leading-relaxed text-right">
                            {finResult.wordsToman}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 px-1">
                        <span>نرخ محاسبه شده مبنا:</span>
                        <span className="font-mono text-slate-700">{formatPersianCurrency(finResult.rateUsed)}</span>
                      </div>
                    </div>
                  )}

                  {/* Comprehensive Live Market Rates Dashboard */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-emerald-600 animate-pulse" />
                        مشاهده نرخ‌های زنده و لحظه‌ای بازار
                      </h4>
                      <span className="text-[9px] font-bold text-slate-400 font-mono">بروزرسانی زنده از TGJU</span>
                    </div>

                    {/* Sub-tabs for Market Categories */}
                    <div className="flex flex-wrap bg-slate-100 p-1 rounded-2xl gap-1">
                      {(["currencies", "gold", "coins", "crypto", "global_domestic"] as const).map((tab) => {
                        const tabLabels = {
                          currencies: "ارزها",
                          gold: "طلا",
                          coins: "سکه",
                          crypto: "رمز ارز",
                          global_domestic: "جهانی و بورس"
                        };
                        return (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setFinMarketTab(tab)}
                            className={`flex-1 min-w-[70px] py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer text-center select-none ${
                              finMarketTab === tab
                                ? "bg-slate-900 text-white shadow-sm"
                                : "text-slate-500 hover:bg-slate-200"
                            }`}
                          >
                            {tabLabels[tab]}
                          </button>
                        );
                      })}
                    </div>

                    {/* Market Data Tables */}
                    <div className="overflow-hidden border border-slate-100 rounded-2xl">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                          <tr>
                            <th className="px-4 py-2 text-right">عنوان دارایی</th>
                            <th className="px-4 py-2 text-left">قیمت / نرخ (ریال یا دلار)</th>
                            <th className="px-4 py-2 text-center w-16">اقدام</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-medium text-slate-750">
                          {(() => {
                            let rows: Array<{ key: string; name: string; value: any; isUSD?: boolean }> = [];
                            
                            if (finMarketTab === "currencies") {
                              rows = [
                                { key: "USD", name: "💵 دلار آمریکا", value: finRates.currencies?.USD },
                                { key: "EUR", name: "🇪🇺 یورو اروپا", value: finRates.currencies?.EUR },
                                { key: "TRY", name: "🇹🇷 لیر ترکیه", value: finRates.currencies?.TRY },
                                { key: "AED", name: "🇦🇪 درهم امارات", value: finRates.currencies?.AED },
                                { key: "GBP", name: "🇬🇧 پوند انگلیس", value: finRates.currencies?.GBP }
                              ];
                            } else if (finMarketTab === "gold") {
                              rows = [
                                { key: "geram18", name: "🪙 طلای ۱۸ عیار (۱ گرم)", value: finRates.gold?.geram18 },
                                { key: "geram24", name: "🪙 طلای ۲۴ عیار (۱ گرم)", value: finRates.gold?.geram24 },
                                { key: "mesghal", name: "⚖️ مثقال طلا / مظنه", value: finRates.gold?.mesghal },
                                { key: "abshodeh", name: "🔥 طلای آبشده نقدی", value: finRates.gold?.abshodeh }
                              ];
                            } else if (finMarketTab === "coins") {
                              rows = [
                                { key: "sekke", name: "👑 سکه امامی (طرح جدید)", value: finRates.coins?.sekke },
                                { key: "bahar", name: "🏛️ سکه بهار آزادی (طرح قدیم)", value: finRates.coins?.bahar },
                                { key: "nim", name: "🌓 نیم سکه بهار آزادی", value: finRates.coins?.nim },
                                { key: "rob", name: "🌘 ربع سکه بهار آزادی", value: finRates.coins?.rob },
                                { key: "gerami", name: "🌱 سکه یک گرمی بانک مرکزی", value: finRates.coins?.gerami },
                                { key: "sekke_retail", name: "🛍️ سکه تک فروشی", value: finRates.coins?.sekke_retail },
                                { key: "parsian100", name: "🎖️ سکه پارسیان ۱۰۰ میلی‌گرم", value: finRates.coins?.parsian100 },
                                { key: "parsian500", name: "🎖️ سکه پارسیان ۵۰۰ میلی‌گرم", value: finRates.coins?.parsian500 },
                                { key: "parsian1000", name: "🎖️ سکه پارسیان ۱۰۰۰ میلی‌گرم", value: finRates.coins?.parsian1000 },
                                { key: "sekke_bubble", name: "💭 حباب سکه امامی", value: finRates.coins?.sekke_bubble }
                              ];
                            } else if (finMarketTab === "crypto") {
                              rows = [
                                { key: "btc", name: "🪙 بیت‌کوین (BTC)", value: finRates.crypto?.btc, isUSD: true },
                                { key: "eth", name: "💎 اتریوم (ETH)", value: finRates.crypto?.eth, isUSD: true },
                                { key: "sol", name: "☀️ سولانا (SOL)", value: finRates.crypto?.sol, isUSD: true },
                                { key: "USDT", name: "💵 تتر (USDT)", value: finRates.crypto?.usdt }
                              ];
                            } else if (finMarketTab === "global_domestic") {
                              rows = [
                                { key: "ons_gold", name: "🟡 اونس جهانی طلا", value: finRates.global_domestic?.ons_gold, isUSD: true },
                                { key: "ons_silver", name: "🥈 اونس جهانی نقره", value: finRates.global_domestic?.ons_silver, isUSD: true },
                                { key: "brent_oil", name: "🛢️ نفت برنت جهانی", value: finRates.global_domestic?.brent_oil, isUSD: true },
                                { key: "tedpix", name: "📈 شاخص کل بورس تهران", value: finRates.global_domestic?.tedpix, isUSD: false }
                              ];
                            }

                            return rows.map((row) => (
                              <tr key={row.key} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-2.5 font-bold text-slate-700">{row.name}</td>
                                <td className="px-4 py-2.5 text-left font-mono font-black text-slate-900">
                                  {row.isUSD 
                                    ? `$${formatThousandsSeparator(row.value?.toString() || "0")}`
                                    : row.key === "tedpix" 
                                      ? toPersianDigits(formatThousandsSeparator(row.value?.toString() || "0"))
                                      : formatPersianCurrency(row.value || 0)
                                  }
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  {row.key !== "tedpix" && !["ons_gold", "ons_silver", "brent_oil"].includes(row.key) ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const amountToUse = finAmount || "1";
                                        if (!finAmount) {
                                          setFinAmount("1");
                                        }
                                        calculateFinancial(amountToUse, row.key);
                                        // Smooth scroll to the result box
                                        setTimeout(() => {
                                          const resultElement = document.getElementById("financial-result-box");
                                          if (resultElement) {
                                            resultElement.scrollIntoView({ behavior: "smooth", block: "center" });
                                          } else {
                                            window.scrollTo({ top: 350, behavior: "smooth" });
                                          }
                                        }, 80);
                                      }}
                                      className="px-2 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 rounded-lg text-[10px] font-black transition-all cursor-pointer select-none"
                                    >
                                      تبدیل
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-slate-300">-</span>
                                  )}
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* 6. DEADLINE RECEIPT */}
              {(activeTab === "deadlines" && deadlineView === 'form') && (
                <div className="py-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2">
                  <Clock className="w-8 h-8 text-slate-350 stroke-1" />
                  <span>محاسبه تاریخ‌های آغازین و واپسین گام دادخواهی را آغاز نمایید.</span>
                </div>
              )}
              {(activeTab === "deadlines" && deadlineView === 'result') && (() => {
                const holidayAdjustment = adjustDateForHolidays(deadlineResult.dueDate);
                const judicialAdjustment = judicialResult ? adjustDateForHolidays(judicialResult.dueDate || judicialResult.endDate) : null;
                const showExplanation = holidayAdjustment.explanation || (judicialAdjustment && judicialAdjustment.explanation);

                return (
                  <div className="py-2 space-y-4 animate-fadeIn">
                    <button 
                      onClick={() => setDeadlineView('form')}
                      className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-900 font-bold mb-4"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      بازگشت به فرم محاسبه
                    </button>
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-xl border border-green-100 text-xs">
                      <CheckCircle2 className="w-4 h-4 shrink-0 animate-pulse" />
                      <span>مواعید قانونی و قضایی با موفقیت محاسبه گردید.</span>
                    </div>

                    <div className={judicialDaysInput ? "max-w-md mx-auto w-full" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
                      {/* Legal Deadline Box - Shown only if no custom judicial deadline is entered */}
                      {!judicialDaysInput && (
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                          <div className="bg-slate-800 text-white px-4 py-3 text-xs font-black flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-amber-400" />
                              مهلت قانونی
                            </div>
                            <button
                              onClick={handleClearDeadline}
                              className="text-[10px] text-red-400 hover:text-red-300 font-bold px-2 py-0.5 rounded border border-red-900 bg-slate-900"
                            >
                              پاک کردن
                            </button>
                          </div>
                          <div className="p-4 flex-1 space-y-3">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                              <span>عنوان:</span>
                              <span className="text-slate-900 truncate max-w-[120px] font-black" title={deadlineResult.typeName}>{deadlineResult.typeName}</span>
                            </div>
                            {currentDeadlineOptions.find(opt => opt.title === deadlineType)?.article && (
                              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                <span>مستند قانونی:</span>
                                <span className="text-slate-900 truncate max-w-[120px] font-black" title={currentDeadlineOptions.find(opt => opt.title === deadlineType)?.article}>
                                  {currentDeadlineOptions.find(opt => opt.title === deadlineType)?.article}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                              <span>مدت:</span>
                              <span className="text-slate-900 font-black">
                                {deadlineType.includes("اعتراض ثالث اصلی") || deadlineType.includes("اعتراض ثالث تبعی")
                                  ? "فاقد محدودیت زمانی"
                                  : `${toPersianDigits(deadlineResult.baseDaysCount)} روز`}
                              </span>
                            </div>
                            <div className="pt-2 border-t border-slate-50">
                              <div className="text-[9px] font-black text-slate-400 mb-1">آخرین مهلت قانونی (آخرین زمان تقدیم لایحه):</div>
                              <div className="text-sm font-black text-red-600 font-mono text-left">
                                {deadlineType.includes("اعتراض ثالث اصلی") ? (
                                  "قبل از اجرای کامل حکم (ماده ۴۲۲ ق.آ.د.م)"
                                ) : deadlineType.includes("اعتراض ثالث تبعی") ? (
                                  "تا پایان دادرسی اصلی (ماده ۴۲۱ ق.آ.د.م)"
                                ) : holidayAdjustment.explanation ? (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 justify-start">
                                      <span className="text-xs text-slate-400 line-through font-mono">
                                        {toPersianDigits(deadlineResult.dueDate)}
                                      </span>
                                      <span className="text-[9px] bg-red-100 text-red-850 px-1.5 py-0.5 rounded-md font-sans font-black border border-red-200">تعطیل (انتقال به روز کاری)</span>
                                    </div>
                                    <div className="text-sm font-black text-red-600 font-mono text-left">
                                      {holidayAdjustment.adjustedDate}
                                    </div>
                                  </div>
                                ) : (
                                  toPersianDigits(deadlineResult.dueDate)
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Judicial Deadline Box - Shown only if custom judicial deadline is entered */}
                      {judicialResult && judicialDaysInput && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                          <div className="bg-amber-600 text-white px-4 py-3 text-xs font-black flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            مهلت قضایی سفارشی
                          </div>
                          <div className="p-4 flex-1 space-y-3">
                            <div className="flex justify-between text-[10px] font-bold text-amber-800">
                              <span>مدت وارد شده:</span>
                              <span className="text-amber-950 font-black">{toPersianDigits(judicialResult.baseDaysCount)} روز</span>
                            </div>
                            <div className="pt-2 border-t border-amber-200/50">
                              <div className="text-[9px] font-black text-amber-700/60 mb-1">آخرین مهلت قضایی (آخرین زمان اقدام):</div>
                              <div className="text-sm font-black text-red-600 font-mono text-left">
                                {judicialAdjustment && judicialAdjustment.explanation ? (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 justify-start">
                                      <span className="text-xs text-amber-600/65 line-through font-mono">
                                        {toPersianDigits(judicialResult.dueDate)}
                                      </span>
                                      <span className="text-[9px] bg-red-100 text-red-850 px-1.5 py-0.5 rounded-md font-sans font-black border border-red-200">تعطیل (انتقال به روز کاری)</span>
                                    </div>
                                    <div className="text-sm font-black text-red-600 font-mono text-left">
                                      {judicialAdjustment.adjustedDate}
                                    </div>
                                  </div>
                                ) : (
                                  toPersianDigits(judicialResult.dueDate)
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {showExplanation && (
                      <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl flex gap-2.5 items-start text-right animate-fadeIn">
                        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="text-[11px] font-black text-blue-900">انتقال موعد به دلیل تعطیلی رسمی یا جمعه:</h4>
                          <p className="text-[10px] leading-relaxed text-blue-850 font-bold">
                            {holidayAdjustment.explanation || (judicialAdjustment && judicialAdjustment.explanation)}
                          </p>
                        </div>
                      </div>
                    )}

                    {(() => {
                      const originDate = toPersianDigits(`${deadlineBaseYear}/${deadlineBaseMonth.toString().padStart(2, "0")}/${deadlineBaseDay.toString().padStart(2, "0")}`);
                      
                      const hasNoLimit = deadlineType.includes("اعتراض ثالث اصلی") || deadlineType.includes("اعتراض ثالث تبعی");

                      return (
                        <div className="space-y-4 mt-6">
                          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="bg-slate-100 text-slate-800 px-4 py-3 text-sm font-black text-center border-b border-slate-200">
                              روند محاسبه
                            </div>
                            <div className="p-4 space-y-3 text-xs text-slate-700 leading-relaxed font-medium">
                              <div className="flex items-start gap-2">
                                <span className="text-slate-400 mt-0.5">•</span>
                                <p>تاریخ مبدأ: {originDate}</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="text-slate-400 mt-0.5">•</span>
                                <p>روز مبدأ در شمارش مهلت لحاظ نشد.</p>
                              </div>
                              
                              {!hasNoLimit ? (
                                <>
                                  <div className="flex items-start gap-2">
                                    <span className="text-slate-400 mt-0.5">•</span>
                                    <p>
                                      مهلت {toPersianDigits(judicialDaysInput ? judicialResult.baseDaysCount : deadlineResult.baseDaysCount)} روزه از {toPersianDigits(judicialDaysInput ? judicialResult.startDate : deadlineResult.startDate)} آغاز شد و پس از {toPersianDigits(judicialDaysInput ? judicialResult.baseDaysCount : deadlineResult.baseDaysCount)} روز شمارش، تاریخ {toPersianDigits(judicialDaysInput ? judicialResult.endDate : deadlineResult.endDate)} بدست آمد.
                                    </p>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <span className="text-slate-400 mt-0.5">•</span>
                                    <p>
                                      تاریخ {toPersianDigits(judicialDaysInput ? judicialResult.endDate : deadlineResult.endDate)} روز اقدام بوده و به عنوان پایان مهلت در نظر گرفته نشد.
                                    </p>
                                  </div>
                                  {!holidayAdjustment.explanation ? (
                                    <div className="flex items-start gap-2 text-red-600 font-black text-xl">
                                      <span className="mt-0.5">•</span>
                                      <p>
                                        روز بعد یعنی {toPersianDigits(judicialDaysInput ? judicialResult.dueDate : deadlineResult.dueDate)} به عنوان پایان مهلت در نظر گرفته شد.
                                      </p>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-start gap-2">
                                        <span className="text-slate-400 mt-0.5">•</span>
                                        <p>
                                          روز بعد یعنی {toPersianDigits(deadlineResult.dueDate)} به عنوان پایان مهلت بود اما به دلیل تعطیلی این روز مهلت تغییر یافت.
                                        </p>
                                      </div>
                                      <div className="flex items-start gap-2 text-red-600 font-black text-xl bg-red-50 p-3 rounded-2xl border border-red-100">
                                        <span className="mt-1">•</span>
                                        <p>
                                          به دلیل تعطیلی روز پایان مهلت، مهلت به اولین روز کاری بعد یعنی {toPersianDigits(holidayAdjustment.adjustedDate)} منتقل شد.
                                        </p>
                                      </div>
                                    </>
                                  )}
                                </>
                              ) : (
                                <div className="flex items-start gap-2">
                                  <span className="text-slate-400 mt-0.5">•</span>
                                  <p>
                                    با توجه به نوع درخواست ({deadlineResult.typeName})، محدودیت زمانی روزشمار برای اقدام وجود ندارد.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="bg-slate-100 text-slate-800 px-4 py-3 text-sm font-black text-center border-b border-slate-200">
                              مستندات
                            </div>
                            <div className="p-4 space-y-3 text-xs text-slate-700 leading-relaxed font-medium">
                              <div className="flex items-start gap-2">
                                <span className="text-slate-400 mt-0.5">•</span>
                                <p>از قانون آیین دادرسی دادگاههای عمومی و انقلاب (در امور مدنی) مصوب ۱۳۷۹:</p>
                              </div>
                              {currentDeadlineOptions.find(opt => opt.title === deadlineType)?.article && (
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-start gap-2">
                                    <span className="text-slate-400 mt-0.5">•</span>
                                    <p className="font-black text-slate-800">{currentDeadlineOptions.find(opt => opt.title === deadlineType)?.article}:</p>
                                  </div>
                                  {currentDeadlineOptions.find(opt => opt.title === deadlineType)?.lawText && (
                                    <div className="flex items-start gap-2 mr-4 bg-slate-50 p-2 rounded-lg border-l-4 border-slate-300">
                                      <p className="text-slate-600 leading-relaxed">{currentDeadlineOptions.find(opt => opt.title === deadlineType)?.lawText}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="flex items-start gap-2">
                                <span className="text-slate-400 mt-0.5">•</span>
                                <p>ماده ۴۴۵ قانون آیین دادرسی دادگاههای عمومی و انقلاب (در امور مدنی): موعدی که ابتدای آن تاریخ ابلاغ یا اعلام ذکر شده است، روز ابلاغ و اعلام و همچنین روز اقدام جزء مدت محسوب نمی‌شود.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}

              {activeTab === "erth" && !erthResult && (
                <div className="py-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2">
                  <Users className="w-8 h-8 text-slate-350 stroke-1" />
                  <span>جهت مشاهده جدول تقسیم سهام و حساب مادی ارث دکمه محاسبه را فشار دهید.</span>
                </div>
              )}
              {activeTab === "erth" && erthResult && (
                <div className="py-2 space-y-4 animate-fadeIn" dir="rtl">
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-xl border border-green-100 text-xs text-right">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>محاسبه تقسیم ماترک ارگانیک بر اساس قوانین ارث مدنی کلید خورد.</span>
                  </div>

                  <h3 className="text-xs font-black text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-right">خلاصه تقسیم ارثیه مصوب:</h3>

                  <div className="space-y-3.5 text-xs text-slate-650 font-bold">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span>طبقه فعال ارث‌بری متوفی:</span>
                      <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-[10px] font-black font-sans">طبقه {toPersianDigits(erthResult.activeClass)}</span>
                    </div>

                    {parsePersianInput(erthEstateValue) > 0 && (
                      <div className="flex justify-between items-center">
                        <span>مبلغ ماترک قابل تقسیم:</span>
                        <span className="font-extrabold text-green-700">{formatPersianCurrency(parsePersianInput(erthEstateValue))}</span>
                      </div>
                    )}

                    {erthResult.commonDenominatorValue && (
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>مخرج مشترک ریاضی محاسبه:</span>
                        <span className="font-mono font-black">{toPersianDigits(erthResult.commonDenominatorValue)}</span>
                      </div>
                    )}

                    {/* Table listing Heirs */}
                    <div className="border border-slate-150 rounded-2xl overflow-hidden mt-4 shadow-sm bg-white">
                      <div className="bg-slate-50/70 p-2.5 border-b border-slate-150 text-right font-black text-xs text-slate-800 select-none">
                        جدول سهام بر اساس سهم‌الارث قانون مدنی:
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-slate-50 border-b border-slate-150 text-[10px] text-slate-500 font-black">
                            <tr>
                              <th className="p-2.5 py-2">وارث حائز ارث</th>
                              <th className="p-2.5 py-2 text-center">سهم کسری</th>
                              <th className="p-2.5 py-2 text-center">درصد سهم</th>
                              {parsePersianInput(erthEstateValue) > 0 && <th className="p-2.5 py-2 text-left">مبلغ سهم (ریال)</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {erthResult.heirs.map((heir: any, index: number) => (
                              <tr key={index} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                                <td className="p-2.5 text-slate-800 font-black">{heir.relation}</td>
                                <td className="p-2.5 text-center font-mono font-black text-slate-900">{toPersianDigits(heir.fraction)}</td>
                                <td className="p-2.5 text-center font-mono text-emerald-700 font-extrabold">٪{toPersianDigits(heir.percentage.toFixed(2))}</td>
                                {parsePersianInput(erthEstateValue) > 0 && (
                                  <td className="p-2.5 text-left font-mono font-black text-green-700">{formatPersianCurrency(heir.valueRials)}</td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Excluded relatives (حجب) */}
                    {erthResult.excluded && erthResult.excluded.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2 mt-4 text-right">
                        <span className="text-[11px] font-black text-amber-900 flex items-center gap-1.5 leading-tight">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          خویشاوندان حائز حجب (محروم از ارث به دلیل وجود وراث نزدیک‌تر):
                        </span>
                        <ul className="list-disc list-inside text-[10px] text-amber-800 font-bold space-y-1.5 leading-relaxed pr-2">
                          {erthResult.excluded.map((item: any, idx: number) => (
                            <li key={idx}>
                              <strong>{item.relation}:</strong> {item.reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "delay_interest" && !delayResult && (
                <div className="py-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2 animate-fadeIn" dir="rtl">
                  <TrendingUp className="w-8 h-8 text-slate-350 stroke-1" />
                  <span>جهت محاسبه خسارت تأخیر تأدیه (ماده ۵۲۲) دکمه محاسبه را فشار دهید.</span>
                </div>
              )}
              {activeTab === "delay_interest" && delayResult && (
                <div className="py-2 space-y-4 animate-fadeIn" dir="rtl">
                  {delayResult.isValid ? (
                    <>
                      <div className="flex items-center gap-2 text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-100 text-xs text-right">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>محاسبه غرامت تأخیر تادیه بر اساس مرکز آمار ایران برابر بخشنامه قوه قضاییه جمهوری اسلامی ایران</span>
                      </div>

                      <h3 className="text-xs font-black text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-right">جزئیات محاسبه خسارت:</h3>

                      <div className="space-y-3.5 text-xs text-slate-650 font-bold">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span>مبلغ اصل بدهی (دین):</span>
                          <span className="text-slate-900 font-extrabold">{formatPersianCurrency(delayResult.principal)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span>شاخص سال و ماه سررسید ({toPersianDigits(`${delayStartYear}/${delayStartMonth}`)}):</span>
                          <span className="font-mono text-slate-900">{toPersianDigits(delayResult.startIndex)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span>شاخص سال و ماه تأدیه ({toPersianDigits(`${delayEndYear}/${delayEndMonth}`)}):</span>
                          <span className="font-mono text-slate-900">{toPersianDigits(delayResult.endIndex)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span>نرخ تورم / ضریب افزایش:</span>
                          <span className="text-slate-900">{toPersianDigits(delayResult.multiplier.toFixed(4))}</span>
                        </div>

                        <div className="mt-6 space-y-3">
                          <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                            <div className="flex justify-between text-slate-600">
                              <span>موجودی اصل بدهی:</span>
                              <span>{formatPersianCurrency(delayResult.principal)}</span>
                            </div>
                            <div className="flex justify-between text-rose-600">
                              <span>مبلغ خسارت تأخیر:</span>
                              <span>{formatPersianCurrency(delayResult.interestAmount)}</span>
                            </div>
                          </div>
                          
                          <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center justify-between shadow-md">
                            <div>
                              <span className="text-[10px] text-slate-400 font-extrabold block mb-1">جمع کل قابل پرداخت (اصل + خسارت):</span>
                              <p className="text-base font-black text-amber-400 leading-none">{formatPersianCurrency(delayResult.finalAmount)}</p>
                              <p className="text-[10px] text-slate-400 mt-1">{numberToPersianWords(delayResult.finalAmount.toString())} ریال</p>
                              <p className="text-sm font-bold text-emerald-400 mt-2">معادل {toPersianDigits(formatThousandsSeparator(Math.floor(delayResult.finalAmount / 10).toString()))} تومان</p>
                              <p className="text-[10px] text-slate-400 mt-1">{numberToPersianWords(Math.floor(delayResult.finalAmount / 10).toString())} تومان</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2 text-amber-900 text-[11px] font-bold">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>{delayResult.error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {activeTab === "execution_fees" && !executionResult && (
              <div className="py-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2 animate-fadeIn" dir="rtl">
                <CheckCircle2 className="w-8 h-8 text-slate-350 stroke-1" />
                <span>جهت مشاهده غرامت و هزینه قانونی اجرای احکام دادگستری دکمه محاسبه را فشار دهید.</span>
              </div>
            )}
            {activeTab === "execution_fees" && executionResult && (
              <div className="py-2 space-y-5 animate-fadeIn text-right font-bold" dir="rtl">
                <div className="flex items-center gap-2 text-amber-800 bg-amber-50/70 p-3 rounded-xl border border-amber-100 text-xs text-right animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>محاسبه غرامت و هزینه قانونی اجرای احکام دادگستری با موفقیت انجام شد.</span>
                </div>

                {/* 1. Main Fee Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center space-y-3">
                  <h4 className="text-slate-500 text-xs font-black">هزینه اجرای احکام</h4>
                  <div className="flex items-center justify-center gap-1.5 py-1">
                    {executionResult.isRange ? (
                      <p className="text-xl font-black text-slate-900 tracking-tight">{toPersianDigits(executionResult.feeText)}</p>
                    ) : (
                      <p className="text-2xl font-black text-slate-900 tracking-tight">{formatPersianCurrency(executionResult.fee)}</p>
                    )}
                  </div>
                </div>

                {/* 2. Document/Legal Bases Card */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-right">مستندات</h4>
                  <div className="p-4 bg-slate-50/60 border border-slate-200 rounded-2xl text-[11px] text-slate-600 font-medium leading-relaxed space-y-2">
                    {executionCategory === "leases" ? (
                      <>
                        <p className="flex items-start gap-1.5 leading-relaxed">• از قانون اجرای احکام مدنی مصوب (۱۳۵۶/۸/۱)</p>
                        <p className="flex items-start gap-1.5 leading-relaxed">• ماده ۱۵۹ - در تخلیه مورد اجاره غیر منقول صدی ده اجاره بهای سه ماه ... بابت حق اجراء دریافت می شود.</p>
                      </>
                    ) : executionCategory === "financial" ? (
                      <>
                        <p className="flex items-start gap-1.5 leading-relaxed">• از قانون اجرای احکام مدنی مصوب (۱۳۵۶/۸/۱)</p>
                        <p className="flex items-start gap-1.5 leading-relaxed">• ماده ۱۵۸ - نیم عشر اجرایی معادل ۵٪ کل مبلغ محکوم به است که پس از اقدام عملیات اجرایی بر عهده محکوم‌علیه قرار می‌گیرد.</p>
                        <p className="flex items-start gap-1.5 leading-relaxed">• ماده ۱۶۰ - در صورت سازش طرفین یا تسلیم محکوم‌به ظرف ۱۰ روز از ابلاغ اجراییه، نصف حق اجرا (ربع عشر معادل ۲.۵٪) دریافت خواهد شد.</p>
                      </>
                    ) : (
                      <>
                        <p className="flex items-start gap-1.5 leading-relaxed">• قانون بودجه سال {toPersianDigits(executionResult.year)} کل کشور</p>
                        <p className="flex items-start gap-1.5 leading-relaxed">• تعرفه‌های رسمی مصوب قوه قضاییه جمهوری اسلامی ایران جهت تامین درآمدهای عمومی دولت.</p>
                      </>
                    )}
                  </div>
                </div>

                {/* 3. Inputs Summary Card */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-right">ورودی ها</h4>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs text-slate-700 bg-white shadow-sm font-bold">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100">
                      <span>سال</span>
                      <span className="text-slate-900">{toPersianDigits(executionResult.year)}</span>
                    </div>

                    <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 gap-4">
                      <span>دسته بندی</span>
                      <span className="text-slate-900 text-left">
                        {executionCategory === "financial" ? "دعاوی مالی" :
                         executionCategory === "non_financial" ? "اجرای احکام دعاوی غیر مالی و احکامی که محکوم به آن تقویم نشده و هزینه اجرای آرا و تصمیمات مراجع غیردادگستری" :
                         executionCategory === "temporary" ? "هزینه اجرای موقت احکام در کلیه مراجع قضایی" :
                         executionCategory === "third_party" ? "اعتراض شخص ثالث به اجرای احکام مدنی" :
                         "تخلیه مورد اجاره غیرمنقول"}
                      </span>
                    </div>

                    {executionCategory === "financial" && (
                      <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100">
                        <span>مبلغ محکوم به</span>
                        <span className="text-slate-900 font-extrabold">{formatPersianCurrency(executionResult.amount)}</span>
                      </div>
                    )}

                    {executionCategory === "leases" && (
                      <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100">
                        <span>مبلغ اجاره بهای یک ماه</span>
                        <span className="text-slate-900 font-extrabold">{formatPersianCurrency(executionResult.leaseAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center px-4 py-3">
                      <span>اجرای حکم به سازش منجر شده است</span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        executionResult.isCompromised ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"
                      }`}>
                        {executionResult.isCompromised ? "بله" : "خیر"}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            )}


          {(ageResult || mehriehResult || diyehResult || courtResult || lawyerResult || deadlineResult || erthResult || delayResult || executionResult || numToWordResult) && (
            <div className="border-t border-slate-100 pt-4 flex gap-2">
                <button
                  onClick={triggerPrint}
                  className="flex-1 py-3 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-950 text-slate-700 rounded-xl text-xs font-black select-none cursor-pointer flex items-center justify-center gap-2 transition duration-150"
                >
                  <Printer className="w-4 h-4 text-emerald-600" />
                  چاپ و ذخیره PDF
                </button>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* --- Legal Deadline Rules Modal --- */}
      {showDeadlineRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn" onClick={() => setShowDeadlineRules(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                مقررات محاسبه مهلت‌ها و مواعد قانونی
              </h3>
              <button onClick={() => setShowDeadlineRules(false)} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto font-sans text-xs leading-6 text-slate-700 space-y-4">
              <div className="bg-amber-50 text-amber-900 p-3 rounded-xl border border-amber-200/50">
                <strong>نکته مهم:</strong> مقررات کلی مربوط به نحوه تعیین، محاسبه و تمدید مهلت‌ها و مواعد قانونی در فصل یازدهم (از باب هشتم) قانون آیین دادرسی دادگاه‌های عمومی و انقلاب در امور مدنی ذیل مواد ۴۴۲ تا ۴۵۳ بیان شده است که پایه و اساس محاسبه مهلت‌های دادرسی مدنی و کیفری هستند.
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="font-bold text-slate-900 mb-1">ماده ۴۴۳:</div>
                  <p>از نظر احتساب موارد قانونی، سال دوازده ماه، ماه سی روز، هفته هفت روز و شبانه‌روز بیست و چهار ساعت است.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="font-bold text-slate-900 mb-1">ماده ۴۴۴:</div>
                  <p>چنانچه روز آخر موعد، مصادف با روز تعطیل ادارات باشد و یا به جهت آماده نبودن دستگاه قضایی مربوط امکان اقدامی نباشد، آن روز به حساب نمی‌آید و روز آخر موعد، روزی خواهد بود که ادارات بعد از تعطیل یا رفع مانع باز می‌شوند.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="font-bold text-slate-900 mb-1">ماده ۴۴۵:</div>
                  <p>موعدی که ابتدای آن تاریخ ابلاغ یا اعلام ذکر شده است، روز ابلاغ و اعلام و همچنین روز اقدام جزء مدت محسوب نمی‌شود.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="font-bold text-slate-900 mb-1">ماده ۴۴۶:</div>
                  <p>کلیه مواعد مقرر در این قانون از قبیل واخواهی و تکمیل دادخواست برای افراد مقیم خارج از کشور دو ماه از تاریخ ابلاغ می‌باشد.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
