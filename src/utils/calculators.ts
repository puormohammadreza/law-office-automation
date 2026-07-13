/**
 * Legal calculations for Iranian Judiciary System (Mehrieh, Diyeh, Court Fees, Lawyer Fees)
 */
import { addDaysToJalali } from "./shamsi";

// CBI inflation indices from year 1350 to 1404
export type MonthlyIndexRecord = {
  annual: number;
  months: { [month: number]: number };
};

export const CBI_INFLATION_INDICES: Record<number, MonthlyIndexRecord> = {
  1315: { annual: 0.001, months: {} },
  1316: { annual: 0.002, months: {} },
  1317: { annual: 0.003, months: {} },
  1318: { annual: 0.004, months: {} },
  1319: { annual: 0.005, months: {} },
  1320: { annual: 0.006, months: {} },
  1321: { annual: 0.007, months: {} },
  1322: { annual: 0.008, months: {} },
  1323: { annual: 0.009, months: {} },
  1324: { annual: 0.01, months: {} },
  1325: { annual: 0.011, months: {} },
  1326: { annual: 0.012, months: {} },
  1327: { annual: 0.013, months: {} },
  1328: { annual: 0.014, months: {} },
  1329: { annual: 0.015, months: {} },
  1330: { annual: 0.016, months: {} },
  1331: { annual: 0.017, months: {} },
  1332: { annual: 0.018, months: {} },
  1333: { annual: 0.019, months: {} },
  1334: { annual: 0.02, months: {} },
  1335: { annual: 0.021, months: {} },
  1336: { annual: 0.022, months: {} },
  1337: { annual: 0.023, months: {} },
  1338: { annual: 0.024, months: {} },
  1339: { annual: 0.025, months: {} },
  1340: { annual: 0.026, months: {} },
  1341: { annual: 0.027, months: {} },
  1342: { annual: 0.028, months: {} },
  1343: { annual: 0.029, months: {} },
  1344: { annual: 0.03, months: {} },
  1345: { annual: 0.031, months: {} },
  1346: { annual: 0.032, months: {} },
  1347: { annual: 0.033, months: {} },
  1348: { annual: 0.034, months: {} },
  1349: { annual: 0.035, months: {} },
  1350: { annual: 0.04, months: {} },
  1351: { annual: 0.05, months: {} },
  1352: { annual: 0.05, months: {} },
  1353: { annual: 0.06, months: {} },
  1354: { annual: 0.07, months: {} },
  1355: { annual: 0.08, months: {} },
  1356: { annual: 0.1, months: {} },
  1357: { annual: 0.11, months: {} },
  1358: { annual: 0.12, months: {} },
  1359: { annual: 0.15, months: {} },
  1360: { annual: 0.18, months: {} },
  1361: { annual: 0.22, months: {} },
  1362: { annual: 0.26, months: {} },
  1363: { annual: 0.29, months: {} },
  1364: { annual: 0.31, months: {} },
  1365: { annual: 0.38, months: {} },
  1366: { annual: 0.49, months: {} },
  1367: { annual: 0.63, months: {} },
  1368: { annual: 0.74, months: {} },
  1369: { annual: 0.81, months: {} },
  1370: { annual: 0.99, months: {} },
  1371: { annual: 1.23, months: {} },
  1372: { annual: 1.51, months: {} },
  1373: { annual: 2.04, months: {} },
  1374: { annual: 3.05, months: {} },
  1375: { annual: 3.75, months: {} },
  1376: { annual: 4.4, months: {} },
  1377: { annual: 5.1, months: {} },
  1378: { annual: 6.1, months: {} },
  1379: { annual: 6.9, months: {} },
  1380: { annual: 7.7, months: {} },
  1381: { annual: 8.9, months: {} },
  1382: { annual: 10.3, months: {} },
  1383: { annual: 11.8, months: {} },
  1384: { annual: 13, months: {} },
  1385: { annual: 14.5, months: {} },
  1386: { annual: 17.2, months: {} },
  1387: { annual: 21.6, months: {} },
  1388: { annual: 23.9, months: {} },
  1389: { annual: 26.9, months: {} },
  1390: { annual: 32.7, months: {} },
  1391: { annual: 42.7, months: {} },
  1392: { annual: 57.5, months: {} },
  1393: { annual: 66.5, months: {} },
  1394: { annual: 74.4, months: {} },
  1395: { annual: 81.1, months: {} },
  1396: { annual: 88.9, months: {} },
  1397: { annual: 116.5, months: {} },
  1398: { annual: 164.5, months: {} },
  1399: { annual: 240.2, months: {} },
  1400: { annual: 351.2, months: {} },
  1401: { annual: 524.3, months: {} },
  1402: { annual: 835.4, months: {} },
  1403: { annual: 1186.3, months: {} },
  1404: { annual: 1684.5, months: {} },
  1405: { annual: 2358.2, months: {} },
};

/**
 * Calculates adjusted Mehrieh based on marriage year and payment/previous year.
 * Multiplier = (Index of Year of Payment - 1) / (Index of Marriage Year)
 */
export function calculateMehrieh(amount: number, marriageYear: number, paymentYear: number): {
  isValid: boolean;
  adjustedAmount: number;
  multiplier: number;
  marriageIndex: number;
  paymentIndex: number;
  inflationRate: number;
  realValue: number;
  error?: string;
} {
  const marriageData = CBI_INFLATION_INDICES[marriageYear];
  const targetYearForIndex = paymentYear - 1;
  const paymentData = CBI_INFLATION_INDICES[targetYearForIndex];

  const marriageIndex = marriageData?.annual;
  const paymentIndex = paymentData?.annual;

  if (!marriageIndex) {
    return {
      isValid: false,
      adjustedAmount: amount,
      multiplier: 1,
      marriageIndex: 1,
      paymentIndex: 1,
      inflationRate: 1,
      realValue: amount,
      error: `شاخص تورم برای سال عقد (${marriageYear}) یافت نشد.`
    };
  }
  if (!paymentIndex) {
    return {
      isValid: false,
      adjustedAmount: amount,
      multiplier: 1,
      marriageIndex,
      paymentIndex: marriageIndex,
      inflationRate: 1,
      realValue: amount,
      error: `شاخص تورم برای سال قبل از تادیه (${targetYearForIndex}) یافت نشد.`
    };
  }

  const multiplier = Number(paymentIndex) / Number(marriageIndex);
  const adjustedAmount = Math.round(Number(amount) * multiplier);

  return {
    isValid: true,
    adjustedAmount,
    multiplier,
    marriageIndex,
    paymentIndex,
    inflationRate: multiplier,
    realValue: adjustedAmount
  };
}

/**
 * Calculates Delay Payment Interest (تاخیر تادیه) based on CBI inflation indices.
 * Formula: Principal * (Index of End Date / Index of Start Date)
 */
export function calculateDelayInterest(
  amount: number,
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number
): {
  isValid: boolean;
  principal: number;
  multiplier: number;
  finalAmount: number;
  interestAmount: number;
  startIndex: number;
  endIndex: number;
  error?: string;
} {
  const startData = CBI_INFLATION_INDICES[startYear];
  const endData = CBI_INFLATION_INDICES[endYear];

  // Fallback to annual if monthly index doesn't exist
  const startIndex = startData?.months?.[startMonth] || startData?.annual;
  const endIndex = endData?.months?.[endMonth] || endData?.annual;

  if (!startIndex || !endIndex) {
    return {
      isValid: false,
      principal: amount,
      multiplier: 1,
      finalAmount: amount,
      interestAmount: 0,
      startIndex: startIndex || 0,
      endIndex: endIndex || 0,
      error: `شاخص تورم برای سال/ماه انتخابی در بانک اطلاعاتی یافت نشد.`
    };
  }

  const multiplier = Number(endIndex) / Number(startIndex);
  const totalPayable = Math.round(Number(amount) * multiplier);
  const pureDamage = totalPayable - Number(amount);

  return {
    isValid: true,
    principal: amount,
    multiplier: multiplier,
    finalAmount: totalPayable,
    interestAmount: pureDamage,
    startIndex: startIndex,
    endIndex: endIndex
  };
}

// Diyeh rates in Rials (defined for current and past years)
export const DIYEH_RATES: { [year: number]: number } = {
  1401: 6000000000,  // 600 Million Toman
  1402: 9000000000,  // 900 Million Toman
  1403: 12000000000, // 1.2 Billion Toman
  1404: 16200000000, // 1.62 Billion Toman
  1405: 21000000000  // 2.1 Billion Toman (21 Billion Rial)
};

/**
 * Calculates Diyeh value based on year, share, and sacred month multiplier.
 */
export function calculateDiyeh(year: number, fraction: number, isSacredMonth: boolean): {
  baseFullRate: number;
  calculatedValue: number;
  customFullRate: number;
  isSacredMonth: boolean;
  baseRate: number;
  diyehFee: number;
} {
  const baseFullRate = DIYEH_RATES[year] || DIYEH_RATES[1405];
  // Sacred month rule (تغلیظ دیه): 1/3 is added to the full base rate for casualties inside sacred months
  const actualFullRate = isSacredMonth ? baseFullRate + (baseFullRate / 3) : baseFullRate;
  const calculatedValue = Math.round(actualFullRate * fraction);

  return {
    baseFullRate,
    customFullRate: actualFullRate,
    calculatedValue,
    isSacredMonth,
    baseRate: baseFullRate,
    diyehFee: calculatedValue
  };
}

/**
 * Court litigation cost (هزینه دادرسی) in Iran
 */
export function calculateCourtFees(claimAmount: number, stage: "first_instance" | "appeal" | "supreme_court" | "non_financial"): {
  courtFee: number;
  stageName: string;
} {
  if (stage === "non_financial") {
    // Non-financial claims have a low fixed registry fee (e.g., average 1,500,000 Rial)
    return { courtFee: 1500000, stageName: "دعوای غیرمالی (هزینه ثابت مقطوع)" };
  }

  let courtFee = 0;
  let stageName = "";

  if (stage === "first_instance") {
    stageName = "مرحله نخستین (دادگاه عمومی)";
    // Up to 200,000,000 Rial => 2.5%, remaining amount over it => 3.5%
    if (claimAmount <= 200000000) {
      courtFee = claimAmount * 0.025;
    } else {
      courtFee = (200000000 * 0.025) + ((claimAmount - 200000000) * 0.035);
    }
  } else if (stage === "appeal") {
    stageName = "تجدیدنظرخواهی و واخواهی";
    // 4.5% of claim value
    courtFee = claimAmount * 0.045;
  } else if (stage === "supreme_court") {
    stageName = "فرجام‌خواهی، اعاده دادرسی و اعتراض ثالث";
    // 5.5% of claim value
    courtFee = claimAmount * 0.055;
  }

  return {
    courtFee: Math.round(courtFee),
    stageName
  };
}

/**
 * Calculates lawyer legal progressive tariff model (تعرفه قانونی موضوع آیین‌نامه تعرفه حق‌الوکاله)
 */
export function calculateLawyerTariff(claimAmount: number): number {
  if (claimAmount <= 0) return 0;
  
  let tariff = 0;
  
  // Up to 500 Million Rial -> 8%
  if (claimAmount <= 500000000) {
    tariff = claimAmount * 0.08;
  } 
  // 500 Million to 2 Billion Rial -> 7%
  else if (claimAmount <= 2000000000) {
    tariff = (500000000 * 0.08) + ((claimAmount - 500000000) * 0.07);
  } 
  // 2 Billion to 10 Billion Rial -> 5%
  else if (claimAmount <= 10000000000) {
    tariff = (500000000 * 0.08) + (1500000000 * 0.07) + ((claimAmount - 2000000000) * 0.05);
  } 
  // 10 Billion to 30 Billion Rial -> 4%
  else if (claimAmount <= 30000000000) {
    tariff = (500000000 * 0.08) + (1500000000 * 0.07) + (8000000000 * 0.05) + ((claimAmount - 10000000000) * 0.04);
  } 
  // Over 30 Billion Rial -> 3%
  else {
    tariff = (500000000 * 0.08) + (1500000000 * 0.07) + (8000000000 * 0.05) + (20000000000 * 0.04) + ((claimAmount - 30000000000) * 0.03);
  }

  // Tariff min and max as per guidelines if any, let's keep the progressive model directly.
  return Math.round(tariff);
}

/**
 * Lawyers full calculations (Tariff vs Contractual, plus finance stamp + Bar Association shares)
 */
export function calculateLawyerFinance(
  firstInstanceAmount: number,
  appealAmount: number,
  calculationType: "tariff" | "contract",
  firstInstanceContractFee: number = 0,
  appealContractFee: number = 0
): {
  firstInstance: { fee: number; taxStamp: number; barAssociationFee: number };
  appeal: { fee: number; taxStamp: number; barAssociationFee: number };
  totalTaxStamp: number;
  totalBarAssociationFee: number;
  description: string;
} {
  const fFee = calculationType === "tariff" ? calculateLawyerTariff(firstInstanceAmount) : firstInstanceContractFee;
  const aFee = calculationType === "tariff" ? calculateLawyerTariff(appealAmount) : appealContractFee;

  const fTaxStamp = Math.round(fFee * 0.05);
  const aTaxStamp = Math.round(aFee * 0.05);

  const fBarFee = Math.round(fFee * 0.01);
  const aBarFee = Math.round(aFee * 0.01);

  return {
    firstInstance: {
      fee: fFee,
      taxStamp: fTaxStamp,
      barAssociationFee: fBarFee,
    },
    appeal: {
      fee: aFee,
      taxStamp: aTaxStamp,
      barAssociationFee: aBarFee,
    },
    totalTaxStamp: fTaxStamp + aTaxStamp,
    totalBarAssociationFee: fBarFee + aBarFee,
    description: calculationType === "tariff"
      ? "محاسبه بر اساس تعرفه قانونی آیین‌نامه سال ۱۳۹۹ (به روز رسانی شده) برای هر مرحله"
      : "محاسبه بر اساس قرارداد خصوصی مالی وکالت منعقده بین وکیل و موکل برای هر مرحله"
  };
}

/**
 * Calculates judicial and procedural deadlines in accordance with Article 445 of the IPC.
 */
export function calculateJudicialDeadline(
  jy: number,
  jm: number,
  jd: number,
  type: string,
  customDays: number = 20,
  customTypeName: string = "",
  includeThursdaysAsHoliday: boolean = false
): {
  daysCount: number;
  startDate: string;
  endDate: string;
  dueDate: string;
  typeName: string;
  baseDaysCount: number;
} {
  let daysCount = customDays;
  let typeName = customTypeName || type;

  // We fallback to checking some old constants...
  if (!customTypeName) {
    switch (type) {
      case "appeal_domestic":
        daysCount = 20;
        typeName = "تجدیدنظرخواهی و واخواهی (مقیم ایران)";
        break;
      case "appeal_abroad":
        daysCount = 60;
        typeName = "تجدیدنظرخواهی و واخواهی (مقیم خارج)";
        break;
      case "supreme_court_domestic":
        daysCount = 20;
        typeName = "فرجام‌خواهی (مقیم ایران)";
        break;
      case "supreme_court_abroad":
        daysCount = 60;
        typeName = "فرجام‌خواهی (مقیم خارج)";
        break;
      case "rehearing_domestic":
        daysCount = 20;
        typeName = "واخواهی (مقیم ایران)";
        break;
      case "rehearing_abroad":
        daysCount = 60;
        typeName = "واخواهی (مقیم خارج)";
        break;
      case "retrial":
        daysCount = 20;
        typeName = "اعاده دادرسی (حقوقی و کیفری)";
        break;
      case "third_party_objection":
        daysCount = 20;
        typeName = "اعتراض ثالث (طاری و اصلی)";
        break;
      case "defect_correction":
        daysCount = 10;
        typeName = "رفع نقص اخطاریه و دادخواست";
        break;
      case "expert_objection":
        daysCount = 7;
        typeName = "اعتراض به نظریه کارشناس";
        break;
      case "attachment_objection":
        daysCount = 10;
        typeName = "اعتراض به قرار تامین خواسته";
        break;
      case "injunction_objection":
        daysCount = 10;
        typeName = "اعتراض به دستور موقت";
        break;
      case "delivery_deadline":
        daysCount = 10;
        typeName = "مهلت تسلیم اموال / معرفی مال";
        break;
      case "judgment_execution":
        daysCount = 10;
        typeName = "مهلت اجرای حکم (ماده ۳۴ قانون اجرای احکام)";
        break;
      case "judicial_deadline":
        daysCount = customDays + 2;
        typeName = `مهلت قضایی (${customDays} روز + ۲ روز ابلاغ و اقدام)`;
        break;
      case "custom":
        daysCount = customDays;
        typeName = `موعد سفارشی (${customDays} روز)`;
        break;
    }
  }

  const pad = (n: number) => n.toString().padStart(2, "0");
  const formatDate = (obj: { jy: number, jm: number, jd: number }) => `${obj.jy}/${pad(obj.jm)}/${pad(obj.jd)}`;

  const addDaysToJalaliDynamic = (jyVal: number, jmVal: number, jdVal: number, daysVal: number) => {
    let jyTmp = jyVal, jmTmp = jmVal, jdTmp = jdVal + daysVal;
    while (true) {
      let mDays = 30;
      if (jmTmp >= 1 && jmTmp <= 6) mDays = 31;
      else if (jmTmp >= 7 && jmTmp <= 11) mDays = 30;
      else {
        const isLeap = [1, 5, 9, 13, 17, 22, 26, 30].includes(jyTmp % 33);
        mDays = isLeap ? 30 : 29;
      }
      if (jdTmp > mDays) {
        jdTmp -= mDays;
        jmTmp++;
        if (jmTmp > 12) {
          jmTmp = 1;
          jyTmp++;
        }
      } else if (jdTmp <= 0) {
        jmTmp--;
        if (jmTmp <= 0) {
          jmTmp = 12;
          jyTmp--;
        }
        let prevMDays = 30;
        if (jmTmp >= 1 && jmTmp <= 6) prevMDays = 31;
        else if (jmTmp >= 7 && jmTmp <= 11) prevMDays = 30;
        else {
          const isLeap = [1, 5, 9, 13, 17, 22, 26, 30].includes(jyTmp % 33);
          prevMDays = isLeap ? 30 : 29;
        }
        jdTmp += prevMDays;
      } else {
        break;
      }
    }
    return { jy: jyTmp, jm: jmTmp, jd: jdTmp };
  };

  const dynamicStart = addDaysToJalaliDynamic(jy, jm, jd, 1);
  
  // Create Date object for calculating day of week to manage holidays accurately
  // Since we only know Jalali dates mathematically here, we do a very approximate day of week calculation
  // by calculating days elapsed since a known Friday in Jalali: 1403/01/03 was Friday.
  
  const getDayOfWeek = (y: number, m: number, d: number) => {
    const startY = 1403; // known year
    let totalDays = 0;
    
    // add days for years
    for (let i = startY; i < y; i++) {
        totalDays += [1, 5, 9, 13, 17, 22, 26, 30].includes(i % 33) ? 366 : 365;
    }
    for (let i = startY; i > y; i--) {
        totalDays -= [1, 5, 9, 13, 17, 22, 26, 30].includes((i-1) % 33) ? 366 : 365;
    }
    
    for (let i = 1; i < m; i++) {
        if (i <= 6) totalDays += 31;
        else totalDays += 30;
    }
    totalDays += d;
    
    // 1403/01/03 was Friday(5)
    // 1403/01/01 was Wednesday(3)
    // Day 1 => 3. So (totalDays - 1 + 3) % 7 
    let wd = (totalDays + 2) % 7;
    if (wd < 0) wd += 7;
    return wd; // 0=Sat, 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri
  }

  // Calculate strict due date
  // Based on the practical calculation in Iranian judicial system (Sana),
  // deadlines are calculated as Notification Date + Duration.
  // Notification Date (Day 0) + Duration = Last Day of Deadline.
  // Due Date is the day AFTER the Last Day of Deadline.
  
  let addedDays = daysCount;
  let dynamicEnd = addDaysToJalaliDynamic(jy, jm, jd, addedDays);
  
  // Last Day of Deadline
  let lastDayOfDeadline = dynamicEnd;
  
  // Due Date is the next day
  let dueDate = addDaysToJalaliDynamic(lastDayOfDeadline.jy, lastDayOfDeadline.jm, lastDayOfDeadline.jd, 1);

  return {
    baseDaysCount: daysCount,
    daysCount: daysCount,
    startDate: formatDate(dynamicStart),
    endDate: formatDate(lastDayOfDeadline),
    dueDate: formatDate(dueDate),
    typeName
  };
}

export interface ErthInput {
  marryStatus: "single" | "husband" | "wife";
  estateValue: number;
  commonDenominator: boolean;
  
  // Class 1
  fatherAlive: boolean;
  motherAlive: boolean;
  sonsCount: number;
  daughtersCount: number;
  grandchildren: Array<{ id: string; gender: "son" | "daughter"; grandchildrenCount: number }>;
  
  // Class 2
  paternalGrandfather: boolean;
  paternalGrandmother: boolean;
  maternalGrandfather: boolean;
  maternalGrandmother: boolean;
  brothersFull: number;
  sistersFull: number;
  brothersPaternal: number;
  sistersPaternal: number;
  siblingsMaternal: number;
  
  // Class 3
  unclesPaternalFull: number;
  auntsPaternalFull: number;
  unclesMaternalFull: number;
  auntsMaternalFull: number;
  
  unclesPaternalPaternal: number;
  auntsPaternalPaternal: number;
  unclesMaternalPaternal: number;
  auntsMaternalPaternal: number;
  
  unclesPaternalMaternal: number;
  auntsPaternalMaternal: number;
  unclesMaternalMaternal: number;
  auntsMaternalMaternal: number;
}

export interface HeirResult {
  relation: string;
  fractionValue: number;
  fraction: string;
  percentage: number;
  valueRials: number;
  details: string;
}

export interface ExcludedHeir {
  relation: string;
  details: string;
}

export interface ErthOutput {
  activeClass: number;
  heirs: HeirResult[];
  excludedHeirs: ExcludedHeir[];
  denominator: number;
}

// Function to find simplified fraction of any floating point value
export function getSimplifiedFraction(val: number): string {
  if (val <= 0) return "۰";
  const tolerance = 0.005;
  for (let d = 1; d <= 480; d++) {
    const n = Math.round(val * d);
    if (Math.abs(val - n / d) < tolerance) {
      if (n === 0) return "۰";
      return d === 1 ? `${n}` : `${n}/${d}`;
    }
  }
  return `${Math.round(val * 100)}/۱۰۰`;
}

export function calculateErth(input: ErthInput): ErthOutput {
  const {
    marryStatus,
    estateValue,
    commonDenominator,
    fatherAlive,
    motherAlive,
    sonsCount,
    daughtersCount,
    grandchildren,
    paternalGrandfather,
    paternalGrandmother,
    maternalGrandfather,
    maternalGrandmother,
    brothersFull,
    sistersFull,
    brothersPaternal,
    sistersPaternal,
    siblingsMaternal,
    unclesPaternalFull,
    auntsPaternalFull,
    unclesMaternalFull,
    auntsMaternalFull,
    unclesPaternalPaternal,
    auntsPaternalPaternal,
    unclesMaternalPaternal,
    auntsMaternalPaternal,
    unclesPaternalMaternal,
    auntsPaternalMaternal,
    unclesMaternalMaternal,
    auntsMaternalMaternal
  } = input;

  const heirsTemp: Array<{ relation: string; rawShare: number; details: string }> = [];
  const excludedHeirs: ExcludedHeir[] = [];
  let activeClass = 1;

  // 1. Detect active inheritance Class
  const hasClass1Input = fatherAlive || motherAlive || sonsCount > 0 || daughtersCount > 0 || grandchildren.length > 0;
  const hasClass2Input = paternalGrandfather || paternalGrandmother || maternalGrandfather || maternalGrandmother || brothersFull > 0 || sistersFull > 0 || brothersPaternal > 0 || sistersPaternal > 0 || siblingsMaternal > 0;

  if (hasClass1Input) {
    activeClass = 1;
    // Exclude other classes
    if (hasClass2Input) {
      excludedHeirs.push({ relation: "وراث طبقه دوم (اجداد و خواهر/برادران)", details: "به دلیل وجود وراث طبقه اول، تمامی خویشاوندان طبقه دوم از ارث محروم می‌شوند (حاجب حرمان)." });
    }
    const hasClass3Input = unclesPaternalFull > 0 || auntsPaternalFull > 0 || unclesMaternalFull > 0 || auntsMaternalFull > 0 || unclesPaternalPaternal > 0 || auntsPaternalPaternal > 0 || unclesMaternalPaternal > 0 || auntsMaternalPaternal > 0 || unclesPaternalMaternal > 0 || auntsPaternalMaternal > 0 || unclesMaternalMaternal > 0 || auntsMaternalMaternal > 0;
    if (hasClass3Input) {
      excludedHeirs.push({ relation: "وراث طبقه سوم (عمو/عمه/دایی/خاله‌ها)", details: "به دلیل وجود وراث طبقه اول، تمامی خویشاوندان طبقه سوم از ارث محروم می‌شوند (حاجب حرمان)." });
    }
  } else if (hasClass2Input) {
    activeClass = 2;
    const hasClass3Input = unclesPaternalFull > 0 || auntsPaternalFull > 0 || unclesMaternalFull > 0 || auntsMaternalFull > 0 || unclesPaternalPaternal > 0 || auntsPaternalPaternal > 0 || unclesMaternalPaternal > 0 || auntsMaternalPaternal > 0 || unclesPaternalMaternal > 0 || auntsPaternalMaternal > 0 || unclesMaternalMaternal > 0 || auntsMaternalMaternal > 0;
    if (hasClass3Input) {
      excludedHeirs.push({ relation: "وراث طبقه سوم (عمو/عمه/دایی/خاله‌ها)", details: "به دلیل وجود وراث طبقه دوم، تمامی خویشاوندان طبقه سوم از ارث محروم می‌شوند (حاجب حرمان)." });
    }
  } else {
    activeClass = 3;
  }

  // Common math logic for classes
  if (activeClass === 1) {
    const hasDescendants = sonsCount > 0 || daughtersCount > 0 || grandchildren.length > 0;
    
    // Spouse Share
    let spouseShare = 0;
    if (marryStatus === "husband") {
      spouseShare = hasDescendants ? 0.25 : 0.50;
      heirsTemp.push({
        relation: "زوج (شوهر متوفی)",
        rawShare: spouseShare,
        details: hasDescendants ? "فرض قانونی یک چهارم تَرکه به دلیل وجود فرزند یا نوادگان" : "فرض قانونی یک دوم تَرکه به دلیل عدم وجود فرزند"
      });
    } else if (marryStatus === "wife") {
      spouseShare = hasDescendants ? 0.125 : 0.25;
      heirsTemp.push({
        relation: "زوجه (همسر متوفی)",
        rawShare: spouseShare,
        details: hasDescendants ? "فرض قانونی یک هشتم تَرکه به دلیل وجود فرزند یا نوادگان" : "فرض قانونی یک چهارم تَرکه به دلیل عدم وجود فرزند"
      });
    }

    // Sibling blocker condition for Mother (blocks from 1/3 to 1/6)
    // Shia law: father is alive + at least (2 brothers OR 1 brother & 2 sisters OR 4 sisters of full or paternal origin)
    const blocksCount = (brothersFull + brothersPaternal) >= 2 || 
                        ((brothersFull + brothersPaternal) === 1 && (sistersFull + sistersPaternal) >= 2) || 
                        (sistersFull + sistersPaternal) >= 4;
    const motherBlocked = fatherAlive && blocksCount;

    // Mother share
    let motherShare = 0;
    if (motherAlive) {
      if (hasDescendants) {
        motherShare = 1/6;
        heirsTemp.push({ relation: "مادر متوفی", rawShare: motherShare, details: "فرض قانونی یک ششم به دلیل وجود اولاد یا نوادگان" });
      } else if (motherBlocked) {
        motherShare = 1/6;
        heirsTemp.push({ relation: "مادر متوفی", rawShare: motherShare, details: "فرض قانونی یک ششم مقید شده به دلیل وجود حاجب نقصان (برادر و خواهران متوفی)" });
      } else {
        motherShare = 1/3;
        heirsTemp.push({ relation: "مادر متوفی", rawShare: motherShare, details: "فرض قانونی یک سوم بی مانع به دلیل عدم وجود فرزند و حاجب" });
      }
    }

    // Father share
    let fatherShare = 0;
    if (fatherAlive) {
      if (hasDescendants) {
        fatherShare = 1/6;
        heirsTemp.push({ relation: "پدر متوفی", rawShare: fatherShare, details: "فرض قانونی یک ششم به دلیل وجود اولاد یا نوادگان" });
      } else {
        // Father gets residue by kinship
        fatherShare = 0; // calculated below as residuary
      }
    }

    // Children / Grandchildren Branch share
    const totalKidsCount = sonsCount + daughtersCount;
    if (hasDescendants) {
      if (totalKidsCount > 0) {
        // Exclude grandchildren if active children exist
        if (grandchildren.length > 0) {
          grandchildren.forEach(g => {
            excludedHeirs.push({
              relation: `نواده متوفی از شاخه ${g.gender === "son" ? "پسر" : "دختر"} فوت شده`,
              details: "در حضور فرزندان بلاواسطه (طبقه اول درجه اول)، بی واسطه‌ها یعنی نوادگان (درجه دوم) ارث نمی برند."
            });
          });
        }

        const remainingPool = 1 - spouseShare - motherShare - (fatherAlive ? 1/6 : 0);
        
        if (sonsCount > 0) {
          // Division by Kinship (قرابت) 2:1 for boys:girls
          const totalUnits = (sonsCount * 2) + (daughtersCount * 1);
          const perUnit = remainingPool / totalUnits;
          
          if (fatherAlive) {
            heirsTemp.push({
              relation: "پدر متوفی",
              rawShare: 1/6,
              details: "فرض قانونی یک ششم در حضور اولاد ملحق شده"
            });
          }

          for (let i = 0; i < sonsCount; i++) {
            heirsTemp.push({
              relation: `پسر متوفی (مورد ${i + 1})`,
              rawShare: perUnit * 2,
              details: "دریافت سهم ارث به صورت قرابت‌بری (سهم پسر دو برابر سهم دختر)"
            });
          }
          for (let i = 0; i < daughtersCount; i++) {
            heirsTemp.push({
              relation: `دختر متوفی (مورد ${i + 1})`,
              rawShare: perUnit,
              details: "دریافت سهم ارث به صورت قرابت‌بری (سهم دختر نصف سهم پسر)"
            });
          }
        } else {
          // Only daughters exist, calculating their fixed shares (1/2 for 1 daughter, 2/3 for multiple)
          const daughterBase = daughtersCount === 1 ? 0.5 : 2/3;
          const fatherBase = fatherAlive ? 1/6 : 0;
          const totalSharesSum = spouseShare + motherShare + fatherBase + daughterBase;

          if (totalSharesSum > 1) {
            // Deficit exists (عول) -> bore entirely by daughters in Shia jurisprudence
            const fixedGuaranteed = spouseShare + motherShare + fatherBase;
            const availableForDaughters = 1 - fixedGuaranteed;
            const perDaughter = availableForDaughters / daughtersCount;
            
            if (fatherAlive) {
              heirsTemp.push({ relation: "پدر متوفی", rawShare: 1/6, details: "فرض قانونی یک ششم تضمین شده در حضور اولاد" });
            }
            for (let i = 0; i < daughtersCount; i++) {
              heirsTemp.push({
                relation: `دختر متوفی (مورد ${i + 1})`,
                rawShare: perDaughter,
                details: "فرض قانونی به کسر ناشی از تداخل سهام (نقائص ماترک طبق فقه امامیه بر دختران وارد می‌شود)"
              });
            }
          } else {
            // Surplus exists (تعصیب باطل است، رد جاری می‌شود)
            // Returned to daughters, father, mother proportionally (spouse gets no return)
            if (fatherAlive) {
              const fatherBaseVal = 1/6;
              const motherBaseVal = motherShare;
              const daughterBaseVal = daughterBase;
              
              // Sum of share weights eligible for return
              const sumReturnWeights = daughterBaseVal + fatherBaseVal + (motherBlocked ? 0 : motherBaseVal);
              const factor = (1 - spouseShare) / sumReturnWeights;
              
              heirsTemp.push({
                relation: "پدر متوفی",
                rawShare: fatherBaseVal * factor,
                details: "فرض قانونی یک ششم به همراه سهم اضافی از رد مازاد ترکه"
              });

              if (motherAlive) {
                // Adjust mother share if not blocked
                const mIndex = heirsTemp.findIndex(h => h.relation === "مادر متوفی");
                if (mIndex !== -1) {
                  heirsTemp[mIndex].rawShare = motherBaseVal * (motherBlocked ? 1 : factor);
                  heirsTemp[mIndex].details = motherBlocked 
                    ? "فرض قانونی یک ششم ثابت شده بدون دریافت مازاد به دلیل وجود حاجب نقصان"
                    : "فرض قانونی به همراه دریافت سهم مازاد ترکه به شکل رد";
                }
              }

              const perDaughter = (daughterBaseVal * factor) / daughtersCount;
              for (let i = 0; i < daughtersCount; i++) {
                heirsTemp.push({
                  relation: `دختر متوفی (مورد ${i + 1})`,
                  rawShare: perDaughter,
                  details: "سهم فرض دختر به انضمام برگشت سهم مازاد ترکه به شکل رد"
                });
              }
            } else {
              // No father alive, return to daughter and mother (if not blocked)
              const motherBaseVal = motherShare;
              const daughterBaseVal = daughterBase;
              const sumReturnWeights = daughterBaseVal + (motherBlocked ? 0 : motherBaseVal);
              const factor = (1 - spouseShare) / sumReturnWeights;

              if (motherAlive) {
                const mIndex = heirsTemp.findIndex(h => h.relation === "مادر متوفی");
                if (mIndex !== -1) {
                  heirsTemp[mIndex].rawShare = motherBaseVal * (motherBlocked ? 1 : factor);
                  heirsTemp[mIndex].details = motherBlocked 
                    ? "فرض قانونی یک ششم ثابت شده بدون دریافت مازاد"
                    : "فرض قانونی به همراه کل برگشتی مازاد به عنوان رد";
                }
              }

              const perDaughter = (daughterBaseVal * factor) / daughtersCount;
              for (let i = 0; i < daughtersCount; i++) {
                heirsTemp.push({
                  relation: `دختر متوفی (مورد ${i + 1})`,
                  rawShare: perDaughter,
                  details: "سهم فرض دختر به همراه برگشت مابقی سهم زاید ترکه"
                });
              }
            }
          }
        }
      } else {
        // No living children, grandchildren inherit by representation (قائم‌مقامی)
        const totalBranchUnits = grandchildren.reduce((acc, g) => acc + (g.gender === "son" ? 2 : 1), 0);
        const remainingPool = 1 - spouseShare - motherShare - (fatherAlive ? 1/6 : 0);
        
        if (fatherAlive) {
          heirsTemp.push({ relation: "پدر متوفی", rawShare: 1/6, details: "فرض قانونی یک ششم ثابت شده در حضور قائم مقام اولاد" });
        }

        grandchildren.forEach(branch => {
          const branchUnitCount = branch.gender === "son" ? 2 : 1;
          const branchBaseShare = (remainingPool / totalBranchUnits) * branchUnitCount;
          
          if (branch.grandchildrenCount > 0) {
            const perGrandchild = branchBaseShare / branch.grandchildrenCount;
            for (let i = 0; i < branch.grandchildrenCount; i++) {
              heirsTemp.push({
                relation: `نواده متوفی شاخه ${branch.gender === "son" ? "پسر" : "دختر"} فوت شده (نوه ${i + 1})`,
                rawShare: perGrandchild,
                details: `ارث قائم‌مقامی فرزند فوت شده متوفی (سهم کل شاخه ${getSimplifiedFraction(branchBaseShare)} تقسیم بر تعداد نوه های آن شاخه)`
              });
            }
          }
        });
      }
    } else {
      // No descendants at all (No children and no grandkids) -> Parents + Spouse
      const restPool = 1 - spouseShare - motherShare;
      if (fatherAlive) {
        heirsTemp.push({
          relation: "پدر متوفی",
          rawShare: restPool,
          details: "تصاحب کننده تمام باقیمانده ماترک به شکل قرابت‌بری خویشاوندی"
        });
      } else {
        // No father alive, residue goes to mother (return)
        if (motherAlive) {
          const mIndex = heirsTemp.findIndex(h => h.relation === "مادر متوفی");
          if (mIndex !== -1) {
            heirsTemp[mIndex].rawShare = 1 - spouseShare;
            heirsTemp[mIndex].details = "تصاحب کل ترکه (مادر علاوه بر سهم فرض خود، مابقی کل ترکه را به وسیله رد دریافت می‌کند)";
          }
        }
      }
    }
  }

  else if (activeClass === 2) {
    // Class 2: Grandparents & Siblings
    let spouseShare = marryStatus === "husband" ? 0.50 : (marryStatus === "wife" ? 0.25 : 0);
    if (spouseShare > 0) {
      heirsTemp.push({
        relation: marryStatus === "husband" ? "زوج (شوهر متوفی)" : "زوجه (همسر متوفی)",
        rawShare: spouseShare,
        details: marryStatus === "husband" ? "فرض قانونی زوج در طبقه دوم (نصف کل ماترک)" : "فرض قانونی زوجه در طبقه دوم (یک چهارم کل ماترک)"
      });
    }

    // Maternal side (امي) Grandparents & Siblings has 1/3 of the estate if multiple, 1/6 if single
    // shared equally regardless of gender
    const maternalCount = (maternalGrandfather ? 1 : 0) + (maternalGrandmother ? 1 : 0) + siblingsMaternal;
    let maternalPoolShare = 0;
    if (maternalCount > 0) {
      maternalPoolShare = maternalCount >= 2 ? (1/3) : (1/6);
      const perMaternalShare = maternalPoolShare / maternalCount;
      
      if (maternalGrandfather) {
        heirsTemp.push({
          relation: "پدربزرگ مادری (جد امی)",
          rawShare: perMaternalShare,
          details: `سهم مساوی از حصه مادری امی ترکه (کل حصه مادری: ${getSimplifiedFraction(maternalPoolShare)})`
        });
      }
      if (maternalGrandmother) {
        heirsTemp.push({
          relation: "مادربزرگ مادری (جده امی)",
          rawShare: perMaternalShare,
          details: `سهم مساوی از حصه مادری امی ترکه (کل حصه مادری: ${getSimplifiedFraction(maternalPoolShare)})`
        });
      }
      for (let i = 0; i < siblingsMaternal; i++) {
        heirsTemp.push({
          relation: `خواهر/برادر مادری (هم‌مادر امی مورد ${i + 1})`,
          rawShare: perMaternalShare,
          details: "خواهری و برادری مادری به تساوی مطلق فارغ از جنیست ارث می‌برند"
        });
      }
    }

    // Paternal side takes the residue
    let paternalPoolShare = Math.max(0, 1 - spouseShare - maternalPoolShare);
    
    // Check Full sibling or paternal sibling active (Full sibling blocks paternal siblings)
    const hasFullSiblings = brothersFull > 0 || sistersFull > 0;
    const activePaternalGrandfather = paternalGrandfather;
    const activePaternalGrandmother = paternalGrandmother;
    const activeBrothers = hasFullSiblings ? brothersFull : brothersPaternal;
    const activeSisters = hasFullSiblings ? sistersFull : sistersPaternal;

    // Exclude blocked paternal siblings
    if (hasFullSiblings && (brothersPaternal > 0 || sistersPaternal > 0)) {
      excludedHeirs.push({
        relation: "خواهران و برادران پدری (ابی)",
        details: "به علت حضور خواهر یا برادر ابوینی (پدر و مادر مشترک)، خویشاوندان ابی (فقط پدر مشترک) ساقط می‌شوند."
      });
    }

    const paternalMales = (activePaternalGrandfather ? 1 : 0) + activeBrothers;
    const paternalFemales = (activePaternalGrandmother ? 1 : 0) + activeSisters;
    const totalPaternalUnits = (paternalMales * 2) + (paternalFemales * 1);

    if (totalPaternalUnits > 0) {
      // Return maternal pool also to paternal if maternal is empty
      if (maternalCount === 0) {
        paternalPoolShare = 1 - spouseShare;
      }

      const perPaternalUnit = paternalPoolShare / totalPaternalUnits;

      if (activePaternalGrandfather) {
        heirsTemp.push({
          relation: "پدربزرگ پدری (جد ابی)",
          rawShare: perPaternalUnit * 2,
          details: "سهم حصه پدری در جدول ارث ابوینی (سهم جنس ذکور دو برابر اناث منسوب)"
        });
      }
      if (activePaternalGrandmother) {
        heirsTemp.push({
          relation: "مادربزرگ پدری (جده ابی)",
          rawShare: perPaternalUnit,
          details: "سهم حصه پدری در جدول ارث ابوینی (سهم جنس اناث نصف ذکور منسوب)"
        });
      }

      const siblingTypeLabel = hasFullSiblings ? "ابوینی" : "ابی";
      for (let i = 0; i < activeBrothers; i++) {
        heirsTemp.push({
          relation: `برادر ${siblingTypeLabel} (مورد ${i + 1})`,
          rawShare: perPaternalUnit * 2,
          details: `سهم حصه پدری قرابت‌بری (سهم برادر دو برابر خواهر ${siblingTypeLabel})`
        });
      }
      for (let i = 0; i < activeSisters; i++) {
        heirsTemp.push({
          relation: `خواهر ${siblingTypeLabel} (مورد ${i + 1})`,
          rawShare: perPaternalUnit,
          details: `سهم حصه پدری قرابت‌بری (سهم خواهر نصف برادر ${siblingTypeLabel})`
        });
      }
    } else {
      // If paternal side is empty but maternal exists, maternal takes the remainder too (return)
      if (maternalCount > 0 && paternalPoolShare > 0) {
        maternalPoolShare = 1 - spouseShare;
        const adjustedPerMaternal = maternalPoolShare / maternalCount;
        
        // Update raw shares of maternal heirs in heirsTemp
        heirsTemp.forEach(h => {
          if (h.relation.includes("مادری") || h.relation.includes("امی")) {
            h.rawShare = adjustedPerMaternal;
            h.details += " (به همراه برگشتی کل حصه پدری خالی به عنوان رد)";
          }
        });
      }
    }
  }

  else {
    // Class 3: Uncles & Aunts
    let spouseShare = marryStatus === "husband" ? 0.50 : (marryStatus === "wife" ? 0.25 : 0);
    if (spouseShare > 0) {
      heirsTemp.push({
        relation: marryStatus === "husband" ? "زوج (شوهر متوفی)" : "زوجه (همسر متوفی)",
        rawShare: spouseShare,
        details: marryStatus === "husband" ? "فرض قانونی نصف ماترک در طبقه سوم" : "فرض قانونی یک چهارم ماترک در طبقه سوم"
      });
    }

    const maternalUnclesCount = unclesMaternalFull + unclesMaternalPaternal + unclesMaternalMaternal;
    const maternalAuntsCount = auntsMaternalFull + auntsMaternalPaternal + auntsMaternalMaternal;
    const totalMaternalCount = maternalUnclesCount + maternalAuntsCount;

    let maternalPoolShare = 0;
    if (totalMaternalCount > 0) {
      maternalPoolShare = totalMaternalCount >= 2 ? (1/3) : (1/6);
      const perMaternal = maternalPoolShare / totalMaternalCount;

      for (let i = 0; i < maternalUnclesCount; i++) {
        heirsTemp.push({
          relation: `دایی متوفی (مورد ${i + 1})`,
          rawShare: perMaternal,
          details: "دایی‌های متوفی با دوشاخگی مادری به مقدار مساوی با خاله‌ها ارث می‌برند"
        });
      }
      for (let i = 0; i < maternalAuntsCount; i++) {
        heirsTemp.push({
          relation: `خاله متوفی (مورد ${i + 1})`,
          rawShare: perMaternal,
          details: "خاله‌های متوفی با دوشاخگی مادری به مقدار مساوی با دایی‌ها ارث می‌برند"
        });
      }
    }

    let paternalPoolShare = Math.max(0, 1 - spouseShare - maternalPoolShare);
    const paternalUnclesCount = unclesPaternalFull + unclesPaternalPaternal + unclesPaternalMaternal;
    const paternalAuntsCount = auntsPaternalFull + auntsPaternalPaternal + auntsPaternalMaternal;
    const totalPaternalCount = paternalUnclesCount + paternalAuntsCount;

    if (totalPaternalCount > 0) {
      if (totalMaternalCount === 0) {
        paternalPoolShare = 1 - spouseShare;
      }
      const totalUnits = (paternalUnclesCount * 2) + (paternalAuntsCount * 1);
      const perUnit = paternalPoolShare / totalUnits;

      for (let i = 0; i < paternalUnclesCount; i++) {
        heirsTemp.push({
          relation: `عمو متوفی (مورد ${i + 1})`,
          rawShare: perUnit * 2,
          details: "سهم حصه پدری عمو (دو برابر سهم عمه عاطفه پدری)"
        });
      }
      for (let i = 0; i < paternalAuntsCount; i++) {
        heirsTemp.push({
          relation: `عمه متوفی (مورد ${i + 1})`,
          rawShare: perUnit,
          details: "سهم حصه پدری عمه (نصف سهم عمو عاطفه پدری)"
        });
      }
    } else {
      if (totalMaternalCount > 0 && paternalPoolShare > 0) {
        maternalPoolShare = 1 - spouseShare;
        const adjustedPerMaternal = maternalPoolShare / totalMaternalCount;
        heirsTemp.forEach(h => {
          if (h.relation.includes("دایی") || h.relation.includes("خاله")) {
            h.rawShare = adjustedPerMaternal;
            h.details += " (به ضمیمه رد باقیمانده حصه پدری)";
          }
        });
      }
    }
  }

  // 4. Calculate Final Fractions and Commons
  let denominator = 1;
  const nonZeroShares = heirsTemp.filter(h => h.rawShare > 0).map(h => h.rawShare);
  
  if (commonDenominator && nonZeroShares.length > 0) {
    const standardDenoms = [1, 2, 3, 4, 6, 8, 12, 24, 30, 36, 40, 48, 60, 72, 80, 96, 120, 240, 360, 480, 720, 960, 1440, 2880];
    for (const d of standardDenoms) {
      let isCommon = true;
      for (const share of nonZeroShares) {
        const multiplied = share * d;
        if (Math.abs(multiplied - Math.round(multiplied)) > 0.005) {
          isCommon = false;
          break;
        }
      }
      if (isCommon) {
        denominator = d;
        break;
      }
    }
  }

  // Apply to heirs list
  const heirsFinal: HeirResult[] = heirsTemp.map(heir => {
    let finalFraction = "";
    if (denominator > 1 && heir.rawShare > 0) {
      finalFraction = `${Math.round(heir.rawShare * denominator)}/${denominator}`;
    } else {
      finalFraction = getSimplifiedFraction(heir.rawShare);
    }

    return {
      relation: heir.relation,
      fractionValue: heir.rawShare,
      fraction: finalFraction,
      percentage: Number((heir.rawShare * 100).toFixed(2)),
      valueRials: estateValue > 0 ? Math.round(heir.rawShare * estateValue) : 0,
      details: heir.details
    };
  });

  return {
    activeClass,
    heirs: heirsFinal.filter(h => h.fractionValue > 0),
    excludedHeirs,
    denominator
  };
}

