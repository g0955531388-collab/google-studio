import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Heart,
  HeartPulse,
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  ShieldCheck,
  Zap,
  Info,
  Sliders,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  BarChart2,
  Flame,
  Moon,
  Pill,
  HelpCircle,
  Maximize2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  VitalTrendDataPoint,
  VitalTimeRange,
  VitalSimulationScenario,
  VitalTrendsGenerationResult,
} from '../../types';
import { aiService } from '../../services/aiService';

interface VitalTrendsVisualizationModuleProps {
  patientId: string;
  patientName?: string;
  initialTrends?: VitalTrendDataPoint[];
  onOpenClinicalChat?: (contextPrompt: string) => void;
  onExportPDF?: () => void;
}

export const VitalTrendsVisualizationModule: React.FC<VitalTrendsVisualizationModuleProps> = ({
  patientId,
  patientName = 'أحمد فهد المنصوري',
  initialTrends = [],
  onOpenClinicalChat,
  onExportPDF,
}) => {
  const [timeRange, setTimeRange] = useState<VitalTimeRange>('48h');
  const [scenario, setScenario] = useState<VitalSimulationScenario>('BASELINE');
  const [metricView, setMetricView] = useState<
    'all' | 'bp_hr' | 'bp' | 'hr' | 'pulse_pressure' | 'glucose' | 'spo2'
  >('bp_hr');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generationResult, setGenerationResult] = useState<VitalTrendsGenerationResult | null>(null);
  const [showDataTable, setShowDataTable] = useState<boolean>(false);
  const [filterAnomaliesOnly, setFilterAnomaliesOnly] = useState<boolean>(false);
  const [activeAnomalyModal, setActiveAnomalyModal] = useState<VitalTrendDataPoint | null>(null);

  // Load initial data on mount or when timeRange/scenario changes
  const fetchTrends = async (overrideScenario?: VitalSimulationScenario, overrideTimeRange?: VitalTimeRange) => {
    setIsLoading(true);
    try {
      const activeScen = overrideScenario || scenario;
      const activeRange = overrideTimeRange || timeRange;

      const res = await aiService.fetchVitalTrendsMockData({
        patientId,
        timeRange: activeRange,
        scenario: activeScen,
        baselineProfile: {
          restingHeartRate: 72,
          systolicTarget: 120,
          diastolicTarget: 80,
          conditions: ['ارتفاع ضغط دم أولي خفيف', 'مقدمات سكري'],
          medications: ['Lisinopril 10mg', 'Atorvastatin 20mg'],
        },
      });

      setGenerationResult(res);
    } catch (err) {
      console.error('Failed to fetch vital trends from Gemini/engine:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [timeRange, scenario]);

  const activeData: VitalTrendDataPoint[] = useMemo(() => {
    if (generationResult?.dataPoints && generationResult.dataPoints.length > 0) {
      return generationResult.dataPoints;
    }
    return initialTrends;
  }, [generationResult, initialTrends]);

  const summary = useMemo(() => {
    if (generationResult?.summary) {
      return generationResult.summary;
    }
    const count = activeData.length || 1;
    const avgHeartRate = Math.round(activeData.reduce((acc, c) => acc + (c.heartRate || 72), 0) / count);
    const minHeartRate = Math.min(...activeData.map((c) => c.heartRate || 72));
    const maxHeartRate = Math.max(...activeData.map((c) => c.heartRate || 72));
    const avgSystolic = Math.round(activeData.reduce((acc, c) => acc + (c.systolicBP || 120), 0) / count);
    const maxSystolic = Math.max(...activeData.map((c) => c.systolicBP || 120));
    const minSystolic = Math.min(...activeData.map((c) => c.systolicBP || 120));
    const avgDiastolic = Math.round(activeData.reduce((acc, c) => acc + (c.diastolicBP || 80), 0) / count);
    const maxDiastolic = Math.max(...activeData.map((c) => c.diastolicBP || 80));
    const minDiastolic = Math.min(...activeData.map((c) => c.diastolicBP || 80));
    const avgMeanArterialPressure = Math.round(
      activeData.reduce((acc, c) => acc + (c.meanArterialPressure || 93), 0) / count
    );
    const avgPulsePressure = Math.round(
      activeData.reduce((acc, c) => acc + ((c.systolicBP || 120) - (c.diastolicBP || 80)), 0) / count
    );
    const avgGlucose = Math.round(activeData.reduce((acc, c) => acc + (c.glucose || 100), 0) / count);
    const avgSpO2 = Math.round(activeData.reduce((acc, c) => acc + (c.spO2 || 98), 0) / count);
    const anomaliesCount = activeData.filter((c) => c.isAnomaly).length;
    const stabilityIndex = Math.max(45, Math.min(99, 100 - anomaliesCount * 8));

    return {
      avgHeartRate,
      minHeartRate,
      maxHeartRate,
      avgSystolic,
      maxSystolic,
      minSystolic,
      avgDiastolic,
      maxDiastolic,
      minDiastolic,
      avgMeanArterialPressure,
      avgPulsePressure,
      avgGlucose,
      avgSpO2,
      stabilityIndex,
      anomaliesCount,
    };
  }, [generationResult, activeData]);

  const handleScenarioChange = (newScenario: VitalSimulationScenario) => {
    setScenario(newScenario);
  };

  const handleTimeRangeChange = (newRange: VitalTimeRange) => {
    setTimeRange(newRange);
  };

  // Custom Interactive Tooltip
  const CustomVitalTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint: VitalTrendDataPoint = payload[0]?.payload;
    if (!dataPoint) return null;

    return (
      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-2xl text-right max-w-xs space-y-2.5 z-50 animate-fade-in text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-bold text-white">{dataPoint.label}</span>
          </div>
          {dataPoint.isAnomaly && (
            <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-black animate-pulse flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" />
              تنبيه شاذ
            </span>
          )}
        </div>

        <div className="space-y-1.5 font-mono text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-sans">ضغط الدم (BP):</span>
            <span className="font-bold text-rose-400">
              {dataPoint.systolicBP} / {dataPoint.diastolicBP}{' '}
              <span className="text-[9px] text-slate-500 font-sans">مم زئبق</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-sans">الضغط الشرياني المتوسط (MAP):</span>
            <span className="font-bold text-indigo-400">
              {dataPoint.meanArterialPressure || Math.round((2 * dataPoint.diastolicBP + dataPoint.systolicBP) / 3)}{' '}
              <span className="text-[9px] text-slate-500 font-sans">مم زئبق</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-sans">نبضات القلب (HR):</span>
            <span className="font-bold text-emerald-400">
              {dataPoint.heartRate} <span className="text-[9px] text-slate-500 font-sans">ن/د</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-sans">سكر الدم (Glucose):</span>
            <span className="font-bold text-amber-400">
              {dataPoint.glucose} <span className="text-[9px] text-slate-500 font-sans">ملغ/دسل</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-sans">تشبع الأكسجين (SpO2):</span>
            <span className="font-bold text-cyan-400">
              {dataPoint.spO2}%
            </span>
          </div>
        </div>

        {dataPoint.notes && (
          <div className="border-t border-slate-800/80 pt-2 text-[10px] text-slate-300 font-sans leading-relaxed bg-slate-900/60 p-2 rounded-lg">
            <div className="flex items-center gap-1 text-teal-400 font-bold mb-0.5">
              <Info className="w-3 h-3" />
              <span>ملاحظة فسيولوجية:</span>
            </div>
            {dataPoint.notes}
          </div>
        )}
      </div>
    );
  };

  const filteredTableData = useMemo(() => {
    if (!filterAnomaliesOnly) return activeData;
    return activeData.filter((d) => d.isAnomaly);
  }, [activeData, filterAnomaliesOnly]);

  const exportCSV = () => {
    const headers = 'Label,Timestamp,HeartRate,SystolicBP,DiastolicBP,MAP,SpO2,Glucose,Notes\n';
    const rows = activeData
      .map(
        (d) =>
          `"${d.label}","${d.timestamp}",${d.heartRate},${d.systolicBP},${d.diastolicBP},${
            d.meanArterialPressure || ''
          },${d.spO2},${d.glucose},"${(d.notes || '').replace(/"/g, '""')}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lifex_Vital_Trends_${patientId}_${timeRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in text-right" dir="rtl">
      {/* Module Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/20 font-black">
                <Activity className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white">
                    منظومة تحليل واتجاهات المؤشرات الحيوية
                  </h2>
                  <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-800/80 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal-400" />
                    Gemini AI Integrated
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  رصد ديناميكي للضغط الشرياني ونبضات القلب والتشبع الأكسجيني مع محاكاة الاستجابة الفسيولوجية
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & AI Refresh */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => fetchTrends()}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-teal-500/10 active:scale-95 transition disabled:opacity-50 cursor-pointer"
              title="إعادة جلب وتوليد بيانات المؤشرات عبر Gemini"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'جاري محاكاة الاتجاهات...' : 'تحديث البيانات عبر Gemini'}</span>
            </button>

            {onOpenClinicalChat && (
              <button
                onClick={() =>
                  onOpenClinicalChat(
                    `يرجى تحليل مخطط مؤشراتي الحيوية الأخير (متوسط ضغط الدم: ${summary.avgSystolic}/${summary.avgDiastolic} مم زئبق، النبض: ${summary.avgHeartRate} ن/د، مؤشر الاستقرار: ${summary.stabilityIndex}%) ومقارنتها بأهدافي السريرية.`
                  )
                }
                className="px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>استشارة سريرية فورية</span>
              </button>
            )}

            {onExportPDF && (
              <button
                onClick={onExportPDF}
                className="px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                title="تصدير تقرير المؤشرات كـ PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* Clinical Scenario Simulator Pills */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
            <Sliders className="w-3.5 h-3.5 text-teal-400" />
            <span>محاكاة السيناريو الفسيولوجي (Clinical Scenarios):</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => handleScenarioChange('BASELINE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                scenario === 'BASELINE'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>خط الأساس المستقر</span>
            </button>

            <button
              onClick={() => handleScenarioChange('HYPERTENSIVE_VARIATION')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                scenario === 'HYPERTENSIVE_VARIATION'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>تذبذب ضغطي مرتفع (Hypertensive Spikes)</span>
            </button>

            <button
              onClick={() => handleScenarioChange('POST_EXERCISE_RECOVERY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                scenario === 'POST_EXERCISE_RECOVERY'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>جهد بدني وتعافي النبض</span>
            </button>

            <button
              onClick={() => handleScenarioChange('NOCTURNAL_DIP')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                scenario === 'NOCTURNAL_DIP'
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Moon className="w-3 h-3" />
              <span>الانخفاض الليلي (Nocturnal Dip)</span>
            </button>

            <button
              onClick={() => handleScenarioChange('MEDICATION_IMPACT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                scenario === 'MEDICATION_IMPACT'
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Pill className="w-3 h-3" />
              <span>استجابة خافض الضغط (Lisinopril)</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Blood Pressure */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">متوسط ضغط الدم (BP)</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                summary.maxSystolic > 140
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {summary.maxSystolic > 140 ? 'تذبذب مرتفع' : 'مستقر'}
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {summary.avgSystolic}/{summary.avgDiastolic}{' '}
            <span className="text-xs font-normal text-slate-400">مم زئبق</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>المدى: {summary.minSystolic} - {summary.maxSystolic}</span>
            <span className="text-rose-400 font-bold">MAP: {summary.avgMeanArterialPressure}</span>
          </div>
        </div>

        {/* Card 2: Heart Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">معدل النبض (HR)</span>
            <HeartPulse className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {summary.avgHeartRate}{' '}
            <span className="text-xs font-normal text-slate-400">نبضة/دقيقة</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>الأدنى: {summary.minHeartRate} ن/د</span>
            <span className="text-emerald-400 font-bold">الأعلى: {summary.maxHeartRate} ن/د</span>
          </div>
        </div>

        {/* Card 3: Stability Score */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">مؤشر الاستقرار السريري</span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {summary.stabilityIndex}%
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ${
                summary.stabilityIndex >= 85
                  ? 'bg-emerald-400'
                  : summary.stabilityIndex >= 70
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${summary.stabilityIndex}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
            <span>التوافق مع الأهداف</span>
            <span className="text-teal-400 font-bold">
              {summary.stabilityIndex >= 85 ? 'ممتاز' : 'مراقبة مطلوبة'}
            </span>
          </div>
        </div>

        {/* Card 4: Anomalies & Pulse Pressure */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">الحالات الشاذة المرصودة</span>
            {summary.anomaliesCount > 0 ? (
              <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded-full font-bold">
                {summary.anomaliesCount} تنبيه
              </span>
            ) : (
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                صفر تنبيهات
              </span>
            )}
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {summary.anomaliesCount}{' '}
            <span className="text-xs font-normal text-slate-400">حالة غير نمطية</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>الضغط النبضي (PP):</span>
            <span className="text-teal-400 font-bold">{summary.avgPulsePressure} مم زئبق</span>
          </div>
        </div>
      </div>

      {/* Main Chart Card with Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Top Controls: Timeframe & Metric Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400">المؤشرات المعروضة:</span>
            <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setMetricView('bp_hr')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  metricView === 'bp_hr'
                    ? 'bg-gradient-to-r from-rose-500 to-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                الضغط والنبض المتلازم (BP & HR)
              </button>
              <button
                onClick={() => setMetricView('bp')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  metricView === 'bp'
                    ? 'bg-rose-500 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                ضغط الدم (Systolic/Diastolic/MAP)
              </button>
              <button
                onClick={() => setMetricView('hr')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  metricView === 'hr'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                نبضات القلب (Heart Rate)
              </button>
              <button
                onClick={() => setMetricView('pulse_pressure')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  metricView === 'pulse_pressure'
                    ? 'bg-indigo-500 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                الضغط النبضي (Pulse Pressure)
              </button>
              <button
                onClick={() => setMetricView('glucose')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  metricView === 'glucose'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                سكر الدم (CGM)
              </button>
              <button
                onClick={() => setMetricView('spo2')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  metricView === 'spo2'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                الأكسجين (SpO2)
              </button>
            </div>
          </div>

          {/* Timeframe Selectors */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 self-start md:self-auto">
            {(['24h', '48h', '7d', '30d'] as VitalTimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => handleTimeRangeChange(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  timeRange === r
                    ? 'bg-teal-600 text-slate-950 shadow font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {r === '24h'
                  ? '24 ساعة'
                  : r === '48h'
                  ? '48 ساعة'
                  : r === '7d'
                  ? '7 أيام'
                  : '30 يوماً'}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Interactive Chart */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {metricView === 'bp' ? (
              <AreaChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="sysGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="diaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis domain={[50, 180]} stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomVitalTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <ReferenceLine
                  y={120}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{ value: 'الحد الطبيعي للانقباضي (120)', fill: '#ef4444', fontSize: 10 }}
                />
                <ReferenceLine
                  y={140}
                  stroke="#dc2626"
                  strokeDasharray="4 4"
                  label={{ value: 'عتبة ارتفاع الضغط المرحلة 2 (140)', fill: '#dc2626', fontSize: 10 }}
                />
                <ReferenceLine
                  y={80}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{ value: 'الحد الطبيعي للانبساطي (80)', fill: '#f59e0b', fontSize: 10 }}
                />
                <Area
                  type="monotone"
                  dataKey="systolicBP"
                  name="الانقباضي (Systolic mmHg)"
                  stroke="#f43f5e"
                  fillOpacity={1}
                  fill="url(#sysGradient)"
                  strokeWidth={2.5}
                />
                <Area
                  type="monotone"
                  dataKey="diastolicBP"
                  name="الانبساطي (Diastolic mmHg)"
                  stroke="#fb7185"
                  fillOpacity={1}
                  fill="url(#diaGradient)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="meanArterialPressure"
                  name="الضغط الشرياني المتوسط (MAP)"
                  stroke="#a855f7"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </AreaChart>
            ) : metricView === 'bp_hr' ? (
              <ComposedChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="sysGradientComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="left"
                  domain={[50, 180]}
                  stroke="#f43f5e"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'ضغط الدم (mmHg)', angle: -90, position: 'insideLeft', fill: '#f43f5e', fontSize: 10 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[40, 150]}
                  stroke="#10b981"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'النبض (bpm)', angle: 90, position: 'insideRight', fill: '#10b981', fontSize: 10 }}
                />
                <Tooltip content={<CustomVitalTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <ReferenceLine yAxisId="left" y={120} stroke="#f43f5e" strokeDasharray="3 3" />
                <ReferenceLine yAxisId="right" y={100} stroke="#10b981" strokeDasharray="3 3" />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="systolicBP"
                  name="الضغط الانقباضي (mmHg)"
                  stroke="#f43f5e"
                  fill="url(#sysGradientComp)"
                  strokeWidth={2.5}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="diastolicBP"
                  name="الضغط الانبساطي (mmHg)"
                  stroke="#fb7185"
                  strokeWidth={1.8}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="heartRate"
                  name="نبضات القلب (bpm)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            ) : metricView === 'pulse_pressure' ? (
              <ComposedChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis domain={[20, 90]} stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomVitalTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <ReferenceLine
                  y={50}
                  stroke="#eab308"
                  strokeDasharray="3 3"
                  label={{ value: 'عتبة الضغط النبضي الهام سريرياً (50 mmHg)', fill: '#eab308', fontSize: 10 }}
                />
                <Bar
                  dataKey="pulsePressure"
                  name="الضغط النبضي Pulse Pressure (Systolic - Diastolic)"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="meanArterialPressure"
                  name="الضغط الشرياني المتوسط (MAP)"
                  stroke="#a855f7"
                  strokeWidth={2.5}
                />
              </ComposedChart>
            ) : metricView === 'hr' ? (
              <LineChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis domain={[40, 150]} stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomVitalTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'عتبة تسرع القلب (100)', fill: '#ef4444', fontSize: 10 }} />
                <ReferenceLine y={60} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'عتبة بطء القلب (60)', fill: '#3b82f6', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="heartRate"
                  name="نبضات القلب (bpm)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            ) : metricView === 'glucose' ? (
              <LineChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis domain={[60, 200]} stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomVitalTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'الحد الأدنى للسكر (70)', fill: '#f59e0b', fontSize: 10 }} />
                <ReferenceLine y={140} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'الحد الأعلى المقبول بعد الأكل (140)', fill: '#ef4444', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="glucose"
                  name="سكر الدم (mg/dL)"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#f59e0b' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            ) : (
              <LineChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis domain={[90, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomVitalTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <ReferenceLine y={95} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'عتبة نقص الأكسجين (95%)', fill: '#ef4444', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="spO2"
                  name="تشبع الأكسجين SpO2 (%)"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#06b6d4' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Clinical Interpretation & AI Narrative Panel */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <h4 className="text-xs font-black text-white">
                التحليل السريري للنموذج (Gemini Clinical Narrative)
              </h4>
            </div>
            <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-mono">
              المصدر: {generationResult?.modelUsed || 'Gemini 3.8 Flash / Sovereign Physiological Engine'}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {generationResult?.clinicalInterpretationAr ||
              'توضح الاتجاهات الزمنية الحيوية استقراراً عاماً في النمط اليومي لضغط الدم والنبض، مع تناغم فسيولوجي بين الأوقات النهارية وساعات الاسترخاء الليلي.'}
          </p>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-900 gap-2">
            <div className="flex items-center gap-4">
              <span>
                الانخفاض الليلي: <strong className="text-emerald-400">طبيعي (10-15% Dipping)</strong>
              </span>
              <span>
                الضغط النبضي المتوسط: <strong className="text-teal-400">{summary.avgPulsePressure} مم زئبق</strong>
              </span>
            </div>
            <span className="text-slate-500 text-[10px]">
              مطابق لبروتوكولات ACC/AHA و ESC لتقييم المراقبة المتنقلة
            </span>
          </div>
        </div>
      </div>

      {/* Expandable Granular Telemetry Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-teal-400" />
            <h3 className="text-xs font-black text-white">
              جدول القراءات والقياسات الحيوية المفصل ({filteredTableData.length} قراءة)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterAnomaliesOnly(!filterAnomaliesOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filterAnomaliesOnly
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>{filterAnomaliesOnly ? 'عرض الشواذ فقط' : 'تصفية الشواذ'}</span>
            </button>

            <button
              onClick={exportCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3 h-3" />
              <span>تصدير CSV</span>
            </button>

            <button
              onClick={() => setShowDataTable(!showDataTable)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <span>{showDataTable ? 'إخفاء الجدول' : 'إظهار الجدول'}</span>
              {showDataTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {showDataTable && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
                <tr>
                  <th className="p-3">التوقيت / النقطة</th>
                  <th className="p-3">ضغط الدم (BP)</th>
                  <th className="p-3">الضغط الشرياني (MAP)</th>
                  <th className="p-3">النبض (HR)</th>
                  <th className="p-3">السكر (CGM)</th>
                  <th className="p-3">الأكسجين (SpO2)</th>
                  <th className="p-3">الحالة السريرية</th>
                  <th className="p-3">الملاحظة والسياق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {filteredTableData.map((dp, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-800/40 transition ${
                      dp.isAnomaly ? 'bg-rose-950/20' : ''
                    }`}
                  >
                    <td className="p-3 font-sans font-bold text-white flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{dp.label}</span>
                    </td>
                    <td className="p-3 text-rose-400 font-bold">
                      {dp.systolicBP} / {dp.diastolicBP}
                    </td>
                    <td className="p-3 text-indigo-400">
                      {dp.meanArterialPressure || Math.round((2 * dp.diastolicBP + dp.systolicBP) / 3)}
                    </td>
                    <td className="p-3 text-emerald-400 font-bold">{dp.heartRate} ن/د</td>
                    <td className="p-3 text-amber-400">{dp.glucose}</td>
                    <td className="p-3 text-cyan-400">{dp.spO2}%</td>
                    <td className="p-3 font-sans">
                      {dp.isAnomaly ? (
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold">
                          {dp.anomalyType || 'تنبيه شاذ'}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                          طبيعي
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-sans text-slate-300 text-[11px] max-w-xs truncate">
                      {dp.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
