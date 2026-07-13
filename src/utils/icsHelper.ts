import { EventItem } from "../types";
import { jalaliToGregorian, toEnglishDigits } from "./shamsi";

// Helper to pad numbers
const pad = (n: number) => n.toString().padStart(2, "0");

// Convert a Jalali date string "YYYY/MM/DD" and time "HH:mm" to ICS date-time format "YYYYMMDDTHHmmssZ"
function formatToICSDate(jalaliDate: string, time: string): string {
  try {
    const enDate = toEnglishDigits(jalaliDate);
    const dateParts = enDate.split("/").map(Number);
    const timeParts = toEnglishDigits(time).split(":").map(Number);
    
    if (dateParts.length !== 3 || timeParts.length !== 2) {
      return "";
    }
    
    const { gy, gm, gd } = jalaliToGregorian(dateParts[0], dateParts[1], dateParts[2]);
    
    // Convert to Date object to get UTC
    const d = new Date(gy, gm - 1, gd, timeParts[0], timeParts[1]);
    
    const utcYear = d.getUTCFullYear();
    const utcMonth = pad(d.getUTCMonth() + 1);
    const utcDay = pad(d.getUTCDate());
    const utcHour = pad(d.getUTCHours());
    const utcMinute = pad(d.getUTCMinutes());
    const utcSecond = "00";

    return `${utcYear}${utcMonth}${utcDay}T${utcHour}${utcMinute}${utcSecond}Z`;
  } catch (e) {
    console.error(e);
    return "";
  }
}

export function generateICSContent(events: EventItem[]): string {
  if (!events || events.length === 0) return "";

  let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//RezaPourmohammad//App//FA\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";

  events.forEach((ev) => {
    const dtStart = formatToICSDate(ev.jalaliDate, ev.time);
    if (!dtStart) return;

    // Estimate end time (1 hour later) for ICS event duration
    const endParts = toEnglishDigits(ev.time).split(":").map(Number);
    let endHour = endParts[0] + 1;
    let endTimeStr = `${pad(endHour > 23 ? 23 : endHour)}:${pad(endParts[1])}`;
    const dtEnd = formatToICSDate(ev.jalaliDate, endTimeStr);

    const now = new Date();
    const dtStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;

    icsContent += "BEGIN:VEVENT\n";
    icsContent += `UID:${ev.id}@pourmohammad.app\n`;
    icsContent += `DTSTAMP:${dtStamp}\n`;
    icsContent += `DTSTART:${dtStart}\n`;
    if (dtEnd) icsContent += `DTEND:${dtEnd}\n`;
    
    // Add Alarm (VALARM)
    // 30 minutes before
    icsContent += "BEGIN:VALARM\n";
    icsContent += "TRIGGER:-PT30M\n";
    icsContent += "ACTION:DISPLAY\n";
    icsContent += `DESCRIPTION:یادآوری: ${ev.title}\n`;
    icsContent += "END:VALARM\n";

    icsContent += `SUMMARY:${ev.title}\n`;
    if (ev.description) {
      icsContent += `DESCRIPTION:${ev.description.replace(/\n/g, '\\n')}\n`;
    } else {
      icsContent += `DESCRIPTION:ثبت شده در سامانه مدیریت وکالت\n`;
    }
    
    icsContent += "END:VEVENT\n";
  });

  icsContent += "END:VCALENDAR\n";
  return icsContent;
}

export async function downloadICSFile(events: EventItem[], filename: string = "alarms.ics") {
  const icsContent = generateICSContent(events);
  if (!icsContent) return;

  // Attempt to use Web Share API for better compatibility with mobile apps
  try {
    const file = new File([icsContent], filename, { type: 'text/calendar' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'افزودن به تقویم',
      });
      return;
    }
  } catch (err) {
    console.warn("Share API not available or failed:", err);
  }

  // Fallback to standard blob download
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
