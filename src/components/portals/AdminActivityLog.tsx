import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Radio,
  ShieldAlert,
  Server,
  Smartphone,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  Play,
  Pause,
  PlusCircle,
  Eye,
  X,
  Clock,
  Battery,
  SlidersHorizontal,
  Download,
  Check,
} from 'lucide-react';
import { activityLogService } from '../../services/activityLogService';
import { ActivityLogEntry, ActivityLogCategory, ActivityLogLevel } from '../../types';

export const AdminActivityLog: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ActivityLogCategory | 'ALL'>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<ActivityLogLevel | 'ALL'>('ALL');
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [selectedLogForInspect, setSelectedLogForInspect] = useState<ActivityLogEntry | null>(null);

  useEffect(() => {
    const unsubscribe = activityLogService.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });

    if (isLiveStreaming) {
      activityLogService.startSimulation(8000);
    }

    return () => {
      unsubscribe();
      activityLogService.stopSimulation();
    };
  }, []);

  const toggleSimulation = () => {
    if (isLiveStreaming) {
      activityLogService.stopSimulation();
      setIsLiveStreaming(false);
    } else {
      activityLogService.startSimulation(7000);
      setIsLiveStreaming(true);
    }
  };

  const handleSimulateDeviceAlert = () => {
    activityLogService.triggerSimulatedDeviceAlert();
  };

  const handleSimulatePortalAccess = () => {
    activityLogService.triggerSimulatedPortalAccess();
  };

  const handleSimulateSystemEvent = () => {
    activityLogService.triggerSimulatedSystemEvent();
  };

  const handleAcknowledge = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    activityLogService.acknowledgeAlert(id);
    if (selectedLogForInspect && selectedLogForInspect.id === id) {
      setSelectedLogForInspect({
        ...selectedLogForInspect,
        diagnosticAlert: selectedLogForInspect.diagnosticAlert
          ? { ...selectedLogForInspect.diagnosticAlert, acknowledged: true }
          : undefined,
      });
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Category filter
      if (selectedCategory !== 'ALL' && log.category !== selectedCategory) {
        return false;
      }
      // Level filter
      if (selectedLevel !== 'ALL' && log.level !== selectedLevel) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = log.title.toLowerCase().includes(q);
        const matchDesc = log.description.toLowerCase().includes(q);
        const matchActor = log.actor?.name.toLowerCase().includes(q) || log.actor?.portal?.toLowerCase().includes(q);
        const matchDevice = log.device?.model.toLowerCase().includes(q) || log.device?.serialNumber.toLowerCase().includes(q);
        const matchNode = log.systemContext?.nodeName.toLowerCase().includes(q);
        const matchAlert = log.diagnosticAlert?.alertType.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchActor && !matchDevice && !matchNode && !matchAlert) {
          return false;
        }
      }
      return true;
    });
  }, [logs, selectedCategory, selectedLevel, searchQuery]);

  const stats = useMemo(() => {
    const total = logs.length;
    const portalAccess = logs.filter((l) => l.category === 'PORTAL_ACCESS').length;
    const systemEvents = logs.filter((l) => l.category === 'SYSTEM_EVENT').length;
    const deviceAlerts = logs.filter((l) => l.category === 'DEVICE_DIAGNOSTIC').length;
    const criticals = logs.filter((l) => l.level === 'CRITICAL').length;
    const unackAlerts = logs.filter((l) => l.diagnosticAlert && !l.diagnosticAlert.acknowledged).length;

    return { total, portalAccess, systemEvents, deviceAlerts, criticals, unackAlerts };
  }, [logs]);

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `lifex-activity-logs-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & KPI Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">سجل النشاط وتتبع الأحداث اللحظية (Activity & Telemetry Log)</h3>
                  {isLiveStreaming ? (
                    <span className="flex items-center gap-1.5 text-[11px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2.5 py-0.5 rounded-full font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      LIVE STREAM
                    </span>
                  ) : (
                    <span className="text-[11px] bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full font-mono">
                      PAUSED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  رصد مباشر لعمليات تسجيل الدخول، وصول البوابات، أحداث العقد، وتنبيهات الأجهزة الطبية المتصلة (IoMT).
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              onClick={toggleSimulation}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                isLiveStreaming
                  ? 'bg-amber-950/40 text-amber-300 border-amber-800/50 hover:bg-amber-900/50'
                  : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50 hover:bg-emerald-900/50'
              }`}
            >
              {isLiveStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isLiveStreaming ? 'إيقاف البث المؤقت' : 'استئناف البث المباشر'}</span>
            </button>

            <button
              onClick={handleSimulateDeviceAlert}
              className="px-3 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 text-purple-200 border border-purple-800/50 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="محاكاة ورود تنبيه عاجل من جهاز مراقبة طبي"
            >
              <Smartphone className="w-3.5 h-3.5 text-purple-400" />
              <span>+ تنبيه جهاز طبي</span>
            </button>

            <button
              onClick={handleSimulatePortalAccess}
              className="px-3 py-1.5 rounded-xl bg-teal-950/50 hover:bg-teal-900/60 text-teal-200 border border-teal-800/50 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="محاكاة دخول طبيب أو مريض للبوابة"
            >
              <Radio className="w-3.5 h-3.5 text-teal-400" />
              <span>+ وصول بوابة</span>
            </button>

            <button
              onClick={handleSimulateSystemEvent}
              className="px-3 py-1.5 rounded-xl bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-200 border border-indigo-800/50 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="محاكاة فحص دوري للعقدة أو السجل"
            >
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              <span>+ حدث نظام</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير JSON</span>
            </button>
          </div>
        </div>

        {/* Quick Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-center">
            <div className="text-lg font-black text-white font-mono">{stats.total}</div>
            <div className="text-[11px] text-slate-400">إجمالي الأحداث</div>
          </div>
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-center">
            <div className="text-lg font-black text-teal-400 font-mono">{stats.portalAccess}</div>
            <div className="text-[11px] text-slate-400">وصول البوابات</div>
          </div>
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-center">
            <div className="text-lg font-black text-indigo-400 font-mono">{stats.systemEvents}</div>
            <div className="text-[11px] text-slate-400">أحداث العقد</div>
          </div>
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-center">
            <div className="text-lg font-black text-purple-400 font-mono">{stats.deviceAlerts}</div>
            <div className="text-[11px] text-slate-400">تشخيص الأجهزة</div>
          </div>
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-center">
            <div className="text-lg font-black text-rose-400 font-mono">{stats.criticals}</div>
            <div className="text-[11px] text-slate-400">أحداث حرجة</div>
          </div>
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-center">
            <div className="text-lg font-black text-amber-400 font-mono">{stats.unackAlerts}</div>
            <div className="text-[11px] text-slate-400">تنبيهات غير مؤكدة</div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-teal-500 text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              الكل ({logs.length})
            </button>
            <button
              onClick={() => setSelectedCategory('PORTAL_ACCESS')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                selectedCategory === 'PORTAL_ACCESS'
                  ? 'bg-teal-500 text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3 h-3" />
              <span>وصول البوابات ({stats.portalAccess})</span>
            </button>
            <button
              onClick={() => setSelectedCategory('SYSTEM_EVENT')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                selectedCategory === 'SYSTEM_EVENT'
                  ? 'bg-teal-500 text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Server className="w-3 h-3" />
              <span>أحداث النظام ({stats.systemEvents})</span>
            </button>
            <button
              onClick={() => setSelectedCategory('DEVICE_DIAGNOSTIC')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                selectedCategory === 'DEVICE_DIAGNOSTIC'
                  ? 'bg-teal-500 text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>تشخيص الأجهزة ({stats.deviceAlerts})</span>
            </button>
          </div>

          {/* Level Filter & Search Bar */}
          <div className="flex items-center gap-2">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:border-teal-500 focus:outline-none"
            >
              <option value="ALL">جميع المستويات (All Levels)</option>
              <option value="INFO">معلومة (Info)</option>
              <option value="SUCCESS">نجاح (Success)</option>
              <option value="WARNING">تحذير (Warning)</option>
              <option value="CRITICAL">حرج (Critical)</option>
            </select>

            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="بحث بالممثل، الجهاز، العقدة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-8 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>نتائج التصفية: {filteredLogs.length} حدث</span>
          <span className="text-[11px] text-teal-400 font-sans">انقر فوق أي حدث لعرض التفاصيل وتوقيع التشفير</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Info className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm font-medium">لا توجد أحداث مطابقة لمعايير البحث المحددة</p>
            <p className="text-xs">جرب تغيير شروط الفلترة أو إعادة ضبط البحث</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredLogs.map((log) => {
              const isCritical = log.level === 'CRITICAL';
              const isWarning = log.level === 'WARNING';
              const isSuccess = log.level === 'SUCCESS';
              const isDevice = log.category === 'DEVICE_DIAGNOSTIC';
              const isPortal = log.category === 'PORTAL_ACCESS';
              const isSystem = log.category === 'SYSTEM_EVENT';

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLogForInspect(log)}
                  className={`p-4 sm:p-5 hover:bg-slate-800/40 transition cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    isCritical ? 'bg-rose-950/10' : ''
                  }`}
                >
                  {/* Left Block: Icon & Main Details */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isCritical
                          ? 'bg-rose-950 text-rose-400 border-rose-800/60'
                          : isWarning
                          ? 'bg-amber-950 text-amber-400 border-amber-800/60'
                          : isSuccess
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800/60'
                          : 'bg-teal-950 text-teal-400 border-teal-800/60'
                      }`}
                    >
                      {isDevice ? (
                        <Smartphone className="w-5 h-5" />
                      ) : isPortal ? (
                        <Radio className="w-5 h-5" />
                      ) : (
                        <Server className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{log.title}</span>

                        {/* Category Badge */}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            isDevice
                              ? 'bg-purple-950 text-purple-300 border border-purple-800/50'
                              : isPortal
                              ? 'bg-teal-950 text-teal-300 border border-teal-800/50'
                              : 'bg-indigo-950 text-indigo-300 border border-indigo-800/50'
                          }`}
                        >
                          {isDevice ? 'Device Alert' : isPortal ? 'Portal Access' : 'System Event'}
                        </span>

                        {/* Level Badge */}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            isCritical
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : isWarning
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : isSuccess
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {log.level}
                        </span>

                        {/* Unacknowledged Device Alert Pulse */}
                        {log.diagnosticAlert && !log.diagnosticAlert.acknowledged && (
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            بانتظار التأكيد
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {log.description}
                      </p>

                      {/* Contextual Badges / Tags */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400 font-mono">
                        {log.actor && (
                          <span className="flex items-center gap-1 text-teal-400">
                            <strong>الفاعل:</strong> {log.actor.name} ({log.actor.role})
                          </span>
                        )}

                        {log.device && (
                          <span className="flex items-center gap-1 text-purple-300">
                            <Smartphone className="w-3 h-3 inline" />
                            {log.device.model} ({log.device.serialNumber})
                          </span>
                        )}

                        {log.device?.batteryPercentage !== undefined && (
                          <span
                            className={`flex items-center gap-1 ${
                              log.device.batteryPercentage < 20 ? 'text-rose-400 font-bold' : 'text-slate-400'
                            }`}
                          >
                            <Battery className="w-3 h-3 inline" />
                            {log.device.batteryPercentage}%
                          </span>
                        )}

                        {log.systemContext?.nodeName && (
                          <span className="flex items-center gap-1 text-indigo-300">
                            <Server className="w-3 h-3 inline" />
                            {log.systemContext.nodeName} ({log.systemContext.latencyMs}ms)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Block: Timestamp & Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full md:w-auto shrink-0 gap-2">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {log.diagnosticAlert && !log.diagnosticAlert.acknowledged && (
                        <button
                          onClick={(e) => handleAcknowledge(log.id, e)}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                          title="تأكيد الاطلاع على التنبيه التشخيصي"
                        >
                          <Check className="w-3 h-3" />
                          <span>تأكيد الإشعار</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedLogForInspect(log)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>تفاصيل</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {selectedLogForInspect && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedLogForInspect.level === 'CRITICAL'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : 'bg-teal-950 text-teal-400 border border-teal-800'
                  }`}
                >
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{selectedLogForInspect.title}</h4>
                  <span className="text-xs text-slate-400 font-mono">{selectedLogForInspect.id}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedLogForInspect(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 leading-relaxed">
                {selectedLogForInspect.description}
              </div>

              {/* Device Diagnostic Details Box */}
              {selectedLogForInspect.device && (
                <div className="p-4 bg-purple-950/20 border border-purple-800/40 rounded-xl space-y-2">
                  <div className="text-purple-300 font-bold flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" />
                    <span>معلومات الجهاز الطبي والتشخيص (Medical Device Telemetry)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono">
                    <div>
                      <span className="text-slate-500">الطراز: </span>
                      {selectedLogForInspect.device.model}
                    </div>
                    <div>
                      <span className="text-slate-500">الرقم التسلسلي: </span>
                      {selectedLogForInspect.device.serialNumber}
                    </div>
                    <div>
                      <span className="text-slate-500">البطارية: </span>
                      {selectedLogForInspect.device.batteryPercentage}%
                    </div>
                    <div>
                      <span className="text-slate-500">البرمجية الثابتة: </span>
                      {selectedLogForInspect.device.firmware}
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500">آخر قراءة سريرية: </span>
                      <strong className="text-teal-400">{selectedLogForInspect.device.latestReading}</strong>
                    </div>
                  </div>

                  {selectedLogForInspect.diagnosticAlert && (
                    <div className="mt-2 pt-2 border-t border-purple-800/30 space-y-1">
                      <div className="text-amber-400 font-bold flex items-center justify-between">
                        <span>نوع التنبيه: {selectedLogForInspect.diagnosticAlert.alertType}</span>
                        <span>الخطورة: {selectedLogForInspect.diagnosticAlert.severity}</span>
                      </div>
                      <div className="text-slate-300">
                        <span className="text-slate-400">القيمة الفعلية: </span>
                        <strong>{selectedLogForInspect.diagnosticAlert.actualValue}</strong> (الحد: {selectedLogForInspect.diagnosticAlert.threshold})
                      </div>
                      <div className="p-2 bg-slate-950 rounded-lg text-emerald-300">
                        <span className="font-bold">الإجراء الموصى به: </span>
                        {selectedLogForInspect.diagnosticAlert.recommendedAction}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actor & System Context */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedLogForInspect.actor && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-teal-400 font-bold">بيانات الفاعل والوصول</div>
                    <div className="text-slate-300">الاسم: {selectedLogForInspect.actor.name}</div>
                    <div className="text-slate-400">الدور: {selectedLogForInspect.actor.role}</div>
                    <div className="text-slate-400">البوابة: {selectedLogForInspect.actor.portal}</div>
                    {selectedLogForInspect.actor.ip && (
                      <div className="text-slate-500 font-mono">IP: {selectedLogForInspect.actor.ip}</div>
                    )}
                  </div>
                )}

                {selectedLogForInspect.systemContext && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-indigo-400 font-bold">سياق العقدة والنظام</div>
                    <div className="text-slate-300">العقدة: {selectedLogForInspect.systemContext.nodeName}</div>
                    <div className="text-slate-400">الإجراء: {selectedLogForInspect.systemContext.action}</div>
                    <div className="text-slate-400">السياسة: {selectedLogForInspect.systemContext.policyApplied}</div>
                    <div className="text-slate-500 font-mono">الاستجابة: {selectedLogForInspect.systemContext.status}</div>
                  </div>
                )}
              </div>

              {/* Cryptographic Provenance */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
                <div className="text-teal-500 font-bold">مسار التدقيق المشفر (Cryptographic Provenance):</div>
                <div className="break-all text-slate-300">{selectedLogForInspect.provenance}</div>
                <div className="text-slate-500 text-[10px]">Timestamp ISO: {selectedLogForInspect.timestamp}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              {selectedLogForInspect.diagnosticAlert && !selectedLogForInspect.diagnosticAlert.acknowledged ? (
                <button
                  onClick={() => handleAcknowledge(selectedLogForInspect.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد الإشعار وإغلاق التنبيه</span>
                </button>
              ) : (
                <span className="text-xs text-slate-500">تم الاطلاع على هذا الحدث</span>
              )}

              <button
                onClick={() => setSelectedLogForInspect(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
