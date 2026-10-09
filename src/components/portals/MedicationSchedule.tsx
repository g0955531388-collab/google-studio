import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  BellOff,
  BellRing,
  Timer,
  VolumeX,
  Radio,
  CheckCircle2,
  Clock,
  Plus,
  AlertCircle,
  Calendar,
  Utensils,
  Volume2,
  X,
  Trash2,
  Sparkles,
  Info,
  Pill,
  Check,
  ChevronDown,
  TrendingUp,
  BarChart3,
  Search,
  History,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle,
  ShieldAlert,
  AlertTriangle,
  Package,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  MedicationScheduleEntry,
  MedicationLogEntry,
  MedicationAdherenceTrendPoint,
  MedicationReminderSettings,
  SmartAlert,
  RefillSummaryStats,
  MedicationRefillCalculation,
} from '../../types';
import { dataService } from '../../services/dataService';
import { aiService } from '../../services/aiService';
import { RefillTracker } from './RefillTracker';

interface MedicationScheduleProps {
  patientId?: string;
  initialView?: 'schedule' | 'history' | 'refills';
  onAdherenceChange?: () => void;
}

export const MedicationSchedule: React.FC<MedicationScheduleProps> = ({
  patientId = 'pat-main',
  initialView = 'schedule',
  onAdherenceChange,
}) => {
  // Main view toggle: 'schedule' vs 'history' vs 'refills'
  const [currentSection, setCurrentSection] = useState<'schedule' | 'history' | 'refills'>(initialView);

  // Schedules and Logs state
  const [schedules, setSchedules] = useState<MedicationScheduleEntry[]>([]);
  const [logs, setLogs] = useState<MedicationLogEntry[]>([]);
  const [refillStats, setRefillStats] = useState<RefillSummaryStats>({
    totalTrackedMedications: 0,
    refillsNeededCount: 0,
    criticalLowCount: 0,
    totalPillsInStock: 0,
    averageDaysRemaining: 0,
    pendingOrdersCount: 0,
  });
  const [refillCalcs, setRefillCalcs] = useState<MedicationRefillCalculation[]>([]);
  const hasTriggeredRefillNotifRef = useRef<boolean>(false);
  const [stats, setStats] = useState({
    todayScheduled: 3,
    todayTaken: 1,
    todaySkipped: 0,
    todayAdherencePct: 33,
    weeklyAdherencePct: 92,
    streakDays: 6,
    totalHistoricalLogs: 19,
    totalTakenAllTime: 18,
    totalSkippedAllTime: 1,
  });

  // Filter state for Daily Schedule
  const [activePeriodFilter, setActivePeriodFilter] = useState<string>('ALL');

  // History & Trends states
  const [trendDays, setTrendDays] = useState<number>(7);
  const [chartMode, setChartMode] = useState<'rate' | 'doses'>('rate');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'ALL' | 'TAKEN' | 'SKIPPED'>('ALL');
  const [historyMedFilter, setHistoryMedFilter] = useState<string>('ALL');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showReminderSettingsModal, setShowReminderSettingsModal] = useState<boolean>(false);
  const [showPastLogModal, setShowPastLogModal] = useState<boolean>(false);
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);

  // Quick Log modal state
  const [selectedEntryForLog, setSelectedEntryForLog] = useState<MedicationScheduleEntry | null>(null);
  const [logMealContext, setLogMealContext] = useState<string>('WITH_MEAL');
  const [logNotes, setLogNotes] = useState<string>('');
  const [logCustomTime, setLogCustomTime] = useState<string>('');

  // Past Dose Logging modal form state
  const [pastLogForm, setPastLogForm] = useState<{
    medicationName: string;
    dosage: string;
    date: string;
    time: string;
    status: 'TAKEN' | 'SKIPPED';
    mealContext: string;
    notes: string;
  }>({
    medicationName: 'Metformin XR (ميتفورمين ممتد المفعول)',
    dosage: '500mg',
    date: new Date().toISOString().slice(0, 10),
    time: '08:30',
    status: 'TAKEN',
    mealContext: 'WITH_MEAL',
    notes: '',
  });

  // Reminder Settings state
  const [reminderSettings, setReminderSettings] = useState<MedicationReminderSettings>({
    browserNotifications: true,
    audioAlerts: true,
    advanceMinutes: 10,
    quietHoursEnabled: false,
    quietHoursStart: '23:00',
    quietHoursEnd: '06:00',
  });

  // Browser Push Notifications & Live Alert System state
  const [browserPermission, setBrowserPermission] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');
  const [activeDoseAlerts, setActiveDoseAlerts] = useState<
    (MedicationScheduleEntry & { triggeredAt: string; isSimulated?: boolean })[]
  >([]);
  const [snoozedAlerts, setSnoozedAlerts] = useState<Record<string, number>>({});
  const firedAlertKeysRef = useRef<Set<string>>(new Set());
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  // New Schedule form state
  const [newSchedule, setNewSchedule] = useState<{
    name: string;
    dosage: string;
    timeSlot: string;
    period: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'BEDTIME' | 'CUSTOM';
    instructions: string;
    mealContext: 'BEFORE_MEAL' | 'WITH_MEAL' | 'AFTER_MEAL' | 'ANY';
    reminderEnabled: boolean;
    reminderAdvanceMinutes: number;
    category: 'PRESCRIPTION' | 'SUPPLEMENT' | 'PRN_AS_NEEDED';
    currentPillCount: number;
    totalPillCapacity: number;
    dosageQuantityPerIntake: number;
    refillThresholdDays: number;
    rxNumber: string;
    pharmacyName: string;
    pharmacyPhone: string;
  }>({
    name: '',
    dosage: '',
    timeSlot: '08:00',
    period: 'MORNING',
    instructions: '',
    mealContext: 'WITH_MEAL',
    reminderEnabled: true,
    reminderAdvanceMinutes: 10,
    category: 'PRESCRIPTION',
    currentPillCount: 30,
    totalPillCapacity: 30,
    dosageQuantityPerIntake: 1,
    refillThresholdDays: 5,
    rxNumber: '',
    pharmacyName: 'صيدلية المستشفى الجامعي التخصصي',
    pharmacyPhone: '+966 11 467 0000',
  });

  // AI-Driven Proactive Smart Alert check state for Add Medication modal
  const [medAlert, setMedAlert] = useState<SmartAlert | null>(null);
  const [isCheckingMedAlert, setIsCheckingMedAlert] = useState<boolean>(false);
  const [hasAcknowledgedMedAlert, setHasAcknowledgedMedAlert] = useState<boolean>(false);

  // Proactive check effect when user types medication name in add modal
  useEffect(() => {
    if (!newSchedule.name || newSchedule.name.trim().length < 3) {
      setMedAlert(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingMedAlert(true);
      try {
        const res = await aiService.analyzeSmartAlerts({
          patientId,
          triggerType: 'NEW_MEDICATION',
          newMedication: {
            name: newSchedule.name,
            dosage: newSchedule.dosage,
            category: newSchedule.category,
            instructions: newSchedule.instructions,
          },
        });

        if (res.alerts && res.alerts.length > 0) {
          setMedAlert(res.alerts[0]);
        } else {
          setMedAlert(null);
        }
      } catch (err) {
        console.warn('Smart alert check error:', err);
      } finally {
        setIsCheckingMedAlert(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [newSchedule.name, newSchedule.dosage, patientId]);

  // Load data
  const refreshData = () => {
    const loadedSchedules = dataService.getMedicationSchedules(patientId);
    const loadedLogs = dataService.getMedicationLogs(patientId);
    const loadedStats = dataService.getMedicationAdherenceStats(patientId);
    const loadedSettings = dataService.getMedicationReminderSettings();
    const loadedRefillStats = dataService.getRefillSummaryStats(patientId);
    const loadedRefillCalcs = dataService.getRefillCalculations(patientId);

    setSchedules(loadedSchedules);
    setLogs(loadedLogs);
    setStats(loadedStats);
    setReminderSettings(loadedSettings);
    setRefillStats(loadedRefillStats);
    setRefillCalcs(loadedRefillCalcs);

    // Refill Notification: If any prescription has fallen below threshold and permission is granted, notify user
    if (
      loadedRefillStats.refillsNeededCount > 0 &&
      !hasTriggeredRefillNotifRef.current &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      const urgentMed = loadedRefillCalcs.find((c) => c.needsRefill);
      if (urgentMed) {
        hasTriggeredRefillNotifRef.current = true;
        try {
          new Notification(`⚠️ حان موعد طلب إعادة صرف الدواء: ${urgentMed.medicationName}`, {
            body: `متبقي ${urgentMed.daysRemaining} أيام فقط (${urgentMed.currentPillCount} حبات). يرجى طلب إعادة الصرف لتفادي انقطاع العلاج.`,
            icon: '/favicon.ico',
          });
        } catch {
          // notification failed
        }
      }
    }

    if (onAdherenceChange) {
      onAdherenceChange();
    }
  };

  useEffect(() => {
    refreshData();
  }, [patientId]);

  // Check browser Notification support & permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(Notification.permission);
    } else {
      setBrowserPermission('unsupported');
    }
  }, []);

  // Audio tone generator
  const triggerAudioTone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Audio not supported in environment
    }
  };

  // Request browser push notification permission
  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationBanner('عذراً، متصفحك لا يدعم نظام إشعارات الويب (Push Notifications). سنعتمد على التنبيهات الصوتية وتنبيهات الشاشة.');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setBrowserPermission(perm);
      if (perm === 'granted') {
        const updated = dataService.updateMedicationReminderSettings({ browserNotifications: true });
        setReminderSettings(updated);
        triggerAudioTone();
        setNotificationBanner('🔔 تم منح إذن إشعارات المتصفح بنجاح! ستصلك تنبيهات النظام بمواعيد جرعاتك اليومية.');
        try {
          new Notification('✓ تم تفعيل تنبيهات الأدوية في المتصفح', {
            body: 'ستصلك إشعارات وتنبيهات صوتية فور حلول موعد كل جرعة علاجية مجدولة.',
            icon: '/favicon.ico',
          });
        } catch {
          // ignore
        }
      } else if (perm === 'denied') {
        setNotificationBanner('⚠️ تم حظر إشعارات المتصفح. يمكنك تفعيلها يدويًا من إعدادات الموقع بشريط العنوان.');
      }
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
    }
  };

  // Dispatch scheduled dose notification (Browser Push + Audio Tone + In-App Urgent Modal)
  const dispatchDoseNotification = (entry: MedicationScheduleEntry, isSimulated = false) => {
    // 1. Audio chime if enabled
    if (reminderSettings.audioAlerts) {
      triggerAudioTone();
    }

    // 2. Browser push notification if permitted and enabled
    if (
      reminderSettings.browserNotifications &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        const mealNote =
          entry.mealContext === 'WITH_MEAL'
            ? 'مع الوجبة'
            : entry.mealContext === 'BEFORE_MEAL'
            ? 'قبل الطعام'
            : entry.mealContext === 'AFTER_MEAL'
            ? 'بعد الطعام'
            : '';
        const notif = new Notification(`⏰ حان موعد دواء: ${entry.name}`, {
          body: `الجرعة: ${entry.dosage} • الموعد المجدول: ${entry.timeSlot}${mealNote ? ` • ${mealNote}` : ''} • ${
            entry.instructions || 'يرجى الالتزام بالجرعة في موعدها المخصص'
          }`,
          icon: '/favicon.ico',
          tag: `med-dose-${entry.id}-${new Date().toISOString().slice(0, 10)}`,
        });
        notif.onclick = () => {
          window.focus();
        };
      } catch (e) {
        console.warn('Browser push notification failed:', e);
      }
    }

    // 3. Add to In-App active urgent alerts
    const nowTimeStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    setActiveDoseAlerts((prev) => {
      if (prev.some((a) => a.id === entry.id)) return prev;
      return [...prev, { ...entry, triggeredAt: nowTimeStr, isSimulated }];
    });
  };

  // Snooze alert for N minutes
  const snoozeAlert = (scheduleId: string, minutes: number = 10) => {
    const until = Date.now() + minutes * 60 * 1000;
    setSnoozedAlerts((prev) => ({ ...prev, [scheduleId]: until }));
    setActiveDoseAlerts((prev) => prev.filter((a) => a.id !== scheduleId));
    setNotificationBanner(`⏱ تم تأجيل تنبيه الدواء لمدة ${minutes} دقائق. سنذكرك مجدداً.`);
    setTimeout(() => setNotificationBanner(null), 3500);
  };

  // Dismiss urgent alert
  const dismissDueAlert = (scheduleId: string) => {
    setActiveDoseAlerts((prev) => prev.filter((a) => a.id !== scheduleId));
  };

  // Test full dose alert simulation (Push + Sound + In-App Modal)
  const triggerFullDoseAlertSimulation = () => {
    const targetEntry = schedules[0] || {
      id: 'sched-test-demo',
      patientId,
      name: 'Metformin XR (ميتفورمين)',
      dosage: '500mg',
      timeSlot: '08:00',
      period: 'MORNING' as const,
      instructions: 'قرص واحد مع وجبة الإفطار لتنظيم السكر',
      mealContext: 'WITH_MEAL' as const,
      reminderEnabled: true,
      category: 'PRESCRIPTION' as const,
    };
    dispatchDoseNotification(targetEntry, true);
    setNotificationBanner('🔔 تم إطلاق التنبيه التجريبي الكامل (إشعار المتصفح + نغمة صوتية + بطاقة تنبيه تفاعلية)');
    setTimeout(() => setNotificationBanner(null), 4500);
  };

  // Periodic Schedule & Dose Evaluator (Every 15 seconds)
  useEffect(() => {
    const evaluateDoseSchedule = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTotalMinutes = currentHours * 60 + currentMinutes;
      const currentHHmm = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;
      setCurrentTimeStr(currentHHmm);

      // Check Quiet Hours
      if (reminderSettings.quietHoursEnabled) {
        const [startH, startM] = reminderSettings.quietHoursStart.split(':').map(Number);
        const [endH, endM] = reminderSettings.quietHoursEnd.split(':').map(Number);
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;
        const isQuiet =
          startTotal <= endTotal
            ? currentTotalMinutes >= startTotal && currentTotalMinutes < endTotal
            : currentTotalMinutes >= startTotal || currentTotalMinutes < endTotal;
        if (isQuiet) return;
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      const advance = reminderSettings.advanceMinutes || 0;

      schedules.forEach((entry) => {
        if (!entry.reminderEnabled) return;

        // Check if already taken or skipped today
        const alreadyLoggedToday = logs.some(
          (l) => l.scheduleEntryId === entry.id && l.loggedAt.startsWith(todayStr)
        );
        if (alreadyLoggedToday) return;

        // Check snooze
        if (snoozedAlerts[entry.id] && Date.now() < snoozedAlerts[entry.id]) {
          return;
        }

        // Parse scheduled time
        const [schedH, schedM] = entry.timeSlot.split(':').map(Number);
        const schedTotalMinutes = schedH * 60 + schedM;

        // Target alert minute (timeSlot minus advanceMinutes)
        const targetTriggerMinute = schedTotalMinutes - advance;
        const alertKey = `${todayStr}_${entry.id}_${targetTriggerMinute}`;

        // Check if within alert window (from target minute up to 30 mins after scheduled time)
        const diffMinutes = currentTotalMinutes - targetTriggerMinute;
        if (diffMinutes >= 0 && diffMinutes <= 30) {
          if (!firedAlertKeysRef.current.has(alertKey)) {
            firedAlertKeysRef.current.add(alertKey);
            dispatchDoseNotification(entry);
          }
        }
      });
    };

    evaluateDoseSchedule();
    const intervalId = setInterval(evaluateDoseSchedule, 15000);
    return () => clearInterval(intervalId);
  }, [schedules, logs, reminderSettings, snoozedAlerts]);

  // Test Reminder Alert
  const triggerTestReminder = () => {
    triggerFullDoseAlertSimulation();
  };

  // Quick Log as Taken
  const handleQuickLogTaken = (entry: MedicationScheduleEntry) => {
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    dataService.logMedicationDose({
      patientId,
      scheduleEntryId: entry.id,
      medicationName: entry.name,
      dosage: entry.dosage,
      scheduledTime: entry.timeSlot,
      status: 'TAKEN',
      mealContext: entry.mealContext || 'WITH_MEAL',
      takenDoseTime: currentTimeStr,
      notes: 'تم تسجيل التناول السريع عبر بوابة المريض',
    });

    triggerAudioTone();
    refreshData();
    setNotificationBanner(`✓ تم توثيق تناول جرعة: ${entry.name} (${entry.dosage})`);
    setTimeout(() => setNotificationBanner(null), 3500);
  };

  // Detailed Log Submit
  const handleDetailedLogSubmit = (status: 'TAKEN' | 'SKIPPED') => {
    if (!selectedEntryForLog) return;

    const now = new Date();
    const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    dataService.logMedicationDose({
      patientId,
      scheduleEntryId: selectedEntryForLog.id,
      medicationName: selectedEntryForLog.name,
      dosage: selectedEntryForLog.dosage,
      scheduledTime: selectedEntryForLog.timeSlot,
      status,
      mealContext: logMealContext,
      takenDoseTime: status === 'TAKEN' ? (logCustomTime || defaultTime) : undefined,
      notes: logNotes.trim() || (status === 'SKIPPED' ? 'تم تخطي الجرعة بطلب المريض' : undefined),
    });

    if (status === 'TAKEN') {
      triggerAudioTone();
    }

    refreshData();
    setSelectedEntryForLog(null);
    setLogNotes('');
    setLogCustomTime('');
    setNotificationBanner(
      status === 'TAKEN'
        ? `✓ تم تأكيد تناول الجرعة: ${selectedEntryForLog.name}`
        : `⚠️ تم تسجيل تخطي الجرعة: ${selectedEntryForLog.name}`
    );
    setTimeout(() => setNotificationBanner(null), 3500);
  };

  // Past Dose Submission
  const handlePastLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastLogForm.medicationName || !pastLogForm.dosage) return;

    const pastDateIso = new Date(`${pastLogForm.date}T${pastLogForm.time || '12:00'}:00`).toISOString();

    dataService.logMedicationDose({
      patientId,
      medicationName: pastLogForm.medicationName,
      dosage: pastLogForm.dosage,
      scheduledTime: pastLogForm.time,
      status: pastLogForm.status,
      mealContext: pastLogForm.mealContext,
      takenDoseTime: pastLogForm.status === 'TAKEN' ? pastLogForm.time : undefined,
      notes: pastLogForm.notes.trim() || 'تم التوثيق بأثر رجعي عبر سجل الجرعات التاريخي',
    });

    refreshData();
    setShowPastLogModal(false);
    setPastLogForm({
      medicationName: 'Metformin XR (ميتفورمين ممتد المفعول)',
      dosage: '500mg',
      date: new Date().toISOString().slice(0, 10),
      time: '08:30',
      status: 'TAKEN',
      mealContext: 'WITH_MEAL',
      notes: '',
    });
    setNotificationBanner(`✓ تم حفظ الجرعة السابقة بنجاح في السجل التاريخي.`);
    setTimeout(() => setNotificationBanner(null), 3500);
  };

  // Undo / Delete Log
  const handleUndoLog = (logId: string) => {
    dataService.undoMedicationLog(logId);
    refreshData();
    setNotificationBanner('تم التراجع عن تسجيل الجرعة بنجاح.');
    setTimeout(() => setNotificationBanner(null), 3000);
  };

  // Toggle Reminder
  const handleToggleReminder = (id: string, name: string) => {
    dataService.toggleScheduleReminder(id, patientId);
    refreshData();
    setNotificationBanner(`تم تحديث حالة التنبيه لـ ${name}.`);
    setTimeout(() => setNotificationBanner(null), 2500);
  };

  // Add new schedule submit
  const handleAddScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedule.name || !newSchedule.dosage) return;

    // Proactively persist any detected drug-drug interaction alert
    if (medAlert) {
      dataService.addSmartAlert(medAlert);
    }

    dataService.saveMedicationSchedule({
      patientId,
      name: newSchedule.name,
      dosage: newSchedule.dosage,
      timeSlot: newSchedule.timeSlot,
      period: newSchedule.period,
      instructions: newSchedule.instructions,
      mealContext: newSchedule.mealContext,
      reminderEnabled: newSchedule.reminderEnabled,
      reminderAdvanceMinutes: newSchedule.reminderAdvanceMinutes,
      category: newSchedule.category,
      currentPillCount: newSchedule.currentPillCount,
      totalPillCapacity: newSchedule.totalPillCapacity,
      dosageQuantityPerIntake: newSchedule.dosageQuantityPerIntake,
      refillThresholdDays: newSchedule.refillThresholdDays,
      rxNumber: newSchedule.rxNumber || undefined,
      pharmacyName: newSchedule.pharmacyName || undefined,
      pharmacyPhone: newSchedule.pharmacyPhone || undefined,
    });

    refreshData();
    setShowAddModal(false);
    setMedAlert(null);
    setHasAcknowledgedMedAlert(false);
    setNewSchedule({
      name: '',
      dosage: '',
      timeSlot: '08:00',
      period: 'MORNING',
      instructions: '',
      mealContext: 'WITH_MEAL',
      reminderEnabled: true,
      reminderAdvanceMinutes: 10,
      category: 'PRESCRIPTION',
      currentPillCount: 30,
      totalPillCapacity: 30,
      dosageQuantityPerIntake: 1,
      refillThresholdDays: 5,
      rxNumber: '',
      pharmacyName: 'صيدلية المستشفى الجامعي التخصصي',
      pharmacyPhone: '+966 11 467 0000',
    });
    setNotificationBanner(
      medAlert
        ? 'تمت إضافة الدواء مع تسجيل تنبيه ذكي للتداخل الدوائي في ملفك.'
        : 'تمت إضافة الدواء بنجاح إلى جدولك اليومي.'
    );
    setTimeout(() => setNotificationBanner(null), 3000);
  };

  // Delete schedule entry
  const handleDeleteSchedule = (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف ${name} من جدولك اليومي؟`)) {
      dataService.deleteMedicationSchedule(id, patientId);
      refreshData();
      setNotificationBanner(`تم حذف ${name} من الجدول.`);
      setTimeout(() => setNotificationBanner(null), 3000);
    }
  };

  // Check today's log status for a given schedule entry
  const getTodayStatusForEntry = (scheduleId: string): MedicationLogEntry | undefined => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return logs.find(
      (l) => l.scheduleEntryId === scheduleId && l.loggedAt.slice(0, 10) === todayStr
    );
  };

  // Filtered schedules for today's view
  const filteredSchedules = schedules.filter((s) => {
    if (activePeriodFilter === 'ALL') return true;
    return s.period === activePeriodFilter;
  });

  // Calculate trends and breakdown data
  const trendData: MedicationAdherenceTrendPoint[] = dataService.getMedicationAdherenceTrends(patientId, trendDays);
  const medicationBreakdown = dataService.getMedicationBreakdownStats(patientId);

  // Distinct medication names for filter
  const distinctMedNames = Array.from(new Set(logs.map((l) => l.medicationName)));

  // Filtered historical logs
  const filteredHistoryLogs = logs.filter((log) => {
    if (historyStatusFilter !== 'ALL' && log.status !== historyStatusFilter) return false;
    if (historyMedFilter !== 'ALL' && log.medicationName !== historyMedFilter) return false;
    if (historySearchQuery.trim()) {
      const q = historySearchQuery.toLowerCase();
      const matchName = log.medicationName.toLowerCase().includes(q);
      const matchNotes = (log.notes || '').toLowerCase().includes(q);
      const matchDate = log.loggedAt.includes(q);
      if (!matchName && !matchNotes && !matchDate) return false;
    }
    return true;
  });

  // Overall adherence for selected trend period
  const totalTrendScheduled = trendData.reduce((acc, curr) => acc + curr.scheduled, 0);
  const totalTrendTaken = trendData.reduce((acc, curr) => acc + curr.taken, 0);
  const periodAdherencePct = totalTrendScheduled > 0
    ? Math.min(100, Math.round((totalTrendTaken / totalTrendScheduled) * 100))
    : 100;

  // Find next upcoming dose for today that hasn't been taken yet
  const nextUpcomingDose = (() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const sorted = [...schedules].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
    for (const item of sorted) {
      const isTaken = logs.some(
        (l) => l.scheduleEntryId === item.id && l.loggedAt.startsWith(todayStr) && l.status === 'TAKEN'
      );
      if (isTaken) continue;

      const [h, m] = item.timeSlot.split(':').map(Number);
      const doseMinutes = h * 60 + m;
      const diff = doseMinutes - currentMinutes;
      return {
        ...item,
        minutesRemaining: diff,
        isDueOrOverdue: diff <= 0,
      };
    }
    return null;
  })();

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {notificationBanner && (
        <div className="bg-teal-500/10 border border-teal-500/30 text-teal-300 p-3.5 rounded-2xl text-xs flex items-center justify-between animate-fade-in shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{notificationBanner}</span>
          </div>
          <button
            onClick={() => setNotificationBanner(null)}
            className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Active Urgent Dose Alert Cards */}
      {activeDoseAlerts.length > 0 && (
        <div className="space-y-3">
          {activeDoseAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-rose-950/70 border-2 border-amber-500/70 rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden animate-pulse-subtle"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 bg-amber-500/20 text-amber-300 rounded-2xl border border-amber-500/40 shrink-0">
                    <BellRing className="w-6 h-6 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/50 font-mono flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        ⏰ حان موعد تناول الجرعة الآن ({alert.timeSlot})
                      </span>
                      {alert.isSimulated && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-950 text-sky-300 border border-sky-800/50">
                          محاكاة تجريبية للنظام
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-mono">
                        توقيت التنبيه: {alert.triggeredAt}
                      </span>
                    </div>

                    <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                      <span>{alert.name}</span>
                      <span className="font-mono text-sm text-teal-300 px-2 py-0.5 rounded bg-teal-950/80 border border-teal-800/50">
                        {alert.dosage}
                      </span>
                    </h3>

                    <p className="text-xs text-slate-300 max-w-2xl">
                      {alert.instructions || 'يرجى الالتزام بالجرعة في موعدها المخصص للحفاظ على استقرار الخطة العلاجية.'}
                      {alert.mealContext === 'WITH_MEAL' && ' • يُفضل تناولها مع وجبة الطعام'}
                      {alert.mealContext === 'BEFORE_MEAL' && ' • يُفضل تناولها قبل وجبة الطعام بـ 30 دقيقة'}
                      {alert.mealContext === 'AFTER_MEAL' && ' • يُفضل تناولها بعد وجبة الطعام'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
                  <button
                    onClick={() => {
                      handleQuickLogTaken(alert);
                      dismissDueAlert(alert.id);
                    }}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-950/50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>تناولت الجرعة الآن</span>
                  </button>

                  <button
                    onClick={() => snoozeAlert(alert.id, 10)}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Timer className="w-4 h-4" />
                    <span>تأجيل 10 دقائق (Snooze)</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedEntryForLog(alert);
                      dismissDueAlert(alert.id);
                    }}
                    className="px-3 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs rounded-xl border border-slate-800 transition cursor-pointer"
                  >
                    <span>توثيق مفصل / تخطي</span>
                  </button>

                  <button
                    onClick={() => dismissDueAlert(alert.id)}
                    className="p-2.5 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                    title="إغلاق هذا التنبيه"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top Header Card & Main Adherence Scoreboard */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <Calendar className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-white tracking-wide flex items-center gap-2">
                  <span>جدول ومتابعة الأدوية اليومية والالتزام</span>
                  <span className="text-[10px] font-mono font-normal bg-teal-950/80 text-teal-300 border border-teal-800/40 px-2 py-0.5 rounded-md">
                    Medication Schedule & History
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  توثيق الجرعات اليومية، إشعارات التنبيه، وسجل الالتزام الدوائي والرسوم البيانية التحليلية
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                اليوم: {new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="bg-teal-950/60 text-teal-300 border border-teal-800/40 px-2.5 py-1 rounded-xl font-mono">
                {stats.todayTaken} من {stats.todayScheduled} جرعات مسجلة اليوم
              </span>
              <span className="bg-purple-950/60 text-purple-300 border border-purple-800/40 px-2.5 py-1 rounded-xl font-mono">
                {logs.length} جرعات موثقة بالسجل التاريخي
              </span>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Adherence Circular Score */}
            <div className="flex items-center gap-3 bg-slate-950/90 border border-slate-800 p-3 rounded-2xl shadow-inner">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-teal-400 transition-all duration-700"
                    strokeDasharray={`${stats.todayAdherencePct}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-mono text-xs font-bold text-white">
                  {stats.todayAdherencePct}%
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[11px] text-slate-400 font-medium">التزام اليوم</span>
                <span className="text-xs font-bold text-teal-300">
                  {stats.streakDays} أيام التزام متتالية 🔥
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-teal-950/50 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة دواء للجدول</span>
              </button>

              <button
                onClick={() => setShowReminderSettingsModal(true)}
                title="إعدادات التنبيهات"
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition border border-slate-700 cursor-pointer"
              >
                <Bell className="w-4 h-4" />
              </button>

              <button
                onClick={triggerTestReminder}
                title="اختبار التنبيه الصوتي"
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition border border-slate-700 cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-teal-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Section Navigation Pills (Daily Schedule vs History vs Refill Tracker) */}
        <div className="flex flex-wrap items-center gap-2 pt-6 mt-6 border-t border-slate-800/80">
          <button
            onClick={() => setCurrentSection('schedule')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              currentSection === 'schedule'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-950/50'
                : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>الجدول اليومي والتذكيرات (Daily Schedule)</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 bg-black/20 rounded">
              {schedules.length}
            </span>
          </button>

          <button
            onClick={() => setCurrentSection('history')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              currentSection === 'history'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-950/50'
                : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>سجل الجرعات ومؤشرات الالتزام (History & Trends)</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 bg-black/20 rounded">
              {logs.length}
            </span>
          </button>

          <button
            onClick={() => setCurrentSection('refills')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              currentSection === 'refills'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-950/50'
                : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>متعقب إعادة التعبئة والمخزون (Refill Tracker)</span>
            {refillStats.refillsNeededCount > 0 ? (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black animate-pulse">
                {refillStats.refillsNeededCount} يتطلب صرف!
              </span>
            ) : (
              <span className="font-mono text-[10px] px-1.5 py-0.2 bg-black/20 rounded">
                {refillStats.totalTrackedMedications}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: DAILY SCHEDULE VIEW */}
      {/* ========================================================================= */}
      {currentSection === 'schedule' && (
        <div className="space-y-6">
          {/* Proactive In-App Prescription Refill Notification Banner */}
          {refillStats.refillsNeededCount > 0 && (
            <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-rose-950/80 border border-amber-500/50 rounded-3xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                  <Package className="w-5 h-5 text-amber-400 animate-pulse" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded">
                      تنبيه إعادة صرف الدواء (Refill Due)
                    </span>
                    <span className="text-xs text-amber-300 font-bold">
                      {refillStats.refillsNeededCount} أدوية اقترب نفاد مخزونها (≤ حد الأمان)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    رصيد الحبوب المتبقي شارف على الانتهاء بناءً على وتيرة الاستهلاك اليومي. يرجى طلب إعادة الصرف قبل موعد النفاد لتجنب انقطاع العلاج.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setCurrentSection('refills')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-950/50"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>فتح متعقب إعادة الصرف ({refillStats.refillsNeededCount})</span>
                </button>
              </div>
            </div>
          )}
          {/* Live Browser Notification & Alert Status Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg relative overflow-hidden">
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className={`p-3 rounded-2xl border shrink-0 transition ${
                  browserPermission === 'granted'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : browserPermission === 'denied'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}
              >
                {browserPermission === 'granted' ? (
                  <BellRing className="w-5 h-5 animate-pulse" />
                ) : browserPermission === 'denied' ? (
                  <BellOff className="w-5 h-5" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-white">نظام تنبيهات الجرعات الحية:</span>
                  {browserPermission === 'granted' ? (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 flex items-center gap-1.5 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      إشعارات المتصفح مفعّلة ونشطة (Push Enabled)
                    </span>
                  ) : browserPermission === 'denied' ? (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800/60">
                      محظورة في إعدادات المتصفح
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/60 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      بانتظار تفعيل إذن إشعارات المتصفح
                    </span>
                  )}
                  {reminderSettings.audioAlerts && (
                    <span className="text-[10px] text-teal-400 font-medium flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                      <Volume2 className="w-3 h-3" />
                      نغمة صوتية مفعلة
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                  {nextUpcomingDose ? (
                    <span>
                      الجرعة القادمة اليوم:{' '}
                      <strong className="text-teal-300 font-bold">
                        {nextUpcomingDose.name} ({nextUpcomingDose.dosage})
                      </strong>{' '}
                      في تمام{' '}
                      <span className="font-mono text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {nextUpcomingDose.timeSlot}
                      </span>
                      {nextUpcomingDose.minutesRemaining > 0 ? (
                        <span> (متبقي {nextUpcomingDose.minutesRemaining} دقيقة)</span>
                      ) : (
                        <span className="text-amber-300 font-bold mr-1"> (حان موعدها الآن!)</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-medium">✓ تم توثيق كافة جرعات اليوم المجدولة بنجاح</span>
                  )}
                  {currentTimeStr && (
                    <span className="font-mono text-slate-500">
                      • التوقيت الحالي: {currentTimeStr}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {browserPermission !== 'granted' && browserPermission !== 'unsupported' && (
                <button
                  onClick={requestNotificationPermission}
                  className="px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-teal-950/40 cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>تفعيل إشعارات المتصفح</span>
                </button>
              )}

              <button
                onClick={triggerFullDoseAlertSimulation}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-teal-200 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                title="إطلاق تنبيه تجريبي فوري لاختبار إشعار المتصفح والنغمة الصوتية وبطاقة الجرعة"
              >
                <Radio className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                <span>اختبار التنبيه الفوري</span>
              </button>

              <button
                onClick={() => setShowReminderSettingsModal(true)}
                className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition cursor-pointer"
                title="تخصيص إعدادات التنبيهات"
              >
                <Bell className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {/* Period Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: 'كافة الأوقات' },
                { id: 'MORNING', label: 'الصباح (Morning)' },
                { id: 'AFTERNOON', label: 'الظهيرة (Afternoon)' },
                { id: 'EVENING', label: 'المساء (Evening)' },
                { id: 'BEDTIME', label: 'قبل النوم (Bedtime)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePeriodFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    activePeriodFilter === tab.id
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentSection('history')}
              className="text-xs text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1.5 underline cursor-pointer"
            >
              <span>عرض سجل الجرعات السابقة والرسوم البيانية</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Schedule Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSchedules.map((entry) => {
              const logForToday = getTodayStatusForEntry(entry.id);
              const isTaken = logForToday?.status === 'TAKEN';
              const isSkipped = logForToday?.status === 'SKIPPED';
              const isCurrentlyDue = activeDoseAlerts.some((a) => a.id === entry.id);

              return (
                <div
                  key={entry.id}
                  className={`bg-slate-900 border rounded-2xl p-5 space-y-4 transition flex flex-col justify-between shadow-md relative overflow-hidden ${
                    isTaken
                      ? 'border-emerald-500/30 bg-emerald-950/10'
                      : isSkipped
                      ? 'border-amber-500/30 bg-amber-950/10'
                      : isCurrentlyDue
                      ? 'border-amber-400 bg-amber-950/20 shadow-lg shadow-amber-950/50 ring-1 ring-amber-400/50'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Time Slot & Badges */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 font-mono text-xs font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-teal-400">
                          <Clock className="w-3.5 h-3.5" />
                          {entry.timeSlot}
                        </span>
                        {isCurrentlyDue && !isTaken && !isSkipped && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse flex items-center gap-1 font-mono">
                            <BellRing className="w-3 h-3 text-amber-400" />
                            حان موعدها
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            entry.category === 'PRESCRIPTION'
                              ? 'bg-blue-950/70 text-blue-300 border border-blue-800/40'
                              : entry.category === 'SUPPLEMENT'
                              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/40'
                              : 'bg-purple-950/70 text-purple-300 border border-purple-800/40'
                          }`}
                        >
                          {entry.category === 'PRESCRIPTION'
                            ? 'وصفة طبية'
                            : entry.category === 'SUPPLEMENT'
                            ? 'مكمل غذائي'
                            : 'عند اللزوم'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleReminder(entry.id, entry.name)}
                          title={entry.reminderEnabled ? 'التنبيه مفعل - انقر للإلغاء' : 'التنبيه معطل - انقر للتفعيل'}
                          className={`p-1.5 rounded-lg transition border cursor-pointer ${
                            entry.reminderEnabled
                              ? 'bg-teal-950/60 text-teal-400 border-teal-800/50 hover:bg-teal-900/60'
                              : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                          }`}
                        >
                          {entry.reminderEnabled ? (
                            <Bell className="w-3.5 h-3.5" />
                          ) : (
                            <BellOff className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteSchedule(entry.id, entry.name)}
                          title="حذف من الجدول"
                          className="p-1.5 rounded-lg bg-slate-950 text-slate-600 hover:text-rose-400 border border-slate-800 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Medication Name & Dosage */}
                    <div>
                      <h3 className="text-base font-bold text-white tracking-wide">
                        {entry.name}
                      </h3>
                      <span className="text-xs font-mono text-teal-400 font-bold block mt-0.5">
                        الجرعة: {entry.dosage}
                      </span>
                    </div>

                    {/* Instructions & Food relationship */}
                    <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                      {entry.instructions && (
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {entry.instructions}
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1 border-t border-slate-800/40">
                        <Utensils className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>
                          {entry.mealContext === 'WITH_MEAL'
                            ? 'تناول مع وجبة الطعام'
                            : entry.mealContext === 'AFTER_MEAL'
                            ? 'تناول بعد وجبة الطعام'
                            : entry.mealContext === 'BEFORE_MEAL'
                            ? 'تناول قبل الوجبة (على معدة فارغة)'
                            : 'يمكن التناول في أي وقت'}
                        </span>
                      </div>

                      {entry.reminderEnabled && (
                        <div className="flex items-center gap-1 text-[10px] text-teal-400">
                          <Bell className="w-2.5 h-2.5" />
                          <span>تنبيه مسبق قبل {entry.reminderAdvanceMinutes} دقائق</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Section / Today's Status */}
                  <div className="pt-2 border-t border-slate-800/60">
                    {isTaken ? (
                      <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/20 px-3 py-2 rounded-xl">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div className="text-right">
                            <span className="block text-xs font-bold text-emerald-300">
                              تم تناول الجرعة
                            </span>
                            <span className="block text-[10px] text-emerald-400/80 font-mono">
                              الساعة {logForToday?.takenDoseTime || logForToday?.scheduledTime}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUndoLog(logForToday.id)}
                          className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                        >
                          تراجع
                        </button>
                      </div>
                    ) : isSkipped ? (
                      <div className="flex items-center justify-between bg-amber-950/40 border border-amber-500/20 px-3 py-2 rounded-xl">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          <div className="text-right">
                            <span className="block text-xs font-bold text-amber-300">
                              تم تخطي الجرعة
                            </span>
                            <span className="block text-[10px] text-amber-400/80">
                              {logForToday?.notes || 'بناء على تقرير المريض'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUndoLog(logForToday.id)}
                          className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                        >
                          تراجع
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuickLogTaken(entry)}
                          className="flex-1 py-2 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-teal-950/40 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>تم التناول الآن</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedEntryForLog(entry);
                            setLogMealContext(entry.mealContext || 'WITH_MEAL');
                          }}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition border border-slate-700 text-xs cursor-pointer"
                          title="خيارات تفصيلية أو تخطي"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredSchedules.length === 0 && (
              <div className="col-span-full py-12 text-center bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl space-y-3">
                <Pill className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-400">لا توجد أدوية مجدولة في هذه الفترة الزمنية.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-xs text-teal-400 hover:text-teal-300 font-bold underline cursor-pointer"
                >
                  إضافة دواء جديد للجدول الآن
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: MEDICATION HISTORY & ADHERENCE TRENDS (CHART + DETAILED LOG) */}
      {/* ========================================================================= */}
      {currentSection === 'history' && (
        <div className="space-y-6 animate-fade-in">
          {/* Key Trend KPI Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>معدل الالتزام ({trendDays} أيام)</span>
                <TrendingUp className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white flex items-baseline gap-1">
                <span>{periodAdherencePct}%</span>
                <span className="text-[10px] text-teal-400 font-normal">
                  {periodAdherencePct >= 80 ? 'ممتاز (مستهدف)' : 'يحتاج متابعة'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block">
                {totalTrendTaken} من {totalTrendScheduled} جرعة متوقعة
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>الجرعات المتناولة</span>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {stats.totalTakenAllTime}
              </div>
              <span className="text-[10px] text-slate-500 block">
                جرعة موثقة بنجاح
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>الجرعات المتخطاة</span>
                <AlertCircle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-400">
                {stats.totalSkippedAllTime}
              </div>
              <span className="text-[10px] text-slate-500 block">
                موضحة بأسباب المريض
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>سلسلة الالتزام الحالي</span>
                <Activity className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-purple-300">
                {stats.streakDays} أيام
              </div>
              <span className="text-[10px] text-slate-500 block">
                تتابع يومي مستمر بدون انقطاع
              </span>
            </div>
          </div>

          {/* Adherence Trend Chart Container (Recharts) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-5 shadow-xl">
            {/* Chart Control Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-teal-400" />
                  <h3 className="text-base font-bold text-white">
                    مؤشر الالتزام الدوائي الزمني (Medication Adherence Trend Chart)
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  مخطط تحليلي لتطور نسبة تناول الأدوية والجرعات المتخذة على مدار الأيام الماضية
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Time range selector */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  {[
                    { days: 7, label: '7 أيام' },
                    { days: 14, label: '14 يوماً' },
                  ].map((btn) => (
                    <button
                      key={btn.days}
                      onClick={() => setTrendDays(btn.days)}
                      className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                        trendDays === btn.days
                          ? 'bg-teal-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Chart Mode Toggle */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setChartMode('rate')}
                    className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                      chartMode === 'rate'
                        ? 'bg-teal-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    نسبة الالتزام %
                  </button>
                  <button
                    onClick={() => setChartMode('doses')}
                    className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                      chartMode === 'doses'
                        ? 'bg-teal-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    توزيع الجرعات (عدد)
                  </button>
                </div>
              </div>
            </div>

            {/* Recharts Render Area */}
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === 'rate' ? (
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="adherenceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val, idx) => {
                        const item = trendData[idx];
                        return item ? `${item.dayName} (${val})` : val;
                      }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      unit="%"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as MedicationAdherenceTrendPoint;
                          return (
                            <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1 text-right">
                              <p className="font-bold text-white border-b border-slate-800 pb-1">
                                {data.dayName} - {data.date}
                              </p>
                              <p className="text-teal-400 font-mono font-bold">
                                نسبة الالتزام: {data.adherencePct}%
                              </p>
                              <div className="text-[11px] text-slate-400 space-y-0.5 pt-0.5">
                                <p className="text-emerald-400">جرعات تم تناولها: {data.taken}</p>
                                <p className="text-amber-400">جرعات متخطاة: {data.skipped}</p>
                                <p className="text-slate-300">الجرعات المجدولة: {data.scheduled}</p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine
                      y={80}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      label={{
                        value: 'المعدل المستهدف 80%',
                        fill: '#10b981',
                        fontSize: 10,
                        position: 'insideTopLeft',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="adherencePct"
                      name="نسبة الالتزام %"
                      stroke="#14b8a6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#adherenceGradient)"
                      activeDot={{ r: 6, fill: '#2dd4bf', stroke: '#0f172a', strokeWidth: 2 }}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val, idx) => {
                        const item = trendData[idx];
                        return item ? `${item.dayName}` : val;
                      }}
                    />
                    <YAxis
                      domain={[0, 'auto']}
                      allowDecimals={false}
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as MedicationAdherenceTrendPoint;
                          return (
                            <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1 text-right">
                              <p className="font-bold text-white border-b border-slate-800 pb-1">
                                {data.dayName} - {data.date}
                              </p>
                              <p className="text-emerald-400 font-medium">جرعات تم تناولها: {data.taken}</p>
                              <p className="text-amber-400 font-medium">جرعات تم تخطيها: {data.skipped}</p>
                              <p className="text-slate-400">إجمالي المجدول: {data.scheduled}</p>
                              <p className="text-teal-400 font-mono pt-1 border-t border-slate-800">
                                الالتزام: {data.adherencePct}%
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    />
                    <Bar
                      dataKey="taken"
                      name="تم التناول (Taken)"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="skipped"
                      name="تم التخطي (Skipped)"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="scheduled"
                      name="المجدول (Scheduled)"
                      fill="#475569"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Target Legend / Adherence Health Info */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-slate-400 border-t border-slate-800/60">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                  نسبة الالتزام اليومية
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  الحد الأدنى المستهدف سريرياً (80% فما فوق)
                </span>
              </div>
              <span className="text-teal-400 font-mono text-[10px]">
                محدث تلقائياً مع كل تسجيل جرعة
              </span>
            </div>
          </div>

          {/* Adherence by Medication Breakdown */}
          {medicationBreakdown.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-teal-400" />
                  <h3 className="text-sm md:text-base font-bold text-white">
                    معدل الالتزام حسب كل دواء (Adherence by Medication)
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  {medicationBreakdown.length} أدوية مسجلة
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {medicationBreakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <strong className="text-xs font-bold text-white block">
                          {item.name}
                        </strong>
                        <span className="text-[10px] text-teal-400 font-mono">
                          {item.dosage}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-teal-300 bg-teal-950 px-2 py-0.5 rounded border border-teal-800/40">
                        {item.adherencePct}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.adherencePct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span>تم تناول {item.taken} من {item.total} جرعة</span>
                      {item.skipped > 0 && (
                        <span className="text-amber-400">{item.skipped} متخطاة</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PAST DOSES TAKEN LOG (TABLE / CARDS WITH SEARCH AND FILTERS) */}
          {/* ========================================================================= */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-5">
            {/* Header & Log Past Dose Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-400" />
                  <h3 className="text-base font-bold text-white">
                    سجل الجرعات التاريخي وتفاصيل التناول (Past Doses Taken Log)
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  عرض وتوثيق الجرعات السابقة، المواعيد المجدولة مقابل الوقت الفعلي، وملاحظات المريض
                </p>
              </div>

              <button
                onClick={() => setShowPastLogModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-teal-200 border border-teal-500/30 text-xs font-bold rounded-xl transition cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>تسجيل جرعة سابقة (Log Past Dose)</span>
              </button>
            </div>

            {/* Filter Controls Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search Query */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="بحث باسم الدواء أو الملاحظة..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-white text-xs placeholder:text-slate-600 focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={historyStatusFilter}
                  onChange={(e) => setHistoryStatusFilter(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none"
                >
                  <option value="ALL">كافة الحالات (الكل)</option>
                  <option value="TAKEN">تم التناول فقط (Taken)</option>
                  <option value="SKIPPED">تم التخطي فقط (Skipped)</option>
                </select>
              </div>

              {/* Medication Filter */}
              <div>
                <select
                  value={historyMedFilter}
                  onChange={(e) => setHistoryMedFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none"
                >
                  <option value="ALL">كافة الأدوية المسجلة</option>
                  {distinctMedNames.map((name, idx) => (
                    <option key={idx} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Historical Entries List */}
            <div className="space-y-3">
              {filteredHistoryLogs.map((log) => {
                const isTaken = log.status === 'TAKEN';
                const logDate = new Date(log.loggedAt);
                const formattedDate = logDate.toLocaleDateString('ar-EG', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <div
                    key={log.id}
                    className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                      isTaken
                        ? 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                        : 'bg-amber-950/15 border-amber-900/30'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      {/* Name, dosage, and status tag */}
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-white text-sm font-bold">
                          {log.medicationName}
                        </strong>
                        <span className="text-teal-400 font-mono text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {log.dosage}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isTaken
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                              : 'bg-amber-950 text-amber-300 border border-amber-800/40'
                          }`}
                        >
                          {isTaken ? 'تم التناول بنجاح' : 'تم التخطي'}
                        </span>

                        {log.mealContext && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded">
                            <Utensils className="w-2.5 h-2.5 text-amber-400" />
                            {log.mealContext === 'WITH_MEAL'
                              ? 'مع الطعام'
                              : log.mealContext === 'AFTER_MEAL'
                              ? 'بعد الطعام'
                              : log.mealContext === 'BEFORE_MEAL'
                              ? 'قبل الطعام'
                              : 'بدون ارتباط'}
                          </span>
                        )}
                      </div>

                      {/* Timestamps & Scheduling Info */}
                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {formattedDate}
                        </span>
                        <span>الموعد المجدول: <span className="font-mono text-slate-300">{log.scheduledTime}</span></span>
                        {log.takenDoseTime && (
                          <span className="text-emerald-400">
                            وقت التناول الفعلي: <span className="font-mono">{log.takenDoseTime}</span>
                          </span>
                        )}
                      </div>

                      {/* Notes / Clinical observation */}
                      {log.notes && (
                        <p className="text-[11px] text-slate-300 bg-slate-900/90 p-2 rounded-xl border border-slate-800/50 mt-1 leading-relaxed">
                          <span className="text-slate-500 font-semibold ml-1">ملاحظة:</span>
                          {log.notes}
                        </p>
                      )}
                    </div>

                    {/* Undo action */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleUndoLog(log.id)}
                        title="حذف هذا السجل والتراجع"
                        className="px-2.5 py-1.5 text-slate-500 hover:text-rose-400 bg-slate-900/80 hover:bg-slate-900 rounded-xl transition border border-slate-800 hover:border-rose-900/40 flex items-center gap-1 cursor-pointer text-[11px]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredHistoryLogs.length === 0 && (
                <div className="text-center py-10 bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl space-y-2">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">لا توجد جرعات مطابقة لشروط البحث والتصفية.</p>
                </div>
              )}
            </div>

            {/* History List Footer */}
            <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-400">
              <span>إجمالي السجلات المعروضة: {filteredHistoryLogs.length} من أصل {logs.length}</span>
              <button
                onClick={() => {
                  setHistoryStatusFilter('ALL');
                  setHistoryMedFilter('ALL');
                  setHistorySearchQuery('');
                }}
                className="text-teal-400 hover:underline cursor-pointer"
              >
                إعادة ضبط عوامل التصفية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: REFILL TRACKER & INVENTORY VIEW */}
      {/* ========================================================================= */}
      {currentSection === 'refills' && (
        <RefillTracker
          patientId={patientId}
          onNavigateToSchedule={() => setCurrentSection('schedule')}
          onRefillUpdated={refreshData}
        />
      )}

      {/* Safety & Provenance Disclaimer Banner */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 flex items-start gap-3">
        <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-slate-200 block text-[11px]">
            المحددات السريرية وحوكمة البيانات (Clinical Safety & Provenance):
          </strong>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            سجل تناول الأدوية والرسوم البيانية للالتزام هي أداة شخصية لمساعدة المريض على التوثيق الذاتي (Self-Reported Adherence Projection).
            تخضع البيانات لمبدأ الفصل المعماري المعتمد:
            <span className="text-teal-400 font-mono mx-1">Prescription ≠ Dispense ≠ Medication Taken</span>.
            لا تعدل السجلات الذاتية الوصفة الأصلية المعتمدة من الطبيب أو أمر الصرف الصيدلاني، ولا تعتبر تشخيصاً أو استبدالاً للإشراف السريري.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Quick / Detailed Log Modal (For Today's Scheduled Dose) */}
      {/* ========================================================================= */}
      {selectedEntryForLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">تسجيل تفصيلي لحالة الجرعة</h3>
              </div>
              <button
                onClick={() => setSelectedEntryForLog(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <strong className="text-white text-sm block">{selectedEntryForLog.name}</strong>
              <span className="text-xs text-teal-400 font-mono">الجرعة المجدولة: {selectedEntryForLog.dosage} ({selectedEntryForLog.timeSlot})</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">وقت التناول الفعلي (اختياري)</label>
                <input
                  type="time"
                  value={logCustomTime}
                  onChange={(e) => setLogCustomTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">علاقة الجرعة بوجبة الطعام</label>
                <select
                  value={logMealContext}
                  onChange={(e) => setLogMealContext(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none"
                >
                  <option value="WITH_MEAL">مع وجبة الطعام</option>
                  <option value="AFTER_MEAL">بعد الطعام</option>
                  <option value="BEFORE_MEAL">قبل الطعام (على الريق)</option>
                  <option value="ANY">بدون ارتباط محدد</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">ملاحظات سريرية أو أعراض جانبية (اختياري)</label>
                <textarea
                  rows={2}
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="مثال: تم تناولها بعد الغداء مع كوب ماء وفير..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs focus:border-teal-500 focus:outline-none placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleDetailedLogSubmit('TAKEN')}
                className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-teal-950"
              >
                <Check className="w-4 h-4" />
                <span>تأكيد التناول (Log Taken)</span>
              </button>

              <button
                onClick={() => handleDetailedLogSubmit('SKIPPED')}
                className="py-2.5 px-4 bg-amber-950/80 hover:bg-amber-900 border border-amber-800/60 text-amber-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                <span>تخطي الجرعة (Skip)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Log Past Dose Modal (Retroactive logging for History) */}
      {/* ========================================================================= */}
      {showPastLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">تسجيل جرعة سابقة في السجل التاريخي</h3>
              </div>
              <button
                onClick={() => setShowPastLogModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePastLogSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">اسم الدواء *</label>
                <select
                  value={pastLogForm.medicationName}
                  onChange={(e) => {
                    const chosen = schedules.find((s) => s.name === e.target.value);
                    setPastLogForm({
                      ...pastLogForm,
                      medicationName: e.target.value,
                      dosage: chosen ? chosen.dosage : pastLogForm.dosage,
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none"
                >
                  {schedules.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.dosage})
                    </option>
                  ))}
                  <option value="Atorvastatin (أستورفاستاتين)">Atorvastatin (أستورفاستاتين) - 20mg</option>
                  <option value="Lisinopril (ليسينوبريل)">Lisinopril (ليسينوبريل) - 10mg</option>
                  <option value="Metformin XR (ميتفورمين ممتد المفعول)">Metformin XR (ميتفورمين) - 500mg</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">الجرعة *</label>
                  <input
                    type="text"
                    required
                    value={pastLogForm.dosage}
                    onChange={(e) => setPastLogForm({ ...pastLogForm, dosage: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">الحالة *</label>
                  <select
                    value={pastLogForm.status}
                    onChange={(e) => setPastLogForm({ ...pastLogForm, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none"
                  >
                    <option value="TAKEN">تم التناول (Taken)</option>
                    <option value="SKIPPED">تم التخطي (Skipped)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">تاريخ الجرعة *</label>
                  <input
                    type="date"
                    required
                    value={pastLogForm.date}
                    onChange={(e) => setPastLogForm({ ...pastLogForm, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">الوقت *</label>
                  <input
                    type="time"
                    required
                    value={pastLogForm.time}
                    onChange={(e) => setPastLogForm({ ...pastLogForm, time: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">علاقة الجرعة بالطعام</label>
                <select
                  value={pastLogForm.mealContext}
                  onChange={(e) => setPastLogForm({ ...pastLogForm, mealContext: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none"
                >
                  <option value="WITH_MEAL">مع وجبة الطعام</option>
                  <option value="AFTER_MEAL">بعد وجبة الطعام</option>
                  <option value="BEFORE_MEAL">قبل الطعام (على الريق)</option>
                  <option value="ANY">بدون ارتباط محدد</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">ملاحظات سريرية أو سبب التخطي</label>
                <textarea
                  rows={2}
                  value={pastLogForm.notes}
                  onChange={(e) => setPastLogForm({ ...pastLogForm, notes: e.target.value })}
                  placeholder="مثال: تم التناول بالموعد المحدد بدون أي أعراض جانبية..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs focus:border-teal-500 focus:outline-none placeholder:text-slate-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPastLogModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-teal-950 cursor-pointer"
                >
                  حفظ الجرعة بالسجل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Add Medication Schedule Modal */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">إضافة دواء جديد إلى الجدول اليومي</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">اسم الدواء أو المكمل *</label>
                <input
                  type="text"
                  required
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                  placeholder="مثال: Vitamin D3 (فيتامين د)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">الجرعة *</label>
                  <input
                    type="text"
                    required
                    value={newSchedule.dosage}
                    onChange={(e) => setNewSchedule({ ...newSchedule, dosage: e.target.value })}
                    placeholder="مثال: 50,000 IU أو 10mg"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">وقت التناول *</label>
                  <input
                    type="time"
                    required
                    value={newSchedule.timeSlot}
                    onChange={(e) => setNewSchedule({ ...newSchedule, timeSlot: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">الفترة الزمنية</label>
                  <select
                    value={newSchedule.period}
                    onChange={(e) => setNewSchedule({ ...newSchedule, period: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none"
                  >
                    <option value="MORNING">الصباح (Morning)</option>
                    <option value="AFTERNOON">الظهيرة (Afternoon)</option>
                    <option value="EVENING">المساء (Evening)</option>
                    <option value="BEDTIME">قبل النوم (Bedtime)</option>
                    <option value="CUSTOM">مخصص (Custom)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">التصنيف</label>
                  <select
                    value={newSchedule.category}
                    onChange={(e) => setNewSchedule({ ...newSchedule, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none"
                  >
                    <option value="PRESCRIPTION">وصفة طبية معتمدة</option>
                    <option value="SUPPLEMENT">مكمل غذائي / فيتامين</option>
                    <option value="PRN_AS_NEEDED">دواء عند الحاجة (PRN)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">إرشادات تناول الدواء</label>
                <input
                  type="text"
                  value={newSchedule.instructions}
                  onChange={(e) => setNewSchedule({ ...newSchedule, instructions: e.target.value })}
                  placeholder="مثال: بعد وجبة الإفطار مع كوب ماء"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">علاقة الجرعة بوجبة الطعام</label>
                <select
                  value={newSchedule.mealContext}
                  onChange={(e) => setNewSchedule({ ...newSchedule, mealContext: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none"
                >
                  <option value="WITH_MEAL">مع وجبة الطعام</option>
                  <option value="AFTER_MEAL">بعد الطعام</option>
                  <option value="BEFORE_MEAL">قبل الطعام (على معدة فارغة)</option>
                  <option value="ANY">في أي وقت</option>
                </select>
              </div>

              {/* Reminder Settings for this item */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold text-slate-200">تفعيل التنبيه التلقائي</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={newSchedule.reminderEnabled}
                    onChange={(e) => setNewSchedule({ ...newSchedule, reminderEnabled: e.target.checked })}
                    className="accent-teal-500 w-4 h-4 cursor-pointer"
                  />
                </div>

                {newSchedule.reminderEnabled && (
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                    <span>التنبيه المسبق:</span>
                    <select
                      value={newSchedule.reminderAdvanceMinutes}
                      onChange={(e) => setNewSchedule({ ...newSchedule, reminderAdvanceMinutes: Number(e.target.value) })}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                    >
                      <option value={0}>في موعد الجرعة بالضبط</option>
                      <option value={5}>قبل 5 دقائق</option>
                      <option value={10}>قبل 10 دقائق</option>
                      <option value={15}>قبل 15 دقيقة</option>
                      <option value={30}>قبل 30 دقيقة</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Refill Tracker & Pill Inventory Configuration */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-bold text-slate-200">
                    متابعة رصيد الحبوب وتنبيهات إعادة الصرف (Refill Tracker)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      رصيد الحبوب المتبقي حالياً *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="500"
                      value={newSchedule.currentPillCount}
                      onChange={(e) =>
                        setNewSchedule({
                          ...newSchedule,
                          currentPillCount: Math.max(0, parseInt(e.target.value) || 0),
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs font-mono focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      سعة العبوة الإجمالية *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={newSchedule.totalPillCapacity}
                      onChange={(e) =>
                        setNewSchedule({
                          ...newSchedule,
                          totalPillCapacity: Math.max(1, parseInt(e.target.value) || 30),
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs font-mono focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      كمية الحبوب في الجرعة الواحدة
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newSchedule.dosageQuantityPerIntake}
                      onChange={(e) =>
                        setNewSchedule({
                          ...newSchedule,
                          dosageQuantityPerIntake: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs font-mono focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      إرسال تنبيه قبل النفاد بـ (أيام)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={newSchedule.refillThresholdDays}
                      onChange={(e) =>
                        setNewSchedule({
                          ...newSchedule,
                          refillThresholdDays: Math.max(1, parseInt(e.target.value) || 5),
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs font-mono focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">رقم الوصفة الطبية (Rx #)</label>
                    <input
                      type="text"
                      placeholder="مثال: RX-94821"
                      value={newSchedule.rxNumber}
                      onChange={(e) => setNewSchedule({ ...newSchedule, rxNumber: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs font-mono focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">اسم الصيدلية</label>
                    <input
                      type="text"
                      placeholder="مثال: صيدلية المستشفى الجامعي"
                      value={newSchedule.pharmacyName}
                      onChange={(e) => setNewSchedule({ ...newSchedule, pharmacyName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* AI-Driven Proactive Smart Alert Drug-Drug Interaction Check */}
              {isCheckingMedAlert && (
                <div className="p-3 rounded-xl bg-slate-950 border border-teal-500/30 text-teal-300 text-xs flex items-center gap-2 animate-pulse">
                  <Sparkles className="w-4 h-4 text-teal-400 animate-spin" />
                  <span>جاري فحص التداخلات الدوائية والتعارضات المحتملة بالذكاء الاصطناعي...</span>
                </div>
              )}

              {medAlert && !isCheckingMedAlert && (
                <div
                  className={`p-4 rounded-2xl border space-y-2.5 animate-fade-in ${
                    medAlert.severity === 'CRITICAL'
                      ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                      : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        medAlert.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            medAlert.severity === 'CRITICAL'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                          }`}
                        >
                          {medAlert.severity === 'CRITICAL' ? 'تداخل دوائي حرج' : 'تنبيه وقائي'}
                        </span>
                        <span className="text-[10px] bg-slate-950 text-teal-300 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-teal-400" />
                          Gemini Sentinel
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white">{medAlert.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{medAlert.summary}</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                    <div>
                      <strong className="text-teal-400">الآلية السريرية:</strong> {medAlert.clinicalMechanism}
                    </div>
                    <div>
                      <strong className="text-emerald-400">التوصية البديلة:</strong> {medAlert.recommendedAction}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300 pt-1">
                    <input
                      type="checkbox"
                      checked={hasAcknowledgedMedAlert}
                      onChange={(e) => setHasAcknowledgedMedAlert(e.target.checked)}
                      className="accent-teal-500 rounded"
                    />
                    <span>أدرك وجود هذا التداخل الدوائي وأؤكد المتابعة بإشراف الطبيب</span>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-teal-950 cursor-pointer"
                >
                  حفظ الدواء في الجدول
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Reminder Settings Modal */}
      {/* ========================================================================= */}
      {showReminderSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">إعدادات تنبيهات الأدوية</h3>
              </div>
              <button
                onClick={() => setShowReminderSettingsModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Browser Push Permission State & Action */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold text-white">إذن إشعارات المتصفح (Web Push)</span>
                  </div>
                  {browserPermission === 'granted' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono">
                      مفعّل بنجاح ✓
                    </span>
                  ) : browserPermission === 'denied' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800/60">
                      محظور من المتصفح
                    </span>
                  ) : (
                    <button
                      onClick={requestNotificationPermission}
                      className="px-2.5 py-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-[10px] rounded-lg transition cursor-pointer"
                    >
                      منح الإذن الآن
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  يتيح للموقع إرسال نوافذ إشعار خارجية منبهة حتى عند تصفح تبويبات أخرى أثناء تشغيل البوابة.
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <span className="text-xs text-slate-300">تفعيل إرسال إشعارات المتصفح:</span>
                  <input
                    type="checkbox"
                    checked={reminderSettings.browserNotifications}
                    onChange={(e) => {
                      const updated = dataService.updateMedicationReminderSettings({
                        browserNotifications: e.target.checked,
                      });
                      setReminderSettings(updated);
                    }}
                    className="accent-teal-500 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>

              {/* Advance Reminder Minutes */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                <div>
                  <span className="block text-xs font-bold text-white">وقت التنبيه المسبق</span>
                  <span className="text-[11px] text-slate-400">إشعار قبل حلول موعد الجرعة بفترة كافية</span>
                </div>
                <select
                  value={reminderSettings.advanceMinutes}
                  onChange={(e) => {
                    const updated = dataService.updateMedicationReminderSettings({
                      advanceMinutes: Number(e.target.value),
                    });
                    setReminderSettings(updated);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs focus:border-teal-500 focus:outline-none"
                >
                  <option value={0}>في موعد الجرعة بالضبط</option>
                  <option value={5}>قبل 5 دقائق</option>
                  <option value={10}>قبل 10 دقائق</option>
                  <option value={15}>قبل 15 دقيقة</option>
                  <option value={30}>قبل 30 دقيقة</option>
                </select>
              </div>

              {/* Audio Alerts */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                <div>
                  <span className="block text-xs font-bold text-white">نغمات التنبيه الصوتية</span>
                  <span className="text-[11px] text-slate-400">تشغيل نغمة لطيفة عند حلول وقت الجرعة</span>
                </div>
                <input
                  type="checkbox"
                  checked={reminderSettings.audioAlerts}
                  onChange={(e) => {
                    const updated = dataService.updateMedicationReminderSettings({
                      audioAlerts: e.target.checked,
                    });
                    setReminderSettings(updated);
                  }}
                  className="accent-teal-500 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Quiet Hours */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-bold text-white">ساعات الهدوء (عدم الإزعاج)</span>
                    <span className="text-[11px] text-slate-400">كتم النغمات والإشعارات أثناء النوم</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={reminderSettings.quietHoursEnabled}
                    onChange={(e) => {
                      const updated = dataService.updateMedicationReminderSettings({
                        quietHoursEnabled: e.target.checked,
                      });
                      setReminderSettings(updated);
                    }}
                    className="accent-teal-500 w-4 h-4 cursor-pointer"
                  />
                </div>
                {reminderSettings.quietHoursEnabled && (
                  <div className="flex items-center gap-3 pt-2 text-xs text-slate-400 border-t border-slate-800/60">
                    <span>من الساعة:</span>
                    <input
                      type="time"
                      value={reminderSettings.quietHoursStart}
                      onChange={(e) => {
                        const updated = dataService.updateMedicationReminderSettings({
                          quietHoursStart: e.target.value,
                        });
                        setReminderSettings(updated);
                      }}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-mono"
                    />
                    <span>إلى:</span>
                    <input
                      type="time"
                      value={reminderSettings.quietHoursEnd}
                      onChange={(e) => {
                        const updated = dataService.updateMedicationReminderSettings({
                          quietHoursEnd: e.target.value,
                        });
                        setReminderSettings(updated);
                      }}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-mono"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={triggerFullDoseAlertSimulation}
                className="text-xs text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>اختبار التنبيه الكامل الآن</span>
              </button>

              <button
                onClick={() => setShowReminderSettingsModal(false)}
                className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer shadow-lg shadow-teal-950/40"
              >
                تم الحفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
