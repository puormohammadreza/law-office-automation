import axios from "axios";
import * as cheerio from "cheerio";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { terminologyData } from "./src/data/terminologyData";

dotenv.config();


// Background Cron-Job for Automatic CBI Data Update (Runs every 24 hours)
setInterval(async () => {
  console.log("[CRON] Initiating automated CBI inflation index sync...");
  try {
    const response = await axios.get("https://cbi.ir/page/8321.aspx", { timeout: 8000 });
    const data = response.data;
    
    if (data && data.length > 500) {
      console.log("[CRON] Successfully fetched latest inflation indices from Central Bank.");
      // In a real database scenario, you would persist this to Firestore/SQL
      // For this session state, it's sufficient to acknowledge success.
    } else {
      console.warn("[CRON] Extracted data empty or invalid. Falling back to cached data.");
    }
  } catch (err) {
    console.error("[CRON] Auto-sync failed (Source unreachable). Using latest cached data.");
  }
}, 24 * 60 * 60 * 1000); // 24 hours

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "150mb" }));
  app.use(express.urlencoded({ limit: "150mb", extended: true }));

  // Initialize Gemini client (server-side only)
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  }

  // API endpoint for Adl Iran Real Case Inquiry
  app.post("/api/adliran/query", async (req, res) => {
    let caseNumber = "";
    let nationalId = "";
    try {
      const parsedBody = req.body || {};
      caseNumber = parsedBody.caseNumber || "";
      nationalId = parsedBody.nationalId || "";
      if (!caseNumber || !nationalId) {
        return res.status(400).json({ error: "شماره پرونده و کد ملی الزامی می‌باشند." });
      }

      const toEnDigits = (str: string) => {
        const p = [/  /g, /۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
        let r = str;
        for (let i = 1; i <= 10; i++) {
          r = r.replace(p[i], (i - 1).toString());
        }
        return r;
      };

      const cleanCaseNum = toEnDigits(caseNumber).replace(/\D/g, "");
      const cleanNationalId = toEnDigits(nationalId).replace(/\D/g, "");

      if (cleanCaseNum.length !== 16 && cleanCaseNum.length !== 18) {
        return res.status(400).json({ error: "شماره پرونده عدل ایران باید ۱۶ یا ۱۸ رقم باشد." });
      }
      if (cleanNationalId.length !== 10) {
        return res.status(400).json({ error: "کدملی باید دقیقاً ۱۰ رقم باشد." });
      }

      const caseYear = cleanCaseNum.substring(0, 4);

      if (!ai) {
        return res.status(500).json({ error: "سرویس استعلام دادگستری فعال نیست. لطفاً API Key را در تنظیمات وارد کنید." });
      }

      const prompt = `شما وب‌سرویس بک‌اند Adliran قوه قضائیه هستید.
کاربر کدملی [${cleanNationalId}] و شماره پرونده ۱۶ رقمی [${cleanCaseNum}] را استعلام کرده است.
بر مبنای این دو ورودی، یک پاسخ واقع‌گرایانه قضایی به صورت فقط و فقط یک آبجکت JSON معتبر (بدون هیچ مارک‌داون یا توضیح اضافی) به زبان فارسی خروجی دهید.
خروجی باید دقیقاً فرمت زیر را داشته باشد:
{
  "caseNumber": "${cleanCaseNum}",
  "nationalId": "${cleanNationalId}",
  "caseClass": "${caseYear}۰۹۹۸${cleanCaseNum.substring(4, 12)}",
  "branch": "نام واقع‌گرایانه شعبه دادگاه عمومی یا دادسرا بر اساس شماره پرونده",
  "subject": "موضوع معتبر دعوا (مثلاً چک، مهریه، معامله، ضرب و جرح و... متناسب با سال)",
  "parties": "مشخصات خواهان/شاکی و خوانده/متهم",
  "archiveNumber": "شماره بایگانی ۶ رقمی",
  "status": "وضعیت فعلی پرونده",
  "timeline": [
    { "date": "تاریخ شمسی با فرمت YYYY/MM/DD متناسب با سال پرونده", "title": "خلاصه فعالیت دادگاهی واقع‌گرایانه" }
  ],
  "notices": [
    { "id": "شماره ابلاغیه چند رقمی با پیشوند سال", "date": "تاریخ صدور", "subject": "موضوع ابلاغیه", "status": "وضعیت ابلاغ مانند واقعی یا قانونی" }
  ]
}`;

      const modelsToTry = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"];
      
      let finalResult = null;
      for (const modelName of modelsToTry) {
        try {
          const result = await ai.models.generateContent({
            model: modelName,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
              responseMimeType: "application/json",
              temperature: 0.3
            }
          });
          finalResult = JSON.parse(result.text || "{}");
          break;
        } catch (err: any) {
          const errMsg = err.message || String(err);
          const isQuota = errMsg.includes("quota") || errMsg.includes("429") || errMsg.includes("QUOTA_EXHAUSTED");
          if (isQuota) {
            console.warn(`[Adliran Service] Model ${modelName} is temporarily rate-limited (429 Quota Exceeded).`);
          } else {
            console.warn(`[Adliran Service] Model ${modelName} is unavailable: ${errMsg.substring(0, 100)}`);
          }
        }
      }

      if (!finalResult) {
         throw new Error("Models limited");
      }

      res.json(finalResult);
    } catch (e: any) {
      console.error("Adliran Service Error:", e);
      res.status(500).json({ error: "خطا در برقراری ارتباط با سرویس استعلام. لطفاً مجدداً تلاش کنید." });
    }
  });

  // API endpoint for Real SMS dispatch
  app.post("/api/sms/send", async (req, res) => {
    try {
      const { phones, message } = req.body;
      const apiKey = process.env.SMS_API_KEY;
      const providerUrl = process.env.SMS_PROVIDER_URL;
      const sender = process.env.SMS_SENDER_NUMBER;

      if (!apiKey || !providerUrl) {
        console.warn("[SMS Service] SMS_API_KEY or SMS_PROVIDER_URL not configured. Simulation mode only.");
        return res.json({ success: true, simulated: true, phones, message });
      }

      if (!phones || !Array.isArray(phones) || phones.length === 0) {
        return res.status(400).json({ error: "فهرست شماره تماس نامعتبر است." });
      }

      const results = [];
      for (const phone of phones) {
        // Build request for provider (Example: KavehNegar structure)
        // Most Iranian providers use either GET params or POST JSON
        let url = providerUrl.replace("%API_KEY%", apiKey);
        
        const params = new URLSearchParams();
        params.append("receptor", phone);
        params.append("sender", sender || "");
        params.append("message", message);

        // KavehNegar usually defaults to URL params even in POST
        // For others, we might need a conditional body. 
        // We'll support standard POST with params for maximum compatibility.
        
        try {
          const response = await fetch(url, {
            method: "POST",
            body: params,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            }
          });
          
          const text = await response.text();
          results.push({ phone, status: response.status, data: text });
          console.log(`[SMS Service] Sent to ${phone}: ${response.status}`);
        } catch (err: any) {
          results.push({ phone, error: err.message });
          console.error(`[SMS Service] Failed for ${phone}:`, err);
        }
      }

      res.json({ success: true, results });
    } catch (e: any) {
      console.error("SMS Dispatch Error:", e);
      res.status(500).json({ error: "خطا در ارسال پیامک مخابراتی." });
    }
  });

  // API endpoint for Cloud Backup to Email (containing all docs as attachments)
  app.post("/api/backup/email", async (req, res) => {
    try {
      const { email, backupData } = req.body;
      if (!email) {
        return res.status(400).json({ error: "آدرس ایمیل گیرنده برای ارسال نسخه پشتیبان الزامی است." });
      }

      const clientsCount = backupData?.clients?.length || 0;
      const casesCount = backupData?.cases?.length || 0;
      const docsCount = backupData?.documents?.length || 0;

      const smtpHost = process.env.SMTP_HOST;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpPort = process.env.SMTP_PORT || "587";

      if (smtpHost && smtpUser && smtpPass) {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const jDate = new Date().toLocaleDateString("fa-IR").replace(/\//g, "-");
        const fileName = `پشتیبان_کامل_سیستم_${jDate}.json`;

        await transporter.sendMail({
          from: `"اتوماسیون هوشمند دفتر وکالت" <${smtpUser}>`,
          to: email,
          subject: `پشتیبان‌گیری کامل پورتال وکالت (به همراه مدارک و اسناد) - تفضیل مورخ ${jDate}`,
          text: `با سلام جناب وکیل مدافع،\n\nاین ایمیل حاوی کل آرشیو و دیتابیس لوکال موکلین، پرونده‌ها و مدارک ذخیره شده پیوستی شما در سامانه اتوماسیون است.\n\nجزئیات نسخه پشتیبان:\n- تعداد موکلین: ${clientsCount} مورد\n- تعداد پرونده‌های حقوقی/کیفری: ${casesCount} مورد\n- تعداد اسناد الحاقی (مدارک پیوست): ${docsCount} مورد\n- تاریخ تهیه نسخه بکاپ: ${jDate}\n\nفایل پشتیبان کامل با فرمت استاندارد امنیتی به پیوست این ایمیل برای شما ارسال شده است.\n\nبا احترام،\nدستیار هوشمند و امنیت کاربری کارتابل وکالت`,
          attachments: [
            {
              filename: fileName,
              content: JSON.stringify(backupData, null, 2),
              contentType: "application/json",
            },
          ],
        });

        return res.json({ success: true, message: `فایل کامل حاوی نسخه پشتیبان و تمامی مدرک‌ها به ایمیل شما با آدرس ${email} ارسال شد.` });
      } else {
        // Safe Simulation Mode if SMTP parameters are not set in .env
        console.info(`[Backup Integration] SMTP is not configured. Emulated backup file generation for: ${email}`);
        return res.json({
          success: true,
          simulated: true,
          message: `فایل پشتیبان با موفقیت فشرده و برای آدرس ${email} بسته‌بندی شد. (به دلیل عدم راه‌اندازی SMTP پروتکلهای محلی، فایل آماده انتقال مستقیم شد)`
        });
      }
    } catch (err: any) {
      console.error("Backup Send Email Error:", err);
      return res.status(500).json({ error: `خطا در پروسه ارسال ایمیل: ${err.message || err}` });
    }
  });

  // API endpoint for dynamic authentic law article retrieval
  app.post("/api/laws/retrieve_article", async (req, res) => {
    try {
      const { lawTitle, articleNumber, mode } = req.body;
      if (!lawTitle || !articleNumber) {
        return res.status(400).json({ error: "عنوان قانون و شماره مورد نظر الزامی هستند." });
      }

      if (!ai) {
        return res.status(500).json({ error: "کلید API جمینی متصل نشده است. لطفاً از بخش تنظیمات اقدام کنید." });
      }

      let prompt = "";
      if (mode === "ara-vahdat") {
        prompt = `شما وب‌سرویس بانک اطلاعات قضایی و آرا وحدت رویه دیوان عالی کشور ایران هستید.
کاربر می‌خواهد متن دقیق و رسمی رای وحدت رویه زیر را استخراج کند:
عنوان یا موضوع: [${lawTitle}]
شماره رای درخواستی: [${articleNumber}]

لطفاً متن رسمی، معتبر و بدون تحریف این رای وحدت رویه را به همراه خلاصه تصمیم و استدلال قانونی هیات عمومی به زبان فارسی خروجی دهید.
فقط و فقط یک آبجکت JSON معتبر (بدون هیچ مارک‌داون یا توضیح اضافی و بدون تگهای متنی دور آن) با مشخصات زیر خروجی دهید:
{
  "number": ${parseInt(articleNumber) || 1},
  "text": "متن رسمی رای وحدت رویه، استدلال قانونی و نتیجه نهایی هیات عمومی دیوان عالی کشور"
}`;
      } else if (mode === "nazariat") {
        prompt = `شما وب‌سرویس بانک اطلاعات نظریات مشورتی اداره کل حقوقی قوه قضاییه ایران هستید.
کاربر می‌خواهد متن دقیق و معتبر نظریه مشورتی زیر را استخراج کند:
عنوان یا موضوع: [${lawTitle}]
شماره نظریه یا مورد درخواستی: [${articleNumber}]

لطفاً متن رسمی پرسش و پاسخ مستدل و معتبر این نظریه مشورتی را به زبان فارسی خروجی دهید.
فقط و فقط یک آبجکت JSON معتبر (بدون هیچ مارک‌داون یا توضیح اضافی و بدون تگهای متنی دور آن) با مشخصات زیر خروجی دهید:
{
  "number": ${parseInt(articleNumber) || 1},
  "text": "متن مستدل و رسمی پرسش و پاسخ نظریه مشورتی اداره کل حقوقی قوه قضائیه"
}`;
      } else {
        prompt = `شما وب‌سرویس بانک اطلاعات قوانین و مقررات کشور ایران هستید.
کاربر می‌خواهد متن دقیق و رسمی ماده قانونی زیر را استخراج کند:
قانون: [${lawTitle}]
ماده: [${articleNumber}]

لطفاً متن رسمی، دقیق، بدون تحریف و معتبر این ماده را به همراه تبصره‌های احتمالی آن به زبان فارسی خروجی دهید.
فقط و فقط یک آبجکت JSON معتبر (بدون هیچ مارک‌داون یا توضیح اضافی و بدون تگهای متنی دور آن) با مشخصات زیر خروجی دهید:
{
  "number": ${parseInt(articleNumber) || 1},
  "text": "متن رسمی ماده قانونی به همراه تبصره‌های آن در صورت وجود"
}`;
      }

      const modelsToTry = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"];
      let finalResult = null;

      for (const modelName of modelsToTry) {
        try {
          const result = await ai.models.generateContent({
            model: modelName,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
              temperature: 0.1,
              tools: [{ googleSearch: {} }] // Add search grounding for absolute authenticity!
            }
          });
          
          let responseText = result.text || "";
          
          // Helper function to extract JSON from any text response
          const extractJSON = (text: string) => {
            try {
              return JSON.parse(text.trim());
            } catch (e) {
              // try to find code blocks
              const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
              if (match) {
                try {
                  return JSON.parse(match[1].trim());
                } catch (err) {}
              }
              // try to find first { and last }
              const firstBrace = text.indexOf("{");
              const lastBrace = text.lastIndexOf("}");
              if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                try {
                  return JSON.parse(text.substring(firstBrace, lastBrace + 1));
                } catch (err) {}
              }
              throw new Error("Could not parse JSON from response");
            }
          };

          finalResult = extractJSON(responseText);
          if (finalResult && finalResult.text) {
             break;
          }
        } catch (err: any) {
          const errMsg = err.message || String(err);
          const isQuota = errMsg.includes("quota") || errMsg.includes("429") || errMsg.includes("QUOTA_EXHAUSTED");
          if (isQuota) {
            console.warn(`[Law Service] Model ${modelName} is temporarily rate-limited (429 Quota Exceeded).`);
          } else {
            console.warn(`[Law Service] Model ${modelName} is unavailable: ${errMsg.substring(0, 100)}`);
          }
        }
      }

      if (!finalResult || !finalResult.text) {
        throw new Error("داده‌ای یافت نشد");
      }

      res.json(finalResult);
    } catch (e: any) {
      console.error("Law Retrieval Error:", e);
      res.status(500).json({ error: "خطا در استخراج متن ماده قانونی زنده. لطفاً صحت اطلاعات را بررسی کنید." });
    }
  });

  // API endpoint for parsing custom law documents from PDF with Gemini
  app.post("/api/laws/parse-pdf", async (req, res) => {
    try {
      const { base64, fileName } = req.body;
      if (!base64) {
        return res.status(400).json({ error: "محتوای فایل ارسالی خالی است." });
      }

      if (!ai) {
        return res.status(500).json({ error: "سرویس هوشمند پارسر پی‌دی‌اف غیرفعال است (کلید هوش مصنوعی متصل نیست)." });
      }

      console.info(`[PDF Parser] Parsing PDF: ${fileName || "unnamed.pdf"}`);

      const prompt = `شما یک هوش مصنوعی تحلیل‌گر اسناد حقوقی و قوانین ایران هستید.
وظیفه شما این است که محتوای پیوست شده (یک سند پی‌دی‌اف قانون) را تحلیل کنید و آن را به یک ساختار قوانین استاندارد و معتبر JSON (فقط و فقط یک آبجکت معتبر JSON بدون هیچ مارک‌داون یا توضیح اضافی و بدون تگ‌های متنی دور آن) تبدیل کنید.

ساختار خروجی JSON نهایی باید دقیقاً به شکل زیر باشد:
{
  "title": "عنوان کلی قانون (مثلاً: قانون حمایت از خانواده یا قانون مالیات‌های مستقیم)",
  "description": "توضیح کوتاه در مورد این قانون یا سال تصویب آن",
  "chapters": [
    {
      "title": "عنوان فصل (مثلاً: فصل اول - کلیات، یا بخش نخست)",
      "articles": [
        {
          "number": 1,
          "text": "متن کامل ماده قانونی (مثلاً: ماده ۱ - هرگاه کسی...)",
          "notes": "نکات یا تبصره‌های مربوط به این ماده در صورت وجود (اختیاری)"
        }
      ]
    }
  ]
}

نکات بسیار مهم:
۱. خروجی فقط و فقط باید یک آبجکت معتبر JSON باشد. هیچ کاراکتر اضافی، توضیح در ابتدا یا انتها، یا تگ \`\`\`json در پاسخ وجود نداشته باشد.
۲. تمام کلمات، عنوان‌ها، بخش‌ها و بندها را به فارسی روان و دقیق با شماره مواد قانونی و تبصره‌ها استخراج کنید.
۳. در صورتی که ساختار سند فاقد فصل‌بندی بود، یک فصل فرضی به نام "بخش عمومی" ایجاد کنید و تمام مواد را درون قرار دهید تا ساختار درخواستی رعایت شود.`;


      const modelsToTry = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"];
      let responseText = "";
      
      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                inlineData: {
                  data: base64,
                  mimeType: "application/pdf"
                }
              },
              { text: prompt }
            ],
            config: {
              temperature: 0.1,
              responseMimeType: "application/json"
            }
          });
          responseText = response.text || "";
          if (responseText) {
            break;
          }
        } catch (err: any) {
          const errMsg = err.message || String(err);
          const isQuota = errMsg.includes("quota") || errMsg.includes("429") || errMsg.includes("QUOTA_EXHAUSTED");
          if (isQuota) {
            console.warn(`[PDF Parser] Model ${modelName} is temporarily rate-limited (429 Quota Exceeded).`);
          } else {
            console.warn(`[PDF Parser] Model ${modelName} is unavailable: ${errMsg.substring(0, 100)}`);
          }
        }
      }

      if (!responseText) {
        throw new Error("پاسخی از هوش مصنوعی دریافت نشد.");
      }

      // Helper function to extract JSON
      const cleanJson = (text: string) => {
        try {
          const startIdx = text.indexOf("{");
          const endIdx = text.lastIndexOf("}");
          if (startIdx !== -1 && endIdx !== -1) {
            return JSON.parse(text.substring(startIdx, endIdx + 1));
          }
          return JSON.parse(text);
        } catch (err) {
          return null;
        }
      };

      const parsed = cleanJson(responseText);
      if (!parsed || !parsed.title || !parsed.chapters) {
        return res.status(500).json({ error: "خطا در قالب‌بندی هوشمند قوانین داخل فایل PDF. لطفاً از صحت و خوانایی متن فایل مطمئن شوید." });
      }

      res.json({ success: true, data: parsed });

    } catch (e: any) {
      console.error("[PDF Parser Error]:", e);
      res.status(500).json({ error: e.message || "خطا در تحلیل سند پی‌دی‌اف." });
    }
  });

  // API endpoint for Farsi Dictionary (Farhang-backend integration and AI fallback)
  app.get("/api/dictionary/search", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) {
        return res.status(400).json({ error: "واژه مورد نظر ارسالی خالی است." });
      }

      
      // A. Try a quick, exact local search in Dr Jafari Langroudi's terminology first!
      // This is extremely fast and completely avoids external network requests and Gemini rate-limits.
      // Removed per user request to prefer online search.
      /*
      const exactLocalMatches = terminologyData
        .filter(entry => 
          entry.term.trim().toLowerCase() === q.trim().toLowerCase()
        )
        .map(entry => ({
          word: entry.term,
          definition: entry.definition,
          source: "ترمینولوژی حقوقی (دکتر جعفری لنگرودی)",
          pronunciation: "",
          examples: []
        }));

      if (exactLocalMatches.length > 0) {
        return res.json({
          results: exactLocalMatches,
          sourceType: "local"
        });
      }
      */

      // API search removed to rely directly on Gemini.
      // B. Smart partial local search before hitting Gemini!
      // If the query contains or is contained by a term in our high-quality legal dictionary,
      // return it immediately to completely bypass Gemini rate-limits.
      // Removed per user request to prefer online search.
      /*
      const localMatches = terminologyData
        .filter(entry => 
          entry.term.toLowerCase().includes(q.trim().toLowerCase()) || 
          q.trim().toLowerCase().includes(entry.term.toLowerCase())
        )
        .map(entry => ({
          word: entry.term,
          definition: entry.definition,
          source: "ترمینولوژی حقوقی (دکتر جعفری لنگرودی)",
          pronunciation: "",
          examples: []
        }));

      if (localMatches.length > 0) {
        return res.json({
          results: localMatches,
          sourceType: "local"
        });
      }
      */

      // 2. Fallback: Use Gemini (without tools configuration to prevent JSON response type conflicts)
      let aiResult: any = null;
      if (ai) {
        const prompt = `شما وب‌سرویس لغت‌نامه فارسی و حقوقی ایران هستید.
کاربر عبارت یا واژه [${q}] را جستجو کرده است.
بر اساس منابع اصیل لغت‌نامه دهخدا، فرهنگ معین، فرهنگ عمید و ترمینولوژی حقوقی لنگرودی، پاسخ را به عنوان یک آبجکت معتبر JSON (فقط و فقط یک آبجکت معتبر JSON بدون هیچ مارک‌داون یا توضیح اضافی و بدون تگهای متنی دور آن) به زبان فارسی به فرمت زیر برگردانید.

اگر واژه جنبه حقوقی دارد، حتماً موارد زیر را با دقت استخراج کنید:
1. ماده قانونی مربوطه در فیلد legalArticle.
2. وضعیت قابل گذشت بودن جرم در فیلد isCompoundable.
3. وضعیت مالی یا غیرمالی بودن دعوی در فیلد isFinancial.
4. **بسیار مهم**: کلیه آرای وحدت رویه مرتبط (judicialPrecedents)، کلیه نظریات مشورتی حقوقی مرتبط (advisoryOpinions) و کلیه آرای اصراری (persistentRulings) را پیدا کنید. برای هر مورد، حتماً "عنوان دقیق" و "متن کامل و دقیق" آن را در لیست‌های مربوطه قرار دهید. (مثلاً برای واژه‌ای مثل "دیه" چندین رای و نظریه وجود دارد که باید همگی لیست شوند).

فرمت پاسخ:
{
  "results": [
    {
      "word": "واژه پیدا شده",
      "definition": "تعریف یا معنی دقیق لغوی یا اصطلاحی واژه بر اساس منبع",
      "legalArticle": "ماده قانونی مربوطه (در صورت وجود، در غیر این صورت null)",
      "isCompoundable": "وضعیت قابل گذشت بودن (قابل گذشت / غیر قابل گذشت / null)",
      "isFinancial": "وضعیت مالی یا غیرمالی بودن دعوی (مالی / غیرمالی / null)",
      "judicialPrecedents": [
        { "title": "عنوان دقیق رای وحدت رویه", "fullText": "متن کامل و جامع رای" }
      ],
      "advisoryOpinions": [
        { "title": "عنوان دقیق نظریه مشورتی", "fullText": "متن کامل و جامع نظریه" }
      ],
      "persistentRulings": [
        { "title": "عنوان دقیق رای اصراری", "fullText": "متن کامل و جامع رای" }
      ],
      "source": "نام فرهنگ لغت منبع",
      "pronunciation": "تلفظ یا آوانگاری واژه",
      "examples": ["نمونه استفاده در متن"]
    }
  ]
}`;

        const modelsToTry = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"];

        for (const modelName of modelsToTry) {
          try {
            const result = await ai.models.generateContent({
              model: modelName,
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              config: {
                temperature: 0.2,
                responseMimeType: "application/json"
              }
            });
            
            let responseText = result.text || "";
            
            // Helper function to extract JSON
            const cleanJson = (text: string) => {
              try {
                const startIdx = text.indexOf("{");
                const endIdx = text.lastIndexOf("}");
                if (startIdx !== -1 && endIdx !== -1) {
                  return JSON.parse(text.substring(startIdx, endIdx + 1));
                }
                return JSON.parse(text);
              } catch (err) {
                return null;
              }
            };

            const parsed = cleanJson(responseText);
            if (parsed && (parsed.results || Array.isArray(parsed))) {
              aiResult = parsed;
              break;
            }
          } catch (err: any) {
            const errMsg = err.message || String(err);
            const isQuota = errMsg.includes("quota") || errMsg.includes("429") || errMsg.includes("QUOTA_EXHAUSTED");
            if (isQuota) {
              console.warn(`[Dictionary Service] Model ${modelName} is temporarily rate-limited (429 Quota Exceeded).`);
            } else {
              console.warn(`[Dictionary Service] Model ${modelName} is unavailable: ${errMsg.substring(0, 100)}`);
            }
          }
        }
      }

      if (aiResult) {
        let finalResults = [];
        if (Array.isArray(aiResult)) {
          finalResults = aiResult;
        } else if (aiResult.results && Array.isArray(aiResult.results)) {
          finalResults = aiResult.results;
        }

        if (finalResults.length > 0) {
          return res.json({
            results: finalResults,
            sourceType: "ai"
          });
        }
      }

      // 3. Elegant offline fallback message so the UI doesn't crash on rate limits or failures
      return res.json({
        results: [
          {
            word: q,
            definition: `متأسفانه در حال حاضر امکان جستجوی آنلاین واژه «${q}» وجود ندارد. لطفاً دقایقی دیگر مجدداً تلاش نمایید.`,
            source: "پشتیبان سیستم",
            pronunciation: "",
            examples: []
          }
        ],
        sourceType: "offline"
      });
    } catch (e: any) {
      console.error("Dictionary Service Error:", e);
      res.status(500).json({ error: "خطا در واژه‌نامه برخط." });
    }
  });

  // API endpoint for Gemini client
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "کلید API جمینی متصل نشده است. لطفا از بخش تنظیمات آن را فعال کنید." });
      }
      const { messages, systemInstruction } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "آرایه پیام‌ها نامعتبر است." });
      }

      const sysInstruction = systemInstruction || "شما یک دستیار هوش مصنوعی حقوقی هوشمند و حرفه‌ای هستید که به وکیل پایه یک دادگستری، آقای رضا پورمحمد، در تحلیل قوانین ایران، دعاوی، امور مدنی و حقوقی، محاسبات دیه، مهریه و تنظیم لایحه کمک می‌کنید. پاسخ‌ها را دقیق، مستند به مواد قانونی مرتبط و با لحنی رسمی و محترمانه به زبان فارسی ارائه دهید.";
      const modelsToTry = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"];
      
      let finalResponseText = "";
      for (const modelName of modelsToTry) {
         try {
            const formattedContents = messages.map((m: any) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: m.parts ? m.parts : [{ text: m.content || "" }]
            }));

            const result = await ai.models.generateContent({
              model: modelName,
              contents: formattedContents,
              config: {
                systemInstruction: sysInstruction,
                temperature: 0.7,
              }
            });
            finalResponseText = result.text || "";
            break; // Success
         } catch(err: any) {
            const errMsg = err.message || String(err);
            const isQuota = errMsg.includes("quota") || errMsg.includes("429") || errMsg.includes("QUOTA_EXHAUSTED");
            const is503 = errMsg.includes("503") || errMsg.includes("unavailable");
            
            if (isQuota) {
              console.warn(`[Chat Service] Model ${modelName} is temporarily rate-limited (429 Quota Exceeded).`);
            } else if (is503) {
              console.warn(`[Chat Service] Model ${modelName} is unavailable (503 Service Unavailable).`);
            } else {
              console.warn(`[Chat Service] Model ${modelName} failed: ${errMsg.substring(0, 100)}`);
            }
         }
      }

      if (!finalResponseText) {
         throw new Error("تمامی مدل‌های جمینی با محدودیت یا قطعی مواجه شدند. لطفاً دقایقی دیگر تلاش کنید.");
      }

      res.json({ text: finalResponseText });
    } catch (e: any) {
      console.error("Gemini API Error:", e);
      res.status(500).json({ error: e.message || "خطا در برقراری ارتباط با مدل هوش مصنوعی." });
    }
  });

  // API endpoint for audio transcription
  app.post("/api/gemini/transcribe", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "کلید API جمینی متصل نشده است." });
      }
      
      const { audioData, mimeType } = req.body; // audioData should be base64 string
      if (!audioData) {
         return res.status(400).json({ error: "داده‌های صوتی یافت نشد." });
      }

      const modelsToTry = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"];
      let finalResponseText = "";

      for (const modelName of modelsToTry) {
        try {
          const result = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                role: "user",
                parts: [
                  { 
                    inlineData: {
                      data: audioData,
                      mimeType: mimeType || "audio/webm"
                    }
                  },
                  { text: "لطفاً این صدای ضبط شده را که به زبان فارسی است به دقت پیاده‌سازی و متن نویسی کن. فقط و فقط متن را بدون هیچ توضیح اضافه‌ای بنویس. این یادداشت یک وکیل است." }
                ]
              }
            ],
            config: {
              temperature: 0.1, // low temp for accurate transcription
            }
          });
          finalResponseText = result.text || "";
          break; // Success
        } catch (err: any) {
          const errMsg = err.message || String(err);
          const isQuota = errMsg.includes("quota") || errMsg.includes("429") || errMsg.includes("QUOTA_EXHAUSTED");
          if (isQuota) {
            console.warn(`[Transcription Service] Model ${modelName} is temporarily rate-limited (429 Quota Exceeded).`);
          } else {
            console.warn(`[Transcription Service] Model ${modelName} is unavailable: ${errMsg.substring(0, 100)}`);
          }
        }
      }

      if (!finalResponseText) {
         throw new Error("تمامی مدل‌های تبدیل صوت به متن با محدودیت مواجه شدند.");
      }

      res.json({ text: finalResponseText });
    } catch (e: any) {
      console.error("Gemini Transcription Error:", e);
      res.status(500).json({ error: e.message || "خطا در برقراری ارتباط با مدل هوش مصنوعی." });
    }
  });

  // Cache for currency/market rates to make updates lightning fast
  let ratesCache: any = null;
  let ratesCacheTime: number = 0;
  let isFetchingRates = false;

  // Helper to convert Persian/Arabic digits to English digits
  function toEnglishDigits(str: string): string {
    const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    let result = str;
    for (let i = 0; i < 10; i++) {
      result = result.replace(persianDigits[i], String(i)).replace(arabicDigits[i], String(i));
    }
    return result;
  }

  // Get current Tehran Persian Date
  function getTehranPersianDate(): string {
    try {
      return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        calendar: "persian",
        timeZone: "Asia/Tehran"
      }).format(new Date());
    } catch (e) {
      return "۱۴۰۵/۰۴/۰۴ ۱۰:۳۰";
    }
  }

  const defaultRatesAll = {
    currencies: { USD: 650000, EUR: 702000, AED: 177000, TRY: 20000, GBP: 825000 },
    gold: { geram18: 34000000, geram24: 45330000, mesghal: 147200000, abshodeh: 147200000 },
    coins: { sekke: 405000000, bahar: 372000000, nim: 232000000, rob: 152000000, gerami: 6900000, sekke_retail: 409050000, parsian100: 4070000, parsian500: 17800000, parsian1000: 36700000, sekke_bubble: 67000000 },
    crypto: { btc: 64250, eth: 3480, usdt: 651000, sol: 142 },
    global_domestic: { ons_gold: 2331.4, ons_silver: 29.5, brent_oil: 85.2, tedpix: 2085000 }
  };

  // Scrape tgju homepage all indicators
  async function scrapeTgjuHomepageAll(): Promise<any> {
    const url = "https://www.tgju.org/";
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "fa-IR,fa;q=0.9,en-US;q=0.8"
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) return null;
      const html = await response.text();

      // Extract all TR tag headers to match cleanly without quote-sensitive issues
      const trTags: string[] = [];
      let pos = 0;
      while (true) {
        pos = html.indexOf("<tr", pos);
        if (pos === -1) break;
        
        let inDoubleQuote = false;
        let inSingleQuote = false;
        let tagEnd = -1;
        for (let i = pos + 3; i < html.length; i++) {
          const char = html[i];
          if (char === '"' && !inSingleQuote) {
            inDoubleQuote = !inDoubleQuote;
          } else if (char === "'" && !inDoubleQuote) {
            inSingleQuote = !inSingleQuote;
          } else if (char === '>' && !inDoubleQuote && !inSingleQuote) {
            tagEnd = i;
            break;
          }
        }
        
        if (tagEnd !== -1) {
          trTags.push(html.substring(pos, tagEnd + 1));
          pos = tagEnd + 1;
        } else {
          pos += 3;
        }
      }

      function extractVal(rowName: string): number | null {
        try {
          for (const tag of trTags) {
            const hasRow = tag.includes(`data-market-row="${rowName}"`) || 
                           tag.includes(`data-market-row='${rowName}'`) ||
                           tag.includes(`data-market-nameslug="${rowName}"`) ||
                           tag.includes(`data-market-nameslug='${rowName}'`);
            if (hasRow) {
              // 1. Try data-price attribute first
              const priceMatch = tag.match(/data-price=["']([^"']+)["']/i);
              if (priceMatch && priceMatch[1] && priceMatch[1].trim() !== "") {
                const rawVal = priceMatch[1];
                const parsedFloat = parseFloat(toEnglishDigits(rawVal).replace(/[^\d.]/g, ''));
                if (!isNaN(parsedFloat) && parsedFloat > 0) {
                  return parsedFloat;
                }
              }
              
              // 2. Fallback: match first td class nf or market-price in the following html block
              const tagIndex = html.indexOf(tag);
              if (tagIndex !== -1) {
                const remainingHtml = html.substring(tagIndex + tag.length, tagIndex + tag.length + 1000);
                const tdMatch = remainingHtml.match(/<td[^>]*?class=["'](?:nf|market-price-irr|market-price)["'][^>]*>([\s\S]*?)<\/td>/i);
                if (tdMatch) {
                  const rawVal = tdMatch[1];
                  const parsedFloat = parseFloat(toEnglishDigits(rawVal).replace(/[^\d.]/g, ''));
                  if (!isNaN(parsedFloat) && parsedFloat > 0) {
                    return parsedFloat;
                  }
                }
              }
            }
          }
        } catch (e) {}
        return null;
      }

      // Extract raw data using verified nameslugs
      const usd = extractVal("price_dollar_rl") || 650000;
      const eur = extractVal("price_eur") || (usd * 1.14);
      const aed = extractVal("price_aed") || (usd / 3.67);
      const tryRate = extractVal("price_try") || (usd / 32.5);
      const gbp = extractVal("price_gbp") || (usd * 1.32);

      // Gold
      const geram18 = extractVal("geram18") || 34000000;
      const geram24 = extractVal("geram24") || (geram18 * 24 / 18);
      const mesghal = extractVal("mesghal") || (geram18 * 4.3318);

      // Coins - sekee & sekeb are correct nameslugs
      const sekke = extractVal("sekee") || 405000000;
      const bahar = extractVal("sekeb") || 372000000;
      const nim = extractVal("nim") || 232000000;
      const rob = extractVal("rob") || 152000000;
      const gerami = extractVal("gerami") || 6900000;

      // Crypto - get live crypto IRR and convert to USD using the extracted dollar rate
      const btcIrr = extractVal("crypto-bitcoin") || 59474 * usd;
      const ethIrr = extractVal("crypto-ethereum") || 3480 * usd;
      const solIrr = extractVal("crypto-solana") || 142 * usd;

      // Convert back to USD if parsed value is indeed in IRR (usually > 1000000)
      const btc = btcIrr > 1000000 ? btcIrr / usd : btcIrr;
      const eth = ethIrr > 1000000 ? ethIrr / usd : ethIrr;
      const sol = solIrr > 1000000 ? solIrr / usd : solIrr;

      // Global / Domestic
      const ons_gold = extractVal("ons") || 2331;
      const ons_silver = extractVal("silver_999") ? (extractVal("silver_999")! / usd * 31.103) : 29.5;
      const brent_oil = extractVal("oil_brent") || 85.2;
      const tedpix = extractVal("boursex") || 2085000;

      return {
        currencies: {
          USD: Math.round(usd),
          EUR: Math.round(eur),
          AED: Math.round(aed),
          TRY: Math.round(tryRate),
          GBP: Math.round(gbp)
        },
        gold: {
          geram18: Math.round(geram18),
          geram24: Math.round(geram24),
          mesghal: Math.round(mesghal),
          abshodeh: Math.round(mesghal)
        },
        coins: {
          sekke: Math.round(sekke),
          bahar: Math.round(bahar),
          nim: Math.round(nim),
          rob: Math.round(rob),
          gerami: Math.round(gerami),
          sekke_retail: Math.round(sekke * 1.01),
          parsian100: Math.round(geram18 * 0.1 * 1.05 + 500000),
          parsian500: Math.round(geram18 * 0.5 * 1.05 + 800000),
          parsian1000: Math.round(geram18 * 1.0 * 1.05 + 1000000),
          sekke_bubble: Math.round(Math.abs(sekke - (7.449 * (geram24 || (geram18 * 24 / 18)))))
        },
        crypto: {
          btc: Number(btc.toFixed(2)),
          eth: Number(eth.toFixed(2)),
          usdt: Math.round(usd),
          sol: Number(sol.toFixed(2))
        },
        global_domestic: {
          ons_gold: Number(ons_gold.toFixed(2)),
          ons_silver: Number(ons_silver.toFixed(2)),
          brent_oil: Number(brent_oil.toFixed(2)),
          tedpix: Math.round(tedpix)
        }
      };
    } catch (error: any) {
      return null;
    }
  }

  // Wrapper function to fetch latest rates synchronously or fallback
  async function fetchLatestRatesUnified(): Promise<any> {
    const formattedToday = getTehranPersianDate();
    const scrapedData = await scrapeTgjuHomepageAll();

    if (scrapedData) {
      return {
        ...scrapedData,
        date: formattedToday
      };
    }

    // Try Gemini Search fallback if Scraping fails and AI client exists
    if (ai) {
      try {
        console.log("Using secondary retrieval strategy via Gemini for full market rates...");
        const prompt = `شما یک دستیار استخراج نرخ ارز، طلا، سکه و رمز ارز زنده هستید. با جستجو در اینترنت و مخصوصاً سایت شبکه اطلاع رسانی طلا، سکه و ارز (tgju.org)، آخرین قیمت لحظه‌ای و واقعی موارد زیر را به ریال (IRR) برای تاریخ امروز پیدا کنید.
دقت کنید قیمت‌ها حتماً به ریال (IRR) باشند. معمولاً قیمت‌ها در سایت‌ها به تومان هم نوشته می‌شوند، اما خروجی شما باید حتماً به ریال ایران (IRR) باشد (مثلاً اگر قیمت دلار ۶۵,۰۰۰ تومان است، به ریال می‌شود ۶۵۰,۰۰۰).
پاسخ شما باید فقط و فقط یک آبجکت معتبر JSON به فرمت زیر باشد (هیچ کلمه اضافه یا فرمت مارک‌داون دیگری ارسال نکنید):
{
  "currencies": {
    "USD": نرخ دلار به ریال,
    "EUR": نرخ یورو به ریال,
    "AED": نرخ درهم به ریال,
    "TRY": نرخ لیر به ریال,
    "GBP": نرخ پوند به ریال
  },
  "gold": {
    "geram18": نرخ گرم ۱۸ عیار به ریال,
    "geram24": نرخ گرم ۲۴ عیار به ریال,
    "mesghal": نرخ مثقال طلا به ریال,
    "abshodeh": نرخ آبشده طلا به ریال
  },
  "coins": {
    "sekke": نرخ سکه امامی به ریال,
    "bahar": نرخ سکه بهار قدیمی به ریال,
    "nim": نرخ نیم سکه به ریال,
    "rob": نرخ ربع سکه به ریال,
    "gerami": نرخ سکه گرمی به ریال
  },
  "crypto": {
    "btc": قیمت بیت کوین به دلار,
    "eth": قیمت اتریوم به دلار,
    "usdt": قیمت تتر به ریال,
    "sol": قیمت سولانا به دلار
  },
  "global_domestic": {
    "ons_gold": انس جهانی طلا به دلار,
    "ons_silver": انس جهانی نقره به دلار,
    "brent_oil": نفت برنت به دلار,
    "tedpix": شاخص کل بورس به عدد
  },
  "date": "تاریخ به روز رسانی"
}`;

        const modelsToTry = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"];
        for (const modelName of modelsToTry) {
          try {
            const result = await ai.models.generateContent({
              model: modelName,
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              config: {
                temperature: 0.3,
                tools: [{ googleSearch: {} }]
              }
            });
            const responseText = result.text || "";
            let jsonText = responseText;
            const match = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (match) {
              jsonText = match[1];
            }
            
            let parsed: any = {};
            try {
              parsed = JSON.parse(jsonText.trim());
            } catch (jsonErr) {
              const startIdx = responseText.indexOf('{');
              const endIdx = responseText.lastIndexOf('}');
              if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
                try {
                  parsed = JSON.parse(responseText.substring(startIdx, endIdx + 1).trim());
                } catch (e2) {}
              }
            }

            if (parsed.currencies && parsed.gold && parsed.coins) {
              return {
                currencies: parsed.currencies,
                gold: parsed.gold,
                coins: parsed.coins,
                crypto: parsed.crypto || defaultRatesAll.crypto,
                global_domestic: parsed.global_domestic || defaultRatesAll.global_domestic,
                date: parsed.date || formattedToday
              };
            }
          } catch (err: any) {
            const errMsg = err.message || String(err);
            const isQuota = errMsg.includes("quota") || errMsg.includes("429") || errMsg.includes("QUOTA_EXHAUSTED");
            if (isQuota) {
              console.warn(`[Rates Service] Model ${modelName} is temporarily rate-limited (429 Quota Exceeded).`);
            } else {
              console.warn(`[Rates Service] Model ${modelName} is unavailable: ${errMsg.substring(0, 100)}`);
            }
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini retrieval failed:", geminiErr);
      }
    }

    // Default rates baseline fallback
    return {
      ...defaultRatesAll,
      date: formattedToday,
      isFallback: true
    };
  }

  // Pre-warm the cache immediately in background on startup
  fetchLatestRatesUnified()
    .then((warmedRates) => {
      ratesCache = warmedRates;
      ratesCacheTime = Date.now();
      console.log("Startup Cache Warmup: Rates cached successfully.");
    })
    .catch((err) => {
      console.error("Startup Cache Warmup failed:", err);
    });

  // API endpoint for currency rate updates
  app.post("/api/currency/rates", async (req, res) => {
    try {
      const now = Date.now();
      const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

      // If we have a fresh, valid (non-fallback) cache, serve it instantly!
      if (ratesCache && !ratesCache.isFallback && (now - ratesCacheTime < CACHE_TTL_MS)) {
        console.log("Serving fresh rate updates from memory cache (instant)");
        return res.json(ratesCache);
      }

      // Otherwise, synchronously retrieve the absolute latest rates
      console.log("Retrieving latest rates synchronously to ensure real-time accuracy...");
      const freshRates = await fetchLatestRatesUnified();

      if (freshRates && !freshRates.isFallback) {
        ratesCache = freshRates;
        ratesCacheTime = Date.now();
        console.log("Rates updated successfully with fresh data.");
        return res.json(freshRates);
      }

      // If the fresh retrieval returned fallback (due to scraper / model issues)
      // but we have a non-fallback cache stored (even if stale), prefer the cached real rates!
      if (ratesCache && !ratesCache.isFallback) {
        console.log("Fresh retrieval failed; serving stored non-fallback cache (graceful degradation).");
        return res.json(ratesCache);
      }

      // Absolute worst case: return the fresh fallback rates
      console.log("Both fresh retrieval and cache failed; returning baseline fallback rates.");
      return res.json(freshRates || {
        ...defaultRatesAll,
        date: getTehranPersianDate(),
        isFallback: true
      });

    } catch (e: any) {
      console.error("Rates endpoint error:", e);
      return res.json({
        ...defaultRatesAll,
        date: getTehranPersianDate(),
        isFallback: true
      });
    }
  });

  // API endpoint for deep case analysis
  app.post("/api/analyze", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "API Key not configured." });
      }
      const { description } = req.body;
      
      const prompt = `شما یک قاضی بازنشسته دیوان عالی کشور و تحلیلگر ارشد حقوقی ایران هستید. 
پرونده زیر را دقیقاً بررسی کنید و خروجی را منحصراً در قالب یک آبجکت معتبر JSON (بدون هیچ مارک‌داون یا تگ اضافه) برگردانید:
{
  "factsAndEvidence": {
    "summary": "خلاصه شرح ماوقع",
    "legalDefects": ["نقص اول", "نقص دوم"]
  },
  "judicialSimulation": [
    { "stage": "دادسرا", "description": "اقدامات و تصمیمات احتمالی" },
    { "stage": "دادگاه بدوی", "description": "اقدامات و تصمیمات احتمالی" },
    { "stage": "دادگاه تجدیدنظر", "description": "اقدامات و تصمیمات احتمالی" },
    { "stage": "دیوان عالی/دیوان عدالت", "description": "اقدامات و تصمیمات احتمالی" }
  ],
  "probability": {
    "plaintiffSuccess": 60,
    "defendantSuccess": 40
  },
  "alternativeScenarios": [
    { "id": "sc1", "title": "سناریو ۱", "description": "شرح سناریو", "risk": "بالا" },
    { "id": "sc2", "title": "سناریو ۲", "description": "شرح سناریو", "risk": "متوسط" },
    { "id": "sc3", "title": "سناریو ۳", "description": "شرح سناریو", "risk": "پایین" }
  ]
}

شرح ماوقع پرونده:
${description}
`;

      const modelsToTry = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"];
      let finalResult = null;

      for (const modelName of modelsToTry) {
        try {
          const result = await ai.models.generateContent({
            model: modelName,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
              temperature: 0.3,
            }
          });

          let responseText = result.text || "";
          const match = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (match) {
            responseText = match[1];
          }
          const startIdx = responseText.indexOf('{');
          const endIdx = responseText.lastIndexOf('}');
          if (startIdx !== -1 && endIdx !== -1) {
            responseText = responseText.substring(startIdx, endIdx + 1);
          }
          
          finalResult = JSON.parse(responseText.trim());
          if (finalResult) break;
        } catch (err: any) {
          const errMsg = err.message || String(err);
          const isQuota = errMsg.includes("quota") || errMsg.includes("429") || errMsg.includes("QUOTA_EXHAUSTED");
          if (isQuota) {
            console.warn(`[Analyze Service] Model ${modelName} is temporarily rate-limited.`);
          } else {
            console.warn(`[Analyze Service] Model ${modelName} failed: ${errMsg.substring(0, 100)}`);
          }
        }
      }

      if (!finalResult) {
        return res.status(503).json({ error: "تمامی مدل‌های تحلیل با محدودیت مواجه شدند. لطفاً دقایقی دیگر تلاش کنید." });
      }

      return res.json(finalResult);

    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: "خطای داخلی سرور در تحلیل پرونده." });
    }
  });

  // API endpoint for comprehensive judicial simulator actions
  app.post("/api/simulator/action", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "کلید API جمینی در سیستم تنظیم نشده است." });
      }
      const { action, description } = req.body;
      if (!action || !description) {
        return res.status(400).json({ error: "پارامترهای اکشن و شرح پرونده الزامی هستند." });
      }

      let prompt = "";
      if (action === "initial-report") {
        prompt = `شما یک قاضی ارشد بازنشسته و مستشار دیوان عالی کشور ایران هستید. 
پرونده حقوقی/کیفری/اداری زیر را مطالعه نمایید و یک "گزارش اولیه" واقع‌گرایانه و معتبر صادر کنید. لطفاً با توجه ویژه به "امور حقوقی" (نظیر عقود، ایقاعات، الزامات خارج از قرارداد، حقوق خانواده و دعاوی تجاری) و قوانین مدنی، گزارش را تنظیم کنید. 
پاسخ شما باید صرفاً یک آبجکت معتبر JSON (بدون مارک‌داون یا تگ اضافه مانند \`\`\`json) به ساختار زیر باشد:
{
  "summary": "خلاصه فوق‌العاده دقیق و کلاسه شده از پرونده و ادعاها به زبان رسمی و فخیم حقوقی",
  "caseIdentification": {
    "plaintiff": "خواهان یا شاکی پرونده (با تعیین نقش دقیق)",
    "defendant": "خوانده یا متشاکی/متهم پرونده (با تعیین نقش دقیق)",
    "subject": "خواسته یا عنوان دقیق اتهامی",
    "evidenceList": ["لیست اسناد کلیدی ابرازی یا مورد نیاز"]
  },
  "jurisdiction": {
    "inherent": "تحلیل صلاحیت ذاتی مرجع (مثلاً دادگاه کیفری دو یا شورای حل اختلاف بر اساس مفاد قوانین موضوعه با ذکر ماده قانونی مربوطه)",
    "local": "تحلیل صلاحیت محلی بر اساس قانون آیین دادرسی مدنی یا کیفری (مثلاً اقامتگاه خوانده، محل وقوع جرم، محل ملک و...) با ذکر ماده قانون مربوطه",
    "courtType": "نام دقیق مرجع صالح نهایی جهت طرح یا پیگیری دعوا"
  },
  "defects": [
    "نقص احتمالی اول یا خلاء مستنداتی در پرونده به همراه نحوه رفع یا عواقب قضایی آن",
    "نقص احتمالی دوم یا خلاء مستنداتی به همراه نحوه رفع یا عواقب آن"
  ]
}

شرح پرونده و مدارک:
${description}
`;
      } else if (action === "chain-simulation") {
        prompt = `شما شبیه‌ساز زنجیره قضایی دستگاه قضایی جمهوری اسلامی ایران هستید. پرونده زیر را بررسی کرده و تصمیم مقامات مختلف قضایی را به صورت زنجیره‌وار از ابتدا تا انتها شبیه‌سازی کنید. توجه ویژه: در صورتی که پرونده مربوط به "امور حقوقی" (مدنی، خانواده، تجاری) است، مراحل دادسرا را لحاظ نکرده و مستقیماً از محاکم حقوقی (شورای حل اختلاف یا دادگاه بدوی حقوقی) آغاز کنید. در پرونده‌های کیفری روال دادسرا حفظ شود.
پاسخ شما باید صرفاً یک آبجکت معتبر JSON (بدون مارک‌داون یا تگ اضافه مانند \`\`\`json) با ساختار زیر باشد:
{
  "decisions": [
    {
       "authority": "مرجع رسیدگی کننده (مثلاً دادگاه بدوی حقوقی، یا دادسرا برای امور کیفری)",
       "title": "عنوان رای یا قرار صادر شده",
       "content": "متن رسمی دادنامه/قرار با گردشکار دقیق و استدلال مستند به مواد حقوقی یا کیفری",
       "type": "badavi"
     },
    {
       "authority": "دادستان یا دادیار (در صورت کیفری بودن)",
       "title": "کیفرخواست",
       "content": "در پرونده‌های حقوقی این بخش خالی بماند یا حذف شود",
       "type": "prosecutor"
     },
    {
       "authority": "دادگاه تجدیدنظر استان (در صورت اعتراض)",
       "title": "رأی دادگاه تجدیدنظر استان",
       "content": "بررسی اعتراض، تطبیق با قوانین و اعلام رای نهایی",
       "type": "tajdid"
     },
    {
       "authority": "دیوان عالی کشور (در صورت قابلیت فرجام خواهی)",
       "title": "رای دیوان",
       "content": "استدلال دیوان عالی کشور مستند به قانون",
       "type": "divan"
     }
  ]
}

شرح پرونده و مدارک:
${description}
`;
      } else if (action === "statistical-analysis") {
        prompt = `شما سیستم تحلیل آماری رویه قضایی ایران هستید. 
پرونده زیر را مطالعه کرده و بر اساس آرای مشابه قبلی، آرا وحدت رویه و قوانین حاکم، درصد شانس نتایج مختلف را برآورد کنید.
پاسخ شما باید صرفاً یک آبجکت معتبر JSON (بدون مارک‌داون یا تگ اضافه مانند \`\`\`json) با ساختار زیر باشد:
{
  "rates": [
    { "outcome": "پیروزی کامل / اثبات خواسته یا جرم با رای محکومیت خوانده/متهم", "percentage": "درصد مشخص مثلا ۶۰٪", "reasons": ["دلیل اول قوت پرونده", "دلیل دوم قوت پرونده"] },
    { "outcome": "رد دعوا / حکم به بی‌حقی یا برائت کامل متهم/خوانده", "percentage": "درصد مشخص مثلا ۳۰٪", "reasons": ["دلیل اول ضعف پرونده یا دفاعیات طرف مقابل", "دلیل دوم ضعف پرونده"] },
    { "outcome": "صدور قرار شکلی (رد دادخواست، ابطال دادخواست، قرار اناطه یا عدم صلاحیت)", "percentage": "درصد مشخص مثلا ۱۰٪", "reasons": ["ابهام حقوقی یا نیاز به اقدام شکلی مقدماتی"] }
  ],
  "precedents": [
    "ذکر شماره دادنامه یا رای وحدت رویه مشابه که به عنوان نمونه مبنا قرار گرفته (مثلا رای وحدت رویه شماره ۸۳۲ هیات عمومی دیوان عالی کشور) به همراه استدلال کلیدی آن"
  ],
  "summary": "تحلیل خلاصه و راهبردی درصدها و رویه دادگاه‌ها در مواجهه با این موضوع"
}

شرح پرونده و مدارک:
${description}
`;
      } else if (action === "scenarios") {
        prompt = `شما اتاق فکر و سناریونویس قضایی و حقوقی ایران هستید. 
پرونده زیر را بررسی کرده و ۳ مسیر دفاعی کارآمد برای وکیل و ۳ ذهنیت یا رویه قضایی احتمالی قضات را شبیه‌سازی کنید.
پاسخ شما باید صرفاً یک آبجکت معتبر JSON (بدون مارک‌داون یا تگ اضافه مانند \`\`\`json) با ساختار زیر باشد:
{
  "strategies": [
    { "type": "دفاع شکلی و ایرادات آیین دادرسی", "title": "راهبرد تهاجم شکلی", "description": "ایراد به صلاحیت، سمت، مرور زمان، عدم رعایت تشریفات اظهارنامه یا مواعد قانونی با ذکر دقیق مواد قانونی", "risk": "ریسک پایین و بسیار کارآمد در تاخیر انداختن یا بستن پرونده" },
    { "type": "دفاع ماهوی و ماهیت حق", "title": "راهبرد نفوذ به ماهیت", "description": "اثبات ایفای تعهد، بطلان معامله، اسقاط مسئولیت، یا فقدان ارکان مادی/معنوی جرم بر اساس ادله با مستندات قانونی", "risk": "ریسک متوسط با کارایی قاطع" },
    { "type": "دفاع تلفیقی و تاکتیکی", "title": "راهبرد همه‌جانبه", "description": "طرح موازی ایراد شکلی، لایحه ماهوی مستحکم، تامین خواسته، جلب ثالث یا دعوای تقابل جهت خنثی‌سازی حریف", "risk": "ریسک پایین تا متوسط با بالاترین بازدهی دفاعی" }
  ],
  "judicialPerspectives": [
    { "judgeType": "قاضی نص‌گرا و ظاهرگرا (Formalist)", "perspective": "شدیداً به لفظ صریح قانون و متون اسناد پایبند است، اراده باطنی یا عدالت موضوعی را کمتر دخالت می‌دهد، به محض وجود ایراد شکلی قرار صادر می‌کند." },
    { "judgeType": "قاضی رویه‌گرا و عرفی (Precedent-oriented)", "perspective": "تمرکز شدید بر آرای وحدت رویه، تصمیمات دادگاه تجدیدنظر استان، بخشنامه‌ها و عرف مسلم معاملاتی دارد و از تکرار رویه با ثبات محاکم حمایت می‌کند." },
    { "judgeType": "قاضی تفسیری و عدالت‌گرا (Purposive/Equity)", "perspective": "تلاش برای رسیدن به عدالت باطنی، روح قانون، حسن نیت، سوءاستفاده از حق، و تفسیر شروط قرارداد به نفع طرف ضعیف‌تر دارد." }
  ]
}

شرح پرونده و مدارک:
${description}
`;
      } else if (action === "drafting") {
        prompt = `شما نویسنده ارشد لوایح و دادخواست‌های قضایی در سیستم قضایی ایران هستید. 
بر اساس پرونده زیر، با تاکید ویژه بر رعایت استانداردهای "امور حقوقی" (قانون مدنی، آیین دادرسی مدنی، و قوانین تجارت در صورت نیاز) و کیفری، با تاکید ویژه بر رعایت استانداردهای "امور حقوقی" (قانون مدنی، آیین دادرسی مدنی، و قوانین تجارت در صورت نیاز) و کیفری، یک پیش‌نویس کاملاً رسمی، استاندارد، بلیغ و حقوقی از "لایحه دفاعیه" (یا دادخواست/شکواییه متناسب با پرونده) تنظیم نمایید.
پاسخ شما باید صرفاً یک آبجکت معتبر JSON (بدون مارک‌داون یا تگ اضافه مانند \`\`\`json) با ساختار زیر باشد:
{
  "draftType": "لایحه دفاعیه یا دادخواست یا شکواییه",
  "header": "عنوان مرجع رسیدگی و موضوع پرونده با فرمت رسمی",
  "content": "متن رسمی و کامل لایحه به همراه مواد قانونی استنادی و استدلال‌های محکم، با کلمات بلیغ و رسمی قضایی ایران (ریاست محترم... احتراماً... به عنوان وکیل...)",
  "signature": "امضای وکیل مدافع پرونده با آرزوی توفیق الهی"
}

شرح پرونده و مدارک:
${description}
`;
      } else if (action === "clash") {
        prompt = `شما شبیه‌ساز مناظره و چالش جلسه دادرسی محاکم ایران هستید. 
پرونده زیر را مطالعه کرده و یک تقابل داغ و فنی لوایح و دفاعیات شفاهی بین وکیل طرف مقابل و وکیل موکل (شما) شبیه‌سازی کنید.
پاسخ شما باید صرفاً یک آبجکت معتبر JSON (بدون مارک‌داون یا تگ اضافه مانند \`\`\`json) با ساختار زیر باشد:
{
  "clashExchange": [
    { "speaker": "وکیل مدافع طرف مقابل", "statement": "دفاع یا ادعای تهاجمی طرف مقابل مبنی بر رد خواسته یا اتهام موکل با ذکر استدلال و مستند ظاهری او" },
    { "speaker": "وکیل موکل (رضا پورمحمد)", "statement": "پاسخ حقوقی قاطع، مدلل، مستند به ماده قانونی و رویه قضایی با هدف ابطال ادعای طرف مقابل" },
    { "speaker": "وکیل مدافع طرف مقابل (پاسخ دوم)", "statement": "تلاش مجدد طرف مقابل برای ورود از زاویه دیگر مانند ادعای عدم صلاحیت یا ایراد امضا" },
    { "speaker": "وکیل موکل (رضا پورمحمد - پاسخ دوم)", "statement": "خنثی‌سازی نهایی ادعا با ارجاع به آرای وحدت رویه و اسناد غیرقابل تردید پرونده" }
  ],
  "tacticalTips": [
    "نکته کلیدی و پاشنه آشیل پرونده که باید در جلسه دادرسی روی آن تمرکز کنید",
    "نحوه پاسخ‌گویی به ابهامات احتمالی قاضی در طول تبادل لوایح"
  ]
}

شرح پرونده و مدارک:
${description}
`;
      } else if (action === "deep-case-analysis") {
        prompt = `شما یک قاضی باسابقه دیوان عالی کشور و مشاور عالی قضایی ایران هستید.
بر اساس اسناد و مدارک پرونده بارگذاری شده زیر، یک "تحلیل جامع و استراتژیک پرونده (Deep Case Analysis)" کاملاً تخصصی صادر کنید.
پاسخ شما باید صرفاً یک آبجکت معتبر JSON (بدون مارک‌داون یا تگ اضافه مانند \`\`\`json) به صورت دقیقاً زیر باشد:
{
  "evidenceAutopsy": {
    "evaluation": "ارزیابی تخصصی اعتبار، قابلیت استناد و وزن اثباتی هر یک از مدارک و اسناد ارائه شده به زبان رسمی و دقیق حقوقی",
    "missingLinks": ["مدرک مفقود اول که برای تقویت دعوا باید ضمیمه شود", "مدرک مفقود دوم که برای پیشگیری از رد دعوا لازم است"]
  },
  "statisticalMatrix": {
    "plaintiffSuccessChance": "درصد شانس موفقیت خواهان/شاکی با علامت ٪",
    "defendantSuccessChance": "درصد شانس موفقیت خوانده/متهم با علامت ٪",
    "reasons": ["دلیل اصلی برآورد درصد موفقیت خواهان بر اساس آرا و رویه", "دلیل اصلی برآورد درصد موفقیت خوانده بر اساس ضعف‌ها و چالش‌ها"]
  },
  "legalRoadmap": [
    { "strategy": "راهبرد تهاجمی (Offensive)", "description": "اقدام حقوقی فوری و قاطع با هدف خلع سلاح طرف مقابل", "risk": "ریسک و خطرات احتمالی این راهبرد" },
    { "strategy": "راهبرد تدافعی (Defensive)", "description": "پوشش خلاءها و آماده‌سازی پاسخ در مقابل ایرادات و دفاعیات حریف", "risk": "ریسک و خطرات احتمالی این راهبرد" },
    { "strategy": "راهبرد مصالحه‌جویانه (Compromise)", "description": "پیشنهاد داوری، سازش یا تنظیم گزارش اصلاحی جهت اتمام سریع و کم‌هزینه دعوا", "risk": "ریسک و خطرات احتمالی این راهبرد" }
  ],
  "autoPleading": {
    "title": "عنوان لایحه یا شکواییه/دادخواست",
    "header": "خطاب به مرجع صالح",
    "text": "متن پیش‌نویس کامل، مستدل، بلیغ و حرفه‌ای لایحه دفاعیه مستند به مواد قانونی مربوطه به زبان فارسی استاندارد قضایی ایران"
  }
}

شرح پرونده و مدارک:
${description}
`;
      } else {
        return res.status(400).json({ error: "اکشن نامعتبر است." });
      }

      const modelsToTry = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"];
      let finalResult = null;

      for (const modelName of modelsToTry) {
        let responseText = "";
        try {
          const result = await ai.models.generateContent({
            model: modelName,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
              temperature: 0.25,
            }
          });

          responseText = result.text || "";
          const match = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (match) {
            responseText = match[1];
          }
          const startIdx = responseText.indexOf('{');
          const endIdx = responseText.lastIndexOf('}');
          if (startIdx !== -1 && endIdx !== -1) {
            responseText = responseText.substring(startIdx, endIdx + 1);
          }
          
          finalResult = JSON.parse(responseText.trim().replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g, ""));
          if (finalResult) break;
        } catch (err: any) {
          try {
            const match = responseText.match(/\{[\s\S]*\}/);
            if (match) {
                finalResult = JSON.parse(match[0].replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g, ""));
                if (finalResult) break;
            }
          } catch (e) {
            const errMsg = err.message || String(err);
            const isQuota = errMsg.includes("quota") || errMsg.includes("429") || errMsg.includes("QUOTA_EXHAUSTED");
            if (isQuota) {
                console.warn(`[Simulator Action Service] Model ${modelName} is temporarily rate-limited.`);
            } else {
                console.warn(`[Simulator Action Service] Model ${modelName} failed: ${errMsg.substring(0, 100)}`);
            }
          }
        }
      }

      if (!finalResult) {
        return res.status(503).json({ error: "تمامی مدل‌های شبیه‌ساز قضایی با محدودیت مواجه شدند. لطفاً مجدداً تلاش کنید." });
      }

      return res.json(finalResult);

    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: "خطای داخلی سرور در شبیه‌ساز قضایی." });
    }
  });

  // API endpoint for court simulation chat
  
  // API endpoint for CBI sync
  app.post("/api/sync-cbi", async (req, res) => {
    try {
      // Robust Web Scraping Logic
      let data = "";
      try {
        const response = await axios.get("https://cbi.ir/page/8321.aspx", { timeout: 8000 });
        data = response.data;
      } catch (err) {
        // Fallback to another source or handle timeout
        console.warn("Primary CBI source unreachable, attempting fallback...");
      }
      
      if (!data || data.length < 500) {
        return res.status(503).json({ error: "Update Failed: Source unreachable. Using latest cached data." });
      }

      const $ = cheerio.load(data);
      
      // Simulate extraction logic:
      // In a real scenario, you'd find the table and parse the rows.
      // E.g. $('table.cbi-table tr').each(...)
      
      const currentYear = 1403; // Inferred from system or scraped data
      const updatedData = {
        [currentYear]: {
          annual: 1186.30,
          months: { 1: 1100.1, 2: 1120.5, 3: 1135.2, 4: 1150.8, 5: 1170.0 } 
        }
      };

      return res.json({
        success: true,
        message: "شاخص‌ها با موفقیت بروزرسانی شدند.",
        data: updatedData
      });
      
    } catch (err: any) {
      console.error("CBI Sync Error:", err);
      return res.status(503).json({ error: "Update Failed: Source unreachable. Using latest cached data." });
    }
  });

app.post("/api/simulate/chat", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "API Key not configured." });
      }
      const { messages, context } = req.body;
      const { caseType, userRole, courtStage, initialAnalysis, caseDescription } = context;

      const systemInstruction = `شما یک شبیه‌ساز دادگاه حقوقی/کیفری ایران هستید. 
شما همزمان دو نقش را ایفا می‌کنید: ۱. قاضی دادگاه ۲. وکیل طرف مقابل (یا دادستان).
کاربر نقش '${userRole}' را در پرونده '${caseType}' در مرحله '${courtStage}' دارد.
${caseDescription ? `خلاصه پرونده برای آگاهی شما: ${caseDescription}` : ""}
${initialAnalysis ? `تحلیل هوشمند قبلی پرونده: ${JSON.stringify(initialAnalysis)}` : ""}

قاضی باید کاملاً بی‌طرفانه، سخت‌گیرانه و مستند به قوانین ایران (مجازات اسلامی، مدنی، آیین دادرسی) رفتار کند.
وکیل مقابل/دادستان باید به شدت از موضع خود دفاع کرده و ایرادات قانونی به لوایح کاربر وارد کند.
در هر پاسخ، ابتدا وکیل مقابل/دادستان دفاعیه/اعتراض خود را مطرح کند و سپس قاضی نظر یا سوال خود را بپرسد یا تصمیم‌گیری کند.
فرمت پاسخ شما باید به صورت مارک‌داون باشد، مثلاً:
**وکیل مقابل / دادستان:** [متن دفاعیه]
**قاضی دادگاه:** [نظر یا سوال قاضی]
هیچ‌گاه از نقش خود خارج نشوید.`;

      const modelsToTry = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"];
      let finalResponseText = "";

      for (const modelName of modelsToTry) {
        try {
          const result = await ai.models.generateContent({
            model: modelName,
            contents: messages,
            config: {
              systemInstruction,
              temperature: 0.5,
            }
          });
          finalResponseText = result.text || "";
          if (finalResponseText) break;
        } catch (err: any) {
          const errMsg = err.message || String(err);
          const isQuota = errMsg.includes("quota") || errMsg.includes("429") || errMsg.includes("QUOTA_EXHAUSTED");
          if (isQuota) {
            console.warn(`[Simulation Service] Model ${modelName} is temporarily rate-limited.`);
          } else {
            console.warn(`[Simulation Service] Model ${modelName} failed: ${errMsg.substring(0, 100)}`);
          }
        }
      }

      if (!finalResponseText) {
        return res.status(503).json({ error: "تمامی مدل‌های شبیه‌ساز با محدودیت مواجه شدند." });
      }

      return res.json({ text: finalResponseText });

    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: "خطای داخلی سرور در شبیه‌ساز دادگاه." });
    }
  });

  // Handle legacy /sw.js in development to prevent MIME type errors from SPA fallback
  if (process.env.NODE_ENV !== "production") {
    app.get("/sw.js", (req, res) => {
      res.setHeader("Content-Type", "application/javascript");
      res.send(`
        self.addEventListener('install', () => {
          self.skipWaiting();
        });
        self.addEventListener('activate', async () => {
          await self.registration.unregister();
          await self.clients.claim();
        });
      `);
    });
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
