import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Smartphone,
  Mail,
  AppWindow,
  FlaskConical,
  Pill,
  Volume2,
  VolumeX,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  Save,
  RotateCcw,
  Sparkles,
  PhoneCall,
  Lock,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { PatientNotificationSettings } from '../../types';

interface NotificationSettingsPanelProps {
  patientId?: string;
  onClose?: () => void;
}

export const NotificationSettingsPanel: React.FC<NotificationSettingsPanelProps> = ({
  patientId = 'pat-main',
  onClose,
}) => {
  const [settings, setSettings] = useState<PatientNotificationSettings>(() => {
    return dataService.getPatientNotificationSettings(patientId);
  });

  const [isSaved, setIsSaved] = useState(false);
  const [testAlertFeedback, setTestAlertFeedback] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    setSettings(dataService.getPatientNotificationSettings(patientId));
  }, [patientId]);

  const handleChannelToggle = (channel: 'sms' | 'email' | 'inApp') => {
    setSettings((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: {
          ...prev.channels[channel],
          enabled: !prev.channels[channel].enabled,
        },
      },
    }));
    setIsSaved(false);
  };

  const handleLabAlertToggle = (channel: 'sms' | 'email' | 'inApp') => {
    setSettings((prev) => ({
      ...prev,
      alerts: {
        ...prev.alerts,
        criticalLabResults: {
          ...prev.alerts.criticalLabResults,
          [channel]: !prev.alerts.criticalLabResults[channel],
        },
      },
    }));
    setIsSaved(false);
  };

  const handleMedReminderToggle = (channel: 'sms' | 'email' | 'inApp') => {
    setSettings((prev) => ({
      ...prev,
      alerts: {
        ...prev.alerts,
        medicationReminders: {
          ...prev.alerts.medicationReminders,
          [channel]: !prev.alerts.medicationReminders[channel],
        },
      },
    }));
    setIsSaved(false);
  };

  const handleSave = () => {
    const updated = dataService.updatePatientNotificationSettings(patientId, settings);
    setSettings(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 4000);
  };

  const handleReset = () => {
    const fresh = dataService.getPatientNotificationSettings(patientId);
    setSettings(fresh);
    setIsSaved(false);
    setTestAlertFeedback(null);
  };

  const handleSendTest = (channel: 'sms' | 'email' | 'inApp', type: 'criticalLabResults' | 'medicationReminders') => {
    setIsSendingTest(true);
    const result = dataService.sendTestNotification(patientId, channel, type);
    setTestAlertFeedback(result.message);
    setIsSendingTest(false);
    setTimeout(() => setTestAlertFeedback(null), 6000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 font-black">
            <BellRing className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-white">إعدادات الإشعارات والتنبيهات (Notification Settings)</h3>
              <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-800 px-2.5 py-0.5 rounded-full font-bold">
                تشفير سيادي E2EE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              التحكم بقنوات التنبيه (SMS، البريد الإلكتروني، وإشعارات التطبيق) للنتائج المخبرية الحرجة وتذكيرات مواعيد الأدوية.
            </p>
          </div>
        </div>

        {/* Save / Reset Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="إعادة ضبط القيم الحالية"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إلغاء التغييرات</span>
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-teal-500/25 flex items-center gap-2 transition active:scale-95 cursor-pointer"
          >
            {isSaved ? <CheckCircle2 className="w-4 h-4 text-slate-950" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'تم الحفظ والمزامنة!' : 'حفظ الإعدادات'}</span>
          </button>
        </div>
      </div>

      {/* Success / Feedback Toast */}
      {isSaved && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>
            <strong>تم حفظ التفضيلات بنجاح:</strong> تم تحديث سياسة التنبيهات الشخصية وتوثيقها في سجل التدقيق السيادي (POL-PATIENT-NOTIFICATION-PREFERENCES).
          </span>
        </div>
      )}

      {testAlertFeedback && (
        <div className="p-4 bg-teal-950/40 border border-teal-800/60 rounded-xl text-xs text-teal-300 flex items-center justify-between gap-2.5 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{testAlertFeedback}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Dispatched</span>
        </div>
      )}

      {/* Section 1: Delivery Channels Configuration */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-teal-400" />
              <span>1. قنوات التوصيل الأساسية (Delivery Channels)</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              تفعيل القنوات وبيانات الاتصال المعتمدة لاستلام التنبيهات الحيوية والطبية
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">3 Channels Supported</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Channel 1: SMS */}
          <div
            className={`p-4 rounded-xl border transition space-y-3 ${
              settings.channels.sms.enabled
                ? 'bg-slate-950 border-teal-500/40 shadow-sm'
                : 'bg-slate-950/60 border-slate-800 opacity-75'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    settings.channels.sms.enabled ? 'bg-teal-500/10 text-teal-400' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">رسائل SMS النصية</span>
                  <span className="text-[10px] text-slate-400">تنبيهات فورية على الجوال</span>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => handleChannelToggle('sms')}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition ${
                  settings.channels.sms.enabled ? 'bg-teal-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="bg-slate-950 w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[11px] text-slate-400 font-medium">رقم الهاتف المصرح:</label>
              <input
                type="text"
                disabled={!settings.channels.sms.enabled}
                value={settings.channels.sms.phoneNumber}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    channels: {
                      ...settings.channels,
                      sms: { ...settings.channels.sms, phoneNumber: e.target.value },
                    },
                  })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-teal-500 disabled:opacity-50"
              />
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 pt-0.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>رقم تم توثيقه مع الهوية الوطنية</span>
              </div>
            </div>
          </div>

          {/* Channel 2: Email */}
          <div
            className={`p-4 rounded-xl border transition space-y-3 ${
              settings.channels.email.enabled
                ? 'bg-slate-950 border-teal-500/40 shadow-sm'
                : 'bg-slate-950/60 border-slate-800 opacity-75'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    settings.channels.email.enabled ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">البريد الإلكتروني Email</span>
                  <span className="text-[10px] text-slate-400">تقارير مفصلة ونتائج</span>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => handleChannelToggle('email')}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition ${
                  settings.channels.email.enabled ? 'bg-indigo-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="bg-slate-950 w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[11px] text-slate-400 font-medium">عنوان البريد الإلكتروني:</label>
              <input
                type="email"
                disabled={!settings.channels.email.enabled}
                value={settings.channels.email.emailAddress}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    channels: {
                      ...settings.channels,
                      email: { ...settings.channels.email, emailAddress: e.target.value },
                    },
                  })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 pt-0.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>بريد موثق ومشفر ببروتوكول TLS</span>
              </div>
            </div>
          </div>

          {/* Channel 3: In-App & Browser Push */}
          <div
            className={`p-4 rounded-xl border transition space-y-3 ${
              settings.channels.inApp.enabled
                ? 'bg-slate-950 border-teal-500/40 shadow-sm'
                : 'bg-slate-950/60 border-slate-800 opacity-75'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    settings.channels.inApp.enabled ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <AppWindow className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">إشعارات التطبيق (In-App)</span>
                  <span className="text-[10px] text-slate-400">بانرات فورية وسطح المكتب</span>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => handleChannelToggle('inApp')}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition ${
                  settings.channels.inApp.enabled ? 'bg-purple-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="bg-slate-950 w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>تنبيه صوتي للحالات الحرجة:</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.channels.inApp.soundEnabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      channels: {
                        ...settings.channels,
                        inApp: { ...settings.channels.inApp, soundEnabled: e.target.checked },
                      },
                    })
                  }
                  className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <span className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-teal-400" />
                  <span>إشعارات المتصفح (Browser Push):</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.channels.inApp.browserPushEnabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      channels: {
                        ...settings.channels,
                        inApp: { ...settings.channels.inApp, browserPushEnabled: e.target.checked },
                      },
                    })
                  }
                  className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-0 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Alert Rules Matrix (Critical Lab Results & Medication Reminders) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module A: Critical Lab Results Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">النتائج المخبرية الحرجة (Critical Lab Results)</h4>
                <p className="text-[11px] text-slate-400">إشعار عند صدور نتائج تحاليل دم خارج النطاق الآمن</p>
              </div>
            </div>
            <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded font-bold">
              High Priority
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            عند رصد مؤشرات حيوية غير طبيعية (مثل هبوط البوتاسيوم الحاد، ارتفاع السكر الشديد، أو مؤشرات إنزيمات القلب)، يتم تفعيل التنبيه تلقائياً عبر القنوات المختارة.
          </p>

          {/* Toggle Switches for Lab Results */}
          <div className="space-y-3 pt-1">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Smartphone className="w-4 h-4 text-teal-400" />
                <span className="text-white font-medium">رسالة نصية SMS عاجلة</span>
              </div>
              <button
                type="button"
                onClick={() => handleLabAlertToggle('sms')}
                className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition ${
                  settings.alerts.criticalLabResults.sms ? 'bg-teal-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="bg-slate-950 w-3.5 h-3.5 rounded-full shadow-md" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Mail className="w-4 h-4 text-indigo-400" />
                <span className="text-white font-medium">بريد إلكتروني يحتوي ملخص التقرير المخبري</span>
              </div>
              <button
                type="button"
                onClick={() => handleLabAlertToggle('email')}
                className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition ${
                  settings.alerts.criticalLabResults.email ? 'bg-indigo-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="bg-slate-950 w-3.5 h-3.5 rounded-full shadow-md" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <AppWindow className="w-4 h-4 text-purple-400" />
                <span className="text-white font-medium">إشعار نافذة منبثقة داخل التطبيق (In-App Banner)</span>
              </div>
              <button
                type="button"
                onClick={() => handleLabAlertToggle('inApp')}
                className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition ${
                  settings.alerts.criticalLabResults.inApp ? 'bg-purple-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="bg-slate-950 w-3.5 h-3.5 rounded-full shadow-md" />
              </button>
            </div>
          </div>

          {/* Sub Option: Urgent threshold only */}
          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.alerts.criticalLabResults.urgentThresholdOnly}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    alerts: {
                      ...settings.alerts,
                      criticalLabResults: {
                        ...settings.alerts.criticalLabResults,
                        urgentThresholdOnly: e.target.checked,
                      },
                    },
                  })
                }
                className="rounded bg-slate-950 border-slate-700 text-teal-500 focus:ring-0 cursor-pointer"
              />
              <span>إرسال التنبيهات للقيم الحرجة فقط (استبعاد النتائج ذات الانحراف البسيط)</span>
            </label>
          </div>

          {/* Test Dispatch Button */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono">Test Dispatch</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSendTest('sms', 'criticalLabResults')}
                disabled={isSendingTest || !settings.channels.sms.enabled}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-40"
              >
                تجربة SMS
              </button>
              <button
                type="button"
                onClick={() => handleSendTest('email', 'criticalLabResults')}
                disabled={isSendingTest || !settings.channels.email.enabled}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-40"
              >
                تجربة بريد
              </button>
              <button
                type="button"
                onClick={() => handleSendTest('inApp', 'criticalLabResults')}
                disabled={isSendingTest}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                تجربة إشعار فوري
              </button>
            </div>
          </div>
        </div>

        {/* Module B: Medication Reminders */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">تذكيرات مواعيد الأدوية (Medication Reminders)</h4>
                <p className="text-[11px] text-slate-400">تنبيهات منتظمة لجرعات الوصفات الطبية وإعادة التعبئة</p>
              </div>
            </div>
            <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded font-bold">
              Adherence Engine
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            تلقي إشعارات تفاعلية لمواعيد جرعاتك اليومية (مثل الميتفورمين والليسينوبريل) مع إمكانية تأكيد التناول مباشرة لتحسين معدل الالتزام الدوائي.
          </p>

          {/* Toggle Switches for Medication Reminders */}
          <div className="space-y-3 pt-1">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Smartphone className="w-4 h-4 text-teal-400" />
                <span className="text-white font-medium">تذكير عبر رسائل SMS النصية</span>
              </div>
              <button
                type="button"
                onClick={() => handleMedReminderToggle('sms')}
                className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition ${
                  settings.alerts.medicationReminders.sms ? 'bg-teal-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="bg-slate-950 w-3.5 h-3.5 rounded-full shadow-md" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Mail className="w-4 h-4 text-indigo-400" />
                <span className="text-white font-medium">جدول التذكير اليومي عبر البريد الإلكتروني</span>
              </div>
              <button
                type="button"
                onClick={() => handleMedReminderToggle('email')}
                className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition ${
                  settings.alerts.medicationReminders.email ? 'bg-indigo-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="bg-slate-950 w-3.5 h-3.5 rounded-full shadow-md" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <AppWindow className="w-4 h-4 text-purple-400" />
                <span className="text-white font-medium">تنبيه صوتي وبصري داخل التطبيق (In-App Alert)</span>
              </div>
              <button
                type="button"
                onClick={() => handleMedReminderToggle('inApp')}
                className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition ${
                  settings.alerts.medicationReminders.inApp ? 'bg-purple-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="bg-slate-950 w-3.5 h-3.5 rounded-full shadow-md" />
              </button>
            </div>
          </div>

          {/* Timing & Advance Minutes Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="space-y-1 text-xs">
              <label className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span>وقت التنبيه المسبق:</span>
              </label>
              <select
                value={settings.alerts.medicationReminders.advanceMinutes}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    alerts: {
                      ...settings.alerts,
                      medicationReminders: {
                        ...settings.alerts.medicationReminders,
                        advanceMinutes: parseInt(e.target.value, 10),
                      },
                    },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
              >
                <option value={0}>في موعد الجرعة تماماً (0 دقيقة)</option>
                <option value={5}>قبل 5 دقائق من الجرعة</option>
                <option value={10}>قبل 10 دقائق من الجرعة (موصى به)</option>
                <option value={15}>قبل 15 دقيقة من الجرعة</option>
                <option value={30}>قبل 30 دقيقة من الجرعة</option>
              </select>
            </div>

            {/* Quiet Hours */}
            <div className="space-y-1 text-xs">
              <label className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                <span>ساعات الهدوء (عدم الإزعاج):</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="time"
                  value={settings.alerts.medicationReminders.quietHoursStart}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      alerts: {
                        ...settings.alerts,
                        medicationReminders: {
                          ...settings.alerts.medicationReminders,
                          quietHoursStart: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                />
                <span className="text-slate-500 text-xs">إلى</span>
                <input
                  type="time"
                  value={settings.alerts.medicationReminders.quietHoursEnd}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      alerts: {
                        ...settings.alerts,
                        medicationReminders: {
                          ...settings.alerts.medicationReminders,
                          quietHoursEnd: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Test Dispatch Button */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono">Test Reminder</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSendTest('sms', 'medicationReminders')}
                disabled={isSendingTest || !settings.channels.sms.enabled}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-40"
              >
                تجربة SMS
              </button>
              <button
                type="button"
                onClick={() => handleSendTest('inApp', 'medicationReminders')}
                disabled={isSendingTest}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                تجربة تذكير فوري
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Caregiver Escalation & Sovereign Security */}
      <div className="p-5 bg-indigo-950/20 border border-indigo-800/40 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-center text-indigo-400 shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>تصعيد الطوارئ لمقدم الرعاية (Caregiver Emergency Escalation)</span>
              <span className="text-[10px] bg-indigo-900/60 text-indigo-300 px-2 py-0.2 rounded font-mono">
                {settings.alerts.emergencyEscalation.notifyCaregiver ? 'مفعّل' : 'معطّل'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              في حال عدم التجاوب مع تنبيه مخبري حرج أو نوبة هبوط سكر، يتم إرسال تنبيه SMS آلي لجهة الاتصال الموثوقة ({settings.alerts.emergencyEscalation.caregiverPhone}).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <label className="flex items-center gap-2 text-xs text-indigo-200 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.alerts.emergencyEscalation.notifyCaregiver}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  alerts: {
                    ...settings.alerts,
                    emergencyEscalation: {
                      ...settings.alerts.emergencyEscalation,
                      notifyCaregiver: e.target.checked,
                    },
                  },
                })
              }
              className="rounded bg-slate-950 border-indigo-700 text-indigo-500 focus:ring-0 cursor-pointer"
            />
            <span className="font-bold">تفعيل التصعيد الآلي</span>
          </label>
        </div>
      </div>
    </div>
  );
};
