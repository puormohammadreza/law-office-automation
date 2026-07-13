// Persian Numbers and Words converter and parses/generators
// Perfect utility to support converting numbers to Persian words and vice versa.

const PERSIAN_UNITS = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const PERSIAN_TEENS = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
const PERSIAN_TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const PERSIAN_HUNDREDS = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
const PERSIAN_SCALES = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون', 'بیلیون'];

/**
 * Converts Persian/Arabic digits inside a string to standard English digits
 */
export function persianToEnglishDigits(str: string): string {
  if (!str) return '';
  return str
    .replace(/[۰0]/g, '0')
    .replace(/[۱1]/g, '1')
    .replace(/[۲2]/g, '2')
    .replace(/[۳3]/g, '3')
    .replace(/[۴4]/g, '4')
    .replace(/[۵5]/g, '5')
    .replace(/[۶6]/g, '6')
    .replace(/[۷7]/g, '7')
    .replace(/[۸8]/g, '8')
    .replace(/[۹9]/g, '9')
    .replace(/[٠]/g, '0')
    .replace(/[١]/g, '1')
    .replace(/[٢]/g, '2')
    .replace(/[٣]/g, '3')
    .replace(/[٤]/g, '4')
    .replace(/[٥]/g, '5')
    .replace(/[٦]/g, '6')
    .replace(/[٧]/g, '7')
    .replace(/[٨]/g, '8')
    .replace(/[٩]/g, '9');
}

/**
 * Converts English digits to Persian digits
 */
export function englishToPersianDigits(str: string | number): string {
  if (str === undefined || str === null) return '';
  const s = str.toString();
  return s
    .replace(/0/g, '۰')
    .replace(/1/g, '۱')
    .replace(/2/g, '۲')
    .replace(/3/g, '۳')
    .replace(/4/g, '۴')
    .replace(/5/g, '۵')
    .replace(/6/g, '۶')
    .replace(/7/g, '۷')
    .replace(/8/g, '۸')
    .replace(/9/g, '۹');
}

/**
 * Formats a number string with automatic comma grouping (thousands separator)
 * e.g., 1000000 -> 1,000,000 or ۱,۰۰۰,۰۰۰
 */
export function formatThousandsSeparator(val: string | number, returnPersian = true): string {
  if (val === undefined || val === null) return '';
  
  // Clean non-digits and normalize
  const cleanVal = persianToEnglishDigits(val.toString()).replace(/\D/g, '');
  if (!cleanVal) return '';
  
  // Manual thousands separator to handle large strings using array join for performance
  let resultArr: string[] = [];
  for (let i = cleanVal.length - 1, count = 0; i >= 0; i--, count++) {
    if (count > 0 && count % 3 === 0) {
      resultArr.unshift(',');
    }
    resultArr.unshift(cleanVal[i]);
  }
  
  const formatted = resultArr.join('');
  return returnPersian ? englishToPersianDigits(formatted) : formatted;
}

/**
 * Converts a numeric value into Persian letters/words
 * Handles large numbers as strings to avoid precision issues and infinite loops
 */
export function numberToPersianWords(num: number | string): string {
  if (num === null || num === undefined) return '';
  
  let str = num.toString().replace(/,/g, '');
  str = persianToEnglishDigits(str).trim();
  
  if (str === '' || !/^-?\d+$/.test(str)) return 'عدد نامعتبر است';
  
  if (str === '0' || str === '-0') return 'صفر';
  
  const isNegative = str.startsWith('-');
  if (isNegative) {
    str = str.substring(1);
  }
  
  // Remove leading zeros
  str = str.replace(/^0+/, '');
  if (str === '') return 'صفر';

  let parts: string[] = [];
  
  // Split string into groups of 3 from right to left
  let groups: string[] = [];
  for (let i = str.length; i > 0; i -= 3) {
    groups.push(str.substring(Math.max(0, i - 3), i));
  }
  
  for (let i = 0; i < groups.length; i++) {
    const chunk = parseInt(groups[i], 10);
    if (chunk > 0) {
      const chunkWords = chunkToWords(chunk);
      const scaleStr = PERSIAN_SCALES[i];
      const part = scaleStr ? `${chunkWords} ${scaleStr}` : chunkWords;
      parts.unshift(part);
    }
  }
  
  const result = parts.join(' و ');
  return isNegative ? 'منفی ' + result : result;
}

function chunkToWords(num: number): string {
  if (num === 0) return '';
  
  let parts: string[] = [];
  
  const h = Math.floor(num / 100);
  const remaining = num % 100;
  
  if (h > 0) {
    parts.push(PERSIAN_HUNDREDS[h]);
  }
  
  if (remaining > 0) {
    if (remaining < 10) {
      parts.push(PERSIAN_UNITS[remaining]);
    } else if (remaining < 20) {
      parts.push(PERSIAN_TEENS[remaining - 10]);
    } else {
      const ten = Math.floor(remaining / 10);
      const unit = remaining % 10;
      parts.push(PERSIAN_TENS[ten]);
      if (unit > 0) {
        parts.push(PERSIAN_UNITS[unit]);
      }
    }
  }
  
  return parts.join(' و ');
}

const wordValues: { [key: string]: number } = {
  'صفر': 0,
  'یک': 1, 'يك': 1,
  'دو': 2,
  'سه': 3,
  'چهار': 4,
  'پنج': 5,
  'شش': 6, 'شیش': 6,
  'هفت': 7,
  'هشت': 8,
  'نه': 9,
  'ده': 10,
  'یازده': 11,
  'دوازده': 12,
  'سیزده': 13,
  'چهارده': 14,
  'پانزده': 15, 'پانزده‌': 15,
  'شانزده': 16,
  'هفده': 17,
  'هجده': 18,
  'نوزده': 19,
  'بیست': 20,
  'سی': 30,
  'چهل': 40,
  'پنجاه': 50,
  'شصت': 60,
  'هفتاد': 70,
  'هشتاد': 80,
  'نود': 90,
  'صد': 100, 'یکصد': 100, 'يكصد': 100,
  'دویست': 200,
  'سیصد': 300,
  'چهارصد': 400,
  'پانصد': 500,
  'ششصد': 600,
  'هفتصد': 700,
  'هشتصد': 800,
  'نهصد': 900
};

const scaleValues: { [key: string]: number } = {
  'هزار': 1000,
  'میلیون': 1000000,
  'میلیارد': 1000000000,
  'تریلیون': 1000000000000,
  'بیلیون': 1000000000000
};

/**
 * Converts Persian words/letters back into numeric values
 */
export function persianWordsToNumber(wordsStr: string): number {
  if (!wordsStr) return 0;
  
  // Normalize string
  let str = wordsStr
    .replace(/ی/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/[\u200B-\u200D\uFEFF]/g, ' ') // replace zero-width spaces with simple space
    .trim();
    
  // Split using spaces and connection character 'و'
  const rawTokens = str.split(/\s+/);
  
  const tokens: string[] = [];
  for (const token of rawTokens) {
    if (token === 'و') continue;
    
    // If token starts with 'و' (e.g., 'وصد', 'وهزار'), separate or clean
    if (token.startsWith('و') && token.length > 1) {
      const sub = token.substring(1);
      if (wordValues[sub] !== undefined || scaleValues[sub] !== undefined) {
        tokens.push(sub);
        continue;
      }
    }
    tokens.push(token);
  }

  let totalSum = 0;
  let currentGroupSum = 0;
  
  for (const token of tokens) {
    const val = wordValues[token];
    const scale = scaleValues[token];
    
    if (scale !== undefined) {
      if (currentGroupSum === 0) {
        currentGroupSum = 1;
      }
      totalSum += currentGroupSum * scale;
      currentGroupSum = 0;
    } else if (val !== undefined) {
      currentGroupSum += val;
    } else {
      // Direct numeric digits fallback if any exist as digit (like '123' or '۱۲۳')
      const cleanDigitStr = persianToEnglishDigits(token).replace(/\D/g, '');
      if (cleanDigitStr) {
        currentGroupSum += Number(cleanDigitStr);
      }
    }
  }
  
  totalSum += currentGroupSum;
  return totalSum;
}
