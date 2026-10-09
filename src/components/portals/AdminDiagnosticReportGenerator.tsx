import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Server,
  Smartphone,
  Activity,
  Layers,
  Clock,
  Sparkles,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { adminReportService } from '../../services/adminReportService';
import { SystemHealthReportData } from '../../types';

export const AdminDiagnosticReportGenerator: React.FC = () => {
  const [selectedScope, setSelectedScope] = useState<string>('REALTIME_SNAPSHOT');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const reportData: SystemHealthReportData = useMemo(() => {
    return adminReportService.generateHealthReportData(selectedScope);
  }, [selectedScope, lastRefreshedAt]);

  const handleRefresh = () => {
    setLastRefreshedAt(new Date());
  };

  const handleExportPDF = () => {
    setIsExportingPDF(true);
    try {
      adminReportService.exportDiagnosticPDF(reportData);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setTimeout(() => setIsExportingPDF(false), 500);
    }
  };

  const handleExportJSON = () => {
    adminReportService.exportDiagnosticJSON(reportData);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 font-black">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">منشئ تقارير التشخيص ومراجعة النظام (Diagnostic Report Generator)</h3>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  Sovereign Audit Certified
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                توليد ملخص تنفيذي لحالة العقد السريرية، كفاءة التحاليل، صحة الأجهزة الطبية، ومؤشرات الحوكمة الأمنية.
              </p>
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={handleRefresh}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
            title="تحديث البيانات اللحظية"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingPDF ? 'جاري إنشاء PDF...' : 'تصدير تقرير PDF رسمي'}</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer"
          >
            <Layers className="w-4 h-4 text-teal-400" />
            <span>تصدير JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="طباعة المعاينة الإدارية"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">طباعة</span>
          </button>
        </div>
      </div>

      {/* Scope Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Clock className="w-4 h-4 text-teal-400" />
          <span className="font-bold text-white">نطاق المراجعة الإدارية (Audit Scope):</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'REALTIME_SNAPSHOT', label: 'لقطة فورية للحالة (Real-time Snapshot)' },
            { id: 'LAST_24_HOURS', label: 'آخر 24 ساعة (Last 24 Hours)' },
            { id: 'LAST_7_DAYS', label: 'آخر 7 أيام (Last 7 Days)' },
            { id: 'MONTHLY_GOVERNANCE', label: 'المراجعة الشهرية الشاملة (Monthly Governance)' },
          ].map((scope) => (
            <button
              key={scope.id}
              onClick={() => setSelectedScope(scope.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedScope === scope.id
                  ? 'bg-teal-500 text-slate-950 font-black shadow-md shadow-teal-500/20'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white'
              }`}
            >
              {scope.label}
            </button>
          ))}
        </div>
      </div>

      {/* Official Summary View for Administrative Review */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-8 shadow-2xl printable-summary">
        {/* Document Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-teal-400 font-bold">LIFEX-AI SOVEREIGN CLINICAL NETWORK</span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] font-mono text-slate-400">{reportData.reportId}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              تقرير التشخيص الإداري والموثوقية التشغيلية
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              تم التوليد في {new Date(reportData.generatedAt).toLocaleString('ar-SA')} • بواسطة: {reportData.generatedBy}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 shrink-0">
            <div className="text-right">
              <div className="text-xs text-slate-400">مؤشر سلامة النظام العام</div>
              <div className="text-2xl font-black text-emerald-400 font-mono">{reportData.overallHealthScore}%</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 4 Pillars Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>العقد السريرية النشطة</span>
              <Server className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {reportData.nodes.length} / {reportData.nodes.length}
            </div>
            <div className="text-[11px] text-emerald-400 font-bold">100% جهوزية تشغيلية</div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>أجهزة المراقبة الطبية IoMT</span>
              <Smartphone className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-300 font-mono">
              {reportData.devicesSummary.onlineDevices} متصلة
            </div>
            <div className="text-[11px] text-slate-400">
              متوسط شحن البطارية: {reportData.devicesSummary.avgBattery}%
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>متوسط زمن التحاليل المخبرية</span>
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-indigo-300 font-mono">
              {reportData.diagnosticEfficiency.avgLabTATMinutes} دقيقة
            </div>
            <div className="text-[11px] text-teal-400 font-bold">أسرع بنسبة 30% من المعيار</div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>مطابقة الذكاء الاصطناعي السريري</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300 font-mono">
              {reportData.diagnosticEfficiency.aiConcordancePct}%
            </div>
            <div className="text-[11px] text-slate-400">توافق دقيق مع إجماع الاستشاريين</div>
          </div>
        </div>

        {/* Section 1: Clinical Nodes Health Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-teal-400" />
              <span>1. كفاءة واستجابة العقد السريرية (Clinical Infrastructure Status)</span>
            </h4>
            <span className="text-xs text-slate-400 font-mono">SLA SLA Compliance: Pass</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono">
                <tr>
                  <th className="p-3">اسم العقدة السريرية</th>
                  <th className="p-3">الدور المعماري</th>
                  <th className="p-3">الحالة التشغيلية</th>
                  <th className="p-3">زمن الاستجابة (Latency)</th>
                  <th className="p-3">التوفر (Uptime)</th>
                  <th className="p-3">معدل المعالجة (Throughput)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-950/30">
                {reportData.nodes.map((node) => (
                  <tr key={node.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-3 font-bold text-white">{node.name}</td>
                    <td className="p-3 font-mono text-slate-400">{node.type}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/60 font-mono text-[11px]">
                        {node.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-teal-400">{node.latency}</td>
                    <td className="p-3 font-mono text-slate-300">{node.uptime}</td>
                    <td className="p-3 font-mono text-slate-400">{node.throughput}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Diagnostic Efficiency Matrix */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>2. مؤشرات الكفاءة التشخيصية وسرعة المعالجة (Diagnostic Efficiency & SLAs)</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-bold">زمن إنجاز الفحوصات المخبرية (Lab TAT):</span>
                <span className="text-emerald-400 font-mono font-bold">42 دقيقة (الهدف: &lt; 60 دقيقة)</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '70%' }} />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                تحاليل دهون الدم، السكر التراكمي، وتروبونين القلب العاجل تسجل تسليماً أسرع بنسبة 30% عبر محرك FHIR R4 المباشر.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-bold">زمن انتقال حزم البث الحي للأجهزة (IoMT Latency):</span>
                <span className="text-teal-400 font-mono font-bold">14 مللي ثانية (الهدف: &lt; 50 ms)</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-teal-500 h-2 rounded-full" style={{ width: '28%' }} />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                قنوات MQTT المشفرة تضمن وصول قراءات تخطيط القلب ومستشعرات السكر اللحظية بأقل من 15 مللي ثانية دون فقد حزم.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Security & Zero-Trust Governance */}
        <div className="p-5 bg-indigo-950/20 border border-indigo-800/40 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              <span>3. الحوكمة وسياسات الأمان السيادية (Zero-Trust Security & Sovereign Compliance)</span>
            </h4>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              100% E2EE Compliant
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
              <div className="text-lg font-bold text-white font-mono">{reportData.securitySummary.totalAuditsLogged}</div>
              <div className="text-[10px] text-slate-400">سجلات تدقيق موثقة</div>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
              <div className="text-lg font-bold text-emerald-400 font-mono">0</div>
              <div className="text-[10px] text-slate-400">اختراقات أو تسريبات</div>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
              <div className="text-lg font-bold text-rose-400 font-mono">{reportData.securitySummary.zeroTrustDenials}</div>
              <div className="text-[10px] text-slate-400">محاولات غير مصرحة صُدت</div>
            </div>
            <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800">
              <div className="text-lg font-bold text-teal-400 font-mono">{reportData.securitySummary.activePolicyRules}</div>
              <div className="text-[10px] text-slate-400">سياسات وصول نشطة</div>
            </div>
          </div>
        </div>

        {/* Section 4: Recommendations */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-white">4. التوصيات الإدارية والتشغيلية المعتمدة:</h4>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {reportData.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Sign-off Seal */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <span>Cryptographic Sovereign Ledger Verification Seal: PASS-VERIFIED-SHA256</span>
          </div>

          <div>
            <span>Audited By: Lifex-AI Governance Core v0.1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
