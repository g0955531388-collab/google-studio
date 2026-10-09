import React, { useState } from 'react';
import {
  User,
  Stethoscope,
  Building2,
  FlaskConical,
  Pill,
  Radio,
  Sparkles,
  Flame,
  GraduationCap,
  ArrowDown,
  ShieldCheck,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

export const GlobalNetworkFlow: React.FC = () => {
  const { t, language } = useTranslation();
  const [selectedNode, setSelectedNode] = useState<number>(0);

  const nodes = [
    {
      id: 'patient',
      icon: User,
      nameAr: 'Patient (المريض والأسرة)',
      nameEn: 'Patient & Family',
      role: 'مالك الموافقة والسيادة على السجل',
      ownership: 'المريض يملك حق الموافقة (Consent) وتحديد نطاق المشاركة وسحبها فورياً.',
      color: 'from-teal-500 to-emerald-600',
      badge: 'Sovereign Consent Owner',
    },
    {
      id: 'doctor',
      icon: Stethoscope,
      nameAr: 'Doctor (الطبيب المعالج)',
      nameEn: 'Treating Physician',
      role: 'تقييم سريري بشري واستشارات تخصصية',
      ownership: 'الطبيب يصل فقط للنطاق المصرح به بالموافقة. الوصول يُسجل في الـ Audit Trail فوراً.',
      color: 'from-blue-500 to-indigo-600',
      badge: 'Authorized Clinical Scope',
    },
    {
      id: 'hospital',
      icon: Building2,
      nameAr: 'Hospital (المستشفى والعمليات)',
      nameEn: 'Hospital & Surgery',
      role: 'إدارة التنويم والعمليات والعناية الفائقة',
      ownership: 'المستشفى يملك سجل التنويم الداخلي الأصلي. لا يصبح مالكاً لكامل تاريخ المريض.',
      color: 'from-indigo-600 to-purple-600',
      badge: 'Canonical Hospital Domain',
    },
    {
      id: 'lab',
      icon: FlaskConical,
      nameAr: 'Laboratory (المختبرات والتحاليل)',
      nameEn: 'Laboratory & Pathology',
      role: 'سحب العينات وتوثيق النتائج المعيارية',
      ownership: 'النتيجة الأصلية تبقى تابعة للمختبر (ISO 15189) وتصدر بمعيار FHIR R4 الصارم.',
      color: 'from-purple-600 to-pink-600',
      badge: 'Canonical Lab Domain (FHIR)',
    },
    {
      id: 'pharmacy',
      icon: Pill,
      nameAr: 'Pharmacy (الصيدلية والدواء)',
      nameEn: 'Pharmacy & Dispensing',
      role: 'صرف الدواء وتتبع أرقام الدفعات والاستدعاء',
      ownership: 'فصل تام: الوصفة (Prescription) ≠ الصرف (Dispense) ≠ تناول الدواء (Taken).',
      color: 'from-pink-600 to-rose-600',
      badge: 'Canonical Dispense Ledger',
    },
    {
      id: 'devices',
      icon: Radio,
      nameAr: 'Medical Devices (الأجهزة الطبية IoT)',
      nameEn: 'Medical Devices IoT',
      role: 'بث القياسات الحيوية المستمرة (ECG, SpO2, CGM)',
      ownership: 'قاعدة هندسية: قراءة الجهاز الحيوية (Reading) ≠ التشخيص السريري (Diagnosis).',
      color: 'from-cyan-600 to-blue-600',
      badge: 'Telemetry Stream Layer',
    },
    {
      id: 'ai',
      icon: Sparkles,
      nameAr: 'AI (الذكاء الصحي المساند)',
      nameEn: 'Supportive AI Engine',
      role: 'مساعد بحث، فهم وثائق، وفرز أولي بمعايير دقيقة',
      ownership: 'قاعدة ثابتة: AI ≠ Doctor. الذكاء الاصطناعي لا يملك قواعد بيانات سريرية مباشرة.',
      color: 'from-violet-600 to-purple-800',
      badge: 'Non-Diagnostic Assistant',
    },
    {
      id: 'emergency',
      icon: Flame,
      nameAr: 'Emergency (الطوارئ والإسعاف)',
      nameEn: 'Emergency & Ambulance',
      role: 'تنسيق البلاغات، الإسعاف، وتجهيز غرف الإنعاش',
      ownership: 'التنسيق الإسعافي (Coordination) يسهل الوصول الآني ولا يلغي الفحص الميداني.',
      color: 'from-red-600 to-amber-600',
      badge: 'Rapid Response Protocol',
    },
    {
      id: 'research',
      icon: GraduationCap,
      nameAr: 'Research (البحث الطبي والتعليم)',
      nameEn: 'Research & Academia',
      role: 'أبحاث التجارب السريرية وتطوير المعرفة الطبية',
      ownership: 'بيانات مجهولة الهوية بالكامل (Anonymized) خاضعة لموافقة صريحة وأخلاقيات البحث.',
      color: 'from-emerald-600 to-teal-700',
      badge: 'Consented De-identified Cohorts',
    },
  ];

  return (
    <section id="network" className="py-16 bg-slate-950/60 border-t border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-950 text-teal-300 border border-teal-800/60">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>بنية الشبكة الصحية العالمية المترابطة</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {t('flowTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {t('flowSubtitle')}
          </p>
        </div>

        {/* Visual Pipeline Flow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-9 gap-2">
          {nodes.map((node, idx) => {
            const Icon = node.icon;
            const isSelected = selectedNode === idx;
            return (
              <div
                key={node.id}
                onClick={() => setSelectedNode(idx)}
                className={`group cursor-pointer rounded-2xl p-3.5 border transition flex flex-col items-center text-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-slate-900 border-teal-500 shadow-xl shadow-teal-500/10 ring-2 ring-teal-500/30'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-mono text-slate-500 font-bold">
                    0{idx + 1}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  )}
                </div>

                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${node.color} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white leading-tight">
                    {language === 'ar' ? node.nameAr.split('(')[0] : node.nameEn}
                  </h3>
                  <span className="block text-[10px] text-teal-400 font-medium">
                    {node.badge}
                  </span>
                </div>

                {idx < nodes.length - 1 && (
                  <div className="hidden lg:block text-slate-600 pt-1">
                    <ArrowDown className="w-3.5 h-3.5 -rotate-90 group-hover:text-teal-400 transition" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Node Deep Dive Inspector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${nodes[selectedNode].color} flex items-center justify-center text-white font-bold shadow-md`}
              >
                {React.createElement(nodes[selectedNode].icon, { className: 'w-6 h-6' })}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white">
                    {language === 'ar' ? nodes[selectedNode].nameAr : nodes[selectedNode].nameEn}
                  </h3>
                  <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-teal-300">
                    {nodes[selectedNode].badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {nodes[selectedNode].role}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-800/40 px-3 py-1.5 rounded-xl">
              <Info className="w-4 h-4 shrink-0" />
              <span>مبدأ السيادة: لا تداخل في المصادر الأصلية (No Canonical Conflicts)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-xs leading-relaxed text-slate-300">
            <div className="space-y-1.5">
              <h4 className="font-bold text-white text-sm">سياسة حيازة البيانات والمسؤولية:</h4>
              <p className="text-slate-400">{nodes[selectedNode].ownership}</p>
            </div>
            <div className="space-y-1.5 p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-[11px]">
              <div className="text-teal-400 font-bold">معيار التدقيق (Audit Rule):</div>
              <div className="text-slate-400">
                ActorRole: {nodes[selectedNode].id.toUpperCase()} → Policy: POL-SOVEREIGN-{nodes[selectedNode].id.toUpperCase()}
              </div>
              <div className="text-slate-500">
                Outcome: STRICT_AUTHORIZATION_REQUIRED | Encryption: TLS 1.3 / AES-256
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
