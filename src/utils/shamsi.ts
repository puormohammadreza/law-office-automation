/**
 * High-precision Solar Hijri (Jalali) Calendar Utilities for Iran Timezone
 */

export const JALALI_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند"
];

export const JALALI_WEEKDAYS = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه"
];

/**
 * Converts Gregorian date components to Jalali components.
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): { jy: number, jm: number, jd: number } {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = (gm > 2) ? (gy + 1) : gy;
  let g_days_in_secs = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
  let jy = -1595 + (33 * Math.floor(g_days_in_secs / 12053));
  g_days_in_secs %= 12053;
  jy += 4 * Math.floor(g_days_in_secs / 1461);
  g_days_in_secs %= 1461;
  if (g_days_in_secs > 365) {
    jy += Math.floor((g_days_in_secs - 1) / 365);
    g_days_in_secs = (g_days_in_secs - 1) % 365;
  }
  let jm = (g_days_in_secs < 186) ? (1 + Math.floor(g_days_in_secs / 31)) : (7 + Math.floor((g_days_in_secs - 186) / 30));
  let jd = 1 + ((g_days_in_secs < 186) ? (g_days_in_secs % 31) : ((g_days_in_secs - 186) % 30));
  return { jy, jm, jd };
}

/**
 * Converts Jalali date components to Gregorian components.
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number, gm: number, gd: number } {
  let jyVal = jy + 1595;
  let g_days_in_secs = -355668 + (365 * jyVal) + Math.floor(jyVal / 33) * 8 + Math.floor(((jyVal % 33) + 3) / 4) + jd + ((jm < 7) ? ((jm - 1) * 31) : (((jm - 7) * 30) + 186));
  let gy = 400 * Math.floor(g_days_in_secs / 146097);
  g_days_in_secs %= 146097;
  if (g_days_in_secs > 36524) {
    g_days_in_secs--;
    gy += 100 * Math.floor(g_days_in_secs / 36524);
    g_days_in_secs %= 36524;
    if (g_days_in_secs >= 365) g_days_in_secs++;
  }
  gy += 4 * Math.floor(g_days_in_secs / 1461);
  g_days_in_secs %= 1461;
  if (g_days_in_secs > 365) {
    g_days_in_secs--;
    gy += Math.floor(g_days_in_secs / 365);
    g_days_in_secs %= 365;
  }
  let gd = g_days_in_secs + 1;
  const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  for (let i = 0; i < sal_a.length; i++) {
    gm = i;
    if (gd <= sal_a[i]) break;
    gd -= sal_a[i];
  }
  return { gy, gm, gd };
}

/**
 * Checks if key Jalali year is leap.
 */
export function isLeapJalali(jy: number): boolean {
  const mod = jy % 33;
  return [1, 5, 9, 13, 17, 22, 26, 30].includes(mod);
}

/**
 * Returns number of days in Jalali year & month.
 */
export function getJalaliMonthDays(jy: number, jm: number): number {
  if (jm >= 1 && jm <= 6) return 31;
  if (jm >= 7 && jm <= 11) return 30;
  if (jm === 12) {
    return isLeapJalali(jy) ? 30 : 29;
  }
  return 30;
}

/**
 * Returns current Jalali date components and time.
 */
export function getCurrentJalali(): { jy: number, jm: number, jd: number, hour: number, minute: number, second: number, weekday: string } {
  // Use Iran Standard Time offset (UTC+3.5 or summer offset if applicable)
  // Inside browsers/Node, Date handles local time based on runtime, let's format it.
  const now = new Date();
  const jyDate = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const weekdayIdx = (now.getDay() + 1) % 7;
  return {
    ...jyDate,
    hour: now.getHours(),
    minute: now.getMinutes(),
    second: now.getSeconds(),
    weekday: JALALI_WEEKDAYS[weekdayIdx]
  };
}

/**
 * Calculates remaining days from today to a Persian date string (YYYY/MM/DD).
 */
export function getDaysRemaining(targetJalaliStr: string): number {
  try {
    const today = getCurrentJalali();
    const cleanTarget = toEnglishDigits(targetJalaliStr);
    const dateParts = cleanTarget.split("/").map(Number);
    if (dateParts.length !== 3) return 0;
    
    const gToday = jalaliToGregorian(today.jy, today.jm, today.jd);
    const dToday = new Date(gToday.gy, gToday.gm - 1, gToday.gd);
    
    const gTarget = jalaliToGregorian(dateParts[0], dateParts[1], dateParts[2]);
    const dTarget = new Date(gTarget.gy, gTarget.gm - 1, gTarget.gd);
    
    const diffTime = dTarget.getTime() - dToday.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch (e) {
    return 0;
  }
}

/**
 * Formats a Jalali date into standard strings.
 */
export function formatJalaliDate(jy: number, jm: number, jd: number, format: string = "YYYY/MM/DD"): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return format
    .replace("YYYY", jy.toString())
    .replace("MM", pad(jm))
    .replace("DD", pad(jd))
    .replace("MName", JALALI_MONTH_NAMES[jm - 1]);
}

/**
 * Returns the first weekday index of a Jalali month (0 = Saturday, ..., 6 = Friday)
 */
export function getJalaliFirstWeekday(jy: number, jm: number): number {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, 1);
  const gDate = new Date(gy, gm - 1, gd);
  return (gDate.getDay() + 1) % 7;
}

export function getPersianDayName(jy: number, jm: number, jd: number): string {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
  const date = new Date(Date.UTC(gy, gm - 1, gd));
  const weekdayIndex = (date.getUTCDay() + 1) % 7;
  return JALALI_WEEKDAYS[weekdayIndex];
}

/**
 * Converts English digits to Persian digits.
 */
export function toPersianDigits(num: number | string): string {
  if (num === undefined || num === null) return "";
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.toString().replace(/\d/g, (x) => persianDigits[parseInt(x)]).replace(/\./g, "/");
}

/**
 * Converts Persian digits to English digits.
 */
export function toEnglishDigits(str: string): string {
  if (!str) return "";
  const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  let result = str.toString();
  for (let i = 0; i < 10; i++) {
    result = result.replace(persianDigits[i], i.toString());
  }
  return result;
}

/**
 * Automatically adds slashes to a date string as the user types (YYYY/MM/DD)
 */
export function formatDateWithSlash(value: string): string {
  const digits = toEnglishDigits(value).replace(/\D/g, "");
  let formatted = digits;
  if (digits.length > 4) {
    formatted = digits.slice(0, 4) + "/" + digits.slice(4);
  }
  if (digits.length > 6) {
    formatted = formatted.slice(0, 7) + "/" + formatted.slice(7, 9);
  }
  return toPersianDigits(formatted);
}

/**
 * Adjusts a Jalali date if it falls on a Friday or official holiday,
 * moving it to the next working day, based on Article 444 of the Civil Procedure Code.
 */
export function adjustDateForHolidays(targetJalaliStr: string, officialHolidays: string[] = []): { adjustedDate: string, explanation: string } {
  let currentJalali = toEnglishDigits(targetJalaliStr);
  let isHoliday = true;

  // Standard fixed annual solar holidays in Iran (MM/DD format)
  const defaultSolarHolidays = [
    "01/01", "01/02", "01/03", "01/04", // نوروز
    "01/12", // روز جمهوری اسلامی
    "01/13", // روز طبیعت (سیزده بدر)
    "03/14", // رحلت امام خمینی
    "03/15", // قیام ۱۵ خرداد
    "11/22", // پیروزی انقلاب اسلامی
    "12/29", // ملی شدن صنعت نفت
    "12/30"  // روز آخر اسفند در سال‌های کبیسه
  ];

  // Pre-calculated solar dates for lunar religious holidays in Iran (YYYY/MM/DD format)
  const religiousHolidays: { [year: number]: string[] } = {
    1403: [
      "1403/01/12", // شهادت حضرت علی
      "1403/01/22", "1403/01/23", // عید فطر
      "1403/02/15", // شهادت امام صادق
      "1403/03/28", // عید قربان
      "1403/04/05", // عید غدیر
      "1403/04/25", "1403/04/26", // تاسوعا و عاشورا
      "1403/06/04", // اربعین حسینی
      "1403/06/12", // رحلت پیامبر و شهادت امام حسن
      "1403/06/14", // شهادت امام رضا
      "1403/06/22", // شهادت امام حسن عسکری
      "1403/06/31", // میلاد پیامبر و امام صادق
      "1403/09/15", // شهادت حضرت فاطمه
      "1403/10/25", // ولادت امام علی
      "1403/11/09", // مبعث رسول اکرم
      "1403/11/27", // ولادت امام زمان (نیمه شعبان)
    ],
    1404: [
      "1404/01/01", // شهادت حضرت علی (نوبت اول)
      "1404/01/11", "1404/01/12", // عید فطر (نوبت اول)
      "1404/02/03", // شهادت امام صادق
      "1404/03/16", // عید قربان
      "1404/03/24", // عید غدیر
      "1404/04/14", "1404/04/15", // تاسوعا و عاشورا
      "1404/05/24", // اربعین حسینی
      "1404/06/01", // رحلت پیامبر و شهادت امام حسن
      "1404/06/03", // شهادت امام رضا
      "1404/06/11", // شهادت امام حسن عسکری
      "1404/06/20", // میلاد پیامبر و امام صادق
      "1404/09/04", // شهادت حضرت فاطمه
      "1404/10/13", // ولادت امام علی
      "1404/10/27", // مبعث رسول اکرم
      "1404/11/15", // ولادت امام زمان (نیمه شعبان)
      "1404/12/19", // شهادت حضرت علی (نوبت دوم)
      "1404/12/29", // عید فطر (نوبت دوم)
    ],
    1405: [
      "1405/01/01", // عید فطر (ادامه از سال قبل)
      "1405/03/02", // شهادت امام صادق
      "1405/03/06", // عید قربان
      "1405/03/14", // عید غدیر
      "1405/04/03", "1405/04/04", // تاسوعا و عاشورا
      "1405/05/13", // اربعین حسینی
      "1405/05/21", // رحلت پیامبر و شهادت امام حسن
      "1405/05/23", // شهادت امام رضا
      "1405/05/31", // شهادت امام حسن عسکری
      "1405/06/09", // میلاد پیامبر و امام صادق
      "1405/08/23", // شهادت حضرت فاطمه
      "1405/10/02", // ولادت امام علی
      "1405/10/16", // مبعث رسول اکرم
      "1405/11/04", // ولادت امام زمان (نیمه شعبان)
      "1405/12/09", // شهادت حضرت علی
      "1405/12/19", "1405/12/20", // عید فطر
    ],
    1406: [
      "1406/02/12", // شهادت امام صادق
      "1406/02/26", // عید قربان
      "1406/03/03", // عید غدیر
      "1406/03/23", "1406/03/24", // تاسوعا و عاشورا
      "1406/05/02", // اربعین حسینی
      "1406/05/10", // رحلت پیامبر و شهادت امام حسن
      "1406/05/12", // شهادت امام رضا
      "1406/05/20", // شهادت امام حسن عسکری
      "1406/05/29", // میلاد پیامبر و امام صادق
      "1406/08/12", // شهادت حضرت فاطمه
      "1406/09/21", // ولادت امام علی
      "1406/10/06", // مبعث رسول اکرم
      "1406/10/24", // ولادت امام زمان (نیمه شعبان)
      "1406/11/29", // شهادت حضرت علی
      "1406/12/09", "1406/12/10", // عید فطر
    ],
    1407: [
      "1407/01/31", // شهادت امام صادق
      "1407/02/15", // عید قربان
      "1407/02/23", // عید غدیر
      "1407/03/12", "1407/03/13", // تاسوعا و عاشورا
      "1407/04/22", // اربعین حسینی
      "1407/04/30", // رحلت پیامبر و شهادت امام حسن
      "1407/05/02", // شهادت امام رضا
      "1407/05/10", // شهادت امام حسن عسکری
      "1407/05/19", // میلاد پیامبر و امام صادق
      "1407/08/01", // شهادت حضرت فاطمه
      "1407/09/10", // ولادت امام علی
      "1407/09/24", // مبعث رسول اکرم
      "1407/10/12", // ولادت امام زمان (نیمه شعبان)
      "1407/11/17", // شهادت حضرت علی
      "1407/11/27", "1407/11/28", // عید فطر
    ]
  };

  while (isHoliday) {
    const parts = currentJalali.split("/").map(Number);
    if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
      break;
    }
    const { gy, gm, gd } = jalaliToGregorian(parts[0], parts[1], parts[2]);
    const date = new Date(gy, gm - 1, gd);

    // In JavaScript Date.getDay(), 5 is Friday
    const isFriday = date.getDay() === 5;
    const formattedMonthDay = `${parts[1].toString().padStart(2, "0")}/${parts[2].toString().padStart(2, "0")}`;

    const normalizedCurrentJalali = `${parts[0]}/${parts[1].toString().padStart(2, "0")}/${parts[2].toString().padStart(2, "0")}`;

    const yearList = religiousHolidays[parts[0]] || [];
    const isReligiousHoliday = yearList.includes(normalizedCurrentJalali);

    const isOfficialHoliday = defaultSolarHolidays.includes(formattedMonthDay) || isReligiousHoliday || officialHolidays.includes(currentJalali);

    if (isFriday || isOfficialHoliday) {
      // Move to the next day
      const nextDate = addDaysToJalali(parts[0], parts[1], parts[2], 1);
      currentJalali = formatJalaliDate(nextDate.jy, nextDate.jm, nextDate.jd);
    } else {
      isHoliday = false;
    }
  }

  if (currentJalali !== toEnglishDigits(targetJalaliStr)) {
    return {
      adjustedDate: toPersianDigits(currentJalali),
      explanation: "بر اساس ماده ۴۴۴ قانون آیین دادرسی مدنی: «چنانچه روز آخر موعد، مصادف با روز تعطیل عمومی باشد، آن روز به حساب نمی‌آید و نخستین روز پس از تعطیل، روز آخر موعد خواهد بود.»"
    };
  }
  return {
    adjustedDate: targetJalaliStr,
    explanation: ""
  };
}

/**
 * Automatically adds colon to a time string as the user types (HH:MM)
 */
export function formatTimeWithColon(value: string): string {
  const digits = toEnglishDigits(value).replace(/\D/g, "").slice(0, 4);
  let formatted = digits;
  if (digits.length > 2) {
    formatted = digits.slice(0, 2) + ":" + digits.slice(2);
  }
  return toPersianDigits(formatted);
}

/**
 * Formats numbers into Persian currency with separators (Toman/Rial)
 */
export function formatPersianCurrency(amount: number): string {
  const safeAmount = amount ?? 0;
  const formatted = safeAmount.toLocaleString("en-US");
  return toPersianDigits(formatted) + " ریال";
}

/**
 * Adds a specific number of days to a Jalali date, transitioning months and years safely.
 */
export function addDaysToJalali(jy: number, jm: number, jd: number, days: number): { jy: number, jm: number, jd: number } {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
  const date = new Date(gy, gm - 1, gd);
  date.setDate(date.getDate() + days);
  return gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/**
 * Checks if a specific Jalali date and time has passed beyond a grace period (default 5 minutes).
 */
export function isEventExpired(jalaliDate: string, time: string, graceMinutes: number = 5, endRepeatDate?: string): boolean {
  try {
    const enDate = toEnglishDigits(endRepeatDate ? endRepeatDate : jalaliDate);
    // Expected format: YYYY/MM/DD
    const dateParts = enDate.split("/").map(Number);
    if (dateParts.length !== 3 || isNaN(dateParts[0])) return false;

    let h = 23, m = 59;
    if (time) {
      const enTime = toEnglishDigits(time);
      const timeParts = enTime.split(":").map(Number);
      if (!isNaN(timeParts[0])) h = timeParts[0];
      if (timeParts.length > 1 && !isNaN(timeParts[1])) m = timeParts[1];
    }

    const { gy, gm, gd } = jalaliToGregorian(dateParts[0], dateParts[1], dateParts[2]);
    const eventDate = new Date(gy, gm - 1, gd, h, m);
    const now = new Date();
    
    // threshold is eventDate + graceMinutes
    const thresholdDate = new Date(eventDate.getTime() + graceMinutes * 60000);
    
    return now > thresholdDate;
  } catch (e) {
    return false;
  }
}

/**
 * Returns the exact timestamp of an event for sorting purposes.
 */
export function getEventTimestamp(jalaliDate: string, time: string): number {
  try {
    const enDate = toEnglishDigits(jalaliDate);
    const dateParts = enDate.split("/").map(Number);
    if (dateParts.length !== 3 || isNaN(dateParts[0])) return 0;
    
    let h = 23, m = 59;
    if (time) {
      const enTime = toEnglishDigits(time);
      const timeParts = enTime.split(":").map(Number);
      if (!isNaN(timeParts[0])) h = timeParts[0];
      if (timeParts.length > 1 && !isNaN(timeParts[1])) m = timeParts[1];
    }
    
    const { gy, gm, gd } = jalaliToGregorian(dateParts[0], dateParts[1], dateParts[2]);
    return new Date(gy, gm - 1, gd, h, m).getTime();
  } catch(e) {
    return 0;
  }
}

/**
 * Returns formatted Persian string showing the remaining time to an event.
 */
export function getRemainingTimeText(jalaliDate: string, time: string): string {
  const timestamp = getEventTimestamp(jalaliDate, time);
  if (!timestamp) return "";
  
  const diff = timestamp - Date.now();
  if (diff <= 0) return "منقضی شده";
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return toPersianDigits(`${days} روز و ${hours} ساعت مانده`);
  } else if (hours > 0) {
    return toPersianDigits(`${hours} ساعت و ${minutes} دقیقه مانده`);
  } else {
    return toPersianDigits(`${minutes} دقیقه مانده`);
  }
}

/**
 * Checks if an event matches a given date (supporting recurring events without duplication).
 */
export function doesEventMatchDate(e: any, dateStr: string): boolean {
  if (e.jalaliDate === dateStr) return true;
  if (!e.repeatSelected || e.repeatSelected === "بدون تکرار") return false;

  const getDaysDiff = (d1: string, d2: string): number => {
    try {
      const p1 = d1.split("/").map(Number);
      const p2 = d2.split("/").map(Number);
      if (p1.length !== 3 || p2.length !== 3) return 0;
      const g1 = jalaliToGregorian(p1[0], p1[1], p1[2]);
      const g2 = jalaliToGregorian(p2[0], p2[1], p2[2]);
      const date1 = new Date(g1.gy, g1.gm - 1, g1.gd);
      const date2 = new Date(g2.gy, g2.gm - 1, g2.gd);
      const diffTime = Math.abs(date2.getTime() - date1.getTime());
      return Math.round(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  const start = e.jalaliDate;
  const end = e.endRepeatDate || "1415/12/29";
  
  if (dateStr < start || dateStr > end) return false;

  if (e.repeatSelected === "هر روز") {
    return true;
  } else if (e.repeatSelected === "هر هفته") {
    const diff = getDaysDiff(start, dateStr);
    return diff % 7 === 0;
  } else if (e.repeatSelected === "هر ماه") {
    const startParts = start.split("/");
    const targetParts = dateStr.split("/");
    return startParts[2] === targetParts[2];
  } else if (e.repeatSelected === "هر سال") {
    const startParts = start.split("/");
    const targetParts = dateStr.split("/");
    return startParts[1] === targetParts[1] && startParts[2] === targetParts[2];
  }
  return false;
}
