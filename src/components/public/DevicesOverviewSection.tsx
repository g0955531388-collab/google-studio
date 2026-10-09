import React, { useState } from 'react';
import { Radio, Cpu, BatteryCharging, Wifi, AlertTriangle, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { dataService } from '../../services/dataService';

export const DevicesOverviewSection: React.FC = () => {
  const { language } = useTranslation();
  const devices = dataService.getMedicalDevices();
  const [activeDeviceIndex, setActiveDeviceIndex] = useState(0);

  const selectedDevice = devices[activeDeviceIndex];

  return (
    <section id="devices" className="py-16 bg-slate-900/40 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>إنترنت الأجهزة الطبية الحيوية (IoMT Telemetry)</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            مراقبة حيوية مستمرة وآمنة عن بعد
          </h2>
          <div className="p-3 bg-cyan-950/40 border border-cyan-800/60 rounded-xl text-cyan-200 text-xs font-bold max-w-2xl mx-auto flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>القاعدة الصارمة: قراءة الجهاز الحيوية (Telemetry Reading) ≠ التشخيص السريري (Clinical Diagnosis).</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            ربط آمن للأجهزة المعتمدة طبياً (FDA / CE Mark) لبث النبض، الضغط، تشبع الأكسجين، وتخطيط القلب إلى منصة الطبيب المعالج دون وسطاء غير آمنين.
          </p>
        </div>

        {/* Live Device Monitor Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Device List Column */}
          <div className="space-y-3 lg:col-span-1">
            <h3 className="text-sm font-bold text-slate-300 px-1">الأجهزة المتصلة بالمريض:</h3>
            {devices.map((dev, idx) => (
              <div
                key={dev.id}
                onClick={() => setActiveDeviceIndex(idx)}
                className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  activeDeviceIndex === idx
                    ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-950 ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{dev.deviceModel}</span>
                    <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800">
                      {dev.deviceCategory}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    SN: {dev.serialNumber}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[11px] text-emerald-400 font-bold">متصل</span>
                </div>
              </div>
            ))}
          </div>

          {/* Active Device Deep Dive Telemetry Screen */}
          <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span>{selectedDevice.deviceModel}</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Firmware: {selectedDevice.firmwareVersion} • Serial: {selectedDevice.serialNumber}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/50">
                    <Wifi className="w-3.5 h-3.5" />
                    <span>Signal 99%</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-cyan-300 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/50">
                    <BatteryCharging className="w-3.5 h-3.5" />
                    <span>{selectedDevice.batteryPercentage}%</span>
                  </div>
                </div>
              </div>

              {/* Real-time reading preview panel */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 font-semibold block">آخر قياس حي مسجل (Latest Telemetry):</span>
                <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight flex items-center justify-between">
                  <span>{selectedDevice.latestReading}</span>
                  <span className="text-xs bg-slate-950 text-slate-300 font-normal px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
                    {new Date(selectedDevice.lastTelemetryAt).toLocaleTimeString('ar-EG')}
                  </span>
                </div>
              </div>

              {/* Protocol & Boundary Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 font-bold block">بروتوكول البث والتشفير:</span>
                  <p className="font-mono text-[11px] text-teal-300">
                    MQTT over TLS 1.3 + ChaCha20-Poly1305 Payload Seal
                  </p>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 font-bold block">سياسة التدفق السريري:</span>
                  <p className="text-[11px] text-slate-300">
                    البيانات تُرسل إلى مسار الطبيب المعالج فقط بناءً على رمز الموافقة الفعال.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800/90 rounded-xl text-[11px] text-slate-400 flex items-center justify-between">
              <span>تحديث البث التلقائي: كل 5 ثوانٍ</span>
              <span className="text-teal-400 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> الأجهزة معتمدة ومطابقة لـ ISO 13485
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
