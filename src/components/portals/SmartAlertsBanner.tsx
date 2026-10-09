import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  AlertCircle,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  RefreshCw,
  X,
  Pill,
  Activity,
  HeartPulse,
} from 'lucide-react';
import { SmartAlert, SmartAlertStats } from '../../types';
import { dataService } from '../../services/dataService';
import { aiService } from '../../services/aiService';

interface SmartAlertsBannerProps {
  patientId?: string;
  onOpenSymptomModal?: () => void;
  onConsultTelehealth?: () => void;
  onAlertsChanged?: () => void;
}

export const SmartAlertsBanner: React.FC<SmartAlertsBannerProps> = ({
  patientId = 'pat-main',
  onOpenSymptomModal,
  onConsultTelehealth,
  onAlertsChanged,
}) => {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [stats, setStats] = useState<SmartAlertStats>({
    totalAlerts: 0,
    criticalCount: 0,
    warningCount: 0,
    activeCount: 0,
    unacknowledgedCount: 0,
  });
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedAlert, setSelectedAlert] = useState<SmartAlert | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const reloadAlerts = () => {
    const list = dataService.getSmartAlerts(patientId);
    setAlerts(list);
    setStats(dataService.getSmartAlertStats(patientId));
    if (onAlertsChanged) onAlertsChanged();
  };

  useEffect(() => {
    reloadAlerts();
  }, [patientId]);

  const handleAcknowledge = (alertId: string) => {
    dataService.acknowledgeSmartAlert(alertId);
    reloadAlerts();
    if (selectedAlert?.id === alertId) {
      setSelectedAlert((prev) => (prev ? { ...prev, status: 'ACKNOWLEDGED' } : null));
    }
  };

  const handleDismiss = (alertId: string) => {
    dataService.dismissSmartAlert(alertId);
    reloadAlerts();
    if (selectedAlert?.id === alertId) {
      setSelectedAlert(null);
    }
  };

  const handleRunFullScan = async () => {
    setIsScanning(true);
    setScanMessage(null);
    try {
      const res = await aiService.analyzeSmartAlerts({
        patientId,
        triggerType: 'FULL_SCAN',
      });
      reloadAlerts();
      setScanMessage(res.summaryMessage || 'تم اكتمال الفحص الاستباقي بنجاح.');
      setTimeout(() => setScanMessage(null), 6000);
    } catch (err) {
      console.error('Scan error:', err);
      setScanMessage('تعذر إكمال الفحص المؤتمت، يرجى المحاولة لاحقاً.');
    } finally {
      setIsScanning(false);
    }
  };

  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE');
  if (activeAlerts.length === 0 && !isScanning && !scanMessage) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <span>اليقظة الدوائية الذكية (Lifex Smart Sentinel)</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded-full font-mono">
                آمن — لا توجد تعارضات نشطة
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              النظام يراقب تلقائياً التداخلات الدوائية والآثار العكسية لجرعاتك المسجلة وقراءاتك الحيوية.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSymptomModal && (
            <button
              onClick={onOpenSymptomModal}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition flex items-center gap-1.5 cursor-pointer text-xs"
            >
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              <span>تسجيل عَرَض صحي</span>
            </button>
          )}

          <button
            onClick={handleRunFullScan}
            disabled={isScanning}
            className="px-3 py-1.5 rounded-xl bg-teal-600/10 hover:bg-teal-600/20 text-teal-300 border border-teal-500/30 font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-teal-400' : ''}`} />
            <span>فحص استباقي شامل</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Banner Card */}
      <div
        className={`rounded-2xl border p-4 shadow-lg transition duration-200 ${
          stats.criticalCount > 0
            ? 'bg-rose-950/30 border-rose-500/40'
            : stats.warningCount > 0
            ? 'bg-amber-950/25 border-amber-500/40'
            : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Header left */}
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                stats.criticalCount > 0
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              {stats.criticalCount > 0 ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-white">
                  نظام التنبيهات الذكية لليقظة الدوائية (Smart Pharmacovigilance Alerts)
                </h4>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    stats.criticalCount > 0
                      ? 'bg-rose-950 text-rose-300 border-rose-700'
                      : 'bg-amber-950 text-amber-300 border-amber-700'
                  }`}
                >
                  {activeAlerts.length} تنبيه نشط
                </span>
                <span className="text-[10px] bg-slate-950 text-teal-300 border border-teal-800/40 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-teal-400" />
                  Gemini Sentinel
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-0.5">
                {stats.criticalCount > 0
                  ? 'تم رصد تداخل دوائي عالي الخطورة أو تعارض تحسسي يتطلب انتباهك الفوري واستشارة الطبيب!'
                  : 'تم رصد آثار عكسية محتملة أو اتجاهات سريرية مرتبطة بأدويتك الحالية أو الأعراض المسجلة.'}
              </p>
            </div>
          </div>

          {/* Header right actions */}
          <div className="flex items-center gap-2">
            {onOpenSymptomModal && (
              <button
                onClick={onOpenSymptomModal}
                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-teal-400" />
                <span>تسجيل عَرَض جديد</span>
              </button>
            )}

            <button
              onClick={handleRunFullScan}
              disabled={isScanning}
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-teal-400' : ''}`} />
              <span>إعادة الفحص</span>
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
              title={isExpanded ? 'طي التنبيهات' : 'توسيع التنبيهات'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {scanMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-slate-950/80 border border-teal-500/40 text-xs text-teal-200 animate-fade-in flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{scanMessage}</span>
          </div>
        )}

        {/* Collapsible Alerts List */}
        {isExpanded && activeAlerts.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3">
            {activeAlerts.map((alert) => {
              const isCrit = alert.severity === 'CRITICAL';
              return (
                <div
                  key={alert.id}
                  className={`rounded-xl p-3.5 border transition ${
                    isCrit
                      ? 'bg-rose-950/40 border-rose-500/30 hover:border-rose-500/50'
                      : 'bg-slate-950/60 border-amber-500/30 hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 max-w-3xl">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                          isCrit ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {alert.type === 'DRUG_DRUG_INTERACTION' || alert.type === 'ALLERGY_CONFLICT' ? (
                          <Pill className="w-4 h-4" />
                        ) : (
                          <Activity className="w-4 h-4" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                              isCrit
                                ? 'bg-rose-600 text-white shadow-sm'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {isCrit ? 'حرج جداً (CRITICAL)' : 'تنبيه وقائي (WARNING)'}
                          </span>

                          <span className="text-[11px] font-bold text-slate-400 font-mono">
                            {alert.type === 'DRUG_DRUG_INTERACTION'
                              ? 'تداخل دوائي مباشر'
                              : alert.type === 'ALLERGY_CONFLICT'
                              ? 'تعارض حساسية مفرطة'
                              : alert.type === 'DRUG_SYMPTOM_SIDE_EFFECT'
                              ? 'أثر دوائي عكسي'
                              : 'اتجاه سريري غير مواتٍ'}
                          </span>

                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(alert.timestamp).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <h5 className="text-xs font-bold text-white">{alert.title}</h5>
                        <p className="text-xs text-slate-300 leading-relaxed">{alert.summary}</p>

                        {/* Trigger details chips */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                          {alert.triggerDetails.medicationName && (
                            <span className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                              <Pill className="w-3 h-3 text-teal-400" />
                              {alert.triggerDetails.medicationName}
                            </span>
                          )}

                          {alert.triggerDetails.interactingWith &&
                            alert.triggerDetails.interactingWith.map((item, idx) => (
                              <span
                                key={idx}
                                className="bg-rose-950/60 border border-rose-800/40 text-rose-300 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono"
                              >
                                <span>يتداخل مع: {item}</span>
                              </span>
                            ))}

                          {alert.triggerDetails.symptomName && (
                            <span className="bg-amber-950/60 border border-amber-800/40 text-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                              <Activity className="w-3 h-3 text-amber-400" />
                              العَرَض: {alert.triggerDetails.symptomName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Alert action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setSelectedAlert(alert)}
                        className="px-2.5 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>التفاصيل السريرية</span>
                      </button>

                      {onConsultTelehealth && (
                        <button
                          onClick={onConsultTelehealth}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                          title="استشر الطبيب حول هذا التنبيه"
                        >
                          <HeartPulse className="w-3.5 h-3.5 text-indigo-400" />
                          <span>استشارة الطبيب</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        title="إقرار بالعلم ومتابعة"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>إقرار</span>
                      </button>

                      <button
                        onClick={() => handleDismiss(alert.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        title="إغلاق التنبيه"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Full Clinical Alert Details */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert
                  className={`w-5 h-5 ${
                    selectedAlert.severity === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'
                  }`}
                />
                <h3 className="text-base font-bold text-white">تفاصيل التنبيه السريري الذكي</h3>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">{selectedAlert.title}</h4>
                {selectedAlert.titleEn && (
                  <p className="text-slate-400 text-[11px] font-mono">{selectedAlert.titleEn}</p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed">
                {selectedAlert.summary}
              </div>

              {/* Mechanism */}
              <div className="space-y-1">
                <span className="font-bold text-teal-400 text-xs block">
                  الآلية الفارماكولوجية والسريرية (Clinical Mechanism):
                </span>
                <p className="text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                  {selectedAlert.clinicalMechanism}
                </p>
              </div>

              {/* Potential Risk */}
              <div className="space-y-1">
                <span className="font-bold text-rose-400 text-xs block">
                  المخاطر المحتملة (Potential Risks):
                </span>
                <p className="text-rose-200/90 bg-rose-950/20 p-2.5 rounded-xl border border-rose-900/30 leading-relaxed">
                  {selectedAlert.potentialRisk}
                </p>
              </div>

              {/* Recommended Action */}
              <div className="space-y-1">
                <span className="font-bold text-emerald-400 text-xs block">
                  الإجراء الطبي الموصى به (Recommended Action):
                </span>
                <p className="text-emerald-200/90 bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-900/30 leading-relaxed">
                  {selectedAlert.recommendedAction}
                </p>
              </div>

              {/* Citations */}
              {selectedAlert.citations && selectedAlert.citations.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="font-bold text-slate-400 text-[11px] block">
                    المراجع والإرشادات السريرية المعتمدة:
                  </span>
                  <div className="space-y-1 font-mono text-[10px] text-slate-400">
                    {selectedAlert.citations.map((cite, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="text-teal-400">•</span>
                        <span>{cite}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                <strong>إخلاء مسؤولية قانوني وسريري:</strong> {selectedAlert.disclaimer}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <span className="text-[10px] font-mono text-slate-500">
                المعرف: {selectedAlert.id} | النموذج: {selectedAlert.modelUsed || 'gemini-3.8-flash'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAcknowledge(selectedAlert.id)}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs transition cursor-pointer"
                >
                  إقرار بالعلم ومتابعة
                </button>
                <button
                  onClick={() => handleDismiss(selectedAlert.id)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  إغلاق التنبيه
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
