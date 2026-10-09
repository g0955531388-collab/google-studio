import React from 'react';
import { ShieldCheck, Database, Lock, Globe2, Cpu, EyeOff, Layers, CheckCircle } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

export const WhyLifexSection: React.FC = () => {
  const { t, language } = useTranslation();

  const principles = [
    {
      title: 'احترام السلطة الطبية (AI ≠ Doctor)',
      desc: 'تم تصميم Lifex-AI كأداة تمكينية ومساندة للأطباء والمرضى، وليس كبديل عنهم. لا تشخيص سريري مستقل، ولا إصدار لوصفات دوائية دون اعتماد طبي.',
      icon: ShieldCheck,
      color: 'text-teal-400 bg-teal-950/60 border-teal-800',
    },
    {
      title: 'فصل الملكية الصارم (Source ≠ Canonical)',
      desc: 'المستشفى يملك سجل التنويم الأصلي، المختبر يملك نتائج تحاليله، والمريض يملك حقه في الموافقة وسحبها. لا تنافس بين النسخ ولا تشتت في السجلات.',
      icon: Database,
      color: 'text-indigo-400 bg-indigo-950/60 border-indigo-800',
    },
    {
      title: 'السيادة والخصوصية (Zero-Trust Security)',
      desc: 'تشفير شامل من النهاية إلى النهاية (E2EE)، إدارة وصول قائمة على الأدوار والسياق (RBAC/ABAC)، وسجل تدقيق حي غير قابل للتعديل لكل حركة.',
      icon: Lock,
      color: 'text-purple-400 bg-purple-950/60 border-purple-800',
    },
    {
      title: 'معيارية FHIR و HL7 الدولية',
      desc: 'توافق كامل مع بروتوكولات HL7 v2/v3 و FHIR R4 لتسهيل نقل البيانات السريرية عبر المستشفيات والحدود الدولية دون فقدان الدقة.',
      icon: Globe2,
      color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
    },
    {
      title: 'فصل بيانات الأجهزة الحيوية',
      desc: 'القراءة الحيوية الواردة من أجهزة إنترنت الأشياء الطبية (IoT Telemetry) لا تعد تشخيصاً بحد ذاتها، بل تدرج ضمن سجل المراقبة التحليلي للطبيب.',
      icon: Cpu,
      color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800',
    },
    {
      title: 'أبحاث آمنة مجهولة الهوية',
      desc: 'المشاركة في الأبحاث السريرية والتدريب الطبي تتم بموافقة صريحة مسبقة من المريض، مع تجريد البيانات بالكامل من المعرفات الشخصية (De-identification).',
      icon: Layers,
      color: 'text-rose-400 bg-rose-950/60 border-rose-800',
    },
  ];

  return (
    <section className="py-16 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-teal-400 bg-teal-950 border border-teal-800/80 px-3 py-1 rounded-full uppercase tracking-wider">
            المبادئ التأسيسية
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            {t('whyTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {t('whySubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {principles.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 space-y-4 transition shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-md ${item.color}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] text-teal-400 font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>معتمد برمجياً في الكود (Architecturally Enforced)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
