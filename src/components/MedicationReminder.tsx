import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pill,
  Plus,
  X,
  Clock,
  Calendar,
  Trash2,
  Edit2,
  Bell,
  Check,
  AlertCircle,
  CheckCircle2,
  ChevronDown
} from "lucide-react";
import { toPersianDigits } from "../utils/shamsi";

interface Medication {
  id: string;
  name: string;
  dose?: string;
  times: string[]; // e.g. ["08:00"]
  days: string[]; // e.g. ["شنبه", "یکشنبه", ...]
  notes?: string;
  active: boolean;
  createdAt: string;
}

const ALL_WEEKDAYS = [
  { key: "شنبه", label: "ش" },
  { key: "یکشنبه", label: "ی" },
  { key: "دوشنبه", label: "د" },
  { key: "سه‌شنبه", label: "س" },
  { key: "چهارشنبه", label: "چ" },
  { key: "پنج‌شنبه", label: "پ" },
  { key: "جمعه", label: "ج" }
];

export default function MedicationReminder() {
  const [medications, setMedications] = useState<Medication[]>(() => {
    const saved = localStorage.getItem("r_medication_reminders");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Could not load medication reminders:", e);
      }
    }
    return [];
  });

  // Modal open state
  const [isOpen, setIsOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const [selectedDays, setSelectedDays] = useState<string[]>(["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"]);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("r_medication_reminders", JSON.stringify(medications));
  }, [medications]);

  // Handle opening modal for Add
  const handleOpenAdd = () => {
    setEditingMed(null);
    setName("");
    setDose("");
    setTimes(["08:00"]);
    setSelectedDays(["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"]);
    setNotes("");
    setFormError("");
    setIsOpen(true);
  };

  // Handle opening modal for Edit
  const handleOpenEdit = (med: Medication) => {
    setEditingMed(med);
    setName(med.name);
    setDose(med.dose || "");
    setTimes(med.times);
    setSelectedDays(med.days);
    setNotes(med.notes || "");
    setFormError("");
    setIsOpen(true);
  };

  // Preset Days selectors
  const handleSelectAllDays = () => {
    setSelectedDays(["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"]);
  };

  const handleSelectWorkDays = () => {
    setSelectedDays(["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه"]);
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleAddTimeField = () => {
    setTimes([...times, "08:00"]);
  };

  const handleRemoveTimeField = (index: number) => {
    if (times.length > 1) {
      setTimes(times.filter((_, idx) => idx !== index));
    }
  };

  const handleTimeChange = (index: number, val: string) => {
    const updated = [...times];
    updated[index] = val;
    setTimes(updated);
  };

  // Save Medication
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("لطفاً نام دارو را وارد نمایید.");
      return;
    }
    if (times.length === 0) {
      setFormError("لطفاً حداقل یک زمان مصرف وارد نمایید.");
      return;
    }
    if (selectedDays.length === 0) {
      setFormError("لطفاً حداقل یک روز مصرف انتخاب نمایید.");
      return;
    }

    if (editingMed) {
      // Edit mode
      setMedications(
        medications.map((m) =>
          m.id === editingMed.id
            ? {
                ...m,
                name: name.trim(),
                dose: dose.trim() || undefined,
                times: [...times].sort(),
                days: selectedDays,
                notes: notes.trim() || undefined
              }
            : m
        )
      );
    } else {
      // Create mode
      const newMed: Medication = {
        id: "med_" + Date.now(),
        name: name.trim(),
        dose: dose.trim() || undefined,
        times: [...times].sort(),
        days: selectedDays,
        notes: notes.trim() || undefined,
        active: true,
        createdAt: new Date().toLocaleDateString("fa-IR")
      };
      setMedications([newMed, ...medications]);
    }

    setIsOpen(false);
  };

  // Delete Medication
  const handleDelete = (id: string) => {
    setMedications(medications.filter((m) => m.id !== id));
  };

  // Toggle Active Status
  const handleToggleActive = (id: string) => {
    setMedications(
      medications.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
    );
  };

  // Calculate Next Dose Info
  const getNextDoseInfo = () => {
    const activeMeds = medications.filter((m) => m.active);
    if (activeMeds.length === 0) return null;

    // For a high-fidelity implementation, find the closest upcoming intake time today/tomorrow
    // Simple approach: look at current local hour & minute, find first future time today or tomorrow
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`;

    let nextMed: Medication | null = null;
    let nextTimeStr = "";
    let isTomorrow = false;

    // Collect all active med times
    const upcomingToday: { med: Medication; time: string }[] = [];
    const earliestTomorrow: { med: Medication; time: string }[] = [];

    activeMeds.forEach((m) => {
      m.times.forEach((t) => {
        if (t > currentTimeStr) {
          upcomingToday.push({ med: m, time: t });
        } else {
          earliestTomorrow.push({ med: m, time: t });
        }
      });
    });

    if (upcomingToday.length > 0) {
      // Sort today's upcoming times ascending
      upcomingToday.sort((a, b) => a.time.localeCompare(b.time));
      nextMed = upcomingToday[0].med;
      nextTimeStr = upcomingToday[0].time;
    } else if (earliestTomorrow.length > 0) {
      // Sort tomorrow's times ascending
      earliestTomorrow.sort((a, b) => a.time.localeCompare(b.time));
      nextMed = earliestTomorrow[0].med;
      nextTimeStr = earliestTomorrow[0].time;
      isTomorrow = true;
    }

    if (nextMed) {
      return {
        medName: nextMed.name,
        dose: nextMed.dose,
        time: nextTimeStr,
        isTomorrow
      };
    }

    return null;
  };

  const nextDose = getNextDoseInfo();

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      {/* Title block */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-teal-950 text-white rounded-3xl p-6 border border-teal-500/20 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
            <Pill className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white">یادآور دارو</h1>
            <p className="text-teal-200 text-xs mt-1 font-medium">مصرف به‌موقع، سلامتی پایدار</p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-5 py-3 bg-teal-500 hover:bg-teal-600 text-white font-black rounded-xl text-xs flex items-center gap-2 select-none shrink-0 cursor-pointer transition active:scale-95 shadow-md shadow-teal-500/10"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>افزودن داروی جدید</span>
        </button>
      </div>

      {/* Next Dose Header Card */}
      <div className="bg-teal-500 text-white rounded-3xl p-6 shadow-md relative overflow-hidden group">
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all" />
        <div className="flex items-center gap-3 mb-2.5">
          <Bell className="w-5 h-5 text-teal-100 animate-swing" />
          <span className="text-xs font-bold tracking-widest text-teal-100 uppercase">نوبت بعدی</span>
        </div>
        {nextDose ? (
          <div className="space-y-1">
            <h2 className="text-lg font-extrabold text-white">
              {nextDose.medName} {nextDose.dose ? `(${nextDose.dose})` : ""}
            </h2>
            <p className="text-xs text-teal-100 font-bold">
              ساعت: {toPersianDigits(nextDose.time)} {nextDose.isTomorrow ? "(فردا)" : "(امروز)"}
            </p>
          </div>
        ) : (
          <p className="text-xs font-bold text-teal-50 leading-relaxed">
            هنوز دارویی اضافه نکرده‌اید. با دکمه پایین اولین دارو را اضافه کنید.
          </p>
        )}
      </div>

      {/* Medication List Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-800 pr-1">داروهای من</h3>

        {medications.length === 0 ? (
          /* Empty List Card */
          <div className="bg-teal-50/30 border-2 border-dashed border-teal-200/50 rounded-3xl p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 mx-auto">
              <Pill className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-800">لیست داروهای شما خالی است</h4>
              <p className="text-xs text-slate-500 font-medium">برای شروع، دکمه + را بزنید</p>
            </div>
          </div>
        ) : (
          /* List of Medications */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {medications.map((med) => (
              <div
                key={med.id}
                className={`p-5 rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between gap-4 bg-white ${
                  med.active ? "border-teal-100" : "border-slate-200 bg-slate-50/50 opacity-75"
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          med.active ? "bg-teal-50 text-teal-600" : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        <Pill className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800">{med.name}</h4>
                        {med.dose && (
                          <p className="text-[10px] text-slate-500 font-bold mt-0.5">{med.dose}</p>
                        )}
                      </div>
                    </div>

                    {/* Active/Inactive Toggle Switch */}
                    <button
                      onClick={() => handleToggleActive(med.id)}
                      className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 outline-none shrink-0 cursor-pointer ${
                        med.active ? "bg-teal-500" : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
                          med.active ? "-translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Schedule Details */}
                  <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                    <span className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{med.times.map(t => toPersianDigits(t)).join(" ، ")}</span>
                    </span>
                    <span className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>
                        {med.days.length === 7
                          ? "همه روزها"
                          : med.days.length === 5 && !med.days.includes("پنج‌شنبه") && !med.days.includes("جمعه")
                          ? "شنبه تا چهارشنبه"
                          : med.days.join("، ")}
                      </span>
                    </span>
                  </div>

                  {med.notes && (
                    <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100 leading-relaxed font-semibold">
                      یادداشت: {med.notes}
                    </p>
                  )}
                </div>

                {/* Actions (Edit / Delete) */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-[9px] text-slate-400 font-bold">ثبت: {med.createdAt}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(med)}
                      className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg transition cursor-pointer"
                      title="ویرایش دارو"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(med.id)}
                      className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                      title="حذف دارو"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Center-aligned Bottom Add Button if list has items */}
      {medications.length > 0 && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleOpenAdd}
            className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-black rounded-full text-xs flex items-center gap-2 select-none cursor-pointer transition active:scale-95 shadow-lg shadow-teal-500/15"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن دارو</span>
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-black text-slate-800">
                  {editingMed ? "ویرایش دارو" : "افزودن داروی جدید"}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Content */}
              <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1 text-right text-xs font-bold text-slate-700">
                {formError && (
                  <div className="p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="block">نام دارو *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-2xl px-4 py-3 outline-none font-bold text-slate-800 text-right"
                    placeholder="مثلاً: استامینوفن"
                  />
                </div>

                {/* Dose */}
                <div className="space-y-1.5">
                  <label className="block">مقدار / دوز (اختیاری)</label>
                  <input
                    type="text"
                    value={dose}
                    onChange={(e) => setDose(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-2xl px-4 py-3 outline-none font-bold text-slate-800 text-right"
                    placeholder="مثلاً: ۱ قرص ۵۰۰ میلی‌گرم"
                  />
                </div>

                {/* Intake Times */}
                <div className="space-y-2">
                  <label className="block">زمان‌های مصرف</label>
                  <div className="space-y-2">
                    {times.map((t, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Clock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="time"
                            value={t}
                            onChange={(e) => handleTimeChange(idx, e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-2xl pr-10 pl-4 py-3 outline-none font-bold text-slate-800 text-center font-mono"
                          />
                        </div>
                        {times.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTimeField(idx)}
                            className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTimeField}
                    className="mt-1 px-4 py-2 text-teal-600 hover:bg-teal-50 text-[10px] rounded-xl flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن زمان دیگر</span>
                  </button>
                </div>

                {/* Days of Consumption */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block">روزهای مصرف</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllDays}
                        className="text-[9px] text-teal-600 hover:underline"
                      >
                        همه روزها
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={handleSelectWorkDays}
                        className="text-[9px] text-teal-600 hover:underline"
                      >
                        شنبه تا چهارشنبه
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-1.5 flex-row-reverse">
                    {ALL_WEEKDAYS.map((day) => {
                      const isSelected = selectedDays.includes(day.key);
                      return (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => toggleDay(day.key)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-black transition-all text-[11px] cursor-pointer select-none ${
                            isSelected
                              ? "bg-teal-500 text-white shadow-sm shadow-teal-500/20"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="block">یادداشت (اختیاری)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2.5}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-2xl px-4 py-3 outline-none font-bold text-slate-800 text-right"
                    placeholder="مثلاً: بعد از غذا مصرف شود"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-teal-500 hover:bg-teal-600 text-white font-black rounded-2xl text-xs cursor-pointer active:scale-95 transition shadow-md shadow-teal-500/10"
                  >
                    {editingMed ? "ویرایش دارو" : "افزودن دارو"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
