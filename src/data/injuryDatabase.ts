export interface InjuryItem {
  id: string;
  category: string;
  name: string;
  percentage: number;
}

export const INJURY_DATABASE: InjuryItem[] = [
  // جراحات سر و صورت
  { id: "h1", category: "جراحات سر و صورت", name: "حارصه سر و صورت (خراش پوست بدون جریان خون - ۱٪) - ماده ۷۰۹", percentage: 1 },
  { id: "h2", category: "جراحات سر و صورت", name: "دامیه سر و صورت (زخم با جریان خون کم - ۲٪) - ماده ۷۰۹", percentage: 2 },
  { id: "h3", category: "جراحات سر و صورت", name: "متلاحمه سر و صورت (بریدگی عمیق گوشت - ۳٪) - ماده ۷۰۹", percentage: 3 },
  { id: "h4", category: "جراحات سر و صورت", name: "سمحاق سر و صورت (جراحت مماس بر غشای استخوان - ۴٪) - ماده ۷۰۹", percentage: 4 },
  { id: "h5", category: "جراحات سر و صورت", name: "موضحه سر و صورت (نمایان شدن استخوان - ۵٪) - ماده ۷۰۹", percentage: 5 },
  { id: "h6", category: "جراحات سر و صورت", name: "هاشمه سر و صورت (شکستن استخوان بدون جابجایی - ۱۰٪) - ماده ۷۰۹", percentage: 10 },
  { id: "h7", category: "جراحات سر و صورت", name: "منقله سر و صورت (شکستگی همراه با جابجایی استخوان - ۱۵٪) - ماده ۷۰۹", percentage: 15 },
  { id: "h8", category: "جراحات سر و صورت", name: "مامومه سر و صورت (جراحت منتهی به کیسه مغز - ۳۳/۳۳۳۳٪) - ماده ۷۰۹", percentage: 33.3333 },
  { id: "h9", category: "جراحات سر و صورت", name: "دامغه سر و صورت (جراحت با پارگی کیسه مغز - ۳۳/۳۳۳۳٪ به علاوه ارش) - ماده ۷۰۹", percentage: 33.3333 },

  // قواعد کلی شکستن اعضاء و استخوان
  { id: "g1_break_fix_perfect", category: "قواعد کلی شکستن اعضاء و استخوان", name: "شکستن عضوی که دارای مقدار دیه است، چنانچه بعد از جنایت به گونه‌ای اصلاح شود که هیچ عیب و نقصی در آن باقی نماند (چهار بیست و پنجم دیه آن عضو - ۱۶٪) - ماده ۵۶۹", percentage: 16 },
  { id: "g1_break_fix_defect", category: "قواعد کلی شکستن اعضاء و استخوان", name: "شکستن عضوی که دارای مقدار دیه است، چنانچه بعد از جنایت با عیب و نقص اصلاح شود یا دیه مقدر نداشته باشد (ارش) - ماده ۵۶۹", percentage: 20 },
  { id: "g1_break_member", category: "قواعد کلی شکستن اعضاء و استخوان", name: "شکستن هر عضو (یک پنجم دیه آن عضو - ۲۰٪) - ماده ۵۶۹", percentage: 20 },
  { id: "g1_break_member_healed", category: "قواعد کلی شکستن اعضاء و استخوان", name: "شکستن هر عضو که بدون عیب درمان شود (چهار پنجم از یک پنجم دیه آن عضو - ۱۶٪) - ماده ۵۶۹", percentage: 16 },
  { id: "g1_crush_member", category: "قواعد کلی شکستن اعضاء و استخوان", name: "خرد شدن استخوان هر عضو (یک سوم دیه آن عضو - ۳۳/۳۳۳۳٪) - ماده ۵۶۹", percentage: 33.3333 },
  { id: "g1_crush_member_healed", category: "قواعد کلی شکستن اعضاء و استخوان", name: "خرد شدن استخوان هر عضو که بدون عیب درمان شود (چهار پنجم از یک سوم دیه آن عضو - ۲۶.۶٪) - ماده ۵۶۹", percentage: 26.6 },
  { id: "g1_crack_member", category: "قواعد کلی شکستن اعضاء و استخوان", name: "ترک برداشتن استخوان هر عضو (چهار پنجم دیه شکستن آن عضو - ۱۶٪) - ماده ۵۶۹", percentage: 16 },
  { id: "g1_pierce_member", category: "قواعد کلی شکستن اعضاء و استخوان", name: "جراحتی که به استخوان نفوذ کند بدون آنکه موجب شکستگی آن گردد (یک چهارم دیه شکستگی آن عضو - ۵٪) - ماده ۵۶۹", percentage: 5 },
  { id: "g1_multiple_breaks", category: "قواعد کلی شکستن اعضاء و استخوان", name: "هرگاه یک استخوان از چند نقطه جدای از هم بشکند یا خرد شود یا ترک بخورد، در صورتی که عرفاً جنایت‌های متعدد محسوب گردد (هر یک دیه جداگانه دارد) - ماده ۵۶۹", percentage: 20 },
  { id: "g1_dislocation", category: "قواعد کلی شکستن اعضاء و استخوان", name: "دررفتگی استخوان از مفصل، در صورتی که موجب شلل یا ازکارافتادگی کامل عضو نگردد (ارش) - تبصره ماده ۵۶۹", percentage: 10 },
  
  // قواعد جراحات سر و صورت
  { id: "b1", category: "جراحات سر و صورت", name: "حارصه بدن (خراش پوست بدن بدون جریان خون - ۰.۵٪) - ماده ۷۱۰", percentage: 0.5 },
  { id: "b2", category: "جراحات سر و صورت", name: "دامیه بدن (زخم با جریان خون کم روی بدن - ۱٪) - ماده ۷۱۰", percentage: 1 },
  { id: "b3", category: "جراحات سر و صورت", name: "متلاحمه بدن (بریدگی عمیق گوشت روی بدن - ۱.۵٪) - ماده ۷۱۰", percentage: 1.5 },
  { id: "b4", category: "جراحات سر و صورت", name: "سمحاق بدن (جراحت مماس بر غشای استخوان بدن - ۲٪) - ماده ۷۱۰", percentage: 2 },
  { id: "b5", category: "جراحات سر و صورت", name: "موضحه بدن (نمایان شدن استخوان روی بدن - ۲.۵٪) - ماده ۷۱۰", percentage: 2.5 },
  { id: "b6", category: "جراحات سر و صورت", name: "هاشمه بدن (شکستن استخوان بدن بدون جابجایی - ۵٪) - ماده ۷۱۰", percentage: 5 },
  { id: "b7", category: "جراحات سر و صورت", name: "منقله بدن (شکستگی بدن همراه با جابجایی استخوان - ۷.۵٪) - ماده ۷۱۰", percentage: 7.5 },
  { id: "b_mamoomeh", category: "جراحات سر و صورت", name: "مامومه بدن (جراحت منتهی به کیسه مغز در بدن - ۱۶.۵٪) - ماده ۷۱۰", percentage: 16.5 },

  // جراحتی که به درون بدن انسان وارد می شود
  { id: "b8", category: "جراحتی که به درون بدن انسان وارد می شود", name: "جائفه (جراحت نفوذی به قفسه سینه یا شکم - ۳۳/۳۳۳۳٪) - ماده ۷۱۳", percentage: 33.3333 },

  // جراحتی که در اعضاء انسان فرو می رود
  { id: "b9", category: "جراحتی که در اعضاء انسان فرو می رود", name: "نافذ در اعضا (سوراخ شدن عضو یا جراحت نافذ - ۱۰٪) - ماده ۷۱۳", percentage: 10 },
  { id: "b_nafez_double", category: "جراحتی که در اعضاء انسان فرو می رود", name: "جراحت نافذ دو طرفه در اعضا (عبور کامل سلاح از عضو - ۱۶/۶۶۶۷٪) - تبصره ماده ۷۱۳", percentage: 16.6667 },

  // مو
  { id: "a1_hair_m_no", category: "مو", name: "کندن و یا از بین بردن تمام موی سر یا ریش مرد در صورتی که دیگر نروید (۱۰۰٪) - ماده ۵۷۶", percentage: 100 },
  { id: "a1_hair_m_yes", category: "مو", name: "کندن و یا از بین بردن تمام موی سر مرد در صورتی که دوباره بروید (ارش) - ماده ۵۷۶", percentage: 10 },
  { id: "a1_beard_yes", category: "مو", name: "کندن و یا از بین بردن تمام ریش مرد در صورتی که دوباره بروید (یک سوم دیه کامل - ۳۳/۳۳۳۳٪) - ماده ۵۷۶", percentage: 33.3333 },
  { id: "a1_hair_f_no", category: "مو", name: "کندن و یا از بین بردن تمام موی سر زن در صورتی که دیگر نروید (۱۰۰٪) - ماده ۵۷۷", percentage: 100 },
  { id: "a1_hair_f_yes", category: "مو", name: "کندن و یا از بین بردن تمام موی سر زن در صورتی که دوباره بروید (مهرالمثل) - ماده ۵۷۷", percentage: 100 },
  { id: "a1_hair_partial", category: "مو", name: "قسمتی از موی سر مرد یا زن یا ریش مرد طوری از بین برود که دیگر نروید (به نسبت مساحت) - ماده ۵۷۸", percentage: 20 },
  { id: "a1_hair_m_partial_regrow", category: "مو", name: "چنانچه قسمتی از موی سر مرد از بین برود، اگر دوباره بروید (ارش) - ماده ۵۷۸", percentage: 5 },
  { id: "a1_beard_partial_regrow", category: "مو", name: "چنانچه قسمتی از ریش مرد از بین برود، اگر دوباره بروید (یک سوم دیه کامل به نسبت مساحت) - ماده ۵۷۸", percentage: 15 },
  { id: "a1_hair_f_partial_regrow", category: "مو", name: "چنانچه قسمتی از موی سر زن از بین برود، اگر دوباره بروید (مهرالمثل به نسبت مساحت) - ماده ۵۷۸", percentage: 20 },
  { id: "a1_hair_expert_diff_1", category: "مو", name: "چنانچه نظر کارشناس بر نروییدن مو باشد و دیه پرداخت شود ولی خلاف آن ثابت شود (دیه مسترد و ارش پرداخت می‌شود) - ماده ۵۷۹", percentage: 10 },
  { id: "a1_hair_expert_diff_2", category: "مو", name: "چنانچه نظر کارشناس بر روییدن باشد و ارش یا یک سوم دیه و یا مهرالمثل پرداخت شود ولی خلاف نظر او ثابت شود (دیه مسترد و مابه‌التفاوت پرداخت می‌شود) - ماده ۵۷۹", percentage: 90 },
  { id: "a1_eyebrow_loss", category: "مو", name: "کندن و یا از بین بردن هر یک از ابروهای مرد یا زن (بدون رضایت...) - ماده ۵۸۰", percentage: 25 },

  // چشم
  { id: "a1_eye_one", category: "چشم", name: "نابینا کردن یا تخلیه یک چشم بینا (۵۰٪) - ماده ۵۸۷", percentage: 50 },
  { id: "a1_eye_both", category: "چشم", name: "نابینا کردن یا تخلیه هر دو چشم بینا (۱۰۰٪) - ماده ۵۸۷", percentage: 100 },
  { id: "a1_eye_blind_one", category: "چشم", name: "درآوردن یا از بین بردن یک چشم نابینا (۱۶/۶۶۶۷٪) - ماده ۵۸۹", percentage: 16.6667 },
  { id: "a1_eyelid_upper", category: "چشم", name: "از بین بردن یک پلک بالا (۱۶/۶۶۶۷٪) - ماده ۵۹۰", percentage: 16.6667 },
  { id: "a1_eyelid_lower", category: "چشم", name: "از بین بردن یک پلک پایین (۲۵٪) - ماده ۵۹۰", percentage: 25 },
  { id: "a1_eyelids_all", category: "چشم", name: "از بین بردن چهار پلک دو چشم (۱۰۰٪) - ماده ۵۹۰", percentage: 100 },
  { id: "a1_eyelid_upper_split", category: "چشم", name: "شکافتن یک پلک بالا بدون بهبود کامل (۱۶/۶۶۶۷٪) - ماده ۵۹۱", percentage: 16.6667 },
  { id: "a1_eyelid_upper_split_healed", category: "چشم", name: "شکافتن یک پلک بالا با بهبود کامل بدون عیب (۱۰٪) - ماده ۵۹۱", percentage: 10 },
  { id: "a1_eyelid_lower_split", category: "چشم", name: "شکافتن یک پلک پایین بدون بهبود کامل (۲۵٪) - ماده ۵۹۱", percentage: 25 },
  { id: "a1_eyelid_lower_split_healed", category: "چشم", name: "شکافتن یک پلک پایین با بهبود کامل بدون عیب (۶/۶۶۶۷٪) - ماده ۵۹۱", percentage: 6.6667 },
  { id: "a1_eyelashes_lost", category: "چشم", name: "از بین بردن مژه‌های چهار پلک به صورت دائم (ارش) - ماده ۵۹۱", percentage: 15 },

  // بینی
  { id: "a1_nose_all", category: "بینی", name: "قطع کامل بینی یا نرمه پایین استخوان آن (۱۰۰٪) - ماده ۵۹۲", percentage: 100 },
  { id: "a1_nose_break_corrupted", category: "بینی", name: "شکستن استخوان بینی با ایجاد فساد و از بین رفتن آن (۱۰۰٪) - ماده ۵۹۳", percentage: 100 },
  { id: "a1_nose_break_healed", category: "بینی", name: "شکستن استخوان بینی با بهبود کامل بدون عیب (۱۰٪) - ماده ۵۹۳", percentage: 10 },
  { id: "a1_nose_break_defect", category: "بینی", name: "شکستن استخوان بینی با بهبود همراه با عیب دائم (ارش) - ماده ۵۹۳", percentage: 15 },
  { id: "a1_nose_wing_one", category: "بینی", name: "از بین بردن یک پره بینی (۳۳/۳۳۳۳٪) - ماده ۵۹۴", percentage: 33.3333 },
  { id: "a1_nose_septum", category: "بینی", name: "از بین بردن پرده میان دو سوراخ بینی (۳۳/۳۳۳۳٪) - ماده ۵۹۴", percentage: 33.3333 },
  { id: "a1_nose_paralysis", category: "بینی", name: "فلج کردن بینی (۶۶/۶۶۶۶٪) - ماده ۵۹۵", percentage: 66.6666 },
  { id: "a1_nose_paralyzed_cut", category: "بینی", name: "قطع کردن بینی فلج (۳۳/۳۳۳۳٪) - ماده ۵۹۵", percentage: 33.3333 },
  { id: "a1_nose_tear_no_heal", category: "بینی", name: "پاره کردن بینی بدون بهبود کامل (۳۳/۳۳۳۳٪) - ماده ۵۹۶", percentage: 33.3333 },
  { id: "a1_nose_tear_healed", category: "بینی", name: "پاره کردن بینی با بهبود کامل بدون عیب (۱۰٪) - ماده ۵۹۶", percentage: 10 },
  { id: "a1_nose_pierce_both_unhealed", category: "بینی", name: "سوراخ کردن هر دو طرف بینی و پرده وسط آن بدون بهبود (۱۰۰٪) - ماده ۵۹۷ بند الف", percentage: 100 },
  { id: "a1_nose_pierce_both_healed", category: "بینی", name: "سوراخ کردن هر دو طرف بینی و پرده وسط آن با بهبود کامل (۲۰٪) - ماده ۵۹۷ بند الف", percentage: 20 },
  { id: "a1_nose_pierce_one", category: "بینی", name: "سوراخ کردن یک طرف بینی بدون بهبود (۱۱/۱۱۱۱٪) - ماده ۵۹۷ بند ب", percentage: 11.1111 },
  { id: "a1_nose_pierce_one_healed", category: "بینی", name: "سوراخ کردن یک طرف بینی با بهبود کامل (۵٪) - ماده ۵۹۷ بند ب", percentage: 5 },
  { id: "a1_nose_pierce_one_with_septum_unhealed", category: "بینی", name: "سوراخ کردن یک طرف بینی با پرده وسط بدون بهبود (۲۲.۲٪) - ماده ۵۹۷ بند پ", percentage: 22.2 },
  { id: "a1_nose_pierce_one_with_septum_healed", category: "بینی", name: "سوراخ کردن یک طرف بینی با پرده وسط با بهبود کامل (۱۰٪) - ماده ۵۹۷ بند پ", percentage: 10 },
  { id: "a1_nose_pierce_septum_only_unhealed", category: "بینی", name: "سوراخ کردن پرده وسط بینی بدون بهبود (۱۱/۱۱۱۱٪) - ماده ۵۹۷ بند ت", percentage: 11.1111 },
  { id: "a1_nose_pierce_septum_only_healed", category: "بینی", name: "سوراخ کردن پرده وسط بینی با بهبود کامل (۵٪) - ماده ۵۹۷ بند ت", percentage: 5 },
  { id: "a1_nose_pierce_one_no_septum", category: "بینی", name: "سوراخ کردن یک طرف بینی بدون سوراخ شدن پرده وسط (۵٪) - تبصره ماده ۵۹۷", percentage: 5 },
  { id: "a1_nose_pierce_both_no_septum", category: "بینی", name: "سوراخ کردن دو طرف بینی بدون سوراخ شدن پرده وسط (۱۰٪) - تبصره ماده ۵۹۷", percentage: 10 },
  { id: "a1_nose_tip", category: "بینی", name: "از بین بردن نوک بینی (محل چکیدن خون - ۵۰٪) - ماده ۵۹۹", percentage: 50 },

  // لاله گوش
  { id: "a1_ear_both_loss", category: "لاله گوش", name: "از بین بردن دو لاله گوش (۱۰۰٪) - ماده ۶۰۰", percentage: 100 },
  { id: "a1_ear_one_loss", category: "لاله گوش", name: "از بین بردن هر یک از دو لاله گوش (۵۰٪) - ماده ۶۰۰", percentage: 50 },
  { id: "a1_ear_lobe_loss", category: "لاله گوش", name: "از بین بردن نرمه هر گوش (یک ششم دیه کامل - ۱۶/۶۶۶۷٪) - ماده ۶۰۰", percentage: 16.6667 },
  { id: "a1_ear_tear_unhealed", category: "لاله گوش", name: "پاره کردن لاله یک گوش (یک ششم دیه کامل - ۱۶/۶۶۶۷٪) - ماده ۶۰۱", percentage: 16.6667 },
  { id: "a1_ear_lobe_tear_unhealed", category: "لاله گوش", name: "پاره کردن نرمه یک گوش (یک نهم دیه کامل - ۱۱/۱۱۱۱٪) - ماده ۶۰۱", percentage: 11.1111 },
  { id: "a1_ear_or_lobe_tear_healed", category: "لاله گوش", name: "پاره کردن لاله یا نرمه گوش در صورت بهبودی (ارش) - تبصره ماده ۶۰۱", percentage: 5 },
  { id: "a1_ear_paralysis_2", category: "لاله گوش", name: "فلج کردن لاله هر گوش (دو سوم دیه آن - ۳۳/۳۳۳۳٪) - ماده ۶۰۲", percentage: 33.3333 },
  { id: "a1_ear_paralyzed_loss", category: "لاله گوش", name: "بریدن لاله گوش فلج شده (یک سوم دیه آن - ۱۶/۶۶۶۷٪) - ماده ۶۰۲", percentage: 16.6667 },
  { id: "a1_ear_drum_tear", category: "لاله گوش", name: "پاره کردن پرده هر گوش (ارش) - ماده ۶۰۵", percentage: 10 },
  { id: "a1_ear_drum_tear_deaf", category: "لاله گوش", name: "اگر در اثر پاره شدن پرده گوش، حس شنوایی از بین برود یا نقصان یابد (دیه شنوایی + دیه پرده گوش) - ماده ۶۰۵", percentage: 60 },
  { id: "a1_ear_cut_to_bone", category: "لاله گوش", name: "هرگاه لاله گوش به نحوی قطع شود که استخوان زیر آن ظاهر گردد (دیه موضحه + دیه لاله گوش) - ماده ۵۹۵", percentage: 55 },

  // لب
  { id: "a1_lip_both_loss", category: "لب", name: "از بین بردن هر دو لب (۱۰۰٪) - ماده ۶۰۷", percentage: 100 },
  { id: "a1_lip_one_loss", category: "لب", name: "از بین بردن هر یک از دو لب (۵۰٪) - ماده ۶۰۷", percentage: 50 },
  { id: "a1_lip_partial_loss", category: "لب", name: "از بین بردن قسمتی از لب (به نسبت) - ماده ۶۰۷", percentage: 25 },
  { id: "a1_lip_contract", category: "لب", name: "جنایتی که باعث جمع شدن یک یا دو لب و یا قسمتی از آن شود خواه موجب نمایان شدن دندان‌ها بشود خواه نشود (ارش) - ماده ۶۰۸", percentage: 15 },
  { id: "a1_lip_paralysis_2", category: "لب", name: "جنایتی که موجب سست و فلج شدن هر یک از لب‌ها به گونه‌ای که با خنده و مانند آن از دندان‌ها کنار نرود (دو سوم دیه یک لب - ۳۳/۳۳۳۳٪) - ماده ۶۰۹", percentage: 33.3333 },
  { id: "a1_lip_paralyzed_loss", category: "لب", name: "از بین بردن هر یک از لب‌های سست و فلج شده (یک سوم دیه آن لب - ۱۶/۶۶۶۷٪) - ماده ۶۰۹", percentage: 16.6667 },
  { id: "a1_lip_split_both_unhealed", category: "لب", name: "شکافتن هر دو لب به نحوی که باعث نمایان شدن دندان‌ها شود در صورتی که قابل بهبودی بدون عیب نباشد (یک سوم دیه کامل - ۳۳/۳۳۳۳٪) - ماده ۶۱۰", percentage: 33.3333 },
  { id: "a1_lip_split_both_healed", category: "لب", name: "شکافتن هر دو لب به نحوی که باعث نمایان شدن دندان‌ها شود در صورت بهبودی بدون عیب (یک پنجم دیه کامل - ۲۰٪) - ماده ۶۱۰", percentage: 20 },
  { id: "a1_lip_split_one_unhealed", category: "لب", name: "شکافتن یک لب به نحوی که باعث نمایان شدن دندان‌ها شود در صورتی که قابل بهبودی بدون عیب نباشد (یک ششم دیه کامل - ۱۶/۶۶۶۷٪) - ماده ۶۱۰", percentage: 16.6667 },
  { id: "a1_lip_split_one_healed_2", category: "لب", name: "شکافتن یک لب به نحوی که باعث نمایان شدن دندان‌ها شود در صورت بهبودی بدون عیب (یک دهم دیه کامل - ۱۰٪) - ماده ۶۱۰", percentage: 10 },

  // زبان
  { id: "a1_tongue_speech_full", category: "زبان", name: "۱. قطع کامل زبان گویای سالم (۱۰۰٪) - ماده ۶۱۱", percentage: 100 },
  { id: "a1_tongue_speech_all_letters", category: "زبان", name: "۲. قطع قسمتی از زبان گویای سالم که موجب زوال کل گویایی و تلفظ تمام حروف شود (۱۰۰٪) - ماده ۶۱۱", percentage: 100 },
  { id: "a1_tongue_speech_partial_letters", category: "زبان", name: "۳. قطع قسمتی از زبان گویای سالم به نسبت حروفی که قدرت تلفظ آنها از بین رفته (به نسبت حروف - ارش - ۲۵٪) - ماده ۶۱۱", percentage: 25 },
  { id: "a1_tongue_mute_full", category: "زبان", name: "۴. قطع کامل زبان غیرگویا یا شخص لال (۳۳/۳۳۳۳٪) - ماده ۶۱۲", percentage: 33.3333 },
  { id: "a1_tongue_mute_partial_area", category: "زبان", name: "۵. قطع قسمتی از زبان شخص لال به نسبت مساحت بخش قطع شده از ثلث دیه (به نسبت مساحت - تا سقف ۳۳/۳۳۳۳٪) - ماده ۶۱۲", percentage: 15 },
  { id: "a1_tongue_make_mute_only", category: "زبان", name: "۶. لال کردن شخص گویا بدون قطع زبان (۱۰۰٪) - ماده ۶۱۴", percentage: 100 },
  { id: "a1_tongue_make_mute_with_cut", category: "زبان", name: "۷. لال کردن شخص گویا همراه با قطع تمام یا قسمتی از زبان (۱۰۰٪) - ماده ۶۱۴ و ۶۱۵", percentage: 100 },
  { id: "a1_tongue_taste_lost_only", category: "زبان", name: "۸. از بین بردن کامل حس چشایی بدون قطع زبان (ارش کامل دائم - ۵۰٪) - ماده ۶۱۳", percentage: 50 },
  { id: "a1_tongue_taste_lost_partial", category: "زبان", name: "۹. از بین بردن قسمتی از حس چشایی بدون قطع زبان (ارش - ۱۵٪) - ماده ۶۱۳", percentage: 15 },
  { id: "a1_tongue_cut_with_taste_lost", category: "زبان", name: "۱۰. قطع قسمتی از زبان با زوال حس چشایی که دیه چشایی بیشتر از مساحت قطع باشد (پرداخت ارش کامل چشایی - ۵۰٪) - ماده ۶۱۵", percentage: 50 },
  { id: "a1_tongue_cut_with_speech_lost", category: "زبان", name: "۱۱. قطع قسمتی از زبان که موجب لال شدن شود و دیه گویایی بیشتر از مساحت قطع شده باشد (پرداخت دیه کامل گویایی - ۱۰۰٪) - ماده ۶۱۵", percentage: 100 },

  // دندان
  { id: "t1_front", category: "دندان", name: "از بین بردن یک دندان پیشین (ثنایا، رباعی، نیش - ۵٪) - ماده ۶۱۶", percentage: 5 },
  { id: "t1_back", category: "دندان", name: "از بین بردن یک دندان عقب (ضواحک، طواحن، نواجذ - ۲.۵٪) - ماده ۶۱۶", percentage: 2.5 },
  { id: "t1_extra_tooth", category: "دندان", name: "از بین بردن دندان اضافی (ارش - ۲.۵٪) - ماده ۶۱۷", percentage: 2.5 },
  { id: "t1_extra_as_main_front", category: "دندان", name: "از بین بردن دندان اضافی روییده به جای دندان اصلی جلو (۵٪) - ماده ۶۱۷", percentage: 5 },
  { id: "t1_extra_as_main_back", category: "دندان", name: "از بین بردن دندان اضافی روییده به جای دندان اصلی عقب (۲.۵٪) - ماده ۶۱۷", percentage: 2.5 },
  { id: "t1_loose_tooth_unhealed", category: "دندان", name: "لق شدن دندان بدون بهبود دائم (ارش - ۲٪) - ماده ۶۱۸", percentage: 2 },
  { id: "t1_loose_tooth_healed", category: "دندان", name: "لق شدن دندان با بهبود کامل بدون عیب (بدون دیه و ارش - ۰٪) - ماده ۶۱۸", percentage: 0 },
  { id: "t1_front_black", category: "دندان", name: "سیاه شدن دندان پیشین بدون شکستگی (۳/۳۳۳۳٪) - ماده ۶۱۹", percentage: 3.3333 },
  { id: "t1_back_black", category: "دندان", name: "سیاه شدن دندان عقب بدون شکستگی (۱/۶۶۶۷٪) - ماده ۶۱۹", percentage: 1.6667 },
  { id: "t1_color_change_not_black", category: "دندان", name: "تغییر رنگ دندان غیر از سیاه شدن آن (ارش - ۱.۵٪) - تبصره ماده ۶۱۹", percentage: 1.5 },
  { id: "t1_front_broken", category: "دندان", name: "شکستن دندان پیشین به طوری که ریشه در لثه بماند (۲.۵٪) - ماده ۶۲۰", percentage: 2.5 },
  { id: "t1_back_broken", category: "دندان", name: "شکستن دندان عقب به طوری که ریشه در لثه بماند (۱.۲۵٪) - ماده ۶۲۰", percentage: 1.25 },
  { id: "t1_front_black_pulled", category: "دندان", name: "کندن دندان سیاه شده پیشین (۱/۶۶۶۷٪) - ماده ۶۲۱", percentage: 1.6667 },
  { id: "t1_back_black_pulled", category: "دندان", name: "کندن دندان سیاه شده عقب (۰.۸۳٪) - ماده ۶۲۱", percentage: 0.83 },
  { id: "t1_crown_destroy_front", category: "دندان", name: "از بین بردن تمام یا قسمتی از تاج دندان پیشین که سیاه نشده (۵٪) - ماده ۶۲۲", percentage: 5 },
  { id: "t1_crown_destroy_back", category: "دندان", name: "از بین بردن تمام یا قسمتی از تاج دندان عقب که سیاه نشده (۲.۵٪) - ماده ۶۲۲", percentage: 2.5 },
  { id: "t1_crown_destroy_black_front", category: "دندان", name: "از بین بردن تاج دندان سیاه شده پیشین (۱/۶۶۶۷٪) - ماده ۶۲۲", percentage: 1.6667 },
  { id: "t1_crown_destroy_black_back", category: "دندان", name: "از بین بردن تاج دندان سیاه شده عقب (۰.۸۳٪) - ماده ۶۲۲", percentage: 0.83 },
  { id: "t1_milk_unregrow", category: "دندان", name: "کندن دندان شیری کودک بدون رویش مجدد (۵٪ - دیه دندان اصلی) - ماده ۶۲۳", percentage: 5 },
  { id: "t1_milk", category: "دندان", name: "کندن دندان شیری کودک با رویش مجدد (ارش - ۱٪) - ماده ۶۲۳", percentage: 1 },
  { id: "t1_defective_front", category: "دندان", name: "از بین بردن دندان پیشین معیوب به نسبت عیب (ارش - ۳٪) - ماده ۶۲۵", percentage: 3 },
  { id: "t1_defective_back", category: "دندان", name: "از بین بردن دندان عقب معیوب به نسبت عیب (ارش - ۱.۵٪) - ماده ۶۲۵", percentage: 1.5 },

  // گردن
  { id: "a1_neck_bend_unhealed_2", category: "گردن", name: "کج شدن و خمیدگی گردن در اثر شکستگی در صورت عدم بهبودی و باقی ماندن این حالت (۱۰۰٪) - ماده ۶۲۶", percentage: 100 },
  { id: "a1_neck_bend_healed_2", category: "گردن", name: "کج شدن و خمیدگی گردن در اثر شکستگی در صورت بهبودی و زوال حالت خمیدگی و کج شدن (ارش) - ماده ۶۲۶", percentage: 15 },
  { id: "a1_neck_fracture_2", category: "گردن", name: "شکستگی گردن بدون کج شدن و خمیدگی (ارش) - ماده ۶۲۷", percentage: 10 },
  { id: "a1_neck_swallowing_difficulty_2", category: "گردن", name: "جنایت بر گردن که مانع فرو بردن یا جویدن غذا و یا نقص آن یا مانع حرکت گردن شود (ارش) - ماده ۶۲۸", percentage: 30 },

  // فک
  { id: "a1_jaw_lower_both", category: "فک", name: "قطع کردن و یا از بین بردن دو استخوان چپ و راست فک که محل رویش دندان‌های پایین است (۱۰۰٪) - ماده ۶۲۹", percentage: 100 },
  { id: "a1_jaw_lower_one", category: "فک", name: "قطع کردن و یا از بین بردن هر یک از استخوان‌های چپ و راست فک که محل رویش دندان‌های پایین است (۵۰٪) - ماده ۶۲۹", percentage: 50 },
  { id: "a1_jaw_lower_partial", category: "فک", name: "قطع کردن و یا از بین بردن مقداری هر یک از استخوان‌های چپ یا راست فک که محل رویش دندان‌های پایین است (به نسبت دیه) - ماده ۶۲۹", percentage: 25 },
  { id: "a1_jaw_with_teeth", category: "فک", name: "اگر با فک دندان یا غیر آن از بین برود یا آسیب ببیند (دیه جداگانه) - تبصره ماده ۶۲۹", percentage: 50 },
  { id: "a1_jaw_slow_move", category: "فک", name: "جنایتی که موجب کندی حرکت فک شود (ارش) - ماده ۶۳۰", percentage: 15 },
  { id: "a1_jaw_chewing_defect", category: "فک", name: "جنایتی که مانع جویدن یا موجب نقص آن شود (ارش) - ماده ۶۳۰", percentage: 20 },
  { id: "a1_jaw_upper_loss", category: "فک", name: "از بین بردن تمام یا قسمتی از فک بالا (ارش) - ماده ۶۳۲", percentage: 15 },
  { id: "a1_jaw_paralysis_2", category: "فک", name: "فلج کردن فک پایین (دو سوم دیه کامل - ۶۶/۶۶۶۶٪) - ماده ۶۳۴", percentage: 66.6666 },
  { id: "a1_jaw_paralyzed_cut_2", category: "فک", name: "قطع فک فلج (یک سوم دیه کامل - ۳۳/۳۳۳۳٪) - ماده ۶۳۴", percentage: 33.3333 },
  { id: "a1_jaw_lower_broken_healed_2", category: "فک", name: "شکستن استخوان فک پایین که بدون عیب درمان گردد (دیه شکستگی) - ماده ۶۳۳", percentage: 10 },
  { id: "a1_jaw_lower_broken_unhealed_2", category: "فک", name: "شکستن استخوان فک پایین که بدون عیب درمان نگردد (ارش شکستگی) - ماده ۶۳۳", percentage: 25 },
  { id: "a1_jaw_upper_broken", category: "فک", name: "شکستن استخوان فک بالا (حکم شکستگی استخوان‌های سر و صورت) - تبصره ماده ۶۳۳", percentage: 10 },

  // دست و پا
  { id: "a2_hand_one", category: "دست و پا", name: "قطع کامل یک دست تا مچ (۵۰٪) - ماده ۶۳۵", percentage: 50 },
  { id: "a2_hand_both", category: "دست و پا", name: "قطع هر دو دست کامل (۱۰۰٪) - ماده ۶۳۵", percentage: 100 },
  { id: "a2_hand_higher", category: "دست و پا", name: "قطع دست از بالاتر از مچ مانند آرنج یا شانه (۵۰٪ به علاوه ارش - ۵۵٪) - ماده ۶۳۶", percentage: 55 },
  { id: "a2_elbow_or_shoulder_cut", category: "دست و پا", name: "بریدن یا از بین بردن آرنج یا شانه (ارش - ۲۵٪) - ماده ۶۳۷", percentage: 25 },
  { id: "a2_hand_cut_no_fingers", category: "دست و پا", name: "قطع دست تا مچ در صورتی که انگشتان آن قبلاً قطع شده باشد (۵۰٪) - ماده ۶۳۸", percentage: 50 },
  { id: "a2_hand_cut_above_wrist_pre_cut", category: "دست و پا", name: "قطع دست بالاتر از مچ در صورتی که مچ یا انگشتان قبلاً قطع شده باشد (۵۰٪ به علاوه ارش بالاتر - ۵۵٪) - ماده ۶۳۹", percentage: 55 },
  { id: "a2_finger_one", category: "دست و پا", name: "قطع هر یک از انگشتان اصلی دست (۱۰٪) - ماده ۶۴۱", percentage: 10 },
  { id: "a2_finger_phalanx", category: "دست و پا", name: "قطع هر بند از انگشتان دست غیر از شست (۳/۳۳۳۳٪) - ماده ۶۴۲", percentage: 3.3333 },
  { id: "a2_thumb_phalanx", category: "دست و پا", name: "قطع هر بند از انگشت شست دست (۵٪) - ماده ۶۴۲", percentage: 5 },
  { id: "a2_finger_extra", category: "دست و پا", name: "قطع انگشت زائد دست یا پا (۳/۳۳۳۳٪) - ماده ۶۴۳", percentage: 3.3333 },
  { id: "a2_finger_extra_phalanx", category: "دست و پا", name: "قطع هر بند انگشت زائد غیر شست (۱/۱۱۱۱٪) - ماده ۶۴۳", percentage: 1.1111 },
  { id: "a2_finger_paralysis", category: "دست و پا", name: "فلج کردن یک انگشت دست یا پا (۶/۶۶۶۷٪) - ماده ۶۴۴", percentage: 6.6667 },
  { id: "a2_finger_paralyzed_cut", category: "دست و پا", name: "بریدن انگشت فلج شده دست یا پا (۳/۳۳۳۳٪) - ماده ۶۴۴", percentage: 3.3333 },
  { id: "a2_finger_phalanx_paralysis", category: "دست و پا", name: "فلج کردن یک بند انگشت غیر شست (۲.۲۲٪) - ماده ۶۴۴", percentage: 2.22 },
  { id: "a2_finger_phalanx_paralyzed_cut", category: "دست و پا", name: "بریدن یک بند انگشت فلج شده غیر شست (۱/۱۱۱۱٪) - ماده ۶۴۴", percentage: 1.1111 },
  { id: "a2_foot_one", category: "دست و پا", name: "قطع کامل یک پا تا مچ (۵۰٪) - ماده ۶۳۵", percentage: 50 },
  { id: "a2_foot_both", category: "دست و پا", name: "قطع هر دو پا کامل (۱۰۰٪) - ماده ۶۳۵", percentage: 100 },
  { id: "a2_toe_one", category: "دست و پا", name: "قطع هر یک از انگشتان اصلی پا (۱۰٪) - ماده ۶۴۱", percentage: 10 },
  { id: "a2_toe_phalanx", category: "دست و پا", name: "قطع هر بند از انگشتان پا غیر از شست (۳/۳۳۳۳٪) - ماده ۶۴۲", percentage: 3.3333 },
  { id: "a2_toethumb_phalanx", category: "دست و پا", name: "قطع هر بند از انگشت شست پا (۵٪) - ماده ۶۴۲", percentage: 5 },
  { id: "a2_bone_arm_leg_bad", category: "دست و پا", name: "شکستگی استخوان عضو دارای دیه مقدر (مانند ساعد، ساق، ران، بازو) بدون بهبود کامل (۱۰٪) - ماده ۵۶۹", percentage: 10 },
  { id: "a2_bone_arm_leg_good", category: "دست و پا", name: "شکستگی استخوان عضو دارای دیه مقدر (مانند ساعد، ساق، ران، بازو) با بهبود کامل بدون عیب (۸٪) - ماده ۵۶۹", percentage: 8 },
  { id: "a2_limb_paralysis", category: "دست و پا", name: "فلج کردن کامل دست یا پا (۳۳/۳۳۳۳٪) - ماده ۶۴۰", percentage: 33.3333 },
  { id: "a2_limb_paralyzed_cut", category: "دست و پا", name: "قطع دست یا پای فلج (۱۶/۶۶۶۷٪) - ماده ۶۴۰", percentage: 16.6667 },
  { id: "a2_nail_no_regrow", category: "دست و پا", name: "از بین بردن ناخن بدون رویش مجدد یا معیوب (۱٪) - ماده ۶۴۵", percentage: 1 },
  { id: "a2_nail_regrow", category: "دست و پا", name: "از بین بردن ناخن با رویش مجدد سالم (۰.۵٪) - ماده ۶۴۵", percentage: 0.5 },

  // ستون فقرات
  { id: "a2_spine_1", category: "ستون فقرات", name: "شکستن ستون فقرات در صورتی که اصلاً درمان نشود و یا بعد از علاج به صورت خمیده درآید (۱۰۰٪) - ماده ۶۴۷", percentage: 100 },
  { id: "a2_spine_2", category: "ستون فقرات", name: "شکستن ستون فقرات که بدون عیب درمان شود ولی موجب از بین رفتن یکی از منافع گردد (مانند توان جنسی یا کنترل ادرار) (۱۰۰٪) - ماده ۶۴۷", percentage: 100 },
  { id: "a2_spine_3", category: "ستون فقرات", name: "شکستن ستون فقرات در صورتی که درمان نشود و موجب از بین رفتن یکی از منافع گردد (۱۰۰٪ + دیه منافع) - ماده ۶۴۷", percentage: 200 },
  { id: "a2_spine_4", category: "ستون فقرات", name: "شکستن ستون فقرات در صورتی که بدون عیب درمان شود (۱۰٪) - ماده ۶۴۷", percentage: 10 },
  { id: "a2_spine_5", category: "ستون فقرات", name: "شکستن ستون فقرات در صورتی که موجب فلج و بی‌حس شدن پاها گردد (۱۰۰٪ + دو سوم دیه برای فلج دو پا) - ماده ۶۴۷", percentage: 166.6666 },
  { id: "a2_spine_6", category: "ستون فقرات", name: "جنایتی که سبب خمیدگی پشت شود بدون آنکه موجب شکستن ستون فقرات گردد در صورتی که خمیدگی درمان نشود (۱۰۰٪) - تبصره ۲ ماده ۶۴۷", percentage: 100 },
  { id: "a2_spine_7", category: "ستون فقرات", name: "جنایتی که سبب خمیدگی پشت شود بدون آنکه موجب شکستن ستون فقرات گردد در صورتی که بدون عیب درمان شود (۱۰٪) - تبصره ۲ ماده ۶۴۷", percentage: 10 },

  // نخاع و نشیمنگاه
  { id: "a2_spinal_cord", category: "نخاع و نشیمنگاه", name: "قطع کامل نخاع (۱۰۰٪) - ماده ۶۴۸", percentage: 100 },
  { id: "a2_spinal_cord_partial", category: "نخاع و نشیمنگاه", name: "قطع جزئی از نخاع (به نسبت عرض دیه دارد) - ماده ۶۴۹", percentage: 50 },
  { id: "a2_spinal_cord_plus", category: "نخاع و نشیمنگاه", name: "هرگاه قطع نخاع موجب عیب عضو دیگر شود (دیه یا ارش آن عضو بر دیه نخاع افزوده می‌شود) - تبصره ماده ۶۴۸", percentage: 150 },
  { id: "a2_buttocks_both", category: "نخاع و نشیمنگاه", name: "از بین بردن دو کپل به نحوی که به استخوان برسد (۱۰۰٪) - ماده ۶۵۰", percentage: 100 },
  { id: "a2_buttock_one", category: "نخاع و نشیمنگاه", name: "از بین بردن هر یک از دو کپل به نحوی که به استخوان برسد (۵۰٪) - ماده ۶۵۰", percentage: 50 },
  { id: "a2_buttock_partial", category: "نخاع و نشیمنگاه", name: "از بین بردن قسمتی از یک کپل (به همان نسبت دیه دارد) - ماده ۶۵۰", percentage: 25 },
  { id: "a2_coccyx_unhealed", category: "نخاع و نشیمنگاه", name: "شکستن استخوان دنبالچه که بدون عیب درمان نشود (ارش) - ماده ۶۵۱", percentage: 10 },
  { id: "a2_coccyx_incontinent_feces", category: "نخاع و نشیمنگاه", name: "شکستن استخوان دنبالچه اگر جنایت مزبور باعث شود مجنی علیه قادر به ضبط مدفوع نباشد (۱۰۰٪) - تبصره ماده ۶۵۱", percentage: 100 },
  { id: "a2_coccyx_incontinent_wind", category: "نخاع و نشیمنگاه", name: "شکستن استخوان دنبالچه اگر جنایت مزبور باعث شود مجنی علیه قادر به ضبط مدفوع باشد ولی قادر به ضبط باد نباشد (ارش) - تبصره ماده ۶۵۱", percentage: 20 },
  { id: "a2_perineum_incontinent", category: "نخاع و نشیمنگاه", name: "صدمه‌ای که به حد فاصل بیضه‌ها و مقعد وارد شده و موجب عدم ضبط ادرار یا مدفوع یا هر دو گردد (۱۰۰٪) - ماده ۶۵۲", percentage: 100 },

  // دنده
  { id: "a2_rib_heart_break", category: "دنده", name: "شکستگی هر دنده محیط به قلب (۲.۵٪) - ماده ۶۵۳", percentage: 2.5 },
  { id: "a2_rib_normal_break", category: "دنده", name: "شکستگی هر دنده غیرمحیط به قلب (۱٪) - ماده ۶۵۳", percentage: 1 },
  { id: "a2_rib_heart_pull", category: "دنده", name: "درآوردن یا کندن دنده محیط به قلب (۵٪) - ماده ۶۵۴", percentage: 5 },
  { id: "a2_rib_normal_pull", category: "دنده", name: "درآوردن یا کندن دنده غیرمحیط به قلب (۲.۵٪) - ماده ۶۵۴", percentage: 2.5 },
  { id: "a2_rib_heart_crack", category: "دنده", name: "ترک خوردگی دنده محیط به قلب (۱.۲۵٪) - بند الف تبصره ماده ۶۵۳", percentage: 1.25 },
  { id: "a2_rib_normal_crack", category: "دنده", name: "ترک خوردگی دنده غیرمحیط به قلب (۰.۵٪) - بند ب تبصره ماده ۶۵۳", percentage: 0.5 },

  // ترقوه
  { id: "a2_collarbone_bad", category: "ترقوه", name: "شکستن یک استخوان ترقوه بدون بهبود کامل همراه با عیب (ارش - ۵٪) - ماده ۶۵۶", percentage: 5 },
  { id: "a2_collarbone_good", category: "ترقوه", name: "شکستن یک استخوان ترقوه همراه با بهبود کامل بدون عیب (۴٪) - ماده ۶۵۶", percentage: 4 },
  { id: "a2_collarbone_pierce", category: "ترقوه", name: "سوراخ کردن استخوان ترقوه (ارش - ۳٪) - ماده ۶۵۷", percentage: 3 },
  { id: "a2_collarbones_both", category: "ترقوه", name: "قطع یا از بین بردن دو استخوان ترقوه (۱۰۰٪) - ماده ۶۵۵", percentage: 100 },
  { id: "a2_collarbone_one", category: "ترقوه", name: "قطع یا از بین بردن یک استخوان ترقوه (۵۰٪) - ماده ۶۵۵", percentage: 50 },

  // اندام تناسلی مرد
  { id: "a2_genital_m", category: "اندام تناسلی مرد", name: "قطع کامل اندام تناسلی مرد تا حشفه (۱۰۰٪) - ماده ۶۶۲", percentage: 100 },
  { id: "a2_genital_m_partial", category: "اندام تناسلی مرد", name: "قطع قسمتی از اندام تناسلی مرد (به نسبت مساحت قطع شده - ارش) - ماده ۶۶۲", percentage: 33.3333 },
  { id: "a2_genital_m_paralyzed", category: "اندام تناسلی مرد", name: "قطع اندام تناسلی فلج مرد (۳۳/۳۳۳۳٪) - ماده ۶۶۳", percentage: 33.3333 },
  { id: "a2_genital_m_paralysis", category: "اندام تناسلی مرد", name: "فلج کردن اندام تناسلی سالم مرد (۶۶/۶۶۶۶٪) - ماده ۶۶۳", percentage: 66.6666 },

  // اندام تناسلی زن
  { id: "a2_genital_f_both", category: "اندام تناسلی زن", name: "قطع دو طرف اندام تناسلی زن (۱۰۰٪) - ماده ۶۶۴", percentage: 100 },
  { id: "a2_genital_f_one", category: "اندام تناسلی زن", name: "قطع یک طرف اندام تناسلی زن (۵۰٪) - ماده ۶۶۴", percentage: 50 },
  { id: "a2_genital_f_partial", category: "اندام تناسلی زن", name: "قطع قسمتی از یک طرف اندام تناسلی زن (به نسبت مساحت - ارش) - ماده ۶۶۴", percentage: 25 },

  // افضاء
  { id: "a2_efza_f_child", category: "افضاء", name: "افضای همسر نابالغ (۱۰۰٪ دیه کامل به علاوه مهر) - ماده ۶۶۱", percentage: 100 },
  { id: "a2_efza_f_other", category: "افضاء", name: "افضای زن غیرهمسر (۱۰۰٪) - ماده ۶۶۲", percentage: 100 },

  // ازاله بکارت
  { id: "a2_virginity_no_consent", category: "ازاله بکارت", name: "ازاله بکارت غیرهمسر بدون رضایت (مهرالمثل) - ماده ۶۵۸", percentage: 10 },
  { id: "a2_virginity_consent", category: "ازاله بکارت", name: "ازاله بکارت با رضایت کامل (بدون ضمان - ۰٪) - تبصره ۱ ماده ۶۵۸", percentage: 0 },
  { id: "a2_virginity_consent_minor", category: "ازاله بکارت", name: "ازاله بکارت دختر نابالغ با رضایت وی (مهرالمثل) - تبصره ۲ ماده ۶۵۸", percentage: 10 },

  // بیضه
  { id: "a2_testicles_both", category: "بیضه", name: "قطع هر دو بیضه (۱۰۰٪) - ماده ۶۶۵", percentage: 100 },
  { id: "a2_testicle_one_l", category: "بیضه", name: "قطع بیضه چپ (۶۶/۶۶۶۶٪) - ماده ۶۶۵", percentage: 66.6666 },
  { id: "a2_testicle_one_r", category: "بیضه", name: "قطع بیضه راست (۳۳/۳۳۳۳٪) - ماده ۶۶۵", percentage: 33.3333 },
  { id: "a2_testicle_swelling", category: "بیضه", name: "ورم کردن بیضه بدون مانع راه رفتن (ارش - ۲۰٪) - ماده ۶۶۶", percentage: 20 },
  { id: "a2_testicle_swelling_walk_one", category: "بیضه", name: "ورم یک بیضه که مانع راه رفتن مفید شود (ارش - ۴۰٪) - ماده ۶۶۶", percentage: 40 },
  { id: "a2_testicle_swelling_walk_both", category: "بیضه", name: "ورم هر دو بیضه که مانع راه رفتن مفید شود (۸۰٪) - ماده ۶۶۶", percentage: 80 },

  // پستان زن
  { id: "a2_breast_one", category: "پستان زن", name: "قطع کامل یک پستان زن (۵۰٪) - ماده ۶۶۹", percentage: 50 },
  { id: "a2_breasts_both", category: "پستان زن", name: "قطع هر دو پستان کامل زن (۱۰۰٪) - ماده ۶۶۹", percentage: 100 },
  { id: "a2_breast_milk_both", category: "پستان زن", name: "از بین بردن شیر یا قدرت ترشح آن در هر دو پستان زن (۱۰۰٪) - ماده ۶۷۰", percentage: 100 },
  { id: "a2_breast_milk_one", category: "پستان زن", name: "از بین بردن شیر یا قدرت ترشح آن در یک پستان زن (۵۰٪) - ماده ۶۷۰", percentage: 50 },

  // عقل
  { id: "m1_intellect", category: "عقل", name: "ایجاد نقص در عقل در اثر ضربه، جراحت، ترساندن و مانند آن (ارش) - ماده ۶۷۵", percentage: 20 },
  { id: "m1_intellect_periodic", category: "عقل", name: "اگر جراحت و ... باعث ایجاد جنون ادواری شود (ارش) - تبصره ماده ۶۷۵", percentage: 50 },
  { id: "m1_memory_loss", category: "عقل", name: "زوال و نقصان حافظه و یا اختلال روانی در صورتی که به جنون نرسد (ارش) - ماده ۶۷۶", percentage: 30 },
  { id: "m1_intellect_loss", category: "عقل", name: "جنایتی که موجب زوال عقل یا کم شدن آن شود هر چند عمدی باشد (دیه کامل یا ارش) - ماده ۶۷۷", percentage: 100 },
  { id: "m1_intellect_head_injury", category: "عقل", name: "هرگاه در اثر صدمه مانند شکستن سر یا صورت عقل زایل شود (دیه جداگانه) - ماده ۶۷۸", percentage: 100 },
  { id: "m1_intellect_head_injury_defect", category: "عقل", name: "هرگاه در اثر صدمه مانند شکستن سر یا صورت موجب نقص عقل شود (ارش جداگانه) - ماده ۶۷۸", percentage: 30 },
  { id: "m1_intellect_return", category: "عقل", name: "هرگاه در اثر جنایتی عقل زایل گردد و پس از دریافت دیه کامل عقل برگردد (دیه مسترد و ارش پرداخت می‌شود) - ماده ۶۷۹", percentage: 20 },
  { id: "m1_coma_death", category: "عقل", name: "هرگاه شخص در اثر جنایتی بی‌هوش شود و به اغماء برود و منتهی به فوت او گردد (دیه نفس) - ماده ۶۸۰", percentage: 100 },
  { id: "m1_coma_return", category: "عقل", name: "هرگاه شخص در اثر جنایتی بی‌هوش شود و به اغماء برود چنانچه به هوش آید (ارش) - ماده ۶۸۰", percentage: 20 },
  { id: "m1_coma_return_with_defects", category: "عقل", name: "هرگاه شخص در اثر جنایتی بی‌هوش شود و به اغماء برود چنانچه عوارض و آسیب‌های دیگری به وجود آید (ارش عوارض + ارش بی‌هوشی) - ماده ۶۸۰", percentage: 40 },
  { id: "m1_coma_crime", category: "عقل", name: "جنایت برکسی که در اغماء یا بی‌هوشی و مانند آن است (مانند هوشیار) - ماده ۶۸۱", percentage: 100 },

  // بویایی
  { id: "m2_smell", category: "بویایی", name: "از بین بردن کامل حس بویایی هر دو مجرا (۱۰۰٪) - ماده ۶۹۳", percentage: 100 },
  { id: "m2_smell_one", category: "بویایی", name: "از بین بردن حس بویایی یک مجرا (۵۰٪) - ماده ۶۹۳", percentage: 50 },
  { id: "m2_smell_reduce", category: "بویایی", name: "کاهش حس بویایی (ارش) - ماده ۶۹۴", percentage: 20 },

  // شنوایی
  { id: "m3_hear_both", category: "شنوایی", name: "از بین بردن شنوایی هر دو گوش به طور کامل (۱۰۰٪) - ماده ۶۸۲", percentage: 100 },
  { id: "m3_hear_one", category: "شنوایی", name: "از بین بردن شنوایی یک گوش به طور کامل (۵۰٪) - ماده ۶۸۲", percentage: 50 },
  { id: "m3_hear_defective", category: "شنوایی", name: "از بین بردن شنوایی گوش شنوای شخصی که یکی از گوش‌های او نمی‌شنود (۵۰٪) - ماده ۶۸۳", percentage: 50 },
  { id: "m3_hear_reduce", category: "شنوایی", name: "کاهش شنوایی در صورتی که مقدار آن قابل تشخیص باشد (به نسبت کاهش - دیه دارد) - ماده ۶۸۴", percentage: 20 },
  { id: "m3_hear_cut_ear", category: "شنوایی", name: "هرگاه با قطع یا از بین بردن گوش و یا هر جنایت دیگری شنوایی از بین برود یا نقصان یابد (دیه جداگانه دارد) - ماده ۶۸۵", percentage: 50 },
  { id: "m3_hear_canal_permanent", category: "شنوایی", name: "هرگاه در اثر جنایتی در مجرای شنوایی نقص دائمی ایجاد شود به نحوی که مانع شنیدن گردد (۱۰۰٪) - ماده ۶۸۶", percentage: 100 },
  { id: "m3_hear_canal_temp", category: "شنوایی", name: "هرگاه در اثر جنایتی در مجرای شنوایی موجب نقص موقت شود (ارش) - ماده ۶۸۶", percentage: 15 },
  { id: "m3_hear_child_mute_1", category: "شنوایی", name: "هرگاه کودکی که زمان سخن گفتن او فرا نرسیده در اثر کر شدن نتواند سخن بگوید (دیه شنوایی + دیه زوال گفتار) - ماده ۶۸۷", percentage: 200 },
  { id: "m3_hear_child_mute_2", category: "شنوایی", name: "هرگاه کودکی که زمان سخن گفتن او فرا رسیده در اثر کر شدن نتواند کلمات دیگر یاد بگیرد و بر زبان آورد (دیه شنوایی + ارش زوال گفتار) - ماده ۶۸۷", percentage: 150 },
  { id: "m3_hear_speech_both", category: "شنوایی", name: "از بین رفتن حس شنوایی و گویایی در یک جنایت (هرکدام یک دیه کامل دارد - ۲۰۰٪) - ماده ۶۸۸", percentage: 200 },

  // بینایی
  { id: "m4_vision_both", category: "بینایی", name: "از بین رفتن کامل بینایی هر دو چشم (۱۰۰٪) - ماده ۶۸۹", percentage: 100 },
  { id: "m4_vision_one", category: "بینایی", name: "از بین رفتن کامل بینایی یک چشم (۵۰٪) - ماده ۶۸۹", percentage: 50 },
  { id: "m4_vision_reduce", category: "بینایی", name: "کاهش بینایی چشم (به نسبت کاهش - ارش) - ماده ۶۹۰", percentage: 20 },
  { id: "m4_vision_defective", category: "بینایی", name: "از بین بردن بینایی چشم دارای نقص مادرزادی (به نسبت بینایی - ارش) - ماده ۶۹۱", percentage: 25 },

  // چشایی
  { id: "m5_taste", category: "چشایی", name: "از بین رفتن کامل حس چشایی (۱۰۰٪ - ارش) - ماده ۶۹۵", percentage: 100 },
  { id: "m5_taste_partial", category: "چشایی", name: "از بین رفتن قسمتی از حس چشایی (ارش) - ماده ۶۹۵", percentage: 25 },
  { id: "m5_taste_reduce", category: "چشایی", name: "کاهش حس چشایی (ارش) - ماده ۶۹۵", percentage: 15 },

  // صوت و گویایی
  { id: "m6_voice_full", category: "صوت و گویایی", name: "از بین بردن صوت به طور کامل به گونه‌ای که شخص نتواند صدایش را آشکار کند (۱۰۰٪) - ماده ۶۹۷", percentage: 100 },
  { id: "m6_voice_defect", category: "صوت و گویایی", name: "جنایتی که موجب عیبی در صوت مانند کاهش طنین صدا، گرفتگی آن و یا صحبت کردن از طریق بینی شود (ارش) - ماده ۷۰۱", percentage: 15 },
  { id: "m6_voice_partial_letters", category: "صوت و گویایی", name: "از بین رفتن صوت بعضی از حروف (ارش) - ماده ۷۰۲", percentage: 10 },
  { id: "m6_voice_and_speech", category: "صوت و گویایی", name: "چنانچه جنایت علاوه بر زوال صوت موجب زوال نطق نیز گردد (دو دیه کامل - ۲۰۰٪) - ماده ۷۰۳", percentage: 200 },
  { id: "m6_speech_full", category: "صوت و گویایی", name: "از بین بردن گویایی به طور کامل و بدون قطع زبان (۱۰۰٪) - ماده ۶۹۸", percentage: 100 },
  { id: "m6_speech_partial", category: "صوت و گویایی", name: "از بین بردن قدرت ادای برخی از حروف (به همان نسبت دیه دارد) - ماده ۶۹۸", percentage: 25 },
  { id: "m6_speech_one_letter", category: "صوت و گویایی", name: "از بین بردن قدرت ادای یک حرف شخص فارسی زبان (یک سی و دوم دیه کامل - ۳.۱۲٪) - تبصره ۱ ماده ۶۱۱", percentage: 3.12 },
  { id: "m6_speech_defect", category: "صوت و گویایی", name: "جنایتی که موجب پیدایش عیبی در گفتار یا ادای حروف گردد و یا عیب موجود در آن را تشدید کند (ارش) - ماده ۶۹۹", percentage: 15 },
  { id: "m6_speech_replace_letter", category: "صوت و گویایی", name: "جنایتی که باعث شود شخص حرفی را به جای حرف دیگر اداء نماید (ارش) - ماده ۷۰۰", percentage: 10 },

  // سایر منافع
  { id: "m10_urine_permanent", category: "سایر منافع", name: "جنایتی که بطور دائم موجب سلس و ریزش ادرار گردد (۱۰۰٪) - ماده ۷۰۴", percentage: 100 },
  { id: "m10_urine_temp", category: "سایر منافع", name: "جنایتی که موجب ریزش غیردائمی ادرار گردد (ارش) - ماده ۷۰۴", percentage: 20 },
  { id: "m10_urine_feces_uncontrolled", category: "سایر منافع", name: "جنایتی که موجب عدم ضبط دائم مدفوع یا ادرار شود (۱۰۰٪) - ماده ۷۰۵", percentage: 100 },
  { id: "m13_intercourse_repro", category: "سایر منافع", name: "از بین بردن قدرت انزال یا تولید مثل مرد یا بارداری زن (ارش) - ماده ۷۰۶", percentage: 30 },
  { id: "m13_intercourse_pleasure", category: "سایر منافع", name: "از بین بردن لذت مقاربت زن یا مرد (ارش) - ماده ۷۰۶", percentage: 20 },
  { id: "m13_intercourse_full", category: "سایر منافع", name: "از بین بردن کامل قدرت مقاربت (۱۰۰٪) - ماده ۷۰۷", percentage: 100 },
  { id: "m14_other_senses", category: "سایر منافع", name: "از بین بردن یا نقص دائم یا موقت حواس یا منافع دیگر (مانند لامسه، خواب، عادت ماهانه) (ارش) - ماده ۷۰۸", percentage: 30 },
  { id: "m14_other_diseases", category: "سایر منافع", name: "به وجود آوردن امراضی مانند لرزش، تشنگی، گرسنگی، ترس و غش (ارش) - ماده ۷۰۸", percentage: 20 },
  { id: "a2_kidneys_both", category: "سایر منافع", name: "از بین بردن هر دو کلیه (۱۰۰٪) - ماده ۶۶۱", percentage: 100 },
  { id: "a2_kidney_one", category: "سایر منافع", name: "از بین بردن یک کلیه (۵۰٪) - ماده ۶۶۱", percentage: 50 },
  { id: "a2_bladder", category: "سایر منافع", name: "از بین بردن مثانه یا پارگی آن با ایجاد بی‌اختیاری دائم ادرار (۱۰۰٪) - ماده ۶۶۲", percentage: 100 },
  
  // جنین و میت در سایر منافع
  { id: "j1", category: "سایر منافع", name: "نطفه‌ای که در رحم مستقر شده است.", percentage: 2 },
  { id: "j2", category: "سایر منافع", name: "علقه که در آن جنین به صورت خون بسته در می‌آید.", percentage: 4 },
  { id: "j3", category: "سایر منافع", name: "مضغه که در آن جنین به صورت توده گوشتی در می‌آید.", percentage: 6 },
  { id: "j4", category: "سایر منافع", name: "عظام که در آن جنین به صورت استخوان درآمده اما هنوز گوشت روئیده نشده است.", percentage: 8 },
  { id: "j5", category: "سایر منافع", name: "جنین که گوشت و استخوان بندی آن تمام شده ولی روح در آن دمیده نشده است.", percentage: 10 },
  { id: "j6", category: "سایر منافع", name: "جنین پسر که روح در آن دمیده شده است.", percentage: 100 },
  { id: "j7", category: "سایر منافع", name: "جنین دختر که روح در آن دمیده شده است.", percentage: 50 },
  { id: "j8", category: "سایر منافع", name: "جنین مشتبه که روح در آن دمیده شده است.", percentage: 75 },
  { id: "j9", category: "سایر منافع", name: "چند جنین در یک رحم باشد سقط هر یک از آنها.", percentage: 0 },
  { id: "j10", category: "سایر منافع", name: "دیه اعضاء و دیگر صدمات وارد بر جنین در مرحله‌ای که استخوان بندی کامل شده ولی روح در آن دمیده نشده است", percentage: 0 },
  { id: "j11", category: "سایر منافع", name: "دیه اعضاء و دیگر صدمات وارد بر جنین در مرحله‌ای که استخوان بندی کامل شده بعد از دمیده شدن روح", percentage: 0 },
  { id: "j12", category: "سایر منافع", name: "دیه اعضاء و دیگر صدمات وارد بر جنین در مرحله‌ای که استخوان بندی کامل شده در صورتی که بر اثر همان جنایت جنین از بین برود", percentage: 0 },
  { id: "d1", category: "سایر منافع", name: "جنایت بر میت", percentage: 10 },
  { id: "d2", category: "سایر منافع", name: "جداکردن سر از بدن میت", percentage: 10 },
  { id: "d3", category: "سایر منافع", name: "جداکردن یک دست یا یک پا از بدن میت", percentage: 5 },
  { id: "d4", category: "سایر منافع", name: "جداکردن هر دو دست یا هر دو پا از بدن میت", percentage: 10 },
  { id: "d5", category: "سایر منافع", name: "جداکردن یک انگشت از بدن میت", percentage: 1 },
  { id: "d6", category: "سایر منافع", name: "جراحات وارده به سر و صورت و سایر اعضاء و جوارح میت", percentage: 0 },
  { id: "d7", category: "سایر منافع", name: "هرگاه آسیب وارده بر میت، دیه مقدر نداشته باشد", percentage: 0 },

  // جراحات و صدماتی که موجب تغییر رنگ پوست یا تورم می شود
  { id: "c1_face_black", category: "جراحات و صدماتی که موجب تغییر رنگ پوست یا تورم می شود", name: "سیاه شدن پوست صورت (۰.۶٪) - ماده ۷۱۴", percentage: 0.6 },
  { id: "c2_face_blue", category: "جراحات و صدماتی که موجب تغییر رنگ پوست یا تورم می شود", name: "کبود شدن پوست صورت (۰.۳٪) - ماده ۷۱۴", percentage: 0.3 },
  { id: "c3_face_red", category: "جراحات و صدماتی که موجب تغییر رنگ پوست یا تورم می شود", name: "سرخ شدن پوست صورت (۰.۱۵٪) - ماده ۷۱۴", percentage: 0.15 },
  { id: "c4_body_black", category: "جراحات و صدماتی که موجب تغییر رنگ پوست یا تورم می شود", name: "سیاه شدن پوست سایر اعضا (۰.۳٪) - ماده ۷۱۴", percentage: 0.3 },
  { id: "c5_body_blue", category: "جراحات و صدماتی که موجب تغییر رنگ پوست یا تورم می شود", name: "کبود شدن پوست سایر اعضا (۰.۱۵٪) - ماده ۷۱۴", percentage: 0.15 },
  { id: "c6_body_red", category: "جراحات و صدماتی که موجب تغییر رنگ پوست یا تورم می شود", name: "سرخ شدن پوست سایر اعضا (۰.۰۷۵٪) - ماده ۷۱۴", percentage: 0.075 },
  { id: "c_swelling", category: "جراحات و صدماتی که موجب تغییر رنگ پوست یا تورم می شود", name: "ایجاد تورم در پوست صورت یا اعضا بدون تغییر رنگ (ارش - ۲٪) - ماده ۷۱۵", percentage: 2 }
];
