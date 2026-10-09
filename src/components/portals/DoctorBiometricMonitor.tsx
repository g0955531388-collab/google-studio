import React, { useState, useEffect, useMemo } from 'react';
import {
  HeartPulse,
  Activity,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Bell,
  BellRing,
  Radio,
  Search,
  Filter,
  Clock,
  Stethoscope,
  PhoneCall,
  Video,
  Pill,
  ExternalLink,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RefreshCw,
  FileText,
  Sparkles,
  Battery,
  Wifi,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Send,
  AlertOctagon,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  BiometricAnomalyAlert,
  BiometricAnomalySeverity,
  BiometricAnomalyStatus,
  BiometricAnomalyType,
} from '../../types';
import { biometricAnomalyService } from '../../services/biometricAnomalyService';
import { authService } from '../../services/authService';

interface DoctorBiometricMonitorProps {
  onOpenTelemedicine?: (patientId: string) => void;
}

export const DoctorBiometricMonitor: React.FC<DoctorBiometricMonitorProps> = ({
  onOpenTelemedicine,
}) => {
  const session = authService.getSession();
  const doctorName = session?.name || 'د. سارة المنصور (استشاري قلب)';
  const doctorId = session?.id || 'doc-dr-sarah';

  const [alerts, setAlerts] = useState<BiometricAnomalyAlert[]>([]);
  const [stats, setStats] = useState(biometricAnomalyService.getSummaryStats());
  const [isSimRunning, setIsSimRunning] = useState(biometricAnomalyService.isSimulationRunning());
  const [soundEnabled, setSoundEnabled] = useState(biometricAnomalyService.isSoundEnabled());

  // Filter & Search states
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('UNACKNOWLEDGED');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Triage Action Modal State
  const [activeTriageAlert, setActiveTriageAlert] = useState<BiometricAnomalyAlert | null>(null);
  const [triageActionType, setTriageActionType] = useState<string>('TELE_CONSULT');
  const [triageNotes, setTriageNotes] = useState<string>('');
  const [triageFeedback, setTriageFeedback] = useState<string | null>(null);

  // Subscribe to real-time anomalies feed
  useEffect(() => {
    const unsub = biometricAnomalyService.subscribe((updatedAlerts) => {
      setAlerts(updatedAlerts);
      setStats(biometricAnomalyService.getSummaryStats());
    });
    return unsub;
  }, []);

  // Filtered Alerts calculation
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (selectedSeverity !== 'ALL' && a.severity !== selectedSeverity) return false;
      if (selectedStatus === 'UNACKNOWLEDGED' && a.status !== 'UNACKNOWLEDGED') return false;
      if (selectedStatus === 'ACKNOWLEDGED' && a.status !== 'ACKNOWLEDGED') return false;
      if (selectedStatus === 'TRIAGED' && a.status !== 'TRIAGED') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = a.patientName.toLowerCase().includes(q);
        const matchTitle = a.title.toLowerCase().includes(q) || a.titleEn.toLowerCase().includes(q);
        const matchParam = a.parameter.toLowerCase().includes(q);
        const matchDevice = a.deviceSource.model.toLowerCase().includes(q);
        if (!matchName && !matchTitle && !matchParam && !matchDevice) return false;
      }

      return true;
    });
  }, [alerts, selectedSeverity, selectedStatus, searchQuery]);

  // Acknowledge Alert Handler
  const handleAcknowledge = (id: string) => {
    biometricAnomalyService.acknowledgeAlert(id, doctorId, doctorName);
  };

  // Submit Clinical Triage Intervention
  const handleSubmitTriage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTriageAlert) return;

    let actionLabel = 'استشارة مرئية عاجلة وتعديل بروتوكول العلاج';
    if (triageActionType === 'MED_ADJUST') actionLabel = 'تعديل جرعة الدواء وإرسال وصفة إلكترونية فورية';
    if (triageActionType === 'ER_DISPATCH') actionLabel = 'توجيه المريض فوراً إلى أقرب قسم طوارئ ومتابعة الإسعاف';
    if (triageActionType === 'HOME_REST') actionLabel = 'التوجيه بالراحة التامة وإعادة القياس بعد 15 دقيقة';

    biometricAnomalyService.triageAlert(
      activeTriageAlert.id,
      actionLabel,
      triageNotes || 'تم التحقق من القراءات الحيوية وتطبيق بروتوكول السلامة السريرية المعتمد.',
      doctorId,
      doctorName
    );

    setTriageFeedback(`تم تسجيل التدخل السريري وتثبيت الإجراء في السجل السيادي بنجاح.`);
    setTimeout(() => {
      setActiveTriageAlert(null);
      setTriageFeedback(null);
      setTriageNotes('');
    }, 1500);
  };

  // Simulation controls
  const toggleSimulation = () => {
    if (isSimRunning) {
      biometricAnomalyService.stopLiveSimulation();
      setIsSimRunning(false);
    } else {
      biometricAnomalyService.startLiveSimulation(15000);
      setIsSimRunning(true);
    }
  };

  const handleTriggerScenario = (
    scenario: 'TACHYCARDIA' | 'HYPOXEMIA' | 'HYPERTENSION' | 'HYPOGLYCEMIA' | 'FEVER'
  ) => {
    biometricAnomalyService.simulateIncomingAnomaly(scenario);
  };

  const toggleSound = () => {
    const updated = biometricAnomalyService.toggleSound();
    setSoundEnabled(updated);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Real-Time Live Biometric Stream Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {/* Background glow when critical anomalies are active */}
        {stats.unacknowledgedCount > 0 && (
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 animate-pulse" />
        )}

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600 via-red-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20 font-black text-xl">
                <HeartPulse className="w-7 h-7" />
              </div>
              {stats.unacknowledgedCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-slate-900"></span>
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-black text-white">
                  نظام التنبيهات اللحظية والشذوذات الحيوية (Biometric Anomaly Stream)
                </h3>
                <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/80">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>بث تلومتري حي نشط</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                رصد تدفق المؤشرات الحيوية لمرضى العيادة والتحذير الفوري من التسرع القلبي، هبوط الأكسجين، أزمات الضغط ونوبات نقص السكر
              </p>
            </div>
          </div>

          {/* Interactive Simulation & Audio Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'كتم نغمة التنبيه' : 'تفعيل نغمة التنبيه'}
              className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-slate-800 text-teal-300 border-slate-700 hover:bg-slate-750'
                  : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? 'الصوت مفعل' : 'صامت'}</span>
            </button>

            <button
              onClick={toggleSimulation}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                isSimRunning
                  ? 'bg-amber-950 text-amber-300 border-amber-800 shadow-lg shadow-amber-950/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isSimRunning ? (
                <>
                  <Pause className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>إيقاف البث التلقائي</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-emerald-400" />
                  <span>بدء محاكاة البث الحي</span>
                </>
              )}
            </button>

            <button
              onClick={() => biometricAnomalyService.resetToDefault()}
              className="px-3 py-2 bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-white rounded-xl border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة ضبط</span>
            </button>
          </div>
        </div>

        {/* Quick Simulation Scenario Ingestion Triggers */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-bold text-slate-300">حقن شذوذ حيوي اختباري (Trigger Scenario):</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleTriggerScenario('TACHYCARDIA')}
              className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 rounded-lg font-bold transition cursor-pointer flex items-center gap-1"
            >
              <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
              <span>تسرع بطيني (VTach)</span>
            </button>

            <button
              onClick={() => handleTriggerScenario('HYPOXEMIA')}
              className="px-2.5 py-1.5 bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border border-sky-800/60 rounded-lg font-bold transition cursor-pointer flex items-center gap-1"
            >
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span>هبوط أكسجين (SpO2 &lt; 85%)</span>
            </button>

            <button
              onClick={() => handleTriggerScenario('HYPERTENSION')}
              className="px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 rounded-lg font-bold transition cursor-pointer flex items-center gap-1"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>أزمة ضغط (186/118)</span>
            </button>

            <button
              onClick={() => handleTriggerScenario('HYPOGLYCEMIA')}
              className="px-2.5 py-1.5 bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800/60 rounded-lg font-bold transition cursor-pointer flex items-center gap-1"
            >
              <Pill className="w-3.5 h-3.5 text-purple-400" />
              <span>هبوط سكر حاد (48 mg/dL)</span>
            </button>

            <button
              onClick={() => handleTriggerScenario('FEVER')}
              className="px-2.5 py-1.5 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/60 rounded-lg font-bold transition cursor-pointer flex items-center gap-1"
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>حمى مفاجئة (39.4°C)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Summary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>تنبيهات حرجة معلقة</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {stats.unacknowledgedCount}
          </div>
          <p className="text-[11px] text-slate-500">
            تتطلب إقرار وتدخل سريري عاجل
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>مرضى تحت المراقبة اللحظية</span>
            <Radio className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {stats.activeMonitoredPatients}
          </div>
          <p className="text-[11px] text-slate-500">
            أجهزة استشعار حيوية موثقة
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>حالات تم فرزها والتدخل</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {stats.triagedCount}
          </div>
          <p className="text-[11px] text-slate-500">
            تم تسجيل الإجراء في السجل السيادي
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>سرعة تدفق القياسات الحيوية</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-400 font-mono">
            {stats.telemetryIngestRateMsgSec} <span className="text-xs text-slate-400">msg/s</span>
          </div>
          <p className="text-[11px] text-slate-500">
            زمن استجابة الشبكة: 14ms (Damascus Gateway)
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالمريض، نوع الشذوذ، الجهاز..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-2.5 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Segmented Buttons */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedStatus('UNACKNOWLEDGED')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                selectedStatus === 'UNACKNOWLEDGED'
                  ? 'bg-rose-950 text-rose-300 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              غير مقروءة ({stats.unacknowledgedCount})
            </button>
            <button
              onClick={() => setSelectedStatus('ACKNOWLEDGED')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                selectedStatus === 'ACKNOWLEDGED'
                  ? 'bg-blue-950 text-blue-300 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              تم الإقرار
            </button>
            <button
              onClick={() => setSelectedStatus('TRIAGED')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                selectedStatus === 'TRIAGED'
                  ? 'bg-emerald-950 text-emerald-300 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              تم التدخل ({stats.triagedCount})
            </button>
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                selectedStatus === 'ALL'
                  ? 'bg-slate-800 text-white font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الكل ({alerts.length})
            </button>
          </div>

          {/* Severity Filter Dropdown */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500 cursor-pointer"
          >
            <option value="ALL">جميع مستويات الخطورة</option>
            <option value="CRITICAL">خطورة حرجة (Critical)</option>
            <option value="WARNING">تحذير سريري (Warning)</option>
            <option value="ATTENTION">ملاحظة وانتباه (Attention)</option>
          </select>
        </div>
      </div>

      {/* Biometric Anomaly Cards Feed */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">لا توجد تنبيهات تطابق المعايير المحددة</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              كافة المؤشرات الحيوية للمرضى ضمن الحدود الطبيعية المستقرة أو تم فرزها والتدخل بشأنها مسبقاً.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isWarning = alert.severity === 'WARNING';
            const isUnacknowledged = alert.status === 'UNACKNOWLEDGED';

            return (
              <div
                key={alert.id}
                className={`rounded-2xl p-5 border transition shadow-xl space-y-4 ${
                  isUnacknowledged && isCritical
                    ? 'bg-slate-900 border-rose-850 shadow-rose-950/20 ring-1 ring-rose-500/30'
                    : isUnacknowledged && isWarning
                    ? 'bg-slate-900 border-amber-850'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                {/* Header Row: Patient, Anomaly Severity, Detection Time */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isCritical
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/80'
                          : isWarning
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                          : 'bg-sky-950 text-sky-300 border border-sky-800/80'
                      }`}
                    >
                      {isCritical ? (
                        <AlertOctagon className="w-5 h-5 animate-pulse text-rose-400" />
                      ) : (
                        <Activity className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white">{alert.patientName}</h4>
                        <span className="text-xs text-slate-400">({alert.patientAge} سنة)</span>
                        <span className="text-[10px] font-mono text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800/80">
                          {alert.consentToken}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>رُصدت: {new Date(alert.detectedAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>·</span>
                        <span className="text-slate-300 font-bold">{alert.deviceSource.model}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Severity Visual Tags */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        isCritical
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : isWarning
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-sky-950 text-sky-300 border-sky-800'
                      }`}
                    >
                      {isCritical ? 'خطورة قصوى (Critical)' : isWarning ? 'تحذير سريري' : 'ملاحظة'}
                    </span>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        alert.status === 'UNACKNOWLEDGED'
                          ? 'bg-red-950/80 text-red-300 border-red-800 animate-pulse'
                          : alert.status === 'ACKNOWLEDGED'
                          ? 'bg-blue-950 text-blue-300 border-blue-800'
                          : alert.status === 'TRIAGED'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {alert.status === 'UNACKNOWLEDGED'
                        ? 'تنبيه غير مقروء'
                        : alert.status === 'ACKNOWLEDGED'
                        ? 'تم الإقرار'
                        : alert.status === 'TRIAGED'
                        ? 'تم التدخل السريري'
                        : 'مغلق'}
                    </span>
                  </div>
                </div>

                {/* Main Anomaly Core: Anomaly Title & Parameter Metric Deviation */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Left Column: Parameter & Numerical Deviation Card */}
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2">
                    <span className="text-xs text-slate-400 font-bold block">
                      المؤشر الفسيولوجي المعتل:
                    </span>
                    <div className="text-xs text-slate-200 font-bold">
                      {alert.parameter}
                    </div>

                    <div className="flex items-baseline gap-2 pt-1">
                      <span
                        className={`text-2xl font-black font-mono ${
                          isCritical ? 'text-rose-400' : 'text-amber-400'
                        }`}
                      >
                        {alert.observedValue}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{alert.unit}</span>

                      {alert.deviationPercentage !== undefined && (
                        <span
                          className={`text-xs font-mono font-bold flex items-center mr-auto ${
                            alert.deviationPercentage > 0 ? 'text-rose-400' : 'text-sky-400'
                          }`}
                        >
                          {alert.deviationPercentage > 0 ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          )}
                          {alert.deviationPercentage > 0 ? `+${alert.deviationPercentage}%` : `${alert.deviationPercentage}%`}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-900">
                      النطاق المستهدف: {alert.baselineRange.targetText}
                    </div>

                    {/* Sparkline Physiological Wavelet */}
                    {alert.physiologicalTrace && alert.physiologicalTrace.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] text-slate-500 block mb-1">
                          منحنى التطور اللحظي (Telemetry Wave):
                        </span>
                        <div className="flex items-end gap-1.5 h-10 bg-slate-900/90 p-1.5 rounded-lg border border-slate-850">
                          {alert.physiologicalTrace.map((pt, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                              <div
                                style={{
                                  height: `${Math.min(
                                    100,
                                    Math.max(15, (Number(pt.value) / (Number(alert.observedValue) || 100)) * 90)
                                  )}%`,
                                }}
                                className={`w-full rounded-t ${
                                  i === alert.physiologicalTrace!.length - 1
                                    ? isCritical
                                      ? 'bg-rose-500 animate-pulse'
                                      : 'bg-amber-400'
                                    : 'bg-slate-700'
                                }`}
                                title={`${pt.timestamp}: ${pt.value}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Middle Column: Clinical Mechanism & Urgency Protocol */}
                  <div className="lg:col-span-2 space-y-2.5">
                    <div>
                      <h5 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{alert.title}</span>
                      </h5>
                      <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                        {alert.titleEn}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-850 space-y-1.5 leading-relaxed">
                      <div>
                        <strong className="text-teal-400">الآلية السريرية المشخصة:</strong>{' '}
                        <span>{alert.clinicalMechanism}</span>
                      </div>
                      <div>
                        <strong className="text-rose-400">بروتوكول الطوارئ الإلزامي:</strong>{' '}
                        <span>{alert.urgencyProtocol}</span>
                      </div>
                      <div>
                        <strong className="text-indigo-300">التوصية المباشرة:</strong>{' '}
                        <span>{alert.recommendedAction}</span>
                      </div>
                    </div>

                    {/* Sensor Device Status & Provenance */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Battery className="w-3.5 h-3.5 text-emerald-400" />
                          <span>بطارية: {alert.deviceSource.batteryPercentage}%</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Wifi className="w-3.5 h-3.5 text-teal-400" />
                          <span>إشارة: {alert.deviceSource.signalQuality || 'ممتازة'}</span>
                        </span>
                      </div>

                      <span className="text-slate-500 font-mono truncate max-w-xs">
                        المصدر: {alert.provenance}
                      </span>
                    </div>

                    {/* If Triaged Notes already exist */}
                    {alert.triagedActionTaken && (
                      <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs space-y-1 text-emerald-300">
                        <div className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>الإجراء السريري المتخذ: {alert.triagedActionTaken}</span>
                        </div>
                        {alert.clinicalNotes && (
                          <p className="text-slate-300 text-[11px]">{alert.clinicalNotes}</p>
                        )}
                        {alert.acknowledgedBy && (
                          <div className="text-[10px] text-emerald-400/80">
                            بواسطة: {alert.acknowledgedBy} • {new Date(alert.acknowledgedAt || '').toLocaleTimeString('ar-SA')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-400" />
                    <span>مشمول بتفويض الرعاية السريرية المعقدة</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Acknowledge Button */}
                    {alert.status === 'UNACKNOWLEDGED' && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                        <span>إقرار القراءة (Acknowledge)</span>
                      </button>
                    )}

                    {/* Urgent Action / Triage Button */}
                    <button
                      onClick={() => {
                        setActiveTriageAlert(alert);
                        setTriageNotes('');
                      }}
                      className="px-4 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-teal-950/40 cursor-pointer"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>تدخل سريري فوري (Clinical Triage)</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Clinical Triage Intervention Modal */}
      {activeTriageAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-950 text-teal-300 border border-teal-800 flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">
                    التدخل السريري والفرز الفوري (Clinical Triage)
                  </h4>
                  <p className="text-xs text-slate-400">
                    المريض: {activeTriageAlert.patientName} • {activeTriageAlert.title}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTriageAlert(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {triageFeedback ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{triageFeedback}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitTriage} className="space-y-4">
                {/* Intervention Action Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">
                    نوع الإجراء السريري المتخذ:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTriageActionType('TELE_CONSULT')}
                      className={`p-3 rounded-xl border text-xs text-right font-bold transition flex items-center gap-2.5 cursor-pointer ${
                        triageActionType === 'TELE_CONSULT'
                          ? 'bg-teal-950/80 text-teal-200 border-teal-700 ring-1 ring-teal-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <Video className="w-4 h-4 text-teal-400 shrink-0" />
                      <div>
                        <div className="text-white">استشارة مرئية عاجلة</div>
                        <div className="text-[10px] text-slate-400">فتح جلسة استشارة فورية مع المريض</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTriageActionType('MED_ADJUST')}
                      className={`p-3 rounded-xl border text-xs text-right font-bold transition flex items-center gap-2.5 cursor-pointer ${
                        triageActionType === 'MED_ADJUST'
                          ? 'bg-teal-950/80 text-teal-200 border-teal-700 ring-1 ring-teal-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <Pill className="w-4 h-4 text-teal-400 shrink-0" />
                      <div>
                        <div className="text-white">تعديل الوصفة الدوائية</div>
                        <div className="text-[10px] text-slate-400">إصدار وصفة جديدة أو تعديل الجرعة</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTriageActionType('ER_DISPATCH')}
                      className={`p-3 rounded-xl border text-xs text-right font-bold transition flex items-center gap-2.5 cursor-pointer ${
                        triageActionType === 'ER_DISPATCH'
                          ? 'bg-rose-950/80 text-rose-200 border-rose-700 ring-1 ring-rose-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <PhoneCall className="w-4 h-4 text-rose-400 shrink-0" />
                      <div>
                        <div className="text-white">توجيه لقسم الطوارئ</div>
                        <div className="text-[10px] text-slate-400">إشعار الإسعاف أو أقرب مستشفى</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTriageActionType('HOME_REST')}
                      className={`p-3 rounded-xl border text-xs text-right font-bold transition flex items-center gap-2.5 cursor-pointer ${
                        triageActionType === 'HOME_REST'
                          ? 'bg-teal-950/80 text-teal-200 border-teal-700 ring-1 ring-teal-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <Activity className="w-4 h-4 text-teal-400 shrink-0" />
                      <div>
                        <div className="text-white">مراقبة منزلية وإعادة فحص</div>
                        <div className="text-[10px] text-slate-400">التوصية بالراحة والقياس بعد 15د</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Clinical Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    الملاحظات السريرية والتعليمات الطبية المعتمدة:
                  </label>
                  <textarea
                    rows={3}
                    value={triageNotes}
                    onChange={(e) => setTriageNotes(e.target.value)}
                    placeholder="اكتب التوجيهات السريرية للمريض أو التوصية التمريضية..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl text-xs text-blue-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>
                    سيتم تسجيل هذا التدخل في السجل السيادي اللامركزي مع ختم هوية الطبيب: {doctorName}.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTriageAlert(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-lg shadow-teal-950/50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>تأكيد الإجراء والتدخل السريري</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
