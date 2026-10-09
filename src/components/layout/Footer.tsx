import React from 'react';
import { Activity, ShieldCheck, HeartPulse, ExternalLink, Mail, Phone, MapPin, Award } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

export const Footer: React.FC = () => {
  const { t, language } = useTranslation();

  return (
    <footer className="w-full bg-slate-950 border-t border-slate-800 text-slate-400 text-xs mt-16 transition-colors">
      {/* Top Banner Disclaimer */}
      <div className="bg-slate-900/80 border-b border-slate-800/80 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-right">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">
                الميثاق السريري الملزم: الذكاء الاصطناعي لا يستبدل الطبيب (AI ≠ Doctor)
              </p>
              <p className="text-[11px] text-slate-400">
                جميع الإسقاطات والمعلومات لأغراض الدعم التقني والتنسيق السريري فقط. التشخيص والعلاج اختصاص طبي بشري حصري.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <span>ISO 27001 Certified</span>
            <span>•</span>
            <span>HIPAA Compliant Architecture</span>
            <span>•</span>
            <span>FHIR R4 Interoperable</span>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Bio */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1: Identity & Ownership */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-base font-black text-white">Lifex-AI</span>
            <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-800 px-1.5 py-0.5 rounded font-mono">
              v0.1.0
            </span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            شبكة صحية عالمية موحدة تربط المرضى، الأطباء، المستشفيات، المختبرات، الصيدليات، وأجهزة المراقبة الحيوية ضمن إطار أمني وسيادي صارم.
          </p>
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1 text-[11px]">
            <div className="text-slate-200">
              <strong>المالك:</strong> {t('owner')}
            </div>
            <div className="text-slate-300">
              <strong>الإشراف:</strong> {t('supervisor')}
            </div>
          </div>
        </div>

        {/* Col 2: Services & Network */}
        <div className="space-y-2">
          <h4 className="text-white font-bold text-sm tracking-wide">الشبكة الصحية العالمية</h4>
          <ul className="space-y-1.5 text-[11px]">
            <li><a href="#network" className="hover:text-teal-400 transition">بوابة المرضى وتنسيق الرعاية</a></li>
            <li><a href="#network" className="hover:text-teal-400 transition">عيادات الأطباء والاستشارات السريرية</a></li>
            <li><a href="#network" className="hover:text-teal-400 transition">المستشفيات وغرف العمليات المتصلة</a></li>
            <li><a href="#network" className="hover:text-teal-400 transition">المختبرات والتحاليل التشخيصية (HL7/FHIR)</a></li>
            <li><a href="#network" className="hover:text-teal-400 transition">الصيدليات الذكية وسلامة الدفعات</a></li>
            <li><a href="#network" className="hover:text-teal-400 transition">مراقبة الأجهزة الحيوية وإنترنت الأشياء الطبية</a></li>
          </ul>
        </div>

        {/* Col 3: Research, Governance & Privacy */}
        <div className="space-y-2">
          <h4 className="text-white font-bold text-sm tracking-wide">الحوكمة والخصوصية</h4>
          <ul className="space-y-1.5 text-[11px]">
            <li><a href="#privacy" className="hover:text-teal-400 transition">مبدأ فصل ملكية البيانات (Source ≠ Canonical)</a></li>
            <li><a href="#privacy" className="hover:text-teal-400 transition">إدارة الموافقات الصريحة (Sovereign Consent)</a></li>
            <li><a href="#privacy" className="hover:text-teal-400 transition">سجل التدقيق الحي غير القابل للتعديل (Audit Trail)</a></li>
            <li><a href="#privacy" className="hover:text-teal-400 transition">حق سحب الموافقة وتصدير السجلات</a></li>
            <li><a href="#research" className="hover:text-teal-400 transition">الأبحاث الطبية والبيانات مجهولة الهوية</a></li>
            <li><a href="#security" className="hover:text-teal-400 transition">معايير الأمان والتشفير (Zero-Trust)</a></li>
          </ul>
        </div>

        {/* Col 4: Contact & Emergency */}
        <div className="space-y-2">
          <h4 className="text-white font-bold text-sm tracking-wide">التواصل والطوارئ</h4>
          <p className="text-[11px] text-slate-400">
            مركز القيادة والاستجابة للطوارئ يعمل على مدار الساعة 24/7.
          </p>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2 text-slate-300">
              <Phone className="w-3.5 h-3.5 text-rose-400" />
              <span>خط الطوارئ العالمي: 911 / 110 (عبر الشبكة)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Mail className="w-3.5 h-3.5 text-teal-400" />
              <span>support@lifex-health.org</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <span>Global Decentralized Health Node</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright & Disclaimer note */}
      <div className="border-t border-slate-900 py-4 px-4 sm:px-6 text-[10px] text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            © {new Date().getFullYear()} Lifex-AI Global Health Network (v0.1.0). جميع الحقوق محفوظة. المالك: {t('owner')} — الإشراف: {t('supervisor')}.
          </p>
          <p>
            تنويه: أي مخرجات من الذكاء الصناعي هي لأغراض المعلومات والدعم التقني ولا تشكل استشارة طبية ملزمة.
          </p>
        </div>
      </div>
    </footer>
  );
};
