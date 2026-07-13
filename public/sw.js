const CACHE_NAME = 'reza-pourmohammad-legal-v10';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
  '/icon-192.png',
  '/?pwa=true&v=10'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('Service Worker: Caching files individually for reliability');
      for (const asset of ASSETS) {
        try {
          await cache.add(asset);
          console.log(`Successfully cached: ${asset}`);
        } catch (err) {
          console.warn(`Failed to cache: ${asset}. SW will still install.`, err);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Only handle GET requests
  if (e.request.method !== 'GET') {
    return;
  }

  const url = new URL(e.request.url);

  // same-origin requests (static assets, index.html, routing pages)
  if (url.origin === self.location.origin) {
    // Exclude dynamic server API routes from stale-while-revalidate static caching
    if (url.pathname.startsWith('/api/')) {
      e.respondWith(
        fetch(e.request).catch(() => {
          return new Response(
            JSON.stringify({ 
              error: "offline", 
              message: "شما در حالت آفلاین هستید. اطلاعات به صورت محلی ذخیره و نمایش داده می‌شوند." 
            }), 
            { headers: { 'Content-Type': 'application/json' } }
          );
        })
      );
      return;
    }

    // Static assets, icons, HTML, JS and CSS bundles
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        const networkFetch = fetch(e.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(e.request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch((err) => {
            console.warn("Network fetch failed in SW offline mode:", err);
            // If offline and navigate request, fallback to root index.html (important for client-side SPA router)
            if (e.request.mode === 'navigate') {
              return caches.match('/').then(res => res || caches.match('/index.html'));
            }
            return null;
          });

        // Stale-While-Revalidate: Return cached response instantly if available, fetch from network in background to update
        if (cachedResponse) {
          e.waitUntil(networkFetch);
          return cachedResponse;
        }

        // Cache miss: Wait for network
        return networkFetch.then((res) => {
          if (res) return res;
          
          // If network fails completely and we have no cache, fallback for navigation
          if (e.request.mode === 'navigate') {
            return caches.match('/').then(res => res || caches.match('/index.html'));
          }
        });
      })
    );
  } else {
    // External origin requests (Google Fonts, CDNs, etc.)
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        const networkFetch = fetch(e.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(e.request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            return null;
          });

        return cachedResponse || networkFetch;
      })
    );
  }
});

/* ==========================================
   ROBUST BACKGROUND ALARM & REMINDER ENGINE
   (Runs when screen is off / app is closed)
   ========================================== */

const JALALI_MONTH_NAMES = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

function toEnglishDigits(str) {
  if (!str) return "";
  const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  let result = str.toString();
  for (let i = 0; i < 10; i++) {
    result = result.replace(persianDigits[i], i.toString());
  }
  return result;
}

function toPersianDigits(num) {
  if (num === undefined || num === null) return "";
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.toString().replace(/\d/g, (x) => persianDigits[parseInt(x)]).replace(/\./g, "/");
}

function gregorianToJalali(gy, gm, gd) {
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

function jalaliToGregorian(jy, jm, jd) {
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

function getCurrentJalali() {
  const now = new Date();
  const jyDate = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return {
    ...jyDate,
    hour: now.getHours(),
    minute: now.getMinutes(),
    second: now.getSeconds()
  };
}

function addDaysToJalali(jy, jm, jd, days) {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
  const date = new Date(gy, gm - 1, gd);
  date.setDate(date.getDate() + days);
  return gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function formatJalaliDate(jy, jm, jd) {
  const pad = (n) => n.toString().padStart(2, "0");
  return `${jy}/${pad(jm)}/${pad(jd)}`;
}

function doesEventMatchDate(e, dateStr) {
  if (e.jalaliDate === dateStr) return true;
  if (!e.repeatSelected || e.repeatSelected === "بدون تکرار") return false;

  const getDaysDiff = (d1, d2) => {
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

  const repeatVal = e.repeatSelected;
  if (repeatVal === "هر روز" || repeatVal === "روزانه") {
    return true;
  } else if (repeatVal === "هر هفته" || repeatVal === "هفتگی") {
    const diff = getDaysDiff(start, dateStr);
    return diff % 7 === 0;
  } else if (repeatVal === "هر ماه" || repeatVal === "ماهانه") {
    const startParts = start.split("/");
    const targetParts = dateStr.split("/");
    return startParts[2] === targetParts[2];
  } else if (repeatVal === "هر سال" || repeatVal === "سالانه") {
    const startParts = start.split("/");
    const targetParts = dateStr.split("/");
    return startParts[1] === targetParts[1] && startParts[2] === targetParts[2];
  }
  return false;
}

// Promise-based IndexedDB access for LawyerDocumentsDB
function getFromIDB(key) {
  return new Promise((resolve) => {
    const request = indexedDB.open("LawyerDocumentsDB", 1);
    request.onsuccess = () => {
      const db = request.result;
      try {
        const tx = db.transaction("documentContents", "readonly");
        const store = tx.objectStore("documentContents");
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    };
    request.onerror = () => resolve(null);
  });
}

function setToIDB(key, value) {
  return new Promise((resolve) => {
    const request = indexedDB.open("LawyerDocumentsDB", 1);
    request.onsuccess = () => {
      const db = request.result;
      try {
        const tx = db.transaction("documentContents", "readwrite");
        const store = tx.objectStore("documentContents");
        const req = store.put(value, key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    };
    request.onerror = () => resolve(false);
  });
}

// Background alarm check logic
async function checkAlarmsInBackground() {
  console.log("[SW Background] Checking alarms...");
  try {
    const idxEventsStr = await getFromIDB("idx_r_events");
    if (!idxEventsStr) return;
    
    const events = JSON.parse(idxEventsStr);
    if (!Array.isArray(events) || events.length === 0) return;
    
    const firedAlarmsStr = await getFromIDB("idx_r_fired_alarms");
    const firedAlarms = new Set(firedAlarmsStr ? JSON.parse(firedAlarmsStr) : []);
    
    const nowJalali = getCurrentJalali();
    const pad = (n) => n.toString().padStart(2, "0");
    const todayStr = `${nowJalali.jy}/${pad(nowJalali.jm)}/${pad(nowJalali.jd)}`;
    const nowTimeStr = `${pad(nowJalali.hour)}:${pad(nowJalali.minute)}`;
    
    let anyNewFired = false;
    
    for (const ev of events) {
      if (!ev.alarmEnabled || ev.isArchived) continue;
      const dev = ev;
      
      const triggerPoints = [];
      const isRecurring = dev.repeatSelected && dev.repeatSelected !== "بدون تکرار";
      
      if (isRecurring) {
        const matchToday = doesEventMatchDate(ev, todayStr);
        if (matchToday) {
          triggerPoints.push({ id: `${ev.id}_final_${todayStr}`, date: todayStr, time: ev.time, label: "موعد نهایی رویداد" });
          
          if (dev.alarm1Hour) {
            const [h, m] = toEnglishDigits(ev.time).split(":").map(Number);
            const targetH = h === 0 ? 23 : h - 1;
            triggerPoints.push({ id: `${ev.id}_1h_${todayStr}`, date: todayStr, time: `${pad(targetH)}:${pad(m || 0)}`, label: "۱ ساعت قبل" });
          }
        }
        
        if (dev.alarm1Day) {
          const tomorrowJalali = addDaysToJalali(nowJalali.jy, nowJalali.jm, nowJalali.jd, 1);
          const tomorrowStr = formatJalaliDate(tomorrowJalali.jy, tomorrowJalali.jm, tomorrowJalali.jd);
          if (doesEventMatchDate(ev, tomorrowStr)) {
            triggerPoints.push({ id: `${ev.id}_1d_${todayStr}`, date: todayStr, time: ev.time, label: "۲۴ ساعت قبل" });
          }
        }
        if (dev.alarm3Days) {
          const days3Jalali = addDaysToJalali(nowJalali.jy, nowJalali.jm, nowJalali.jd, 3);
          const days3Str = formatJalaliDate(days3Jalali.jy, days3Jalali.jm, days3Jalali.jd);
          if (doesEventMatchDate(ev, days3Str)) {
            triggerPoints.push({ id: `${ev.id}_3d_${todayStr}`, date: todayStr, time: ev.time, label: "۳ روز قبل" });
          }
        }
        if (dev.alarm1Week) {
          const days7Jalali = addDaysToJalali(nowJalali.jy, nowJalali.jm, nowJalali.jd, 7);
          const days7Str = formatJalaliDate(days7Jalali.jy, days7Jalali.jm, days7Jalali.jd);
          if (doesEventMatchDate(ev, days7Str)) {
            triggerPoints.push({ id: `${ev.id}_1w_${todayStr}`, date: todayStr, time: ev.time, label: "۱ هفته قبل" });
          }
        }
      } else {
        triggerPoints.push({ id: `${ev.id}_final_${ev.jalaliDate}`, date: ev.jalaliDate, time: ev.time, label: "موعد نهایی رویداد" });
        
        if (dev.alarm1Hour && ev.time) {
          const [h, m] = toEnglishDigits(ev.time).split(":").map(Number);
          const targetH = h === 0 ? 23 : h - 1;
          triggerPoints.push({ id: `${ev.id}_1h_${ev.jalaliDate}`, date: ev.jalaliDate, time: `${pad(targetH)}:${pad(m || 0)}`, label: "۱ ساعت قبل" });
        }
        
        const addPoint = (days, tag, label) => {
          if (!ev.jalaliDate) return;
          const parts = toEnglishDigits(ev.jalaliDate).split("/").map(Number);
          if (parts.length < 3) return;
          const [y, m, d] = parts;
          try {
            const targetDate = addDaysToJalali(y, m, d, -days);
            const targetDateStr = formatJalaliDate(targetDate.jy, targetDate.jm, targetDate.jd);
            triggerPoints.push({ id: `${ev.id}_${tag}_${targetDateStr}`, date: targetDateStr, time: ev.time, label });
          } catch(e) {}
        };
        
        if (dev.alarm1Day) addPoint(1, "1d", "۲۴ ساعت قبل");
        if (dev.alarm3Days) addPoint(3, "3d", "۳ روز قبل");
        if (dev.alarm1Week) addPoint(7, "1w", "۱ هفته قبل");
      }
      
      for (const pt of triggerPoints) {
        const normalizeDate = (d) => {
          if (!d) return d;
          const parts = toEnglishDigits(d).split("/");
          if (parts.length === 3) {
            return `${parts[0]}/${parts[1].padStart(2, "0")}/${parts[2].padStart(2, "0")}`;
          }
          return d;
        };
        const normalizeTime = (t) => {
          if (!t) return t;
          const parts = toEnglishDigits(t).split(":");
          if (parts.length === 2) {
            return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
          }
          return t;
        };
        
        const matchDate = normalizeDate(pt.date) === normalizeDate(todayStr);
        const matchTime = normalizeTime(pt.time) === normalizeTime(nowTimeStr);
        
        if (matchDate && matchTime && !firedAlarms.has(pt.id)) {
          // Fire notification!
          firedAlarms.add(pt.id);
          anyNewFired = true;
          
          const title = toPersianDigits(ev.title);
          const body = toPersianDigits(`${pt.label}: ${ev.time || ""}`);
          
          self.registration.showNotification(title, {
            body: body,
            icon: "./icon-192.png",
            badge: "./icon-192.png",
            vibrate: [1000, 500, 1000, 500, 1000, 500, 1000],
            requireInteraction: true,
            renotify: true,
            tag: `alarm-${pt.id}`
          });
        }
      }
    }
    
    if (anyNewFired) {
      await setToIDB("idx_r_fired_alarms", JSON.stringify(Array.from(firedAlarms)));
    }
  } catch (err) {
    console.error("Error checking alarms in service worker background:", err);
  }
}

// Set up periodic trigger checks
setInterval(checkAlarmsInBackground, 30000); // Check every 30s when active

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "check-alarms") {
    event.waitUntil(checkAlarmsInBackground());
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === "check-alarms" || event.tag === "alarm-sync") {
    event.waitUntil(checkAlarmsInBackground());
  }
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CHECK_ALARMS_NOW") {
    checkAlarmsInBackground();
  }
});

// Focus on application window upon clicking a notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("./?pwa=true");
      }
    })
  );
});

