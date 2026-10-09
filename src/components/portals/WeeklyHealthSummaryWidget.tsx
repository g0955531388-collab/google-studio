import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Flame,
  Activity,
  Heart,
  Pill,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { aiService } from '../../services/aiService';
import { WeeklyHealthSummaryResponse } from '../../types';

interface WeeklyHealthSummaryWidgetProps {
  patientId: string;
  patientName?: string;
  onOpenClinicalChat?: () => void;
}

export const WeeklyHealthSummaryWidget: React.FC<WeeklyHealthSummaryWidgetProps> = ({
  patientId,
  patientName = 'أحمد فهد المنصوري',
  onOpenClinicalChat,
}) => {
  const [summaryData, setSummaryData] = useState<WeeklyHealthSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiService.generateWeeklyHealthSummary(patientId, patientName);
      setSummaryData(res);
    } catch (err: any) {
      console.error('Failed to load weekly health summary:', err);
      setError('تعذر تحميل التلخيص الصحي بالذكاء الاصطناعي حالياً.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [patientId]);

  const handleCopy = () => {
    if (!summaryData) return;
    const textToCopy = `الملخص السريري الأسبوعي (${summaryData.patientName}) - Lifex-AI Gemini 3.8 Flash\nتاريخ التوليد: ${new Date(summaryData.generatedAt).toLocaleDateString('ar-EG')}\n\n${summaryData.summary}\n\n${summaryData.disclaimer}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Render markdown-like sections safely and beautifully
  const renderFormattedSummary = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }
      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-xs font-black text-teal-300 mt-4 mb-2 flex items-center gap-1.5 border-b border-slate-800/80 pb-1">
            <span>{trimmed.replace('### ', '')}</span>
          </h4>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-sm font-black text-white mt-4 mb-2">
            {trimmed.replace('## ', '')}
          </h3>
        );
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
        const itemText = trimmed.replace(/^[-•*]\s*/, '');
        return (
          <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 my-1 pr-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
            <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(itemText) }} />
          </div>
        );
      }
      if (/^\d+\.\s/.test(trimmed)) {
        return (
          <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 my-1 pr-1">
            <span className="font-bold text-teal-400 text-[11px] shrink-0 mt-0.5">{trimmed.match(/^\d+\./)?.[0]}</span>
            <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed.replace(/^\d+\.\s*/, '')) }} />
          </div>
        );
      }
      if (trimmed.startsWith('---')) {
        return <hr key={idx} className="border-slate-800 my-3" />;
      }
      if (trimmed.startsWith('[أبرز خلاصات الأسبوع]:') || trimmed.startsWith('أبرز خلاصات الأسبوع:')) {
        return null; // Rendered in distinct takeaways block
      }
      return (
        <p
          key={idx}
          className="text-xs text-slate-300 leading-relaxed my-1.5"
          dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }}
        />
      );
    });
  };

  const formatInlineMarkdown = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-teal-200">$1</em>');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
      {/* Widget Header */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/20 border-b border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 shadow-inner">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>الملخص السريري الأسبوعي الذكي</span>
                <span className="text-[11px] font-normal text-slate-400 font-mono">Weekly AI Health Summary</span>
              </h3>
              <span className="text-[10px] bg-slate-950 text-teal-300 border border-teal-900/60 px-2 py-0.5 rounded font-mono font-bold">
                Gemini 3.8 Flash
              </span>
            </div>
            {/* Zero-pill unboxed metadata */}
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span>آخر 7 أيام</span>
              <span aria-hidden="true">·</span>
              <span>معدل الالتزام والاتجاهات الحيوية</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-300 font-medium">سياق سريري موثق</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={fetchSummary}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
            title="إعادة توليد التلخيص الأسبوعي بأحدث البيانات"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'جاري التحليل...' : 'تحديث'}</span>
          </button>

          <button
            onClick={handleCopy}
            disabled={!summaryData || loading}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
            title="نسخ نص التلخيص"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={isExpanded ? 'طي التقرير' : 'توسيع التقرير'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && !summaryData && (
        <div className="p-6 space-y-4 animate-pulse">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-800/60 rounded-xl" />
            ))}
          </div>
          <div className="space-y-2.5 pt-2">
            <div className="h-4 bg-slate-800/80 rounded w-3/4" />
            <div className="h-4 bg-slate-800/60 rounded w-5/6" />
            <div className="h-4 bg-slate-800/50 rounded w-2/3" />
            <div className="h-4 bg-slate-800/40 rounded w-4/5" />
          </div>
        </div>
      )}

      {/* Error View */}
      {error && !loading && (
        <div className="p-6 flex items-center justify-between text-xs text-rose-300 bg-rose-950/20 border-b border-rose-900/30">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchSummary}
            className="px-3 py-1 bg-rose-900/40 hover:bg-rose-900/60 text-white rounded-lg font-bold transition"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {summaryData && isExpanded && (
        <div className="p-5 space-y-5 animate-fade-in">
          {/* KPI Snapshot Row (Unboxed metadata, zero pill slop) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Metric 1: Medication Adherence */}
            <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>الالتزام الدوائي (7 أيام)</span>
                <Pill className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-white">{summaryData.metrics.weeklyAdherencePct}%</span>
                <span className="text-[10px] text-slate-400">
                  ({summaryData.metrics.totalDosesTaken}/{summaryData.metrics.totalDosesScheduled} جرعة)
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full"
                  style={{ width: `${summaryData.metrics.weeklyAdherencePct}%` }}
                />
              </div>
            </div>

            {/* Metric 2: Adherence Streak */}
            <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>سلسلة الانضباط</span>
                <Flame className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-amber-400">{summaryData.metrics.streakDays}</span>
                <span className="text-[10px] text-slate-400">أيام متتالية دون انقطاع</span>
              </div>
              <div className="text-[10px] text-emerald-400/90">
                <span>استقرار دوائي وتراكمي ممتاز</span>
              </div>
            </div>

            {/* Metric 3: Average Blood Pressure */}
            <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>متوسط ضغط الدم (7 أيام)</span>
                <Heart className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-white">{summaryData.metrics.avgBloodPressure}</span>
              </div>
              <div className="text-[10px] text-slate-400">
                <span>النبض: {summaryData.metrics.avgHeartRate} ن/د · سكر: {summaryData.metrics.avgGlucose} ملغ/دسل</span>
              </div>
            </div>

            {/* Metric 4: Clinical Status Assessment */}
            <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>التقييم السريري العام</span>
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-black text-emerald-400">
                  {summaryData.metrics.status === 'EXCELLENT' ? 'نموذجي ومستقر' : summaryData.metrics.status === 'STABLE' ? 'مستقر وضمن الهدف' : 'يحتاج لمتابعة'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                <span>درجة الثبات: {summaryData.metrics.vitalStabilityScore}/100</span>
              </div>
            </div>
          </div>

          {/* Key Takeaways Callout Card */}
          {summaryData.keyTakeaways && summaryData.keyTakeaways.length > 0 && (
            <div className="p-4 bg-teal-950/20 border border-teal-800/40 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-teal-300">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>أبرز خلاصات الأسبوع السريرية (Key Takeaways):</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                {summaryData.keyTakeaways.map((takeaway, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                    <span className="text-teal-400 font-bold shrink-0">✓</span>
                    <span>{takeaway}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Narrative Section */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4 space-y-2">
            {renderFormattedSummary(summaryData.summary)}
          </div>

          {/* Footer & Clinical Disclaimer */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{summaryData.disclaimer}</span>
            </div>
            {onOpenClinicalChat && (
              <button
                onClick={onOpenClinicalChat}
                className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition shrink-0 cursor-pointer"
              >
                <span>طرح استفسار للمساعد السريري الذكي ←</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
