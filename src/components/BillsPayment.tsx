import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  CreditCard,
  Zap,
  Droplet,
  Flame,
  Phone,
  Smartphone,
  ShieldCheck,
  Printer,
  ChevronLeft,
  X,
  Building,
  Scale,
  RefreshCw,
  Wallet,
  Timer
} from "lucide-react";
import { toPersianDigits, getCurrentJalali, formatJalaliDate } from "../utils/shamsi";

interface BillItem {
  id: string;
  type: "water" | "electricity" | "gas" | "phone" | "mobile" | "municipality" | "judicial";
  title: string;
  billId: string;
  paymentId: string;
  amount: number; // in Tomans
  status: "pending" | "paid";
  dueDate: string;
  paidDate?: string;
  trackingCode?: string;
  createdAt: string;
}

const INITIAL_BILLS: BillItem[] = [
  {
    id: "bill_1",
    type: "judicial",
    title: "قبض هزینه دادرسی پرونده الزام به تنظیم سند رسمی",
    billId: "۳۹۸۲۷۱۸۲۷۱۸",
    paymentId: "۸۲۷۱۸۲۰",
    amount: 3200000,
    status: "pending",
    dueDate: "۱۴۰۵/۰۵/۱۰",
    createdAt: "۱۴۰۴/۰۴/۱۸"
  },
  {
    id: "bill_2",
    type: "electricity",
    title: "قبض برق دفتر وکالت (دوره اردیبهشت و خرداد)",
    billId: "۹۲۸۱۷۲۸۱۷۲۷",
    paymentId: "۷۲۸۱۷۲۸",
    amount: 680000,
    status: "paid",
    dueDate: "۱۴۰۵/۰۴/۳۰",
    paidDate: "۱۴۰۵/۰۴/۲۲",
    trackingCode: "TR-۹۸۲۷۱۸",
    createdAt: "۱۴۰۴/۰۴/۱۵"
  },
  {
    id: "bill_3",
    type: "phone",
    title: "تلفن ثابت دفتر (خط اصلی مطهری)",
    billId: "۸۲۷۱۸۲۷۱۸۱۷",
    paymentId: "۶۲۷۱۸۱۷",
    amount: 120000,
    status: "pending",
    dueDate: "۱۴۰۵/۰۵/۰۵",
    createdAt: "۱۴۰۴/۰۴/۲۰"
  },
  {
    id: "bill_4",
    type: "judicial",
    title: "تعرفه انتشار آگهی روزنامه رسمی دادگستری",
    billId: "۴۹۲۸۱۷۲۸۱۷۱",
    paymentId: "۳۹۲۸۱۷۲",
    amount: 450000,
    status: "pending",
    dueDate: "۱۴۰۵/۰۵/۱۵",
    createdAt: "۱۴۰۴/۰۴/۲۱"
  }
];

export default function BillsPayment() {
  const [bills, setBills] = useState<BillItem[]>(() => {
    const saved = localStorage.getItem("r_office_bills");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Could not load bills:", e);
      }
    }
    return INITIAL_BILLS;
  });

  const [activeTab, setActiveTab] = useState<"pending" | "paid">("pending");
  const [isAdding, setIsAdding] = useState(false);

  // New bill states
  const [billType, setBillType] = useState<BillItem["type"]>("judicial");
  const [title, setTitle] = useState("");
  const [billId, setBillId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Payment Gateway Simulator Modal State
  const [selectedBillForPay, setSelectedBillForPay] = useState<BillItem | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [cvv2, setCvv2] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [dynamicOtp, setDynamicOtp] = useState("");
  const [otpCounter, setOtpCounter] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [gatewayError, setGatewayError] = useState("");
  const [gatewaySuccess, setGatewaySuccess] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [generatedTrackingCode, setGeneratedTrackingCode] = useState("");

  // Save bills to localStorage
  useEffect(() => {
    localStorage.setItem("r_office_bills", JSON.stringify(bills));
  }, [bills]);

  // Otp timer
  useEffect(() => {
    let timer: any;
    if (otpCounter > 0) {
      timer = setTimeout(() => setOtpCounter(otpCounter - 1), 1000);
    } else if (otpCounter === 0 && otpSent) {
      setOtpSent(false);
    }
    return () => clearTimeout(timer);
  }, [otpCounter, otpSent]);

  // Detect bill type based on Bill ID
  useEffect(() => {
    if (billId.length >= 2) {
      const code = billId.slice(-2, -1) || billId.slice(-1);
      switch (code) {
        case "1":
          setBillType("water");
          break;
        case "2":
          setBillType("electricity");
          break;
        case "3":
          setBillType("gas");
          break;
        case "4":
          setBillType("phone");
          break;
        case "5":
          setBillType("mobile");
          break;
        case "6":
          setBillType("municipality");
          break;
        case "7":
          setBillType("judicial");
          break;
        default:
          break;
      }
    }
  }, [billId]);

  const handleAddBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !billId.trim() || !paymentId.trim() || !amountStr.trim() || !dueDate.trim()) {
      alert("لطفاً تمام فیلدهای ستاره‌دار را تکمیل فرمایید.");
      return;
    }

    const cleanAmount = parseInt(amountStr.replace(/,/g, ""), 10);
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      alert("مبلغ وارد شده معتبر نمی‌باشد.");
      return;
    }

    const now = getCurrentJalali();
    const nowStr = formatJalaliDate(now.jy, now.jm, now.jd);

    const newBill: BillItem = {
      id: "bill_" + Date.now(),
      type: billType,
      title: title.trim(),
      billId: toPersianDigits(billId),
      paymentId: toPersianDigits(paymentId),
      amount: cleanAmount,
      status: "pending",
      dueDate: toPersianDigits(dueDate),
      createdAt: nowStr
    };

    setBills([newBill, ...bills]);
    setIsAdding(false);

    // Reset Form
    setTitle("");
    setBillId("");
    setPaymentId("");
    setAmountStr("");
    setDueDate("");
  };

  const handleDeleteBill = (id: string) => {
    if (window.confirm("آیا از حذف این قبض خدماتی دفتری اطمینان دارید؟")) {
      setBills(bills.filter(b => b.id !== id));
    }
  };

  const handleOpenGateway = (bill: BillItem) => {
    setSelectedBillForPay(bill);
    setCardNumber("");
    setCvv2("");
    setExpiryMonth("");
    setExpiryYear("");
    setDynamicOtp("");
    setOtpSent(false);
    setOtpCounter(0);
    setGatewayError("");
    setGatewaySuccess(false);
    setIsPaying(false);
  };

  const handleRequestOtp = () => {
    if (cardNumber.length < 16) {
      setGatewayError("لطفاً شماره کارت ۱۶ رقمی خود را به طور کامل وارد کنید.");
      return;
    }
    setOtpSent(true);
    setOtpCounter(120); // 2 minutes
    setGatewayError("");
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    alert(`[بانک شبیه‌ساز] رمز پویای شما با موفقیت پیامک گردید:\nکد تایید: ${randomOtp}`);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvv2 || !expiryMonth || !expiryYear || !dynamicOtp) {
      setGatewayError("لطفاً تمام اطلاعات امنیتی کارت بانکی را تکمیل فرمایید.");
      return;
    }

    setIsPaying(true);
    setGatewayError("");

    setTimeout(() => {
      const trackingCode = "TR-" + Math.floor(100000 + Math.random() * 900000);
      setGeneratedTrackingCode(toPersianDigits(trackingCode));
      setGatewaySuccess(true);
      setIsPaying(false);

      const now = getCurrentJalali();
      const nowStr = formatJalaliDate(now.jy, now.jm, now.jd);

      // Update state
      setBills(bills.map(b => {
        if (b.id === selectedBillForPay?.id) {
          return {
            ...b,
            status: "paid",
            paidDate: nowStr,
            trackingCode: toPersianDigits(trackingCode)
          };
        }
        return b;
      }));
    }, 1500);
  };

  const getBillIcon = (type: BillItem["type"]) => {
    switch (type) {
      case "water":
        return <Droplet className="w-5 h-5 text-blue-500" />;
      case "electricity":
        return <Zap className="w-5 h-5 text-amber-500" />;
      case "gas":
        return <Flame className="w-5 h-5 text-orange-500" />;
      case "phone":
        return <Phone className="w-5 h-5 text-teal-500" />;
      case "mobile":
        return <Smartphone className="w-5 h-5 text-emerald-500" />;
      case "municipality":
        return <Building className="w-5 h-5 text-purple-500" />;
      case "judicial":
        return <Scale className="w-5 h-5 text-indigo-500" />;
    }
  };

  const getBillTypeText = (type: BillItem["type"]) => {
    switch (type) {
      case "water": return "قبض آب";
      case "electricity": return "قبض برق";
      case "gas": return "قبض گاز";
      case "phone": return "تلفن ثابت";
      case "mobile": return "تلفن همراه";
      case "municipality": return "عوارض شهرداری";
      case "judicial": return "خدمات الکترونیک قضایی / عدل ایران";
    }
  };

  // Calculations
  const pendingBills = bills.filter(b => b.status === "pending");
  const paidBills = bills.filter(b => b.status === "paid");
  const totalPendingAmount = pendingBills.reduce((sum, b) => sum + b.amount, 0);
  const totalPaidAmount = paidBills.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-950 text-white rounded-3xl p-6 border border-amber-500/20 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full w-fit border border-amber-500/20 text-[10px] font-black uppercase">
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>مدیریت و پرداخت برخط قبوض خدماتی و قضایی</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white mt-3">
            پرداخت قبوض
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 font-medium">
            تأدیه هزینه‌های دادرسی دادگاه، تعرفه روزنامه رسمی، حق اشتراک ثنا، شارژ ماهانه تلفن، آب، برق و گاز با شبیه‌ساز درگاه ملی شتاب
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 select-none shrink-0 cursor-pointer transition active:scale-95 shadow-md shadow-amber-500/10"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>ثبت قبض جدید</span>
        </button>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl shadow-sm text-right space-y-2">
          <span className="text-[10px] font-bold text-slate-400">تعداد قبوض معوقه (در انتظار پرداخت)</span>
          <h3 className="text-xl font-black text-slate-800 font-mono">
            {toPersianDigits(pendingBills.length)} <span className="text-xs font-sans">عدد</span>
          </h3>
          <p className="text-[10px] text-amber-600 font-bold">
            بدهی کل معوقه: {toPersianDigits(totalPendingAmount.toLocaleString())} تومان
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200/50 p-5 rounded-3xl shadow-sm text-right space-y-2">
          <span className="text-[10px] font-bold text-emerald-600">قبوض پرداخت و تسویه شده</span>
          <h3 className="text-xl font-black text-emerald-950 font-mono">
            {toPersianDigits(paidBills.length)} <span className="text-xs font-sans">قبض</span>
          </h3>
          <p className="text-[10px] text-emerald-600 font-bold">
            مجموع تسویه شده: {toPersianDigits(totalPaidAmount.toLocaleString())} تومان
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200/50 p-5 rounded-3xl shadow-sm text-right space-y-2">
          <span className="text-[10px] font-bold text-amber-700">کل قبوض دوره جاری دفتری</span>
          <h3 className="text-xl font-black text-slate-800 font-mono">
            {toPersianDigits(bills.length)} <span className="text-xs font-sans">تراکنش</span>
          </h3>
          <p className="text-[10px] text-slate-500 font-bold">
            کل مبالغ دوره: {toPersianDigits((totalPendingAmount + totalPaidAmount).toLocaleString())} تومان
          </p>
        </div>
      </div>

      {/* Add New Bill Form */}
      {isAdding && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-amber-500/35 rounded-3xl p-6 shadow-md"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-500" />
              ثبت قبض خدماتی / قضایی جدید
            </h3>
            <button
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
            >
              بستن فرم
            </button>
          </div>

          <form onSubmit={handleAddBill} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-bold text-slate-700">
              <div className="space-y-1.5">
                <label className="block">نوع قبض / سرویس خدماتی:</label>
                <select
                  value={billType}
                  onChange={(e) => setBillType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2.5 outline-none font-bold text-slate-800"
                >
                  <option value="judicial">قوه قضاییه (ثنا / عدل ایران)</option>
                  <option value="phone">تلفن ثابت دفتر</option>
                  <option value="mobile">تلفن همراه وکیل</option>
                  <option value="electricity">برق</option>
                  <option value="water">آب</option>
                  <option value="gas">گاز</option>
                  <option value="municipality">عوارض شهرداری</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block">عنوان قبض / بابت کدام ردیف دفتری؟ *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2.5 outline-none font-bold text-slate-800"
                  placeholder="مثال: قبض اینترنت دفتر - دوره بهار"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block">شناسه قبض (Bill ID) *</label>
                <input
                  type="text"
                  value={billId}
                  onChange={(e) => setBillId(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2.5 outline-none font-mono font-bold text-slate-800 text-left"
                  placeholder="وارد کردن شناسه قبض"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block">شناسه پرداخت (Payment ID) *</label>
                <input
                  type="text"
                  value={paymentId}
                  onChange={(e) => setPaymentId(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2.5 outline-none font-mono font-bold text-slate-800 text-left"
                  placeholder="وارد کردن شناسه پرداخت"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block">مبلغ قبض (تومان) *</label>
                <input
                  type="text"
                  value={amountStr}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    setAmountStr(clean ? Number(clean).toLocaleString() : "");
                  }}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2.5 outline-none font-mono font-bold text-slate-800 text-left"
                  placeholder="مثال: ۵۰۰,۰۰۰"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block">مهلت نهایی پرداخت (به شمسی) *</label>
                <input
                  type="text"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-xl px-3.5 py-2.5 outline-none font-bold text-slate-800 text-center"
                  placeholder="مثال: ۱۴۰۵/۰۵/۰۵"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs cursor-pointer active:scale-95 transition"
              >
                ثبت تعهد قبض دفتری
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs cursor-pointer transition"
              >
                انصراف
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Tabs list to filter paid and pending */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition ${
              activeTab === "pending"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            قبوض پرداخت نشده ({toPersianDigits(pendingBills.length)})
          </button>
          <button
            onClick={() => setActiveTab("paid")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition ${
              activeTab === "paid"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            قبوض تسویه شده ({toPersianDigits(paidBills.length)})
          </button>
        </div>

        {/* Bills list */}
        <div className="space-y-3">
          {(activeTab === "pending" ? pendingBills : paidBills).length === 0 ? (
            <div className="text-center py-10 space-y-2 bg-slate-50 rounded-2xl border border-slate-100">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-black text-slate-500">هیچ قبضی در این بخش یافت نشد.</p>
              <p className="text-[10px] text-slate-400">از دکمه بالا برای اضافه کردن قبوض استفاده فرمایید.</p>
            </div>
          ) : (
            (activeTab === "pending" ? pendingBills : paidBills).map(bill => (
              <div
                key={bill.id}
                className="p-4 rounded-2xl border border-slate-150 hover:border-slate-300 hover:shadow-sm bg-white transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-right"
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                    {getBillIcon(bill.type)}
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-150">
                        {getBillTypeText(bill.type)}
                      </span>
                      <h4 className="text-xs font-black text-slate-800 truncate">{bill.title}</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[10px] font-bold text-slate-500 pt-1">
                      <span>شناسه قبض: <strong className="font-mono">{bill.billId}</strong></span>
                      <span>شناسه پرداخت: <strong className="font-mono">{bill.paymentId}</strong></span>
                      <span className="font-sans">مهلت نهایی: {bill.dueDate}</span>
                    </div>

                    {bill.status === "paid" && (
                      <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-emerald-600 bg-emerald-500/5 border border-emerald-500/10 p-2 rounded-xl mt-2">
                        <span>پرداخت شده در تاریخ: {bill.paidDate}</span>
                        <span>کد پیگیری تراکنش: <strong className="font-mono">{bill.trackingCode}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-3 w-full md:w-auto border-t md:border-0 pt-3 md:pt-0 border-slate-100 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-bold">مبلغ قبض:</p>
                    <p className="text-sm font-black text-slate-800 font-mono">
                      {toPersianDigits(bill.amount.toLocaleString())} <span className="text-[10px] font-sans">تومان</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {bill.status === "pending" ? (
                      <button
                        onClick={() => handleOpenGateway(bill)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-[10px] flex items-center gap-1.5 cursor-pointer active:scale-95 transition shadow-sm shadow-emerald-700/10"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>پرداخت برخط قبض</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          alert(`رسید پرداخت قبض الکترونیک:\n\nعنوان: ${bill.title}\nتاریخ پرداخت: ${bill.paidDate}\nکد رهگیری تراکنش: ${bill.trackingCode}\nمبلغ: ${toPersianDigits(bill.amount.toLocaleString())} تومان\nپورتال وکالتی هوشمند`);
                        }}
                        className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold border border-slate-200 rounded-xl text-[10px] flex items-center gap-1 cursor-pointer transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>چاپ رسید</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteBill(bill.id)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl transition cursor-pointer"
                      title="حذف قبض"
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

      {/* Shape/Saman Bank Payment Gateway Simulator Modal */}
      <AnimatePresence>
        {selectedBillForPay && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[200] animate-in fade-in duration-200" dir="ltr">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-slate-50 rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Shaparak / Saman Header */}
              <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-5 flex items-center justify-between text-left">
                <div className="flex items-center gap-2.5">
                  <div className="bg-white/10 p-2 rounded-2xl">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black tracking-wider uppercase">Saman Electronic Payment</h3>
                    <p className="text-[9px] text-indigo-200 font-bold">شبیه‌ساز درگاه پرداخت الکترونیک بانک سامان (شاپرک)</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBillForPay(null)}
                  className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Gateway Body */}
              <div className="p-6 space-y-5">
                {gatewaySuccess ? (
                  /* Success Screen */
                  <div className="text-center py-6 space-y-4 animate-in zoom-in duration-300 text-right" dir="rtl">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 mx-auto">
                      <CheckCircle2 className="w-8 h-8 font-bold" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-800">تراکنش با موفقیت انجام شد!</h4>
                      <p className="text-[10px] text-slate-400 font-bold">مبلغ قبض با موفقیت از کارت شما کسر و ثبت گردید.</p>
                    </div>

                    <div className="bg-white border border-slate-200 p-4 rounded-3xl space-y-2 text-xs font-bold text-slate-600 max-w-sm mx-auto">
                      <div className="flex justify-between">
                        <span>نوع تراکنش:</span>
                        <span className="text-slate-800 font-black">پرداخت قبض دفتری</span>
                      </div>
                      <div className="flex justify-between">
                        <span>عنوان قبض:</span>
                        <span className="text-slate-800 font-black">{selectedBillForPay.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>کد پیگیری تراکنش:</span>
                        <span className="text-emerald-700 font-mono font-black">{generatedTrackingCode}</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span>مبلغ پرداخت شده:</span>
                        <span className="text-slate-900 font-black">{toPersianDigits(selectedBillForPay.amount.toLocaleString())} تومان</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedBillForPay(null)}
                      className="w-full max-w-sm mx-auto py-3 bg-slate-900 hover:bg-slate-950 text-white font-black rounded-xl text-xs transition cursor-pointer"
                    >
                      تایید و بازگشت به پورتال
                    </button>
                  </div>
                ) : (
                  /* Payment Form */
                  <form onSubmit={handleProcessPayment} className="space-y-4 text-right" dir="rtl">
                    {gatewayError && (
                      <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-[10px] font-black text-center flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{gatewayError}</span>
                      </div>
                    )}

                    {/* Receipt Summary Card */}
                    <div className="bg-slate-100/80 border border-slate-200 p-4 rounded-3xl flex justify-between items-center text-xs font-bold">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 block font-bold">مبلغ قابل کسر از کارت:</span>
                        <span className="text-slate-800 font-black font-mono text-sm">{toPersianDigits(selectedBillForPay.amount.toLocaleString())} <small className="font-sans text-[10px]">تومان</small></span>
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] text-slate-400 block font-bold">بابت قبض:</span>
                        <span className="text-slate-800 font-black truncate max-w-[180px] inline-block">{selectedBillForPay.title}</span>
                      </div>
                    </div>

                    {/* Form Inputs */}
                    <div className="space-y-3.5 text-xs font-bold text-slate-700">
                      {/* Card Number */}
                      <div className="space-y-1.5">
                        <label className="block text-slate-500">شماره کارت ۱۶ رقمی شتاب: *</label>
                        <div className="relative">
                          <CreditCard className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            maxLength={16}
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
                            className="w-full bg-white border border-slate-200 focus:border-indigo-600 rounded-xl pr-10 pl-3.5 py-2.5 outline-none font-mono font-black text-slate-800 tracking-[0.25em]"
                            placeholder="6037991122334455"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* CVV2 */}
                        <div className="space-y-1.5">
                          <label className="block text-slate-500">کد امنیتی CVV2: *</label>
                          <input
                            type="password"
                            maxLength={4}
                            value={cvv2}
                            onChange={(e) => setCvv2(e.target.value.replace(/\D/g, ""))}
                            className="w-full bg-white border border-slate-200 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 outline-none font-mono font-black text-slate-800 text-center tracking-widest"
                            placeholder="•••"
                          />
                        </div>

                        {/* Expiry Date */}
                        <div className="space-y-1.5">
                          <label className="block text-slate-500">تاریخ انقضا: *</label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              type="text"
                              maxLength={2}
                              value={expiryMonth}
                              onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, ""))}
                              className="bg-white border border-slate-200 focus:border-indigo-600 rounded-xl py-2.5 outline-none font-mono font-black text-slate-800 text-center"
                              placeholder="ماه"
                            />
                            <input
                              type="text"
                              maxLength={2}
                              value={expiryYear}
                              onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, ""))}
                              className="bg-white border border-slate-200 focus:border-indigo-600 rounded-xl py-2.5 outline-none font-mono font-black text-slate-800 text-center"
                              placeholder="سال"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Dynamic OTP */}
                      <div className="space-y-1.5">
                        <label className="block text-slate-500">رمز دوم پویا: *</label>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            maxLength={8}
                            value={dynamicOtp}
                            onChange={(e) => setDynamicOtp(e.target.value.replace(/\D/g, ""))}
                            className="flex-1 bg-white border border-slate-200 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 outline-none font-mono font-black text-slate-800 text-center tracking-wider"
                            placeholder="رمز پویا را وارد کنید"
                          />
                          <button
                            type="button"
                            onClick={handleRequestOtp}
                            disabled={otpSent}
                            className={`px-4 rounded-xl text-[10px] font-black cursor-pointer transition flex items-center justify-center gap-1 border select-none shrink-0 ${
                              otpSent
                                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                : "bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100"
                            }`}
                          >
                            <Timer className="w-3.5 h-3.5" />
                            <span>
                              {otpSent
                                ? `دریافت مجدد (${toPersianDigits(otpCounter)})`
                                : "درخواست رمز پویا"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3">
                      <button
                        type="submit"
                        disabled={isPaying}
                        className="flex-1 py-3 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-800/10 active:scale-98 transition disabled:opacity-50"
                      >
                        {isPaying ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>در حال برقراری تراکنش...</span>
                          </>
                        ) : (
                          <>
                            <Wallet className="w-4 h-4" />
                            <span>تایید نهایی و پرداخت</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedBillForPay(null)}
                        className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs cursor-pointer transition"
                      >
                        انصراف
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
