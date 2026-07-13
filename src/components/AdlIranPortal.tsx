export default function AdlIranPortal() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <h2 className="text-xl font-bold text-white mb-4">سامانه عدل ایران</h2>
      <p className="text-slate-400 mb-6">برای دسترسی به خدمات قضایی، لطفاً به وب‌سایت رسمی عدل ایران مراجعه کنید.</p>
      <button
        onClick={() => window.open("https://adliran.ir", "_blank")}
        className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition"
      >
        ورود به سایت عدل ایران
      </button>
    </div>
  );
}
