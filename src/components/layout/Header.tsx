import React, { useState } from 'react';
import {
  Activity,
  Shield,
  Search,
  Globe,
  Sun,
  Moon,
  AlertCircle,
  Flame,
  User,
  Sliders,
  ChevronDown,
  Building2,
  Stethoscope,
  FlaskConical,
  Pill,
  Radio,
  FileCheck2,
  Lock,
  HeartPulse,
  Heart,
  Flower2
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { authService } from '../../services/authService';
import { UserRole } from '../../types';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenAuth: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenAuth,
  activeView,
  setActiveView,
}) => {
  const { t, language, setLanguage, theme, setTheme } = useTranslation();
  const session = authService.getSession();
  const [portalsMenuOpen, setPortalsMenuOpen] = useState(false);

  const cycleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('contrast');
    else setTheme('dark');
  };

  const portalOptions: Array<{ id: string; role: UserRole; labelAr: string; labelEn: string; icon: any }> = [
    { id: 'patient', role: 'patient', labelAr: 'بوابة المريض (Patient Portal)', labelEn: 'Patient Portal', icon: HeartPulse },
    { id: 'doctor', role: 'doctor', labelAr: 'بوابة الطبيب والعيادة (Doctor Portal)', labelEn: 'Doctor Portal', icon: Stethoscope },
    { id: 'hospital', role: 'hospital', labelAr: 'بوابة المستشفيات (Hospital Portal)', labelEn: 'Hospital Portal', icon: Building2 },
    { id: 'lab', role: 'laboratory', labelAr: 'بوابة المختبرات (Laboratory Portal)', labelEn: 'Laboratory Portal', icon: FlaskConical },
    { id: 'pharmacy', role: 'pharmacy', labelAr: 'بوابة الصيدليات (Pharmacy Portal)', labelEn: 'Pharmacy Portal', icon: Pill },
    { id: 'devices', role: 'patient', labelAr: 'إنترنت الأجهزة الحيوية (Devices IoT)', labelEn: 'Medical Devices IoT', icon: Radio },
    { id: 'privacy', role: 'patient', labelAr: 'مركز الخصوصية والموافقات (Privacy Center)', labelEn: 'Privacy & Consent', icon: Lock },
    { id: 'admin', role: 'administrator', labelAr: 'لوحة الإدارة والتدقيق (Admin & Audit)', labelEn: 'Admin & Audit Trail', icon: FileCheck2 },
    { id: 'organizations', role: 'organization', labelAr: 'المنظمات والجمعيات الإنسانية', labelEn: 'Organizations & Relief', icon: Heart },
    { id: 'women_health', role: 'patient', labelAr: 'صحة المرأة ورعاية الحمل', labelEn: "Women's Health & Care", icon: Flower2 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100 transition-colors">
      {/* Official Top Legal Disclaimer & Identity Bar */}
      <div className="bg-gradient-to-r from-teal-950/90 via-slate-900 to-indigo-950/90 border-b border-teal-800/40 px-3 py-1 text-[11px] text-teal-200/90">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white bg-teal-600/30 px-2 py-0.5 rounded text-[10px] border border-teal-500/40">
              v0.1.0 Official
            </span>
            <span className="font-semibold text-slate-200">المالك: {t('owner')}</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-300">الإشراف: {t('supervisor')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-300/95 font-medium">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{t('disclaimerBar')}</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div
          onClick={() => setActiveView('home')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 group-hover:scale-105 transition">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-white group-hover:text-teal-400 transition">
                {t('brandName')}
              </span>
              <span className="text-[10px] bg-indigo-950 border border-indigo-700/60 text-indigo-300 px-1.5 py-0.2 rounded font-mono">
                Global Network
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              {language === 'ar' ? 'نظام صحي عالمي بالذكاء الصناعي' : 'Global Health Intelligence'}
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveView('home')}
            className={`px-3 py-2 rounded-lg transition ${
              activeView === 'home'
                ? 'bg-teal-600/20 text-teal-300 border border-teal-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {t('navHome')}
          </button>

          <button
            onClick={() => setActiveView('network')}
            className={`px-3 py-2 rounded-lg transition ${
              activeView === 'network'
                ? 'bg-teal-600/20 text-teal-300 border border-teal-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {t('navNetwork')}
          </button>

          <button
            onClick={() => setActiveView('ai')}
            className={`px-3 py-2 rounded-lg transition ${
              activeView === 'ai'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {t('navAi')}
          </button>

          <button
            onClick={() => setActiveView('devices')}
            className={`px-3 py-2 rounded-lg transition ${
              activeView === 'devices'
                ? 'bg-teal-600/20 text-teal-300 border border-teal-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {t('navDevices')}
          </button>

          <button
            onClick={() => setActiveView('emergency')}
            className={`px-3 py-2 rounded-lg transition ${
              activeView === 'emergency'
                ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {t('navEmergency')}
          </button>

          <button
            onClick={() => setActiveView('privacy')}
            className={`px-3 py-2 rounded-lg transition ${
              activeView === 'privacy'
                ? 'bg-teal-600/20 text-teal-300 border border-teal-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {t('navPrivacy')}
          </button>

          {/* Portals Dropdown */}
          <div className="relative">
            <button
              onClick={() => setPortalsMenuOpen(!portalsMenuOpen)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
            >
              <span>{t('navPortals')}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {portalsMenuOpen && (
              <div
                onMouseLeave={() => setPortalsMenuOpen(false)}
                className="absolute top-full mt-1.5 w-64 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 space-y-1 animate-fade-in"
              >
                <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  بوابات المنظومة الطبية المستقلة
                </div>
                {portalOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        authService.switchRole(opt.role);
                        setActiveView(opt.id);
                        setPortalsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-800 hover:text-teal-300 transition text-right"
                    >
                      <Icon className="w-4 h-4 text-teal-400 shrink-0" />
                      <span className="truncate">{language === 'ar' ? opt.labelAr : opt.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2">
          {/* Global Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5"
            title="البحث الموحد المصرح به (Global Search)"
          >
            <Search className="w-4 h-4 text-teal-400" />
            <span className="hidden sm:inline text-xs font-medium text-slate-400">بحث...</span>
          </button>

          {/* Language Switch */}
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs font-bold"
            title="تبديل اللغة (Language Switch)"
          >
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          {/* Theme Mode Cycle */}
          <button
            onClick={cycleTheme}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition"
            title={`نمط العرض الحالي: ${theme}`}
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-teal-300" />
            ) : theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Sliders className="w-4 h-4 text-purple-400" />
            )}
          </button>

          {/* Fast Emergency Trigger */}
          <button
            onClick={() => setActiveView('emergency')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-950/60 animate-pulse transition active:scale-95"
          >
            <Flame className="w-4 h-4" />
            <span>{t('heroCtaEmergency')}</span>
          </button>

          {/* User Session / Auth Trigger */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 text-xs font-bold transition active:scale-95"
          >
            <User className="w-4 h-4" />
            <span className="max-w-[100px] truncate">
              {session ? session.name.split(' ')[0] : t('navLogin')}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
