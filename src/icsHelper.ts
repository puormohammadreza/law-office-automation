import { EventItem } from "./types";

export function generateAndDownloadICS(events: EventItem[], filename: string = "alarms.ics") {
  if (!events || events.length === 0) return;

  let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//RezaPourmohammad//App//FA\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";

  events.forEach((event) => {
    // Basic date parsing (assuming format like YYYY/MM/DD and HH:mm)
    // Convert Jalali to Gregorian for the ICS file, but since we might not have a full Jalali->Gregorian converter here,
    // we need to be careful. Let's assume we can approximate or if we have a converter.
    // Wait, do we have jalaali-js?
    // Let's check package.json
  });

  icsContent += "END:VCALENDAR";

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
