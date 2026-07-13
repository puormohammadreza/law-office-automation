import React, { useState, useMemo } from "react";
import { getCurrentJalali, toPersianDigits } from "../utils/shamsi";
import { LegalCase, Client } from "../types";
import {
  Coins,
  TrendingUp,
  PiggyBank,
  Sparkles,
  Search,
  FileText,
  User,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  CalendarDays
} from "lucide-react";

interface FinanceLedgerProps {
  cases: LegalCase[];
  clients: Client[];
  onNavigate: (tab: any) => void;
}

export default function FinanceLedger({ cases, clients, onNavigate }: FinanceLedgerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const monthNames = ["", "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

  // Aggregate stats
  const { totalR, totalP, monthlyStats } = useMemo(() => {
    let tr = 0;
    let tp = 0;
    const mStats: Record<string, number> = {};

    cases.forEach(c => {
      let caseIncome = 0;
      let caseExpense = c.paidExpenses || 0; // Legacy

      if (c.payments && c.payments.length > 0) {
        c.payments.forEach(p => {
          // Assume all payments logged are income/received from client
          const amt = p.amount || 0;
          caseIncome += amt;
          
          if (p.date) {
            const parts = p.date.split("/");
            if (parts.length >= 2) {
              // Assume YYYY/MM/... or ... if they typed digits
              const year = parts[0];
              const monthIdx = parseInt(parts[1].replace(/\D/g, ""));
              if (monthIdx >= 1 && monthIdx <= 12) {
                const monthKey = `${monthNames[monthIdx]} ${year}`;
                if (!mStats[monthKey]) mStats[monthKey] = 0;
                mStats[monthKey] += amt;
              } else {
                 const key = "سایر";
                 if (!mStats[key]) mStats[key] = 0;
                 mStats[key] += amt;
              }
            }
          }
        });
      } else {
        caseIncome += c.receivedFee || 0;
      }

      tr += caseIncome;
      tp += caseExpense;
    });

    return { totalR: tr, totalP: tp, monthlyStats: mStats };
  }, [cases]);

  const totalNet = totalR - totalP;

  // Filter cases
  const filteredCases = cases.filter(c => {
    const clientName = c.clientName || "";
    const title = c.title || "";
    const archiveNum = c.archiveNumber || "";
    
    const matchesSearch = 
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      archiveNum.toLowerCase().includes(searchTerm.toLowerCase());
      
    let caseIncome = c.receivedFee || 0;
    if (c.payments) caseIncome = c.payments.reduce((s, p) => s + (p.amount || 0), 0);
    const caseExpense = c.paidExpenses || 0;

    const hasFinancials = caseIncome > 0 || caseExpense > 0;
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "has-finance") return matchesSearch && hasFinancials;
    if (statusFilter === "no-finance") return matchesSearch && !hasFinancials;
    if (statusFilter === "debtor") return matchesSearch && caseIncome < caseExpense;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-850 text-white rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center border border-amber-500/20 gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full w-fit border border-amber-500/20">
            <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">پورتال حسابداری و تراز مالی دفتر</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white mt-3">
            حسابداری و تراز مالی دفتر وکالت
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 font-medium">
            پایش هوشمند حق‌الوکاله‌ها، ثبت دقیق مبالغ اضافات، هدایا و گزارش ماهانه درآمدها
          </p>
        </div>
        <button
          onClick={() => onNavigate("cases")}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-2 select-none shrink-0 cursor-pointer"
        >
          ویرایش و ثبت ارقام در پرونده‌ها
          <FileText className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Income Total and Advanced Breakdown */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="bg-emerald-50/70 p-5 rounded-3xl border border-emerald-500/15 flex items-center gap-4 shadow-sm mb-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100/50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs text-emerald-700/80 font-black block">مجموع دریافتی‌ها (حق‌الوکاله موکلین) کل تاریخ</span>
              <p className="text-3xl font-black text-emerald-950 font-mono mt-1">
                {toPersianDigits(totalR.toLocaleString())} <span className="text-sm font-bold">تومان</span>
              </p>
              <span className="text-[10px] text-emerald-600/75 font-semibold block mt-1">کلیه مبالغ واریزی، نقدی و هدایای موکلین</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-sky-500" />
                آمار پیشرفته درآمدهای ماهانه
              </h2>
              <p className="text-[10px] text-slate-400 mt-1">تفکیک کل مجموع درآمدهای دفتر به تفکیک ماه‌های سال بر اساس تاریخ پرداخت موکل (مثلاً مهرماه یا آبان‌ماه سال جاری)</p>
            </div>
            
            <div className="overflow-x-auto">
              {Object.keys(monthlyStats).length === 0 ? (
                 <div className="py-8 text-center text-slate-400 text-xs font-bold bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">هنوز هیچ پرداختی با تاریخ مشخص ثبت نشده است.</div>
              ) : (
                 <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] text-slate-500 font-extrabold border-b border-slate-200">
                      <th className="p-3 first:rounded-tr-xl">ماه و سال پرداختی</th>
                      <th className="p-3">درآمد ثبت‌شده (تومان)</th>
                      <th className="p-3 last:rounded-tl-xl w-32">درصد از کل درآمدها</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(monthlyStats)
                      .sort(([mA], [mB]) => mB.localeCompare(mA)) // Simple sort descending by string for now
                      .map(([month, amount], idx, arr) => {
                      const amountNum = amount as number;
                      const pct = totalR > 0 ? ((amountNum / totalR) * 100).toFixed(1) : "0";
                      return (
                        <tr key={idx} className={`border-b border-slate-50 hover:bg-slate-50/80 transition-colors text-xs font-bold ${idx === arr.length - 1 ? 'border-none' : ''}`}>
                          <td className="p-3 text-slate-800 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            {toPersianDigits(month)}
                          </td>
                          <td className="p-3 font-mono text-emerald-700 font-black">{toPersianDigits(amount.toLocaleString())}</td>
                          <td className="p-3">
                             <div className="flex items-center gap-2">
                               <span className="font-mono text-slate-500 text-[10px] min-w-[20px]">{toPersianDigits(pct)}٪</span>
                               <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden w-20 shadow-inner">
                                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                               </div>
                             </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Expenses and Net */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-rose-50/70 p-6 rounded-3xl border border-rose-500/15 flex flex-col sm:flex-row lg:flex-col items-center sm:items-start lg:items-center gap-4 shadow-sm flex-1">
            <div className="w-16 h-16 rounded-2xl bg-rose-100/50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
              <PiggyBank className="w-8 h-8" />
            </div>
            <div className="text-center sm:text-right lg:text-center">
              <span className="text-xs text-rose-700/80 font-black block">مجموع پرداختی‌ها (هزینه‌ و مخارج)</span>
              <p className="text-2xl font-black text-rose-950 font-mono mt-1 w-full truncate">
                {toPersianDigits(totalP.toLocaleString())} <span className="text-[10px] font-bold">تومان</span>
              </p>
              <span className="text-[9px] text-rose-500 font-bold block mt-1">ابطال تمبر مالیاتی سهم کانون و هزینه‌های دادرسی کل</span>
            </div>
          </div>

          <div className="bg-amber-50/70 p-6 rounded-3xl border border-amber-500/20 flex flex-col sm:flex-row lg:flex-col items-center sm:items-start lg:items-center gap-4 shadow-sm flex-1">
            <div className="w-16 h-16 rounded-2xl bg-amber-100/50 text-amber-700 flex items-center justify-center border border-amber-200/50 shrink-0">
              <Sparkles className="w-8 h-8 text-amber-500 animate-pulse" />
            </div>
            <div className="text-center sm:text-right lg:text-center">
              <span className="text-xs text-amber-700 font-black block">عایدی خالص معوق (سود زنده)</span>
              <p className={`text-2xl font-black font-mono mt-1 w-full truncate ${
                totalNet >= 0 ? "text-amber-800" : "text-rose-600"
              }`}>
                {toPersianDigits(totalNet.toLocaleString())} <span className="text-[10px] font-bold">تومان</span>
              </p>
              <span className="text-[9px] text-amber-600 font-bold block mt-1">تراکنش زنده کارگزاری پس از کسر تمامی مخارج</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger Directory searchable table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-800">ریز حسابرسی مالی پرونده‌ها و موکلین</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">جدول مستند ارقام خصوصی و تفکیکی پرداختی به مراجع قضایی</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="جستجوی پرونده یا موکل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-8 pl-3 py-1.5 bg-slate-50 border border-slate-250 rounded-xl text-xs outline-none focus:ring-1 focus:ring-slate-900 font-bold"
              />
            </div>

            {/* Filter buttons */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-xl text-[11px] font-bold outline-none cursor-pointer"
            >
              <option value="all">همه پرونده‌ها</option>
              <option value="has-finance">دارای تراکنش مالی</option>
              <option value="no-finance">فاقد تراکنش مالی</option>
              <option value="debtor">مخارج بیش از دریافتی</option>
            </select>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-450 font-black">
                <th className="p-3">عنوان پرونده حقوقی</th>
                <th className="p-3">کلاسه بایگانی</th>
                <th className="p-3">موکل پرونده</th>
                <th className="p-3">کل دریافتی از موکل</th>
                <th className="p-3">هزینه‌های مراجع قضایی</th>
                <th className="p-3">سود خالص معوق</th>
                <th className="p-3">وضعیت حساب</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-xs text-slate-450">
                    هیچ رکورد حسابداری با فیلترهای کنونی پیدا نشد.
                  </td>
                </tr>
              ) : (
                filteredCases.map((cs) => {
                  let rec = cs.receivedFee || 0;
                  if (cs.payments) rec = cs.payments.reduce((s, p) => s + (p.amount || 0), 0);
                  const exp = cs.paidExpenses || 0;
                  const net = rec - exp;
                  const statusLabel = net > 0 ? "تراز مثبت" : net === 0 ? "سر به سر" : "تراز بدهکار";
                  const badgeColor = 
                    net > 0 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                      : net === 0 
                      ? "bg-slate-50 text-slate-500 border-slate-150" 
                      : "bg-red-50 text-red-700 border-red-150";

                  return (
                    <tr key={cs.id} className="border-b border-slate-100 hover:bg-slate-50/70 text-xs font-bold transition">
                      <td className="p-3 pb-4">
                        <span className="text-slate-800 font-extrabold block">{toPersianDigits(cs.title)}</span>
                        <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">{toPersianDigits(cs.branch || "شعبه عمومی")}</span>
                      </td>
                      <td className="p-3 font-mono text-[10px] text-slate-500">{toPersianDigits(cs.archiveNumber)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{cs.clientName}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-emerald-700 font-black">
                        {toPersianDigits(rec.toLocaleString())} <span className="text-[10px]">تومان</span>
                      </td>
                      <td className="p-3 font-mono text-rose-600">
                        {toPersianDigits(exp.toLocaleString())} <span className="text-[10px]">تومان</span>
                      </td>
                      <td className={`p-3 font-mono font-black ${net >= 0 ? "text-slate-900" : "text-rose-700"}`}>
                        {toPersianDigits(net.toLocaleString())} <span className="text-[10px]">تومان</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black ${badgeColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
