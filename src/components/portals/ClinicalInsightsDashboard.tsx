import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Activity,
  Users,
  Zap,
  CheckCircle2,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Filter,
  Sparkles,
  HeartPulse,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from 'recharts';
import { clinicalInsightsService } from '../../services/clinicalInsightsService';
import { ClinicalInsightsOverview } from '../../types';

export const ClinicalInsightsDashboard: React.FC = () => {
  const [selectedCohort, setSelectedCohort] = useState<'ALL' | 'CARDIO' | 'METABOLIC' | 'RESPIRATORY'>('ALL');
  const [timeHorizon, setTimeHorizon] = useState<'30D' | '90D' | '6M'>('6M');

  const overviewData: ClinicalInsightsOverview = useMemo(() => {
    return clinicalInsightsService.getOverviewData();
  }, []);

  // Filter conditions based on selected cohort
  const filteredConditions = useMemo(() => {
    if (selectedCohort === 'CARDIO') {
      return overviewData.conditionDistribution.filter(
        (c) => c.condition.includes('Hypertension') || c.condition.includes('Heart')
      );
    }
    if (selectedCohort === 'METABOLIC') {
      return overviewData.conditionDistribution.filter(
        (c) => c.condition.includes('Diabetes') || c.condition.includes('Dyslipidemia')
      );
    }
    if (selectedCohort === 'RESPIRATORY') {
      return overviewData.conditionDistribution.filter((c) => c.condition.includes('Asthma'));
    }
    return overviewData.conditionDistribution;
  }, [overviewData, selectedCohort]);

  // AI Diagnostic Concordance Data for PieChart
  const concordanceData = [
    { name: 'إجماع سريري كامل (Full Concordance)', value: 98.4, color: '#10b981' },
    { name: 'تباين طفيف في الإرشادات (Minor Guideline Variance)', value: 1.2, color: '#f59e0b' },
    { name: 'مراجعة ثانوية قيد الانتظار (Pending Secondary Review)', value: 0.4, color: '#6366f1' },
  ];

  // Risk Stratification Data
  const riskStratification = [
    { name: 'مخاطر منخفضة (Low Risk)', percentage: 54, count: 2602, color: '#10b981' },
    { name: 'رعاية مدارة (Managed Care)', percentage: 31, count: 1494, color: '#0d9488' },
    { name: 'مراقبة حثيثة (High Risk Watch)', percentage: 15, count: 724, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 font-black">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">لوحة الرؤى السريرية وتحليلات السكان (Clinical Insights Dashboard)</h3>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full font-bold">
                  Recharts Analytics Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تحليل اتجاهات الصحة السكانية، انتشار الأمراض المزمنة، وكفاءة التحاليل التشخيصية وتدفق بيانات الأجهزة.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedCohort('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedCohort === 'ALL' ? 'bg-teal-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              كافة الفئات
            </button>
            <button
              onClick={() => setSelectedCohort('CARDIO')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedCohort === 'CARDIO' ? 'bg-teal-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              القلبية
            </button>
            <button
              onClick={() => setSelectedCohort('METABOLIC')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedCohort === 'METABOLIC' ? 'bg-teal-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              الاستقلاب والسكري
            </button>
          </div>

          <select
            value={timeHorizon}
            onChange={(e) => setTimeHorizon(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:border-teal-500 focus:outline-none"
          >
            <option value="30D">آخر 30 يوماً</option>
            <option value="90D">آخر 3 أشهر</option>
            <option value="6M">آخر 6 أشهر (تاريخي)</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>إجمالي السكان المشمولين بالرصد</span>
            <Users className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {overviewData.totalPopulationMonitored.toLocaleString()} مريض
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+8.4% نمو في التغطية الشهرية</span>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>متوسط زمن الفحوصات المخبرية (TAT)</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-300 font-mono">
            {overviewData.averageDiagnosticTATMinutes} دقيقة
          </div>
          <div className="flex items-center gap-1 text-[11px] text-teal-400 font-bold">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>أسرع بـ 22.5 دقيقة من المعيار</span>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>موثوقية حزم أجهزة IoMT</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {overviewData.telemetryIngestReliabilityPct}%
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            0% معدل فقد الحزم في السحابة
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>مطابقة التشخيص مع الاستشاريين</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {overviewData.aiDiagnosticConcordancePct}%
          </div>
          <div className="text-[11px] text-emerald-400 font-bold">
            تأكيد سريري عالي الدقة
          </div>
        </div>
      </div>

      {/* Section 1: Population Health Trends (2 Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Chronic Conditions Prevalence */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-400" />
                <span>معدل انتشار الحالات المزمنة بين السكان (Prevalence Breakdown)</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                توزيع الفئات المرضية الأساسية وعدد المرضى المسجلين في الشبكة
              </p>
            </div>
            <span className="text-[11px] font-mono text-teal-400 bg-teal-950/60 px-2.5 py-1 rounded-lg border border-teal-800/60">
              N = {overviewData.totalPopulationMonitored}
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredConditions}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" tickFormatter={(v) => `${v}%`} />
                <YAxis
                  type="category"
                  dataKey="conditionAr"
                  stroke="#cbd5e1"
                  width={130}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-white">{data.condition}</p>
                          <p className="text-teal-400">نسبة الانتشار: {data.prevalencePct}%</p>
                          <p className="text-slate-300">عدد المرضى: {data.patientCount} مريض</p>
                          <p className="text-amber-400 font-mono">مستوى المتابعة: {data.riskLevel}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="prevalencePct" radius={[0, 6, 6, 0]}>
                  {filteredConditions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Population Vital Monthly Benchmarks */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-400" />
                <span>المؤشرات الحيوية السكانية عبر الزمن (Population Vital Benchmarks)</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                تتبع متوسط ضغط الدم وسكر الدم التراكمي ومقارنته بالحدود المستهدفة
              </p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/60">
              Down-trending Risk
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={overviewData.monthlyVitalBenchmarks}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorBP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorGlucose" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" domain={[60, 150]} tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-white">{label}</p>
                          <p className="text-rose-400">متوسط الانقباضي: {payload[0]?.value} mmHg</p>
                          <p className="text-teal-400">متوسط الغلوكوز: {payload[1]?.value} mg/dL</p>
                          <p className="text-slate-400">معدل نبض الراحة: {payload[0]?.payload.avgHeartRate} bpm</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 10, fontSize: 11 }} />
                <ReferenceLine y={120} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Target BP (120)', fill: '#10b981', fontSize: 10 }} />
                <Area
                  type="monotone"
                  dataKey="avgSystolicBP"
                  name="متوسط ضغط الدم الانقباضي (mmHg)"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="avgGlucose"
                  name="متوسط سكر الدم الصائم (mg/dL)"
                  stroke="#0d9488"
                  fillOpacity={1}
                  fill="url"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section 2: System-Wide Diagnostic Efficiency Metrics (2 Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Laboratory Turnaround Time (TAT) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>كفاءة وزمن إنجاز التحاليل التشخيصية (Lab Turnaround Time - TAT)</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                مقارنة الزمن الفعلي المستغرق لإنجاز التحليل بالدقائق مقابل الهدف القياسي (SLA)
              </p>
            </div>
            <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-800/60">
              Avg TAT: 37.5m
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={overviewData.labTurnaroundMetrics}
                margin={{ top: 10, right: 10, left: 0, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis
                  dataKey="testCode"
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  interval={0}
                />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => `${v}m`} tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-white">{data.testName}</p>
                          <p className="text-teal-400">الزمن الفعلي: {data.actualTATMinutes} دقيقة</p>
                          <p className="text-slate-400">الحد الأقصى للهدف: {data.targetTATMinutes} دقيقة</p>
                          <p className="text-emerald-400">الكفاءة: {data.efficiencyPct}%</p>
                          <p className="text-slate-300">الحجم المنجز: {data.volume} فحص</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 10, fontSize: 11 }} />
                <Bar dataKey="actualTATMinutes" name="الزمن الفعلي (دقيقة)" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="targetTATMinutes" name="الحد المستهدف SLA (دقيقة)" fill="#475569" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: IoMT Telemetry Throughput & Latency */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>تدفق بيانات الأجهزة الطبية وزمن الاستجابة (IoMT Telemetry Throughput)</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                معدل معالجة رسائل النبض وضغط الدم والغلوكوز بالثانية وزمن الاستجابة (ms)
              </p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/60">
              Peak: 5,100 msg/s
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={overviewData.telemetryThroughput}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="left"
                  stroke="#0d9488"
                  tickFormatter={(v) => `${v}`}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#f59e0b"
                  tickFormatter={(v) => `${v}ms`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-white">الوقت: {label}</p>
                          <p className="text-teal-400">معدل الرسائل: {payload[0]?.value} رسالة/ثانية</p>
                          <p className="text-amber-400">زمن الاستجابة: {payload[1]?.value} ms</p>
                          <p className="text-purple-300">القنوات المتصلة النشطة: {payload[0]?.payload.activeStreams}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 10, fontSize: 11 }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="messagesPerSec"
                  name="حجم الرسائل (msg/sec)"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0d9488' }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="latencyMs"
                  name="زمن التأخير (ms)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#f59e0b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section 3: Risk Stratification & Clinical AI Concordance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Cards */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span>تصنيف المخاطر السكانية (Risk Stratification)</span>
          </h4>
          <p className="text-xs text-slate-400">
            توزيع المرضى حسب مؤشر الخطورة السريرية واحتياج المتابعة الوقائية
          </p>

          <div className="space-y-3 pt-2">
            {riskStratification.map((tier, idx) => (
              <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{tier.name}</span>
                  <span className="font-mono font-bold" style={{ color: tier.color }}>
                    {tier.percentage}% ({tier.count} مريض)
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${tier.percentage}%`, backgroundColor: tier.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Clinical Diagnostic Concordance Pie */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>توافق ودقة الذكاء الاصطناعي مع إجماع الأطباء (Diagnostic Concordance)</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                معدل التطابق بين توصيات الفرز الآلية وقرارات الأطباء الاستشاريين المعتمدة
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
              98.4% Match
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 pt-2">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={concordanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {concordanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs">
                            <span className="font-bold text-white">{payload[0].name}: </span>
                            <span className="text-teal-400 font-mono">{payload[0].value}%</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2.5 text-xs">
              {concordanceData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300 text-[11px]">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-white">{item.value}%</span>
                </div>
              ))}
              <div className="text-[11px] text-slate-500 pt-1 leading-relaxed">
                * تطبق المنظومة قاعدة Zero-Hallucination مع عزل النماذج في Sandbox مستقل يمنع تعديل السجلات مباشرة دون توقيع الطبيب.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
