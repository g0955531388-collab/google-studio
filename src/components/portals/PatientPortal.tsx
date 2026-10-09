import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Activity,
  Pill,
  AlertTriangle,
  Clock,
  Download,
  Calendar,
  Lock,
  Unlock,
  Fingerprint,
  ShieldCheck,
  CheckCircle2,
  FileText,
  UserCheck,
  Radio,
  ExternalLink,
  Video,
  Printer,
  Sparkles,
  Target,
  ShieldAlert,
  Package,
  Bell,
  BellRing,
  Stethoscope,
  CalendarCheck,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { consentService } from '../../services/consentService';
import { authService } from '../../services/authService';
import { biometricService } from '../../services/biometricService';
import { MedicationSchedule } from './MedicationSchedule';
import { TelemedicineConsultation } from './TelemedicineConsultation';
import { ClinicalContextChat } from './ClinicalContextChat';
import { HealthGoalsDashboard } from './HealthGoalsDashboard';
import { WeeklyHealthSummaryWidget } from './WeeklyHealthSummaryWidget';
import { SmartAlertsBanner } from './SmartAlertsBanner';
import { SymptomLogModal } from './SymptomLogModal';
import { NotificationSettingsPanel } from './NotificationSettingsPanel';
import { BiometricAuthOverlay } from './BiometricAuthOverlay';
import { MedicalHistorySummaryPanel } from './MedicalHistorySummaryPanel';
import { SymptomAssessmentModule } from './SymptomAssessmentModule';
import { VitalTrendsVisualizationModule } from './VitalTrendsVisualizationModule';
import { AppointmentSchedulingModule } from './AppointmentSchedulingModule';
import { MedicationPushNotificationScheduler } from './MedicationPushNotificationScheduler';
import { generateHealthReportPDF } from '../../services/pdfReportService';

export const PatientPortal: React.FC = () => {
  const session = authService.getSession();
  const patientId = session?.id || 'pat-main';
  const projections = dataService.getPatientProjections(patientId);
  const vitalTrends = dataService.getPatientVitalTrends(patientId);
  const consents = consentService.getConsentsForPatient(patientId);

  const [activeTab, setActiveTab] = useState<'timeline' | 'vitals' | 'meds' | 'goals' | 'symptoms' | 'symptom-triage' | 'appointments' | 'telemedicine' | 'allergies' | 'consents' | 'clinical-chat' | 'notifications' | 'medical-history'>('timeline');
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>(undefined);
  const [medsSubView, setMedsSubView] = useState<'schedule' | 'history' | 'prescriptions' | 'refills' | 'push-alerts'>('schedule');
  const [showSymptomModal, setShowSymptomModal] = useState<boolean>(false);
  const [portalSymptomsVersion, setPortalSymptomsVersion] = useState<number>(0);

  // Biometric Authentication Overlay State
  const [biometricState, setBiometricState] = useState(biometricService.getState());
  const [showBiometricOverlay, setShowBiometricOverlay] = useState(false);
  const [biometricPromptContext, setBiometricPromptContext] = useState<{ title?: string; description?: string } | undefined>(undefined);
  const [pendingSensitiveAction, setPendingSensitiveAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    return biometricService.subscribe((state) => {
      setBiometricState(state);
    });
  }, []);

  const openChatWithQuestion = (q?: string) => {
    setChatInitialPrompt(q);
    setActiveTab('clinical-chat');
  };
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);

  const handleExportPDF = () => {
    setIsExportingPDF(true);
    try {
      const adherenceTrends = dataService.getMedicationAdherenceTrends(patientId, 7);
      const medLogs = dataService.getMedicationLogs(patientId);
      const activeMeds = projections.medications.map((m) => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        status: m.status,
        doctor: m.prescribedByDoctor,
      }));
      const adherenceStats = dataService.getMedicationAdherenceStats(patientId);

      // Calculate averages from vital trends
      const count = vitalTrends.length || 1;
      const avgHeartRate = vitalTrends.reduce((acc, curr) => acc + curr.heartRate, 0) / count;
      const avgSystolic = vitalTrends.reduce((acc, curr) => acc + curr.systolicBP, 0) / count;
      const avgDiastolic = vitalTrends.reduce((acc, curr) => acc + curr.diastolicBP, 0) / count;
      const avgGlucose = vitalTrends.reduce((acc, curr) => acc + curr.glucose, 0) / count;
      const avgSpO2 = vitalTrends.reduce((acc, curr) => acc + curr.spO2, 0) / count;

      generateHealthReportPDF({
        patientId,
        patientName: session?.name || 'أحمد فهد المنصوري',
        bloodType: 'O+',
        generatedAt: new Date().toISOString(),
        vitalTrends,
        medicationLogs: medLogs,
        medicationAdherenceTrends: adherenceTrends,
        currentMedications: activeMeds,
        summaryStats: {
          weeklyAdherencePct: adherenceStats.weeklyAdherencePct,
          streakDays: adherenceStats.streakDays,
          avgHeartRate,
          avgSystolic,
          avgDiastolic,
          avgGlucose,
          avgSpO2,
        },
      });

      setExportStatus('✅ تم تصدير تقرير المؤشرات الصحية وسجل الأدوية بصيغة PDF بنجاح.');
    } catch (err: any) {
      setExportStatus(`❌ فشل تصدير تقرير PDF: ${err.message || 'حدث خطأ غير متوقع'}`);
    } finally {
      setIsExportingPDF(false);
      setTimeout(() => setExportStatus(null), 5000);
    }
  };

  const executeExport = () => {
    const res = dataService.exportPatientRecord(patientId, session?.role || 'patient');
    if (res.success) {
      setExportStatus('✅ تم إنشاء حزمة التصدير المشفرة (JSON) بنجاح وفق معايير GDPR / HIPAA.');
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `Lifex_Patient_Projection_${patientId}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      setExportStatus(`❌ ${res.error}`);
    }
    setTimeout(() => setExportStatus(null), 5000);
  };

  const handleExport = () => {
    if (!biometricService.isVerified()) {
      setBiometricPromptContext({
        title: 'التحقق البيومتري مطلوب لتصدير السجل الطبي',
        description: 'وفق سياسات حماية الخصوصية والسيادة الرقمية، يلزم تأكيد البصمة البيومترية قبل تنزيل ملف السجلات الطبية الشاملة.',
      });
      setPendingSensitiveAction(() => executeExport);
      setShowBiometricOverlay(true);
      return;
    }
    executeExport();
  };

  const handleRevoke = (cstId: string) => {
    if (!biometricService.isVerified()) {
      setBiometricPromptContext({
        title: 'التحقق البيومتري مطلوب لإلغاء تفويض الطبيب',
        description: 'إلغاء حق الوصول السريري المصرح يستلزم توثيق الهوية البيومترية المباشرة لمنع الإلغاء العرضي.',
      });
      setPendingSensitiveAction(() => () => consentService.revokeConsent(cstId, patientId));
      setShowBiometricOverlay(true);
      return;
    }
    consentService.revokeConsent(cstId, patientId);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Projection Clarification */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 font-black text-xl">
            {session ? session.name.slice(0, 1) : 'أ'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black text-white">{session?.name || 'أحمد فهد المنصوري'}</h2>
              <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded-full font-bold">
                ملف مريض موثق
              </span>

              {/* Biometric Lock Status Pill */}
              {biometricState.isVerified ? (
                <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full text-[10px] text-emerald-300 font-bold">
                  <Fingerprint className="w-3 h-3 text-emerald-400" />
                  <span>موثق بيومترياً (مفتوح)</span>
                  <button
                    onClick={() => biometricService.lock(true)}
                    className="mr-1 text-[9px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    (قفل)
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setBiometricPromptContext(undefined);
                    setPendingSensitiveAction(null);
                    setShowBiometricOverlay(true);
                  }}
                  className="flex items-center gap-1.5 bg-slate-950 border border-amber-500/40 hover:border-amber-400 px-2 py-0.5 rounded-full text-[10px] text-amber-300 font-bold transition cursor-pointer"
                  title="السجلات الحساسة مقفلة. انقر لتوثيق الهوية البيومترية"
                >
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>قفل بيومتري نشط • انقر للفتح</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              معرّف المريض: <span className="font-mono text-slate-300">{patientId}</span> • فصيلة الدم: <strong className="text-rose-400">O+</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (biometricState.isVerified) {
                biometricService.lock(true);
              } else {
                setBiometricPromptContext(undefined);
                setPendingSensitiveAction(null);
                setShowBiometricOverlay(true);
              }
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm border ${
              biometricState.isVerified
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/50'
                : 'bg-slate-900 text-amber-300 border-amber-500/40 hover:bg-slate-800'
            }`}
            title={biometricState.isVerified ? 'السجلات مفتوحة. انقر لإعادة القفل فوراً' : 'فتح السجلات الحساسة بالبصمة'}
          >
            <Fingerprint className={`w-4 h-4 ${biometricState.isVerified ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>{biometricState.isVerified ? 'السجلات مفتوحة (قفل)' : 'التحقق البيومتري (Lock)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('goals')}
            className="px-4 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-sm"
            title="متابعة الأهداف الصحية ومعدلات الإنجاز اليومية"
          >
            <Target className="w-4 h-4 text-teal-400" />
            <span>الأهداف الصحية (Goals)</span>
          </button>

          <button
            onClick={() => setShowSymptomModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-sm"
            title="تسجيل عَرَض صحي جديد وفحص التداخلات الذكية"
          >
            <Activity className="w-4 h-4 text-amber-400" />
            <span>تسجيل عَرَض (Log Symptom)</span>
          </button>

          <button
            onClick={() => openChatWithQuestion()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500/20 to-emerald-500/20 hover:from-teal-500/30 hover:to-emerald-500/30 text-teal-300 border border-teal-500/50 text-xs font-bold flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-sm"
            title="فتح المساعد السريري الذكي المدعوم بـ Gemini"
          >
            <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
            <span>الدردشة السريرية الذكية (AI Chat)</span>
          </button>

          <button
            onClick={() => setActiveTab('telemedicine')}
            className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-sm"
          >
            <Video className="w-4 h-4 text-indigo-400" />
            <span>استشارة الطبيب عن بُعد (Telehealth)</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-sm"
            title="تخصيص قنوات التنبيه (SMS، البريد، والتطبيق) للتحاليل والأدوية"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span>إعدادات الإشعارات (Alerts)</span>
          </button>

          <button
            onClick={() => setActiveTab('symptom-triage')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-teal-950/40 transition active:scale-95 cursor-pointer"
            title="تقييم الأعراض والفرز السريري الأولي بالذكاء الاصطناعي (Gemini AI Clinical Triage)"
          >
            <Stethoscope className="w-4 h-4 text-slate-950" />
            <span>الفرز السريري للأعراض (AI Triage)</span>
            <span className="text-[10px] bg-slate-950 text-teal-300 px-1.5 py-0.2 rounded font-mono font-bold">
              Gemini
            </span>
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-indigo-950/40 transition active:scale-95 cursor-pointer"
            title="حجز موعد سريري ذكي مقترح بالذكاء الاصطناعي (AI Optimal Appointment Scheduling)"
          >
            <CalendarCheck className="w-4 h-4 text-white" />
            <span>حجز المواعيد الذكي (AI Appointments)</span>
            <span className="text-[10px] bg-slate-950 text-indigo-300 px-1.5 py-0.2 rounded font-mono font-bold">
              Gemini
            </span>
          </button>

          <button
            onClick={() => setActiveTab('medical-history')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-950/40 transition active:scale-95 cursor-pointer"
            title="توليد وتصدير ملخص التاريخ الطبي كملف PDF للمراجعة السريرية الخارجية أو الأوفلاين"
          >
            <FileText className="w-4 h-4 text-sky-200" />
            <span>ملخص التاريخ الطبي (Medical History PDF)</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition active:scale-95 cursor-pointer disabled:opacity-50"
            title="تصدير تقرير المؤشرات الصحية وسجل الأدوية كملف PDF"
          >
            <Printer className="w-4 h-4" />
            <span>{isExportingPDF ? 'جاري تجهيز PDF...' : 'تصدير تقرير صحي (PDF Report)'}</span>
          </button>

          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 text-xs font-bold flex items-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تصدير السجل المصرح به (JSON)</span>
          </button>
        </div>
      </div>

      {exportStatus && (
        <div className="p-3 rounded-xl bg-slate-900 border border-teal-500/50 text-xs text-teal-200 font-semibold animate-fade-in">
          {exportStatus}
        </div>
      )}

      {/* Projection Disclaimer Box */}
      <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
        <span>
          <strong>ملاحظة معمارية:</strong> هذا الجدول الزمني هو <strong>إسقاط سريري مجمع (Projection)</strong> لأغراض العرض والمتابعة، والسجلات الأصلية تظل محفوظة ومملوكة للمستشفيات والمختبرات المصدرة.
        </span>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'timeline'
              ? 'bg-teal-600 text-slate-950 shadow-md shadow-teal-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          الجدول الزمني الصحي (Timeline)
        </button>

        <button
          onClick={() => setActiveTab('medical-history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'medical-history'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-950 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-sky-400" />
          <span>ملخص التاريخ الطبي (Medical History PDF)</span>
          <span className="text-[10px] bg-sky-950 text-sky-300 border border-sky-800 px-1.5 py-0.2 rounded font-mono font-bold">
            PDF
          </span>
        </button>

        <button
          onClick={() => setActiveTab('vitals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'vitals'
              ? 'bg-teal-600 text-slate-950 shadow-md shadow-teal-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          المؤشرات الحيوية (Vitals)
        </button>

        <button
          onClick={() => setActiveTab('meds')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'meds'
              ? 'bg-teal-600 text-slate-950 shadow-md shadow-teal-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          الأدوية والوصفات (Medications)
        </button>

        <button
          onClick={() => setActiveTab('goals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'goals'
              ? 'bg-teal-600 text-slate-950 shadow-md shadow-teal-950 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Target className="w-3.5 h-3.5 text-teal-400" />
          <span>الأهداف الصحية (Health Goals)</span>
        </button>

        <button
          onClick={() => setActiveTab('symptoms')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'symptoms'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>الأعراض والتنبيهات (Symptoms & Alerts)</span>
        </button>

        <button
          onClick={() => setActiveTab('symptom-triage')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'symptom-triage'
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md shadow-teal-950 font-black'
              : 'text-teal-300 hover:text-white hover:bg-slate-800 border border-teal-500/30 bg-teal-950/20'
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
          <span>تقييم الأعراض والفرز (AI Triage)</span>
          <span className="text-[10px] bg-slate-950 text-teal-300 px-1.5 py-0.2 rounded font-mono font-bold">
            Gemini
          </span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'appointments'
              ? 'bg-gradient-to-r from-indigo-600 to-teal-600 text-white shadow-md shadow-indigo-950 font-black'
              : 'text-indigo-300 hover:text-white hover:bg-slate-800 border border-indigo-500/30 bg-indigo-950/20'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>حجز المواعيد الذكي (AI Appointments)</span>
          <span className="text-[10px] bg-slate-950 text-indigo-300 px-1.5 py-0.2 rounded font-mono font-bold">
            Gemini
          </span>
        </button>

        <button
          onClick={() => setActiveTab('clinical-chat')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'clinical-chat'
              ? 'bg-gradient-to-r from-teal-400 to-emerald-500 text-slate-950 shadow-md shadow-teal-950 font-black'
              : 'text-teal-300 hover:text-white hover:bg-slate-800 border border-teal-500/30 bg-teal-950/20'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>الدردشة السريرية الذكية (AI Chat)</span>
          <span className="text-[10px] bg-slate-950 text-teal-300 px-1.5 py-0.2 rounded font-mono font-bold">
            Gemini
          </span>
        </button>

        <button
          onClick={() => setActiveTab('telemedicine')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'telemedicine'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Video className="w-3.5 h-3.5 text-indigo-400" />
          <span>الاستشارة المرئية (Telemedicine)</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        <button
          onClick={() => setActiveTab('allergies')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'allergies'
              ? 'bg-teal-600 text-slate-950 shadow-md shadow-teal-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          الحساسيات والأمراض المزمنة
        </button>

        <button
          onClick={() => setActiveTab('consents')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'consents'
              ? 'bg-teal-600 text-slate-950 shadow-md shadow-teal-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          الموافقات الممنوحة للأطباء ({consents.length})
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'notifications'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Bell className="w-3.5 h-3.5 text-amber-400" />
          <span>إعدادات الإشعارات (Notifications)</span>
        </button>
      </div>

      {/* Tab 1: Timeline Projection */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {/* AI-Driven Proactive Smart Alerts Banner */}
          <SmartAlertsBanner
            patientId={patientId}
            onOpenSymptomModal={() => setShowSymptomModal(true)}
            onConsultTelehealth={() => setActiveTab('telemedicine')}
            onAlertsChanged={() => setPortalSymptomsVersion((v) => v + 1)}
          />

          {/* Weekly Health Summary Widget (Gemini AI Powered) */}
          <WeeklyHealthSummaryWidget
            patientId={patientId}
            patientName={session?.name}
            onOpenClinicalChat={() =>
              openChatWithQuestion(
                'يرجى تقديم تفاصيل إضافية حول ملخصي الصحي الأسبوعي واتجاهات علاماتي الحيوية والتزامي الدوائي.'
              )
            }
          />

          <div className="space-y-4">
            {projections.timeline.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/50">
                    {item.sourceDomain}
                  </span>
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {new Date(item.timestamp).toLocaleDateString('ar-EG')}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{item.summary}</p>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>المزود: {item.providerName} — {item.location}</span>
                <span className="text-teal-400">إسقاط مصرح به (Authorized Projection)</span>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Tab 2: Vitals */}
      {activeTab === 'vitals' && (
        <div className="space-y-6">
          {/* Real-time Telemetry Snapshot Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {projections.vitals.map((v) => (
              <div
                key={v.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">{v.type}</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                    {v.status}
                  </span>
                </div>
                <div className="text-2xl font-black text-white font-mono">
                  {v.value} <span className="text-xs font-normal text-slate-400">{v.unit}</span>
                </div>
                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span>الجهاز: {v.deviceId}</span>
                  <span className="text-emerald-400 font-bold">موثق سريرياً</span>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Longitudinal Vital Trends Module (Recharts & Gemini AI Integrated) */}
          <VitalTrendsVisualizationModule
            patientId={patientId}
            patientName={session?.name}
            initialTrends={vitalTrends}
            onOpenClinicalChat={openChatWithQuestion}
            onExportPDF={handleExportPDF}
          />
        </div>
      )}

      {/* Tab 3: Medications & Daily Schedule */}
      {activeTab === 'meds' && (
        <div className="space-y-6">
          {/* Sub-view Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-2 rounded-2xl">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setMedsSubView('schedule')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  medsSubView === 'schedule'
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-950/60'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>جدول وتذكيرات الجرعات (Daily Schedule)</span>
              </button>

              <button
                onClick={() => setMedsSubView('history')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  medsSubView === 'history'
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-950/60'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>سجل الجرعات ومؤشرات الالتزام (Medication History & Trends)</span>
              </button>

              <button
                onClick={() => setMedsSubView('prescriptions')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  medsSubView === 'prescriptions'
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-950/60'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Pill className="w-3.5 h-3.5" />
                <span>الوصفات المعتمدة ({projections.medications.length})</span>
              </button>

              <button
                onClick={() => setMedsSubView('refills')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  medsSubView === 'refills'
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-950/60'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>متعقب إعادة التعبئة (Refills)</span>
              </button>

              <button
                onClick={() => setMedsSubView('push-alerts')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  medsSubView === 'push-alerts'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-950/60 font-black'
                    : 'text-amber-300 hover:text-white hover:bg-slate-800/60 border border-amber-500/20'
                }`}
              >
                <BellRing className="w-3.5 h-3.5 text-amber-400" />
                <span>جدولة الإشعارات الفورية (Push Alerts)</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openChatWithQuestion('كيف تؤثر مواعيد أدويتي الحالية ونسبة التزامي على استقرار حالتي الصحية؟')}
                className="px-3 py-1.5 rounded-xl bg-teal-950/80 hover:bg-teal-900 text-teal-300 border border-teal-500/40 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
                title="استشارة المساعد السريري حول جدول أدويتك والالتزام"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>استشر الذكاء الاصطناعي</span>
              </button>

              <button
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
                title="تصدير سجل الأدوية ومؤشرات الالتزام كملف PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>تصدير PDF</span>
              </button>

              <div className="text-[11px] text-slate-400 px-3 hidden lg:block">
                {medsSubView === 'schedule'
                  ? 'توثيق مواعيد تناول الجرعات والتنبيهات المباشرة'
                  : medsSubView === 'history'
                  ? 'تحليل تطور الالتزام البياني وسجل الجرعات السابقة'
                  : medsSubView === 'refills'
                  ? 'متعقب رصيد الحبوب وتنبيهات إعادة الصرف'
                  : medsSubView === 'push-alerts'
                  ? 'إشعارات الويب الفورية المجدولة بناءً على سجلات الأدوية'
                  : 'الأصول السريرية الصادرة من الطبيب والصيدلية'}
              </div>
            </div>
          </div>

          {/* Sub-view 1: Daily Schedule Component */}
          {medsSubView === 'schedule' && (
            <MedicationSchedule key="schedule-view" patientId={patientId} initialView="schedule" />
          )}

          {/* Sub-view 2: Medication History & Trends Component */}
          {medsSubView === 'history' && (
            <MedicationSchedule key="history-view" patientId={patientId} initialView="history" />
          )}

          {/* Sub-view 3: Refill Tracker Component */}
          {medsSubView === 'refills' && (
            <MedicationSchedule key="refills-view" patientId={patientId} initialView="refills" />
          )}

          {/* Sub-view 4: Push Notification Scheduler System */}
          {medsSubView === 'push-alerts' && (
            <MedicationPushNotificationScheduler
              key="push-alerts-view"
              patientId={patientId}
              patientName={session?.name}
              onOpenMedicationSchedule={() => setMedsSubView('schedule')}
            />
          )}

          {/* Sub-view 3: Prescriptions & Pharmacy Dispense */}
          {medsSubView === 'prescriptions' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
                <span>سجل الوصفات الطبية المعتمدة (Canonical Prescriptions from Doctor Domain)</span>
                <span className="font-mono text-teal-400 text-[11px]">FHIR R4 MedicationRequest Compliant</span>
              </div>

              {projections.medications.map((m) => (
                <div
                  key={m.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">{m.name}</h3>
                      <span className="text-xs text-teal-400 font-mono">{m.dosage} • {m.frequency}</span>
                    </div>
                    <span className="text-xs bg-emerald-950 text-emerald-300 px-2.5 py-1 rounded-full font-bold">
                      معدل الالتزام الكلي: {m.adherencePercentage}%
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <div>الطبيب الواصف: <strong className="text-slate-200">{m.prescribedByDoctor}</strong> ({m.prescribedAt})</div>
                    <div>صيدلية الصرف: <strong className="text-slate-200">{m.dispensedByPharmacy}</strong> ({m.dispensedAt})</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Allergies & Chronic Conditions */}
      {activeTab === 'allergies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>الحساسيات الدوائية والغذائية الحرجة</span>
            </h3>
            <div className="space-y-3">
              {projections.allergies.map((a) => (
                <div key={a.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-white text-xs">{a.allergen}</strong>
                    <span className="text-[10px] bg-rose-950 text-rose-300 px-2 py-0.5 rounded font-bold">{a.severity}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">رد الفعل: {a.reaction}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
            <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2">
              <HeartPulse className="w-4 h-4" />
              <span>الأمراض المزمنة المسجلة</span>
            </h3>
            <div className="space-y-3">
              {projections.conditions.map((c) => (
                <div key={c.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-white text-xs">{c.name}</strong>
                    <span className="text-[10px] bg-teal-950 text-teal-300 px-2 py-0.5 rounded font-mono font-bold">ICD: {c.icdCode}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">سنة التشخيص: {c.diagnosedYear} • الحالة: {c.status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Health Goals Dashboard */}
      {activeTab === 'goals' && (
        <HealthGoalsDashboard patientId={patientId} />
      )}

      {/* Tab: Symptoms & Proactive Smart Alerts */}
      {activeTab === 'symptoms' && (
        <div className="space-y-6">
          <SmartAlertsBanner
            patientId={patientId}
            onOpenSymptomModal={() => setShowSymptomModal(true)}
            onConsultTelehealth={() => setActiveTab('telemedicine')}
            onAlertsChanged={() => setPortalSymptomsVersion((v) => v + 1)}
          />

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-teal-400" />
                  <span>سجل الأعراض والملاحظات السريرية (Patient Symptoms Log)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  رصد الأعراض الشخصية واستجابتها اليومية مع الربط التلقائي ببروتوكولات الأمان واليقظة الدوائية.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveTab('symptom-triage')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-teal-950/40 transition active:scale-95 cursor-pointer"
                >
                  <Stethoscope className="w-4 h-4 text-slate-950" />
                  <span>الفرز السريري للأعراض (AI Triage)</span>
                  <span className="text-[10px] bg-slate-950 text-teal-300 px-1.5 py-0.2 rounded font-mono font-bold">
                    Gemini
                  </span>
                </button>

                <button
                  onClick={() => setShowSymptomModal(true)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer border border-slate-700"
                >
                  <Activity className="w-4 h-4 text-teal-400" />
                  <span>+ تسجيل عَرَض جديد</span>
                </button>
              </div>
            </div>

            {/* Symptoms list */}
            {dataService.getSymptoms(patientId).length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                لا توجد أعراض مسجلة حالياً. استخدم الزر أعلاه لتسجيل أي عَرَض جديد.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dataService.getSymptoms(patientId).map((sym) => {
                  const isSev = sym.severity === 'SEVERE';
                  const isMod = sym.severity === 'MODERATE';
                  const isActive = sym.status === 'ACTIVE';

                  return (
                    <div
                      key={sym.id}
                      className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md hover:border-slate-700 transition"
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                                isSev
                                  ? 'bg-rose-600 text-white'
                                  : isMod
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                              }`}
                            >
                              {sym.severity === 'SEVERE'
                                ? 'شديد (SEVERE)'
                                : sym.severity === 'MODERATE'
                                ? 'متوسط (MODERATE)'
                                : 'خفيف (MILD)'}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                                isActive
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {sym.status === 'ACTIVE' ? 'نشط ومستمر' : sym.status === 'RESOLVED' ? 'متلاشٍ وزال' : 'متحسن'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white">{sym.symptomName}</h4>
                          {sym.symptomNameEn && (
                            <p className="text-[11px] text-slate-400 font-mono">{sym.symptomNameEn}</p>
                          )}
                        </div>

                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          {new Date(sym.loggedAt).toLocaleDateString('ar-EG')}
                        </span>
                      </div>

                      {sym.duration && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-teal-400" />
                          <span>المدة: {sym.duration}</span>
                        </div>
                      )}

                      {sym.associatedFactors && sym.associatedFactors.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {sym.associatedFactors.map((f, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-slate-900 border border-slate-800 text-teal-300 px-2 py-0.5 rounded-md font-mono"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      )}

                      {sym.notes && (
                        <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60 leading-relaxed">
                          {sym.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                        <button
                          onClick={() => {
                            dataService.updateSymptomStatus(
                              sym.id,
                              sym.status === 'ACTIVE' ? 'RESOLVED' : 'ACTIVE'
                            );
                            setPortalSymptomsVersion((v) => v + 1);
                          }}
                          className="text-teal-400 hover:text-teal-300 text-[11px] font-bold cursor-pointer transition"
                        >
                          {sym.status === 'ACTIVE' ? 'تحديد كـ "زال العَرَض"' : 'إعادة تفعيل كـ "عَرَض نشط"'}
                        </button>

                        <button
                          onClick={() => {
                            dataService.deleteSymptom(sym.id, patientId);
                            setPortalSymptomsVersion((v) => v + 1);
                          }}
                          className="text-slate-500 hover:text-rose-400 text-[11px] cursor-pointer transition"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Clinical Context Chat (AI Powered) */}
      {activeTab === 'clinical-chat' && (
        <ClinicalContextChat
          patientId={patientId}
          initialQuestion={chatInitialPrompt}
          onNavigateToVitals={() => setActiveTab('vitals')}
          onNavigateToMeds={() => setActiveTab('meds')}
        />
      )}

      {/* Tab 4: Telemedicine Virtual Consultation */}
      {activeTab === 'telemedicine' && (
        <TelemedicineConsultation
          patientId={patientId}
          onNavigateToTimeline={() => setActiveTab('timeline')}
          onNavigateToMeds={() => setActiveTab('meds')}
        />
      )}

      {/* Tab 5: Consents Granted by Patient */}
      {activeTab === 'consents' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400">
            أنت المالك الحصري لسيادة بياناتك. يمكنك إلغاء وصول أي طبيب أو مستشفى فوراً:
          </div>
          {consents.map((c) => (
            <div
              key={c.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">{c.granteeName}</h4>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      c.status === 'ACTIVE'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  النطاق المصرح: <strong className="text-teal-300">{c.scope}</strong> • الغرض: <strong className="text-indigo-300">{c.purpose}</strong>
                </p>
                <div className="text-[11px] text-slate-500 font-mono">
                  تاريخ المنح: {new Date(c.grantedAt).toLocaleDateString('ar-EG')} • ينتهي في: {new Date(c.expiresAt).toLocaleDateString('ar-EG')}
                </div>
              </div>

              {c.status === 'ACTIVE' && (
                <button
                  onClick={() => handleRevoke(c.id)}
                  className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition active:scale-95 cursor-pointer"
                >
                  إلغاء الموافقة فوراً
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Notification Settings Panel & Medication Push Scheduler */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <MedicationPushNotificationScheduler
            patientId={patientId}
            patientName={session?.name}
            onOpenMedicationSchedule={() => {
              setActiveTab('meds');
              setMedsSubView('schedule');
            }}
          />
          <NotificationSettingsPanel patientId={patientId} />
        </div>
      )}

      {/* Tab: Medical History Summary & External Review PDF Export */}
      {activeTab === 'medical-history' && (
        <MedicalHistorySummaryPanel
          patientId={patientId}
          patientName={session?.name}
          onRequestBiometricVerify={(onSuccess) => {
            setBiometricPromptContext({
              title: 'التحقق البيومتري مطلوب لتصدير السجل الطبي الشامل',
              description: 'وفق سياسات حماية الخصوصية والسيادة الرقمية، يلزم تأكيد البصمة البيومترية قبل تنزيل ملخص التاريخ الطبي للأطباء الخارجيين.',
            });
            setPendingSensitiveAction(() => onSuccess);
            setShowBiometricOverlay(true);
          }}
        />
      )}

      {/* Tab: Interactive Symptom Assessment & Clinical Triage Module (Gemini AI) */}
      {activeTab === 'symptom-triage' && (
        <SymptomAssessmentModule
          patientId={patientId}
          onNavigateToTelemedicine={(triageCtx) => {
            if (triageCtx?.symptomSummary) {
              setChatInitialPrompt(`حالة استشارة عاجلة بعد الفرز السريري: ${triageCtx.symptomSummary} (${triageCtx.urgencyLevel})`);
            }
            setActiveTab('telemedicine');
          }}
          onNavigateToSymptomsLog={() => setActiveTab('symptoms')}
        />
      )}

      {/* Tab: AI-Powered Appointment Scheduling Module (Physician Availability & Patient History) */}
      {activeTab === 'appointments' && (
        <AppointmentSchedulingModule
          patientId={patientId}
          patientName={session?.name}
          onNavigateToTelemedicine={() => setActiveTab('telemedicine')}
          onOpenClinicalChat={(prompt) => openChatWithQuestion(prompt)}
        />
      )}

      {/* Modal: Symptom Logger with Real-Time Proactive AI Sentinel */}
      <SymptomLogModal
        isOpen={showSymptomModal}
        onClose={() => setShowSymptomModal(false)}
        patientId={patientId}
        onSaved={() => {
          setPortalSymptomsVersion((v) => v + 1);
        }}
      />

      {/* Simulated Biometric Authentication Overlay */}
      <BiometricAuthOverlay
        isOpen={showBiometricOverlay}
        onClose={() => {
          setShowBiometricOverlay(false);
          setPendingSensitiveAction(null);
        }}
        onSuccess={() => {
          if (pendingSensitiveAction) {
            pendingSensitiveAction();
            setPendingSensitiveAction(null);
          }
        }}
        title={biometricPromptContext?.title}
        description={biometricPromptContext?.description}
        patientId={patientId}
      />
    </div>
  );
};

