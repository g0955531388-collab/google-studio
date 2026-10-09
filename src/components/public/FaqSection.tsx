import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldCheck } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'هل يقوم نظام Lifex-AI بتشخيص الأمراض أو وصف الأدوية بشكل مستقل؟',
      a: 'كلا، إطلاقاً وبشكل حاسم. المبدأ التأسيسي لـ Lifex-AI ينص على أن المنصة هي للدعم الصحي، المعلوماتي، والتقني فقط. لا يدّعي النظام التشخيص المستقل، ولا يصف العلاج، ولا يستبدل الطبيب البشري أو يتخذ قرارات سريرية نهائية.',
    },
    {
      q: 'من يملك بيانات المريض والنتائج الطبية في Lifex-AI؟',
      a: 'تتبع المنصة المبدأ المعماري الصارم: (Source ≠ Canonical Owner ≠ Consumer ≠ Projection). المستشفى يملك سجله الداخلي الأصلي، المختبر يملك نتائج تحاليله الأصلية، والمريض يملك سلطة الموافقة الصريحة وتحديد نطاق المشاركة مع الأطباء.',
    },
    {
      q: 'كيف تضمن المنصة عدم تسريب البيانات أو الوصول غير المصرح به؟',
      a: 'تطبق Lifex-AI نموذج Zero-Trust Security مع تشفير شامل أثناء التخزين (AES-256) والنقل (TLS 1.3). كل محاولة قراءة أو كتابة تُسجل فوراً في سجل تدقيق (Audit Trail) غير قابل للتعديل يتضمن هوية الفاعل والغرض والسياسة المطبقة.',
    },
    {
      q: 'هل يمكن للمريض إلغاء موافقة الطبيب أو المستشفى في أي وقت؟',
      a: 'نعم، بكل تأكيد. يتيح مركز الخصوصية والموافقات للمريض سحب أي موافقة سابقة فورياً بنقرة واحدة، مما يوقف وصول الجهة إلى إسقاط السجل الطبي مع تسجيل الإلغاء في سجل التدقيق.',
    },
    {
      q: 'كيف يتم الربط مع الأجهزة الطبية المنزلية أو المحمولة (IoMT)؟',
      a: 'يتم الربط عبر بروتوكولات آمنة ومشفرة. والقاعدة البرمجية الصارمة تنص على أن قراءة الجهاز الحيوية (Device Reading) تسجل كقياس رقمي فقط ولا تعتبر تشخيصاً سريرياً مستقلاً.',
    },
  ];

  return (
    <section id="faq" className="py-16 bg-slate-950 border-b border-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-950 text-teal-300 border border-teal-800/80">
            <HelpCircle className="w-4 h-4 text-teal-400" />
            <span>الأسئلة الشائعة والأطر التنظيمية</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            إجابات واضحة حول الخصوصية والمسؤولية الطبية
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-right flex items-center justify-between gap-3 text-white font-bold text-sm sm:text-base hover:text-teal-400 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-teal-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
