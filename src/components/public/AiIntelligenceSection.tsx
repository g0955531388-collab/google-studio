import React, { useState } from 'react';
import {
  Sparkles,
  ShieldAlert,
  Search,
  FileText,
  Scan,
  TrendingUp,
  Activity,
  GitPullRequest,
  BookOpen,
  Send,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  Cpu
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { aiService } from '../../services/aiService';
import { AiQueryResponse } from '../../types';

export const AiIntelligenceSection: React.FC = () => {
  const { t, language } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AiQueryResponse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AiQueryResponse['category']>('INFORMATION_ASSIST');

  const capabilities = [
    {
      id: 'INFORMATION_ASSIST',
      titleAr: 'مساعد الاستفسارات الصحية',
      titleEn: 'Health Information Assistant',
      descAr: 'توضيح المفاهيم والمصطلحات والأسئلة الشائعة مع إحالة للطبيب دائماً.',
      icon: Sparkles,
      color: 'from-purple-500 to-indigo-600',
    },
    {
      id: 'LITERATURE_SEARCH',
      titleAr: 'بحث الأدبيات الطبية والمنشورات',
      titleEn: 'Medical Knowledge Search',
      descAr: 'استرجاع الدراسات الموثقة من PubMed وCochrane والأدلة الإرشادية.',
      icon: Search,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      id: 'DOCUMENT_SUMMARY',
      titleAr: 'فهم وتلخيص الوثائق السريرية',
      titleEn: 'Document Understanding',
      descAr: 'قراءة تقارير الخروج ونتائج التحاليل وتقديم ملخص أولي للطبيب.',
      icon: FileText,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'TRIAGE_PRECHECK',
      titleAr: 'مساندة الفرز والتحليل الأولي',
      titleEn: 'Triage & Care Coordination',
      descAr: 'فرز أولي لتحديد درجة الإلحاح دون إصدار تشخيص طبي نهائي.',
      icon: Activity,
      color: 'from-rose-500 to-amber-600',
    },
  ];

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const res = await aiService.askAssistant(prompt, selectedCategory);
      setResponse(res);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (q: string) => {
    setPrompt(q);
    setTimeout(() => {
      aiService.askAssistant(q, selectedCategory).then(setResponse);
    }, 100);
  };

  return (
    <section id="ai" className="py-16 bg-slate-900/60 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Section Header with Strict Rules */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black bg-purple-950 text-purple-300 border border-purple-800/70 shadow-sm">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Lifex-AI Intelligence (الذكاء الصحي المساند)</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white">
            {t('aiSectionTitle')}
          </h2>

          {/* Immutable Rule Banner */}
          <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl text-purple-200 font-bold text-xs flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{t('aiRuleBadge')}</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {t('aiSectionSubtitle')}
          </p>
        </div>

        {/* 4 Architectural Capability Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            const isSelected = selectedCategory === cap.id;
            return (
              <div
                key={cap.id}
                onClick={() => setSelectedCategory(cap.id as any)}
                className={`p-5 rounded-2xl border cursor-pointer transition flex flex-col justify-between gap-4 ${
                  isSelected
                    ? 'bg-slate-900 border-purple-500 shadow-xl shadow-purple-500/10 ring-2 ring-purple-500/20'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cap.color} flex items-center justify-center text-white shadow-md`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {language === 'ar' ? cap.titleAr : cap.titleEn}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {cap.descAr}
                    </p>
                  </div>
                </div>

                <div className="text-[11px] font-bold text-purple-400 flex items-center gap-1">
                  <span>وضع الفحص النشط</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Assistant Query Sandbox */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>محاكي الاستفسار الذكي مع توثيق المصدر وعدم اليقين (Provenance Engine)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                كل استعلام يخضع للمراجعة الرقابية ويسجل في الـ Audit Log دون تعديل مباشر في قواعد البيانات.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-purple-300 bg-purple-950/60 px-3 py-1 rounded-lg border border-purple-800/40">
              <span>Model: Lifex-Clinical-Assistant v0.1.0</span>
            </div>
          </div>

          {/* Quick Example Prompts */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">استفسارات سريعة:</span>
            <button
              type="button"
              onClick={() => handleQuickPrompt('ما هو المعدل الطبيعي لضغط الدم وما إرشادات القياس؟')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
            >
              معدل ضغط الدم الطبيعي
            </button>
            <button
              type="button"
              onClick={() => handleQuickPrompt('ما هي معايير تشخيص السكر التراكمي HbA1c؟')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
            >
              السكر التراكمي HbA1c
            </button>
            <button
              type="button"
              onClick={() => handleQuickPrompt('متى يستدعي الصداع الشديد التوجه الفوري للطوارئ؟')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
            >
              علامات خطورة الصداع
            </button>
          </div>

          {/* Prompt Form */}
          <form onSubmit={handleAsk} className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="اكتب استفسارك الصحي أو اسم التحليل أو السؤال التثقيفي هنا..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-900/50 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'جارٍ التحليل...' : 'استعلام'}</span>
            </button>
          </form>

          {/* AI Output Result Box with Full Provenance & Disclaimers */}
          {response && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 animate-fade-in">
              {/* Output Header with Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 text-xs">
                <div className="flex items-center gap-2 text-purple-300 font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>نتيجة المساعد الصحي المساند (Assistance Output)</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {new Date(response.timestamp).toLocaleTimeString('ar-EG')}
                  </span>
                  <span>الثقة: <strong className="text-emerald-400">{Math.round(response.confidenceScore * 100)}%</strong></span>
                  <span>عدم اليقين: <strong className="text-amber-400">{Math.round(response.uncertaintyScore * 100)}%</strong></span>
                </div>
              </div>

              {/* Main Response Text */}
              <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                {response.responseContent}
              </div>

              {/* Mandatory Medical Disclaimer Box */}
              <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg text-xs text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{response.medicalDisclaimer}</span>
              </div>

              {/* Provenance & Citations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-[11px]">
                {/* Sources / Citations */}
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="font-bold text-slate-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                    <span>المصادر والأدبيات المستند إليها:</span>
                  </div>
                  <ul className="space-y-1 text-slate-400 list-disc list-inside">
                    {response.sources.map((s, idx) => (
                      <li key={idx}>
                        {s.title} {s.pmid && <span className="text-purple-400 font-mono">[PMID: {s.pmid}]</span>}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Limitations */}
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-400" />
                    <span>القيود السريرية (Clinical Limitations):</span>
                  </div>
                  <ul className="space-y-1 text-slate-400 list-disc list-inside">
                    {response.limitations.map((lim, idx) => (
                      <li key={idx}>{lim}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Provenance Tag */}
              <div className="text-[10px] font-mono text-slate-500 border-t border-slate-800 pt-2 flex items-center justify-between">
                <span>Provenance: {response.provenance}</span>
                <span>QueryID: {response.queryId}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
