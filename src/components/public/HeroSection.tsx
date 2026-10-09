import React from 'react';
import {
  Activity,
  Shield,
  ArrowRight,
  Flame,
  Stethoscope,
  Building2,
  Lock,
  Sparkles,
  Globe2,
  Radio,
  CheckCircle2,
  Users
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

interface HeroSectionProps {
  onStart: () => void;
  onExplore: () => void;
  onLogin: () => void;
  onServices: () => void;
  onEmergency: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStart,
  onExplore,
  onLogin,
  onServices,
  onEmergency,
}) => {
  const { t, language } = useTranslation();

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-teal-500/15 via-indigo-600/15 to-purple-600/10 blur-[130px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
          {/* Official Accreditation Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-950/70 text-teal-300 border border-teal-500/40 shadow-sm">
              <Activity className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              <span>Lifex-AI Global Health Network v0.1.0</span>
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 text-slate-300 border border-slate-700/60">
              <span>المالك:</span>
              <strong className="text-white">{t('owner')}</strong>
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/70 text-indigo-300 border border-indigo-700/50">
              <span>الإشراف:</span>
              <strong className="text-white">{t('supervisor')}</strong>
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            <span className="bg-gradient-to-r from-teal-400 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
              Lifex-AI
            </span>
            <br />
            <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-100">
              {language === 'ar' ? 'الشبكة الصحية العالمية بالذكاء الصناعي' : 'Global Health Network'}
            </span>
          </h1>

          {/* Core Description Quote */}
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl">
            "شبكة صحية عالمية تربط الإنسان والرعاية الصحية والأجهزة والبيانات والذكاء الصناعي ضمن منصة واحدة آمنة."
          </p>

          {/* Mandatory Clinical Disclaimer Banner */}
          <div className="w-full max-w-2xl p-3.5 rounded-xl bg-slate-900/90 border border-amber-600/40 text-amber-300/90 text-xs text-right leading-normal flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong>المبدأ التأسيسي:</strong> Lifex-AI منصة دعم صحي ومعلوماتي وتقني، وليست بديلاً عن الطبيب أو المختص الصحي. يمنع الموقع ادعاء التشخيص الطبي المستقل أو وصف العلاج أو اتخاذ القرارات السريرية النهائية عبر الذكاء الاصطناعي.
            </p>
          </div>

          {/* 5 Main Action Buttons Required by Brief */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {/* 1. ابدأ الآن */}
            <button
              onClick={onStart}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 font-black text-sm shadow-lg shadow-teal-500/25 transition active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>{t('heroCtaStart')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* 2. استكشف Lifex-AI */}
            <button
              onClick={onExplore}
              className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-sm transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Globe2 className="w-4 h-4 text-teal-400" />
              <span>{t('heroCtaExplore')}</span>
            </button>

            {/* 3. تسجيل الدخول */}
            <button
              onClick={onLogin}
              className="px-5 py-3 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/60 font-bold text-sm transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>{t('heroCtaLogin')}</span>
            </button>

            {/* 4. الخدمات الصحية */}
            <button
              onClick={onServices}
              className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-sm transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Stethoscope className="w-4 h-4 text-purple-400" />
              <span>{t('heroCtaServices')}</span>
            </button>

            {/* 5. الطوارئ */}
            <button
              onClick={onEmergency}
              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm shadow-lg shadow-rose-950/60 animate-pulse transition active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Flame className="w-4 h-4" />
              <span>{t('heroCtaEmergency')}</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="w-full max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 text-center">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-xl sm:text-2xl font-black text-teal-400">100%</div>
              <div className="text-[11px] text-slate-400">فصل تام للملكية (Zero Leaks)</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-xl sm:text-2xl font-black text-indigo-400">FHIR R4</div>
              <div className="text-[11px] text-slate-400">تكامل معياري للمختبرات</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-xl sm:text-2xl font-black text-purple-400">24 / 7</div>
              <div className="text-[11px] text-slate-400">استجابة طوارئ ومراقبة IoT</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-xl sm:text-2xl font-black text-emerald-400">AES-256</div>
              <div className="text-[11px] text-slate-400">تشفير سيادي وموافقة صريحة</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
