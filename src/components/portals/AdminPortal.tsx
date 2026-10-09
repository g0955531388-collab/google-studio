import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  ShieldCheck,
  Server,
  AlertTriangle,
  Activity,
  Database,
  CheckCircle2,
  FileText,
  TrendingUp,
  Radio,
  Lock,
} from 'lucide-react';
import { auditService } from '../../services/auditService';
import { activityLogService } from '../../services/activityLogService';
import { AdminActivityLog } from './AdminActivityLog';
import { AdminDiagnosticReportGenerator } from './AdminDiagnosticReportGenerator';
import { ClinicalInsightsDashboard } from './ClinicalInsightsDashboard';

type AdminTab = 'overview' | 'activity-log' | 'clinical-insights' | 'diagnostic-report';

export const AdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('activity-log');
  const [unacknowledgedAlertsCount, setUnacknowledgedAlertsCount] = useState(0);

  const logs = auditService.getLogs();

  useEffect(() => {
    const unsub = activityLogService.subscribe((activityLogs) => {
      const unack = activityLogs.filter(
        (l) => l.category === 'DEVICE_DIAGNOSTIC' && l.diagnosticAlert && !l.diagnosticAlert.acknowledged
      ).length;
      setUnacknowledgedAlertsCount(unack);
    });
    return unsub;
  }, []);

  const nodes = [
    { name: 'Hospital Node (Damascus Gateway)', status: 'HEALTHY', latency: '18ms', uptime: '99.99%', role: 'Ingress & Sovereign Identity Gateway' },
    { name: 'Lab HL7/FHIR Engine', status: 'HEALTHY', latency: '24ms', uptime: '99.98%', role: 'FHIR R4 Diagnostic Bundle Orchestrator' },
    { name: 'Pharmacy Dispense Ledger', status: 'HEALTHY', latency: '12ms', uptime: '100%', role: 'Sovereign Tamper-proof Drug Ledger' },
    { name: 'IoMT Telemetry MQTT Broker', status: 'HEALTHY', latency: '9ms', uptime: '99.95%', role: 'High-frequency Vital Sensors Stream' },
    { name: 'AI Assistance Knowledge Sandbox', status: 'HEALTHY', latency: '140ms', uptime: '99.90%', role: 'Sandboxed Inference & Guideline Concordance' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Portal Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-700 to-purple-800 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 font-black text-xl">
            <FileCheck2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">لوحة الإدارة والحوكمة والامتثال (Admin & Governance)</h2>
              <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full font-bold">
                Zero-Trust Enforced
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              مراقبة صحة العقد • تدقيق سجلات الأمان • تتبع وصول البوابات • تنبيهات الأجهزة الطبية والرؤى السريرية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3.5 py-2 rounded-xl border border-emerald-800/60">
          <CheckCircle2 className="w-4 h-4" />
          <span>All 5 Clinical Nodes Online</span>
        </div>
      </div>

      {/* Strict Governance Rule Notice */}
      <div className="p-3.5 bg-rose-950/30 border border-rose-800/40 rounded-xl text-xs text-rose-200 flex items-center gap-2.5">
        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
        <span>
          <strong>قاعدة الحوكمة الصارمة:</strong> Admin ≠ unrestricted access to medical records. مسؤول النظام لا يملك وصولاً غير مقيد للسجلات الطبية السريرية الفردية بدون إذن قانوني وسجل تدقيق إلزامي مشفر.
        </span>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 p-2 rounded-2xl border border-slate-800 shadow-lg">
        <button
          onClick={() => setActiveTab('activity-log')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'activity-log'
              ? 'bg-teal-500 text-slate-950 font-black shadow-lg shadow-teal-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>سجل النشاط وتنبيهات الأجهزة (Activity Log & Alerts)</span>
          {unacknowledgedAlertsCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'activity-log' ? 'bg-rose-950 text-rose-200' : 'bg-rose-500 text-white'
              }`}
            >
              {unacknowledgedAlertsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('clinical-insights')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'clinical-insights'
              ? 'bg-teal-500 text-slate-950 font-black shadow-lg shadow-teal-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>لوحة الرؤى السريرية (Clinical Insights Dashboard)</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnostic-report')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'diagnostic-report'
              ? 'bg-teal-500 text-slate-950 font-black shadow-lg shadow-teal-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>منشئ تقارير التشخيص (Diagnostic Report Generator)</span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-teal-500 text-slate-950 font-black shadow-lg shadow-teal-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>نظرة عامة على العقد (Nodes Overview)</span>
        </button>
      </div>

      {/* Tab 1: Activity Log */}
      {activeTab === 'activity-log' && <AdminActivityLog />}

      {/* Tab 2: Clinical Insights Dashboard */}
      {activeTab === 'clinical-insights' && <ClinicalInsightsDashboard />}

      {/* Tab 3: Diagnostic Report Generator */}
      {activeTab === 'diagnostic-report' && <AdminDiagnosticReportGenerator />}

      {/* Tab 4: Nodes Health Overview & Security Stats */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Nodes Health Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nodes.map((n, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md hover:border-slate-700 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{n.name}</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold border border-emerald-800/60">
                    {n.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{n.role}</p>
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-2 border-t border-slate-800/60">
                  <span>Latency: <strong className="text-teal-400">{n.latency}</strong></span>
                  <span>Uptime: <strong className="text-indigo-400">{n.uptime}</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* Audit Stats */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>إحصائيات التدقيق والأمان الحالية:</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xl font-bold text-teal-400 font-mono">{logs.length}</div>
                <div className="text-[11px] text-slate-400">إجمالي سجلات التدقيق</div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xl font-bold text-emerald-400 font-mono">100%</div>
                <div className="text-[11px] text-slate-400">امتثال التشفير E2EE</div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xl font-bold text-indigo-400 font-mono">0</div>
                <div className="text-[11px] text-slate-400">خرق أو تسريب أمني</div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xl font-bold text-purple-400 font-mono">Active</div>
                <div className="text-[11px] text-slate-400">بوابات RBAC/ABAC</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
