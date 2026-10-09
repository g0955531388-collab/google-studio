import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Clock,
  Pill,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Smartphone,
  ShieldCheck,
  Calendar,
  Utensils,
  ChevronRight,
  Info,
  Check,
  X,
  FileText,
  Activity,
  Flame,
  Award,
} from 'lucide-react';
import { ScheduledMedicationPushAlert, PushNotificationSchedulerConfig, MedicationScheduleEntry } from '../../types';
import { pushNotificationService } from '../../services/pushNotificationService';
import { dataService } from '../../services/dataService';

interface MedicationPushNotificationSchedulerProps {
  patientId?: string;
  patientName?: string;
  onOpenMedicationSchedule?: () => void;
}

export const MedicationPushNotificationScheduler: React.FC<MedicationPushNotificationSchedulerProps> = ({
  patientId = 'pat-main',
  patientName = 'أحمد المنصور',
  onOpenMedicationSchedule,
}) => {
  const [alerts, setAlerts] = useState<ScheduledMedicationPushAlert[]>([]);
  const [config, setConfig] = useState<PushNotificationSchedulerConfig>(() =>
    pushNotificationService.getConfig(patientId)
  );
  const [schedules, setSchedules] = useState<MedicationScheduleEntry[]>([]);
  const [selectedAlertForAction, setSelectedAlertForAction] = useState<ScheduledMedicationPushAlert | null>(null);
  const [actionNotes, setActionNotes] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [simulatedAlertActive, setSimulatedAlertActive] = useState<ScheduledMedicationPushAlert | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'TRIGGERED' | 'ACKNOWLEDGED' | 'SNOOZED'>('ALL');
  const [snoozeMinutes, setSnoozeMinutes] = useState<number>(10);

  // Sync alerts on mount & subscribe
  useEffect(() => {
    pushNotificationService.syncScheduledAlerts(patientId);
    setAlerts(pushNotificationService.getActiveAlerts(patientId));
    setConfig(pushNotificationService.getConfig(patientId));
    setSchedules(dataService.getMedicationSchedules(patientId));

    const unsubscribe = pushNotificationService.subscribe((updatedAlerts) => {
      setAlerts(updatedAlerts.filter((a) => a.patientId === patientId));
      setConfig(pushNotificationService.getConfig(patientId));
    });

    const stopScheduler = pushNotificationService.startScheduler(15000);

    return () => {
      unsubscribe();
      stopScheduler();
    };
  }, [patientId]);

  const handleRequestPermission = async () => {
    const perm = await pushNotificationService.requestPushPermission(patientId);
    if (perm === 'granted') {
      showToast('✓ تم تفعيل إشعارات المتصفح بنجاح! ستصلك تنبيهات الجرعات في مواعيدها الدقيقة.');
      pushNotificationService.playChimeSound();
    } else if (perm === 'denied') {
      showToast('⚠️ تم رفض الإذن بالمتصفح. يمكنك السماح بالإشعارات من إعدادات المتصفح.');
    } else {
      showToast('ℹ️ يتم استخدام التنبيهات المدمجة والتنبيهات الصوتية في بيئة الاستعراض.');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleSimulatePush = (scheduleId?: string) => {
    const alert = pushNotificationService.simulateImmediatePushAlert(patientId, scheduleId);
    setSimulatedAlertActive(alert);
    showToast(`🔔 تم إطلاق إشعار فوري تجريبي لدواء: ${alert.medicationName}`);
  };

  const handleAcknowledge = (alertId: string) => {
    const result = pushNotificationService.acknowledgeAlert(alertId, actionNotes || undefined);
    if (result.success) {
      showToast(`✓ تم تأكيد تناول الجرعة وتسجيلها في السجل الطبي بنجاح!`);
      setSelectedAlertForAction(null);
      setActionNotes('');
      setSimulatedAlertActive(null);
    }
  };

  const handleSnooze = (alertId: string) => {
    const updated = pushNotificationService.snoozeAlert(alertId, snoozeMinutes);
    if (updated) {
      showToast(`⏱️ تم تأجيل التنبيه لمدة ${snoozeMinutes} دقائق.`);
      setSelectedAlertForAction(null);
      setSimulatedAlertActive(null);
    }
  };

  const handleToggleSound = () => {
    const updated = pushNotificationService.updateConfig(patientId, {
      soundChimeEnabled: !config.soundChimeEnabled,
    });
    setConfig(updated);
    if (updated.soundChimeEnabled) {
      pushNotificationService.playChimeSound();
      showToast('🔊 تم تفعيل النغمات الصوتية الطبية');
    } else {
      showToast('🔇 تم كتم النغمات الصوتية');
    }
  };

  const handleToggleQuietHours = () => {
    const updated = pushNotificationService.updateConfig(patientId, {
      quietHoursStart: config.quietHoursStart ? undefined : '23:00',
      quietHoursEnd: config.quietHoursEnd ? undefined : '06:00',
    });
    setConfig(updated);
  };

  // Filtered alerts
  const filteredAlerts = alerts.filter((a) => {
    if (activeFilter === 'ALL') return true;
    return a.status === activeFilter;
  });

  const pendingCount = alerts.filter((a) => a.status === 'PENDING').length;
  const triggeredCount = alerts.filter((a) => a.status === 'TRIGGERED').length;
  const ackCount = alerts.filter((a) => a.status === 'ACKNOWLEDGED').length;

  return (
    <div className="space-y-6 animate-fade-in text-right" dir="rtl">
      {/* Toast */}
      {toastMessage && (
        <div className="p-4 bg-teal-950/80 border border-teal-500/50 rounded-2xl text-teal-200 text-xs font-bold flex items-center justify-between shadow-2xl animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <BellRing className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-teal-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner & Control Center */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-slate-950 shadow-xl shadow-teal-500/20 font-black shrink-0">
              <BellRing className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-black text-white">نظام جدولة الإشعارات التلقائية للأدوية</h3>
                <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-800 px-2.5 py-0.5 rounded-full font-bold">
                  Push Alerts Engine
                </span>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  EHR Grounded
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                تنبيهات فورية مجدولة تلقائياً بالاعتماد على الوصفات الطبية المحفوظة في ملف المريض ({patientName}). يربط النظام مواعيد الجرعات بإشعارات الويب المباشرة مع تسجيل الامتثال الدوائي وتأكيد التناول تلقائياً في السجل الطبي.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {config.permissionStatus !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-teal-500/25 flex items-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span>تفعيل إشعارات المتصفح</span>
              </button>
            )}

            <button
              onClick={() => handleSimulatePush()}
              className="px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-sm"
              title="محاكاة إشعار فوري لجرعة مستحقة الآن"
            >
              <Play className="w-3.5 h-3.5 text-indigo-400" />
              <span>محاكاة إشعار فوري (Live Test)</span>
            </button>

            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                config.soundChimeEnabled
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={config.soundChimeEnabled ? 'كتم النغمة الصوتية' : 'تفعيل النغمة الصوتية'}
            >
              {config.soundChimeEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {onOpenMedicationSchedule && (
              <button
                onClick={onOpenMedicationSchedule}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>عرض جدول الأدوية</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">أدوية مجدولة بالإشعارات</div>
              <div className="text-lg font-black text-white">{schedules.filter((s) => s.reminderEnabled).length} <span className="text-xs text-slate-500 font-normal">أدوية</span></div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">تنبيهات بالانتظار اليوم</div>
              <div className="text-lg font-black text-amber-400">{pendingCount} <span className="text-xs text-slate-500 font-normal">جرعة</span></div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">إشعارات حان موعدها</div>
              <div className="text-lg font-black text-rose-400">{triggeredCount} <span className="text-xs text-slate-500 font-normal">نشط</span></div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">جرعات تم تأكيدها اليوم</div>
              <div className="text-lg font-black text-emerald-400">{ackCount} <span className="text-xs text-slate-500 font-normal">مؤكد</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Active Live Push Alert Overlay Card if Triggered */}
      {simulatedAlertActive && (
        <div className="bg-gradient-to-r from-teal-950/90 via-slate-900 to-indigo-950/90 border-2 border-teal-500 rounded-3xl p-6 shadow-2xl animate-bounce-subtle">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/40">
                <BellRing className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-teal-500 text-slate-950 px-2 py-0.5 rounded font-black">
                    إشعار فوري نشط الآن
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {simulatedAlertActive.scheduledTime}
                  </span>
                </div>
                <h4 className="text-lg font-black text-white mt-1">
                  حان الآن موعد: {simulatedAlertActive.medicationName} ({simulatedAlertActive.dosage})
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  التعليمات السريرية: {simulatedAlertActive.instructions}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => handleAcknowledge(simulatedAlertActive.id)}
                className="flex-1 md:flex-none px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>تم تناول الجرعة الآن</span>
              </button>

              <button
                onClick={() => handleSnooze(simulatedAlertActive.id)}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold border border-slate-700 cursor-pointer transition"
                title="تأجيل 10 دقائق"
              >
                <span>تأجيل (10 د)</span>
              </button>

              <button
                onClick={() => setSimulatedAlertActive(null)}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Alerts List with Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-teal-400" />
            <h4 className="text-base font-black text-white">جدول التنبيهات المستخرجة من السجلات الطبية</h4>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
              {alerts.length} تنبيهات
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                activeFilter === 'ALL' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              الكل ({alerts.length})
            </button>
            <button
              onClick={() => setActiveFilter('PENDING')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                activeFilter === 'PENDING' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              بالانتظار ({pendingCount})
            </button>
            <button
              onClick={() => setActiveFilter('TRIGGERED')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                activeFilter === 'TRIGGERED' ? 'bg-rose-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              مستحقة ({triggeredCount})
            </button>
            <button
              onClick={() => setActiveFilter('ACKNOWLEDGED')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                activeFilter === 'ACKNOWLEDGED' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              مؤكدة ({ackCount})
            </button>
          </div>
        </div>

        {/* Alerts Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAlerts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 space-y-2">
              <Pill className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-bold text-slate-400">لا توجد تنبيهات مطابقة لهذا الفلتر</p>
              <p className="text-xs text-slate-500">تم فحص السجلات الطبية الخاصة بجرعات اليوم بنجاح</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isTriggered = alert.status === 'TRIGGERED';
              const isAck = alert.status === 'ACKNOWLEDGED';
              const isPending = alert.status === 'PENDING';
              const isSnoozed = alert.status === 'SNOOZED';

              return (
                <div
                  key={alert.id}
                  className={`p-5 rounded-2xl border transition relative space-y-3 ${
                    isTriggered
                      ? 'bg-rose-950/30 border-rose-500/60 shadow-lg shadow-rose-950/30'
                      : isAck
                      ? 'bg-slate-950/60 border-emerald-800/40 opacity-90'
                      : isSnoozed
                      ? 'bg-amber-950/20 border-amber-600/40'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isTriggered
                            ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                            : isAck
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-teal-500/10 text-teal-400'
                        }`}
                      >
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-white">{alert.medicationName}</h5>
                          <span className="text-xs text-teal-400 font-mono font-bold">({alert.dosage})</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span className="font-mono">{alert.scheduledTime}</span>
                          <span>•</span>
                          <span className="text-[11px] text-slate-400">
                            {alert.mealContext === 'WITH_MEAL'
                              ? 'مع الوجبة'
                              : alert.mealContext === 'BEFORE_MEAL'
                              ? 'قبل الطعام'
                              : alert.mealContext === 'AFTER_MEAL'
                              ? 'بعد الطعام'
                              : 'في أي وقت'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isTriggered && (
                        <span className="text-[10px] bg-rose-900/60 text-rose-300 border border-rose-700 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          <span>حان الموعد</span>
                        </span>
                      )}
                      {isAck && (
                        <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>تم التناول</span>
                        </span>
                      )}
                      {isPending && (
                        <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-full font-bold">
                          مجدول
                        </span>
                      )}
                      {isSnoozed && (
                        <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2.5 py-1 rounded-full font-bold">
                          مؤجل
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Instructions */}
                  <p className="text-xs text-slate-300 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
                    {alert.instructions}
                  </p>

                  {/* Bottom Actions */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {alert.rxNumber ? `Rx: ${alert.rxNumber}` : 'سجل طبي معتمد'}
                    </span>

                    <div className="flex items-center gap-2">
                      {!isAck && (
                        <>
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 rounded-xl font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer text-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>تأكيد التناول</span>
                          </button>

                          <button
                            onClick={() => handleSnooze(alert.id)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl font-bold transition cursor-pointer text-xs"
                            title="تأجيل التنبيه"
                          >
                            <span>تأجيل</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleSimulatePush(alert.scheduleId)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl transition cursor-pointer"
                        title="تجربة إرسال هذا الإشعار الآن"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Advanced Push Scheduling Settings & Privacy Enclave */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-teal-400" />
            <h4 className="text-sm font-bold text-white">خيارات توصيل الإشعارات وسياسة الخصوصية السيادية</h4>
          </div>
          <span className="text-xs text-slate-500 font-mono">POL-PUSH-NOTIFICATION-GOVERNANCE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">إشعارات المتصفح (Web Push)</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                config.permissionStatus === 'granted'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {config.permissionStatus === 'granted' ? 'مفعّل' : 'تنبيهات مدمجة'}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              تلقي بانر تنبيه حتى في حال تصغير نافذة المتصفح لضمان عدم تفويت مواعيد الجرعات.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">النغمة الصوتية الطبية</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                config.soundChimeEnabled
                  ? 'bg-teal-950 text-teal-300 border border-teal-800'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {config.soundChimeEnabled ? 'نشط (Web Audio)' : 'صامت'}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              نغمة مريحة مولدة عبر Web Audio API دون الحاجة لتنزيل ملفات صوتية خارجية.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">ساعات الهدوء وعدم الإزعاج</span>
              <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-bold">
                {config.quietHoursStart && config.quietHoursEnd ? `${config.quietHoursStart} - ${config.quietHoursEnd}` : 'معطل'}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              إسكات النغمات المزعجة أثناء فترات النوم مع الحفاظ على تسجيل الإشعار بالجدول.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
