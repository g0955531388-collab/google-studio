import React, { useState } from 'react';
import {
  Heart,
  Baby,
  Calendar,
  Lock,
  Sparkles,
  ShieldCheck,
  Send,
  AlertCircle,
  HelpCircle,
  Clock,
  Activity,
  CheckCircle2,
  Flower2,
  Smile
} from 'lucide-react';

export default function WomenHealthUnit() {
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [stage, setStage] = useState<'cycle' | 'pregnancy' | 'postpartum'>('pregnancy');
  const [lmpDate, setLmpDate] = useState('2025-11-05');
  const [assistantQuestion, setAssistantQuestion] = useState('');
  const [assistantReply, setAssistantReply] = useState<string | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  // Calculate gestational weeks based on LMP
  const calculateGestationalWeeks = () => {
    if (!lmpDate) return 0;
    const diffDays = Math.floor(
      (new Date().getTime() - new Date(lmpDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(1, Math.min(42, Math.floor(diffDays / 7)));
  };

  const gestationalWeeks = calculateGestationalWeeks();

  // Estimated Due Date (Naegele's rule: +280 days)
  const calculateDueDate = () => {
    if (!lmpDate) return '';
    const d = new Date(lmpDate);
    d.setDate(d.getDate() + 280);
    return d.toISOString().split('T')[0];
  };

  const dueDate = calculateDueDate();

  const handleAskAssistant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantQuestion.trim()) return;

    setIsReplying(true);
    setAssistantReply(null);

    setTimeout(() => {
      setIsReplying(false);
      const q = assistantQuestion.toLowerCase();
      if (q.includes('غثيان') || q.includes('إرهاق') || q.includes('تعب')) {
        setAssistantReply(
          'الغثيان الصباحي والإجهاد من الأعراض الطبيعية خاصة في الثلث الأول نتيجة ارتفاع هرمون الحمل (hCG). يُنصح بوجبات خفيفة وموزعة، وتجنب المعدة الفارغة، مع شرب كميات كافية من الماء. إذا كان هناك قيء متكرر يعيق التغذية يجب استشارة الطبيبة.'
        );
      } else if (q.includes('سونار') || q.includes('موعد') || q.includes('فحص')) {
        setAssistantReply(
          `أنتِ حالياً في الأسبوع ${gestationalWeeks} تقريباً. من المهم التحقق من نبض الجنين، فحوصات الدم الشاملة، ونسبة خضاب الدم والحديد، والتأكد من موعد تصوير السونار التفصيلي.`
        );
      } else {
        setAssistantReply(
          'تم تسجيل استفسارك وإدراجه في قائمة الأسئلة المقترحة لزيارة طبيبتك القادمة. نحرص دائماً على سلامتك وسلامة جنينك عبر التوجيه السريري المعتمد.'
        );
      }
    }, 700);
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-pink-950 via-purple-950 to-slate-900 border border-pink-900/50 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-pink-600/30 border border-pink-500/40 flex items-center justify-center text-pink-400">
                <Flower2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  وحدة رعاية صحة المرأة والحمل والولادة
                </h1>
                <p className="text-xs sm:text-sm text-pink-200">
                  منظومة صحية نسائية متكاملة تجمع المعرفة، المتابعة السريرية، والخصوصية التامة
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              تتيح الوحدة خيارين للدخول: وضع "مهتمة" للتثقيف الصحي العام والوقاية عبر كافة مراحل العمر، أو
              زر "الانتساب" للمتابعة السريرية الحساسة للدورة الشهرية والحمل ورعاية ما بعد الولادة مع أعلى درجات التشفير.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPrivacyModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
            >
              <Lock className="w-4 h-4 text-pink-400" />
              <span>معايير الخصوصية</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode Switch Card: مهتمة vs منتسبة */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-pink-400" />
              حالة الانتساب للوحدة النسائية
            </h2>
            <p className="text-xs text-slate-400">
              {isEnrolled
                ? 'الحالة الحالية: [منتسبة] — ملف الرعاية السريرية نشط ومربوط بملفك الصحي المشفر'
                : 'الحالة الحالية: [مهتمة] — وضع التثقيف الصحي العام بدون فتح ملف متابعة سريري'}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsEnrolled(false)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                !isEnrolled
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              وضع "مهتمة" (معرفة عامة)
            </button>
            <button
              onClick={() => setIsEnrolled(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                isEnrolled
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              زر "الانتساب" (متابعة سريرية)
            </button>
          </div>
        </div>

        {/* Stage selection for Enrolled */}
        {isEnrolled ? (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto text-xs">
              {[
                { id: 'cycle', label: 'متابعة الدورة والخصوبة', icon: Calendar },
                { id: 'pregnancy', label: 'ملف الحمل الذكي ونمو الجنين', icon: Baby },
                { id: 'postpartum', label: 'رعاية ما بعد الولادة والأمومة', icon: Heart },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setStage(s.id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition ${
                      stage === s.id
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Pregnancy Profile Card */}
            {stage === 'pregnancy' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white flex items-center gap-2">
                      <Baby className="w-4 h-4 text-pink-400" />
                      حساب عمر الحمل وتاريخ الولادة التقديري
                    </span>
                    <span className="text-xs bg-pink-950 text-pink-300 border border-pink-800/60 px-2 py-0.5 rounded-full font-bold">
                      الأسبوع {gestationalWeeks} من 40
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs text-slate-400">تاريخ أول يوم من آخر دورة شهرية (LMP):</label>
                    <input
                      type="date"
                      value={lmpDate}
                      onChange={(e) => setLmpDate(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>بداية الحمل</span>
                      <span>تاريخ الولادة المتوقع: {dueDate}</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (gestationalWeeks / 40) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-pink-950/30 border border-pink-800/40 rounded-lg text-xs text-pink-200 leading-relaxed">
                    💡 <strong>نصيحة الأسبوع {gestationalWeeks}:</strong> في هذه المرحلة يكتمل تشكل معظم الأعضاء
                    الحيوية للجنين. تأكدي من تناول حمض الفوليك والحديد، والالتزام بجدول التحاليل المخبرية الدورية.
                  </div>
                </div>

                {/* AI Pregnancy Assistant */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span>مساعد الحامل الذكي (Lifex-AI Assistant)</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      اكتبي أي استفسار حول الأعراض أو المواعيد لتجهيز قائمة الأسئلة لزيارة طبيبتك القادمة:
                    </p>

                    <form onSubmit={handleAskAssistant} className="flex gap-2">
                      <input
                        type="text"
                        value={assistantQuestion}
                        onChange={(e) => setAssistantQuestion(e.target.value)}
                        placeholder="مثال: أعاني من غثيان صباحي وإرهاق..."
                        className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="submit"
                        disabled={isReplying}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                      >
                        {isReplying ? 'جاري التحليل...' : 'إرسال'}
                      </button>
                    </form>

                    {assistantReply && (
                      <div className="p-3 bg-purple-950/40 border border-purple-800/50 rounded-lg text-xs text-purple-200 leading-relaxed animate-fade-in">
                        {assistantReply}
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 italic">
                    ملاحظة: المساعد الذكي لا يعتبر بديلاً عن الطبيبة المعالجة بل وسيلة تنظيم وتوجيه وإعداد للمواعيد.
                  </div>
                </div>
              </div>
            )}

            {stage === 'cycle' && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-2">
                <div className="font-bold text-sm text-white">سجل الدورة الشهرية والخصوبة المشفر</div>
                <p className="leading-relaxed">
                  تتبع آمن لمواعيد الدورة الشهرية والتنبؤ الهادئ بأيام الإباضة والخصوبة، بدون أي تتبع تجاري أو إعلاني.
                  البيانات تُخزن مشفرة محلياً وفي الخزنة السحابية الخاصة بحسابك فقط.
                </p>
              </div>
            )}

            {stage === 'postpartum' && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-2">
                <div className="font-bold text-sm text-white">رعاية ما بعد الولادة والأمومة</div>
                <p className="leading-relaxed">
                  برامج دعم التعافي البدني والنفسي، إرشادات الرضاعة الطبيعية، تتبع جدول تطعيمات المولود الجديد،
                  والفحوصات الدورية للأم بالتعاون مع طبيبة النساء وطبيب الأطفال.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* General Education for Interested Users */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="font-bold text-xs text-pink-300">مرحلة المراهقة والبلوغ</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                التغيرات الهرمونية والجسدية، التغذية المتوازنة، وممارسة الرياضة للحفاظ على استقرار الدورة وصحة العظام.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="font-bold text-xs text-purple-300">الاستعداد والتخطيط للحمل</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                أهمية حمض الفوليك، مراجعة الأمراض الوراثية، والتقييم السريري المسبق لضمان بداية آمنة للأم والجنين.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="font-bold text-xs text-indigo-300">الصحة الوقائية وسن الأمان</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                الفحوصات الدورية للثدي وعنق الرحم، دعم التوازن الهرموني، والوقاية من هشاشة العظام في كل الأعمار.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Privacy Dialog */}
      {privacyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-pink-400" />
                حماية الخصوصية النسائية في Lifex-AI
              </h3>
              <button
                onClick={() => setPrivacyModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              - لا تظهر أي تفاصيل حساسة في الإشعارات الخارجية (يظهر فقط: "لديك تذكير صحي خاص").
              <br />
              - لا تظهر بيانات الحمل أو الدورة لأي فرد من أفراد الأسرة في الحسابات المرتبطة إلا بإذن مباشر.
              <br />
              - إمكانية استخدام اسم مستعار مشفر للملف النسائي.
            </p>
            <div className="text-right pt-2 border-t border-slate-800">
              <button
                onClick={() => setPrivacyModalOpen(false)}
                className="px-4 py-1.5 bg-pink-600 text-white rounded-lg text-xs font-bold"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
