import React from 'react';
import {
  Users,
  Stethoscope,
  Building2,
  FlaskConical,
  Pill,
  Radio,
  Flame,
  Home,
  HeartPulse,
  Brain,
  Apple,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Activity,
  Share2,
  Lock,
  Headphones
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

export const ServicesGrid: React.FC<{ onSelectPortal: (portalId: string) => void }> = ({ onSelectPortal }) => {
  const { language } = useTranslation();

  const services = [
    { id: 'patient', title: 'خدمات المرضى وتنسيق الرعاية', desc: 'إدارة السجل الصحي، المواعيد، الحساسيات، والتاريخ المرضي عبر إسقاط رقمي آمن.', icon: Users, color: 'text-teal-400 bg-teal-950/50' },
    { id: 'doctor', title: 'بوابة الأطباء والاستشارات', desc: 'إدارة اللقاءات السريرية، الملاحظات الطبية، والوصفات بنطاق موافقة صارم.', icon: Stethoscope, color: 'text-blue-400 bg-blue-950/50' },
    { id: 'hospital', title: 'المستشفيات والعمليات الجراحية', desc: 'إدارة الأقسام، الأسِرّة، التنويم، غرف العمليات، وجودة الرعاية السريرية.', icon: Building2, color: 'text-indigo-400 bg-indigo-950/50' },
    { id: 'lab', title: 'المختبرات والتحاليل التشخيصية', desc: 'إدارة العينات، القياسات، وتوثيق النتائج بمعيار FHIR R4 و HL7.', icon: FlaskConical, color: 'text-purple-400 bg-purple-950/50' },
    { id: 'pharmacy', title: 'الصيدليات الذكية وصرف الدواء', desc: 'تتبع المخزون، أرقام الدفعات، تاريخ الصلاحية، واستدعاء الأدوية.', icon: Pill, color: 'text-pink-400 bg-pink-950/50' },
    { id: 'devices', title: 'الأجهزة الطبية وإنترنت الأشياء', desc: 'بث المؤشرات الحيوية المستمرة (ECG, SpO2, ضغط، سكر) عن بعد.', icon: Radio, color: 'text-cyan-400 bg-cyan-950/50' },
    { id: 'emergency', title: 'الطوارئ والإسعاف السريع', desc: 'تنسيق البلاغات الطارئة، الإسعاف، وتجهيز غرف الإنعاش على مدار 24/7.', icon: Flame, color: 'text-rose-400 bg-rose-950/50' },
    { id: 'homecare', title: 'الرعاية الصحية المنزلية', desc: 'متابعة كبار السن، ذوي الاحتياجات الخاصة، ومقدمي الرعاية الميدانيين.', icon: Home, color: 'text-emerald-400 bg-emerald-950/50' },
    { id: 'rehab', title: 'التأهيل والعلاج الطبيعي', desc: 'خطط إعادة التأهيل الحركي والوظيفي ومتابعة التقدم السريري.', icon: HeartPulse, color: 'text-amber-400 bg-amber-950/50' },
    { id: 'mental_health', title: 'الصحة النفسية والدعم الإرشادي', desc: 'استشارات نفسية آمنة بسرية تامة وتتبع مستويات الإجهاد والاستقرار.', icon: Brain, color: 'text-violet-400 bg-violet-950/50' },
    { id: 'nutrition', title: 'التغذية العلاجية والصحية', desc: 'برامج حمية مخصصة لمرضى السكري والضغط والسمنة بإشراف أخصائيين.', icon: Apple, color: 'text-lime-400 bg-lime-950/50' },
    { id: 'preventive', title: 'الصحة الوقائية والفحص المبكر', desc: 'تنبيهات الفحوصات الدورية، اللقاحات، والكشف المبكر عن الأمراض المزمنة.', icon: ShieldCheck, color: 'text-teal-400 bg-teal-950/50' },
    { id: 'research', title: 'البحث الطبي والتجارب السريرية', desc: 'أبحاث آمنة ببيانات مجهولة الهوية بموافقة مسبقة لتطوير العلاجات.', icon: GraduationCap, color: 'text-sky-400 bg-sky-950/50' },
    { id: 'education', title: 'التعليم والتثقيف الصحي', desc: 'محتوى طبي معتمد ومبسط لرفع الوعي الصحي المجتمعي ومكافحة الشائعات.', icon: GraduationCap, color: 'text-orange-400 bg-orange-950/50' },
    { id: 'ai', title: 'الذكاء الصناعي المساند', desc: 'مساعد معرفي لفهم الوثائق والبحث الطبي دون تشخيص مستقل.', icon: Sparkles, color: 'text-purple-400 bg-purple-950/50' },
    { id: 'rpm', title: 'مراقبة المرضى عن بعد (RPM)', desc: 'تحليل الاتجاهات الحيوية وإطلاق تنبيهات استباقية للطبيب المعالج.', icon: Activity, color: 'text-blue-400 bg-blue-950/50' },
    { id: 'hie', title: 'تبادل المعلومات الصحية (HIE)', desc: 'ربط السجلات الطبية بين مختلف المؤسسات الطبية وفق معايير عالمية.', icon: Share2, color: 'text-indigo-400 bg-indigo-950/50' },
    { id: 'privacy', title: 'حماية الخصوصية والموافقات', desc: 'إدارة صلاحيات الوصول، التشفير السيادي، وسجل التدقيق غير القابل للتعديل.', icon: Lock, color: 'text-teal-400 bg-teal-950/50' },
  ];

  return (
    <section id="services" className="py-16 bg-slate-900/30 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-teal-400 bg-teal-950 border border-teal-800/80 px-3 py-1 rounded-full uppercase tracking-wider">
            منظومة الخدمات الشاملة
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            18 قطاعاً صحياً متكاملاً في منصة واحدة
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            تم تصميم كل قطاع ليعمل باستقلالية تامة مع معايير ربط بينية صارمة تحمي خصوصية المريض وسيادة البيانات.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((svc) => {
            const Icon = svc.icon;
            return (
              <div
                key={svc.id}
                onClick={() => onSelectPortal(svc.id)}
                className="bg-slate-950/70 border border-slate-800/80 hover:border-teal-500/60 rounded-2xl p-5 space-y-3 transition cursor-pointer group shadow-lg hover:shadow-teal-950/20"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border border-slate-700/60 ${svc.color} group-hover:scale-105 transition`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-teal-300 transition">
                    {svc.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {svc.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
