import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Trash2,
  CheckCircle,
  MessageSquare,
  Coins,
  User,
  FileText,
  Calendar,
  AlertCircle,
  DollarSign,
  Filter,
  Check,
  Send,
  UserCheck,
  Edit
} from "lucide-react";
import { toPersianDigits, getCurrentJalali, formatJalaliDate } from "../utils/shamsi";

interface DebtCreditItem {
  id: string;
  type: "credit" | "debt"; // credit = we expect to receive money (طلبکاری), debt = we owe money (بدهکاری)
  title: string;
  clientName: string;
  caseTitle?: string;
  amount: number; // in Tomans
  dueDate: string; // Jalali date
  status: "pending" | "paid";
  description?: string;
  createdAt: string;
}

const INITIAL_DEBTS_CREDITS: DebtCreditItem[] = [
  {
    id: "dc_1",
    type: "credit",
    title: "مابقی قسط دوم پرونده الزام به تنظیم سند رسمی",
    clientName: "مریم دانا",
    caseTitle: "الزام به تنظیم سند رسمی ملک پاسداران",
    amount: 15000000,
    dueDate: "۱۴۰۵/۰۵/۰۱",
    status: "pending",
    description: "قسط دوم قرارداد وکالت ملکی که می‌بایست تا شروع جلسه اول دادگاه تسویه گردد.",
    createdAt: "۱۴۰۴/۰۴/۱۰"
  },
  {
    id: "dc_2",
    type: "credit",
    title: "هزینه داوری و کارشناسی ارزش ملک هشتگرد",
    clientName: "مرتضی کریمی",
    caseTitle: "مطالبه وجه سفته واخواست شده",
    amount: 8500000,
    dueDate: "۱۴۰۵/۰۴/۲۵",
    status: "paid",
    description: "هزینه پرداخت شده به کارشناس رسمی دادگستری جهت ارزیابی اولیه که توسط دفتر وکیل تادیه شده بود.",
    createdAt: "۱۴۰۴/۰۴/۱۲"
  },
  {
    id: "dc_3",
    type: "debt",
    title: "سهم شراکت همکار مشاور (جناب وکیل احمدی)",
    clientName: "امیر احمدی (وکیل همکار)",
    caseTitle: "پرونده مطالبه مهریه حسینی",
    amount: 12000000,
    dueDate: "۱۴۰۵/۰۵/۱۵",
    status: "pending",
    description: "۳۰ درصد سهم مشاوره و حضور در جلسه دادگاه تجدید نظر پرونده مهریه زوجه.",
    createdAt: "۱۴۰۴/۰۴/۱۴"
  },
  {
    id: "dc_4",
    type: "debt",
    title: "اجاره ماهیانه دفتر وکالت (مرداد ماه)",
    clientName: "آقای رضایی (موجر)",
    amount: 25000000,
    dueDate: "۱۴۰۵/۰۵/۰۵",
    status: "pending",
    description: "اجاره ماهیانه طبقه دوم اداری دفتر مطهری.",
    createdAt: "۱۴۰۴/۰۴/۱۵"
  }
];

export default function DebtsCredits() {
  const [items, setItems] = useState<DebtCreditItem[]>(() => {
    const saved = localStorage.getItem("r_debts_credits");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Could not load debts and credits:", e);
      }
    }
    return INITIAL_DEBTS_CREDITS;
  });

  const [filterType, setFilterType] = useState<"all" | "credit" | "debt">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "paid">("all");
  const [searchTerm, setSearchTerm] = useState("");

  // New item states
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<DebtCreditItem | null>(null);
  const [formError, setFormError] = useState("");
  const [type, setType] = useState<"credit" | "debt">("credit");
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [caseTitle, setCaseTitle] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");

  // Save to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem("r_debts_credits", JSON.stringify(items));
  }, [items]);

  const handleEditClick = (item: DebtCreditItem) => {
    setEditingItem(item);
    setType(item.type);
    setTitle(item.title);
    setClientName(item.clientName);
    setCaseTitle(item.caseTitle || "");
    setAmountStr(item.amount.toLocaleString("fa-IR").replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())); // Clean formatted numbers if any
    setDueDate(item.dueDate);
    setDescription(item.description || "");
    setFormError("");
    setIsAdding(true);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setEditingItem(null);
    setFormError("");
    setTitle("");
    setClientName("");
    setCaseTitle("");
    setAmountStr("");
    setDueDate("");
    setDescription("");
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientName.trim() || !amountStr.trim() || !dueDate.trim()) {
      setFormError("لطفاً تمام فیلدهای ستاره‌دار را تکمیل فرمایید.");
      return;
    }

    const cleanedAmount = parseInt(amountStr.replace(/,/g, "").replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString()), 10);
    if (isNaN(cleanedAmount) || cleanedAmount <= 0) {
      setFormError("مبلغ وارد شده معتبر نمی‌باشد.");
      return;
    }

    setFormError("");

    if (editingItem) {
      const updatedItems = items.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            type,
            title: title.trim(),
            clientName: clientName.trim(),
            caseTitle: caseTitle.trim() || undefined,
            amount: cleanedAmount,
            dueDate: toPersianDigits(dueDate),
            description: description.trim() || undefined,
          };
        }
        return item;
      });
      setItems(updatedItems);
      setEditingItem(null);
    } else {
      const now = getCurrentJalali();
      const nowStr = formatJalaliDate(now.jy, now.jm, now.jd);

      const newItem: DebtCreditItem = {
        id: "dc_" + Date.now(),
        type,
        title: title.trim(),
        clientName: clientName.trim(),
        caseTitle: caseTitle.trim() || undefined,
        amount: cleanedAmount,
        dueDate: toPersianDigits(dueDate),
        status: "pending",
        description: description.trim() || undefined,
        createdAt: nowStr
      };

      setItems([newItem, ...items]);
    }

    setIsAdding(false);
    
    // Reset form
    setTitle("");
    setClientName("");
    setCaseTitle("");
    setAmountStr("");
    setDueDate("");
    setDescription("");
  };

  const handleToggleStatus = (id: string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === "paid" ? "pending" : "paid";
        return { ...item, status: nextStatus };
      }
      return item;
    }));
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Calculations
  const totalCredits = items.filter(i => i.type === "credit" && i.status === "pending").reduce((sum, i) => sum + i.amount, 0);
  const totalDebts = items.filter(i => i.type === "debt" && i.status === "pending").reduce((sum, i) => sum + i.amount, 0);
  const totalPaidCredits = items.filter(i => i.type === "credit" && i.status === "paid").reduce((sum, i) => sum + i.amount, 0);
  const totalPaidDebts = items.filter(i => i.type === "debt" && i.status === "paid").reduce((sum, i) => sum + i.amount, 0);
  const netBalance = totalCredits - totalDebts;

  const filteredItems = items.filter(item => {
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.caseTitle && item.caseTitle.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      {/* Header Panel */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-6 border border-amber-500/20 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full w-fit border border-amber-500/20 text-[10px] font-black uppercase">
            <Coins className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>حسابداری داخلی و مطالبات</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white mt-3">
            طلبکاری‌ها و بدهکاری‌ها
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 font-medium">
            مدیریت، پیگیری و ثبت مطالبات مالی از موکلین و تصفیه دیون، سهم شرکا و مخارج وکالت پرونده‌ها
          </p>
        </div>
        <button
          onClick={() => {
            if (isAdding) {
              handleCancelAdd();
            } else {
              setIsAdding(true);
            }
          }}
          className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 select-none shrink-0 cursor-pointer transition active:scale-95 shadow-md shadow-amber-500/10"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>{editingItem ? "ویرایش آیتم مالی" : "ثبت آیتم مالی جدید"}</span>
        </button>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-200/60 p-5 rounded-3xl shadow-sm space-y-2 text-right relative overflow-hidden group">
          <div className="absolute left-4 top-4 w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
            <TrendingUp className="w-6 h-6 font-bold" />
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md inline-block">طلبکاری‌های معوقه (در انتظار دریافت)</span>
          <h3 className="text-xl font-black text-emerald-950 font-mono mt-2">
            {toPersianDigits(totalCredits.toLocaleString())} <span className="text-xs font-sans">تومان</span>
          </h3>
          <p className="text-[10px] text-emerald-600 font-bold">
            تسویه شده: {toPersianDigits(totalPaidCredits.toLocaleString())} تومان
          </p>
        </div>

        <div className="bg-rose-50 border border-rose-200/60 p-5 rounded-3xl shadow-sm space-y-2 text-right relative overflow-hidden group">
          <div className="absolute left-4 top-4 w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20 group-hover:scale-110 transition-transform duration-300">
            <TrendingDown className="w-6 h-6 font-bold" />
          </div>
          <span className="text-[10px] font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-md inline-block">بدهکاری‌های معوقه (در انتظار پرداخت)</span>
          <h3 className="text-xl font-black text-rose-950 font-mono mt-2">
            {toPersianDigits(totalDebts.toLocaleString())} <span className="text-xs font-sans">تومان</span>
          </h3>
          <p className="text-[10px] text-rose-600 font-bold">
            پرداخت شده: {toPersianDigits(totalPaidDebts.toLocaleString())} تومان
          </p>
        </div>
      </div>

      {/* Add New Item Dialog Form */}
      {isAdding && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-amber-500/35 rounded-3xl p-6 shadow-md"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              {editingItem ? <Edit className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-amber-500" />}
              {editingItem ? "ویرایش تعهد مالی" : "ثبت تعهد مالی جدید (طلبکاری / بدهکاری)"}
            </h3>
            <button
              onClick={handleCancelAdd}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
            >
              انصراف و بستن فرم
            </button>
          </div>

          <form onSubmit={handleAddItem} className="space-y-4">
            {formError && (
              <div className="p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {/* Type Selector Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl max-w-xs text-xs font-bold">
              <button
                type="button"
                onClick={() => setType("credit")}
                className={`py-2 rounded-lg transition-all ${
                  type === "credit"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                طلبکاری (طلب از دیگران)
              </button>
              <button
                type="button"
                onClick={() => setType("debt")}
                className={`py-2 rounded-lg transition-all ${
                  type === "debt"
                    ? "bg-rose-600 text-white shadow"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                بدهکاری (بدهی ما به دیگران)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-bold text-slate-700">
              <div className="space-y-1.5">
                <label className="block">عنوان تراکنش / بابت چیست؟ *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2.5 outline-none font-bold text-slate-800"
                  placeholder=""
                />
              </div>

              <div className="space-y-1.5">
                <label className="block">{type === "credit" ? "نام موکل / طرف حساب بدهکار *" : "نام طلبکار / بستانکار *"}</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2.5 outline-none font-bold text-slate-800"
                  placeholder=""
                />
              </div>

              <div className="space-y-1.5">
                <label className="block">پرونده یا موضوع مرتبط (اختیاری)</label>
                <input
                  type="text"
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2.5 outline-none font-bold text-slate-800"
                  placeholder=""
                />
              </div>

              <div className="space-y-1.5">
                <label className="block">مبلغ تعهد (به تومان) *</label>
                <input
                  type="text"
                  value={amountStr}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    setAmountStr(clean ? parseInt(clean).toLocaleString('fa-IR') : "");
                  }}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2.5 outline-none font-mono font-bold text-slate-800 text-left"
                  placeholder=""
                />
              </div>

              <div className="space-y-1.5">
                <label className="block">تاریخ سررسید پرداخت (به شمسی) *</label>
                <input
                  type="text"
                  value={dueDate}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, "");
                    if (val.length > 4) val = val.slice(0, 4) + "/" + val.slice(4);
                    if (val.length > 7) val = val.slice(0, 7) + "/" + val.slice(7, 9);
                    setDueDate(val);
                  }}
                  maxLength={10}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2.5 outline-none font-bold text-slate-800 text-center"
                  placeholder="۱۴۰۵/۰۱/۰۱"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <label className="block">توضیحات و جزئیات بیشتر</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2 outline-none font-bold text-slate-800"
                  placeholder=""
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs cursor-pointer active:scale-95 transition"
              >
                {editingItem ? "ثبت تغییرات تعهد مالی" : "ثبت تعهد در سیستم حسابداری"}
              </button>
              <button
                type="button"
                onClick={handleCancelAdd}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs cursor-pointer transition"
              >
                انصراف
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Main Ledger Content */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        {/* Filtering & Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] font-black text-slate-400 pl-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>فیلتر وضعیت:</span>
            </div>
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition ${
                filterStatus === "all" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              همه وضعیت‌ها
            </button>
            <button
              onClick={() => setFilterStatus("pending")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition ${
                filterStatus === "pending" ? "bg-amber-500 text-slate-950" : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              در انتظار تصفیه
            </button>
            <button
              onClick={() => setFilterStatus("paid")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition ${
                filterStatus === "paid" ? "bg-emerald-500 text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              تسویه شده
            </button>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl pr-10 pl-3.5 py-2 font-bold text-xs outline-none text-slate-800 text-right"
              placeholder="جستجو در نام، عنوان یا پرونده..."
            />
          </div>
        </div>

        {/* Ledger List */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-10 space-y-2 bg-slate-50 rounded-2xl border border-slate-100">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-black text-slate-500">هیچ ردیف طلبکاری یا بدهکاری متناسب با فیلترها یافت نشد.</p>
              <p className="text-[10px] text-slate-400">شما می‌توانید با دکمه بالا یک تعهد جدید ثبت کنید.</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all hover:shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                  item.status === "paid"
                    ? "bg-slate-50/50 border-slate-150 opacity-80"
                    : item.type === "credit"
                    ? "bg-white border-emerald-100 hover:border-emerald-200"
                    : "bg-white border-rose-100 hover:border-rose-200"
                }`}
              >
                {/* Transaction Info Block */}
                <div className="flex items-start gap-3.5 text-right flex-1 min-w-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                    item.type === "credit"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                      : "bg-rose-50 text-rose-600 border-rose-100"
                  }`}>
                    {item.type === "credit" ? (
                      <TrendingUp className="w-5 h-5 font-bold" />
                    ) : (
                      <TrendingDown className="w-5 h-5 font-bold" />
                    )}
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                        item.type === "credit"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : "bg-rose-50 text-rose-700 border border-rose-100"
                      }`}>
                        {item.type === "credit" ? "طلبکاری دفتری" : "بدهکاری دفتری"}
                      </span>
                      <h4 className="text-xs font-black text-slate-800 truncate">{item.title}</h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[10px] font-bold text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>طرف حساب: {item.clientName}</span>
                      </span>
                      {item.caseTitle && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">پرونده: {item.caseTitle}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-sans">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>سررسید: {item.dueDate}</span>
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100 font-semibold">
                        توضیحات: {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Amount, Status & Controls Hub */}
                <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-3 w-full md:w-auto border-t md:border-0 pt-3 md:pt-0 border-slate-100 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-bold">مبلغ تعهد:</p>
                    <p className="text-sm font-black text-slate-800 font-mono">
                      {toPersianDigits(item.amount.toLocaleString())} <span className="text-[10px] font-sans">تومان</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Mark as paid toggle button */}
                    <button
                      onClick={() => handleToggleStatus(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition flex items-center gap-1 cursor-pointer select-none border ${
                        item.status === "paid"
                          ? "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600"
                          : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                      }`}
                      title={item.status === "paid" ? "بازگردانی به وضعیت معوق" : "تغییر وضعیت به تسویه شده"}
                    >
                      {item.status === "paid" ? (
                        <>
                          <Check className="w-3.5 h-3.5 font-bold" />
                          <span>تسویه شده</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>در انتظار تصفیه</span>
                        </>
                      )}
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => handleEditClick(item)}
                      className="p-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-600 rounded-xl transition cursor-pointer"
                      title="ویرایش تعهد مالی"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl transition cursor-pointer"
                      title="حذف تعهد مالی"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
