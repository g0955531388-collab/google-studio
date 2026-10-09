import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Users,
  Calendar,
  FileText,
  Activity,
  ShieldCheck,
  Lock,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HeartPulse,
  AlertTriangle,
  Bell,
  ArrowRight,
  ShieldAlert,
  Radio,
} from 'lucide-react';
import DoctorPorcelainInterface from '../DoctorPorcelainInterface';
import { DoctorBiometricMonitor } from './DoctorBiometricMonitor';
import { dataService } from '../../services/dataService';
import { authService } from '../../services/authService';
import { biometricAnomalyService } from '../../services/biometricAnomalyService';
import { BiometricAnomalyAlert } from '../../types';

type DoctorViewTab = 'biometric-monitor' | 'encounters' | 'porcelain_3d';

export const DoctorPortal: React.FC = () => {
  const session = authService.getSession();
  const doctorId = session?.id || 'doc-dr-sarah';
  const doctorName = session?.name || 'د. سارة المنصور (استشاري قلب)';
  const encounters = dataService.getDoctorEncounters(doctorId);

  const [activeTab, setActiveTab] = useState<DoctorViewTab>('biometric-monitor');
  const [alerts, setAlerts] = useState<BiometricAnomalyAlert[]>([]);
  const [dismissedBannerId, setDismissedBannerId] = useState<string | null>(null);

  // Subscribe to real-time biometric anomalies for dashboard alert summaries
  useEffect(() => {
    const unsub = biometricAnomalyService.subscribe((updatedAlerts) => {
      setAlerts(updatedAlerts);
    });
    return unsub;
  }, []);

  const unacknowledgedCount = alerts.filter(
    (a) => a.status === 'UNACKNOWLEDGED'
  ).length;

  const criticalUnackAlerts = alerts.filter(
    (a) => a.severity === 'CRITICAL' && a.status === 'UNACKNOWLEDGED'
  );

  const topCriticalAlert = criticalUnackAlerts.length > 0 ? criticalUnackAlerts[0] : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner with Strict Governance Rule */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-black text-xl">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">{doctorName}</h2>
              <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-full font-bold">
                ترخيص سريري معتمد #MED-88102
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              التخصص: أمراض القلب والأوعية الدموية • العيادة: مركز الحياة للقلب الدولي
            </p>
          </div>
        </div>

        {/* Real-time Status Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/80 px-3.5 py-2 rounded-xl border border-emerald-800/80">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>نظام التنبيهات الحيوية متصل (Biometric Stream Online)</span>
          </div>
        </div>
      </div>

      {/* Mandatory Doctor Access Boundary Governance Box */}
      <div className="p-3.5 bg-blue-950/30 border border-blue-800/40 rounded-xl text-xs text-blue-200 flex items-center gap-2.5">
        <Lock className="w-4 h-4 text-blue-400 shrink-0" />
        <span>
          <strong>قاعدة حوكمة وصول الطبيب:</strong> الطبيب لا يحصل تلقائياً على كامل ملف المريض. يتم منح الوصول عبر السلسلة:
          <span className="font-mono text-teal-300 mx-1">Identity → Authorization → Consent → Purpose → Data Scope → Policy → Audit</span>.
        </span>
      </div>

      {/* Pushed Urgent Alert Summary Banner on Dashboard */}
      {topCriticalAlert && dismissedBannerId !== topCriticalAlert.id && (
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-red-950 border border-rose-600/80 rounded-2xl p-4.5 shadow-2xl shadow-rose-950/50 animate-pulse relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black shadow-lg shadow-rose-600/40 shrink-0">
              <HeartPulse className="w-6 h-6 animate-bounce" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider bg-rose-500 text-slate-950 px-2 py-0.5 rounded font-mono">
                  شذوذ حيوي حرج عاجل (Emergency Biometric Anomaly)
                </span>
                <span className="text-xs text-rose-300 font-mono">
                  {new Date(topCriticalAlert.detectedAt).toLocaleTimeString('ar-SA')}
                </span>
              </div>
              <h4 className="text-sm font-black text-white mt-1">
                المريض: {topCriticalAlert.patientName} — {topCriticalAlert.title}
              </h4>
              <p className="text-xs text-rose-200/90 mt-0.5">
                القراءة المعتلة: <strong className="font-mono text-white text-sm">{topCriticalAlert.observedValue} {topCriticalAlert.unit}</strong>{' '}
                (الهدف الطبيعي: {topCriticalAlert.baselineRange.targetText}) • الجهاز: {topCriticalAlert.deviceSource.model}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
            <button
              onClick={() => {
                setActiveTab('biometric-monitor');
                biometricAnomalyService.acknowledgeAlert(topCriticalAlert.id, doctorId, doctorName);
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-rose-950 cursor-pointer"
            >
              <span>فتح التنبيه والفرز السريري</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setDismissedBannerId(topCriticalAlert.id)}
              className="px-3 py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-700 text-xs transition cursor-pointer"
            >
              إخفاء الشريط
            </button>
          </div>
        </div>
      )}

      {/* Doctor Dashboard Segmented Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 p-2 rounded-2xl border border-slate-800 shadow-lg">
        {/* Tab 1: Biometric Anomaly Monitor */}
        <button
          onClick={() => setActiveTab('biometric-monitor')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'biometric-monitor'
              ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white font-black shadow-lg shadow-rose-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>مراقبة الشذوذات الحيوية اللحظية (Biometric Anomaly Monitor)</span>
          {unacknowledgedCount > 0 && (
            <span className="bg-rose-950 text-rose-300 border border-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
              {unacknowledgedCount} غير مقروء
            </span>
          )}
        </button>

        {/* Tab 2: Encounters */}
        <button
          onClick={() => setActiveTab('encounters')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'encounters'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>اللقاءات السريرية المصرح بها (Clinical Encounters - {encounters.length})</span>
        </button>

        {/* Tab 3: Porcelain 3D */}
        <button
          onClick={() => setActiveTab('porcelain_3d')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'porcelain_3d'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-4 h-4 text-teal-300" />
          <span>واجهة الطبيب الخزفية ثلاثية الأبعاد (Porcelain 3D)</span>
        </button>
      </div>

      {/* Main Tab Content Display */}
      {activeTab === 'biometric-monitor' && (
        <DoctorBiometricMonitor />
      )}

      {activeTab === 'porcelain_3d' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl">
          <DoctorPorcelainInterface />
        </div>
      )}

      {activeTab === 'encounters' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>اللقاءات السريرية المصرح بها (Clinical Encounters)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              إجمالي الحالات: {encounters.length}
            </span>
          </div>

          <div className="space-y-4">
            {encounters.map((enc) => (
              <div
                key={enc.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{enc.patientName}</h4>
                      <span className="text-[10px] font-mono text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                        ConsentToken: {enc.consentToken}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      التاريخ: {enc.date} • الغرض: {enc.reasonForVisit}
                    </span>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      enc.status === 'COMPLETED'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {enc.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                    <strong className="text-slate-300 block">التقييم الذاتي (Subjective Assessment):</strong>
                    <p className="text-slate-400 leading-relaxed">{enc.subjectiveAssessment}</p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                    <strong className="text-slate-300 block">الملاحظات الموضوعية (Objective Findings):</strong>
                    <p className="text-slate-400 leading-relaxed">{enc.objectiveFindings}</p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                  <strong className="text-teal-300 block">الخطة العلاجية والقرارات السريرية (Assessment & Plan):</strong>
                  <p className="text-slate-300 leading-relaxed">{enc.assessmentPlan}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
