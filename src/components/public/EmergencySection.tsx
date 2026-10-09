import React, { useState } from 'react';
import {
  Flame,
  Phone,
  MapPin,
  Ambulance,
  Building2,
  Users,
  AlertTriangle,
  Clock,
  Radio,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { auditService } from '../../services/auditService';

export const EmergencySection: React.FC = () => {
  const incidents = dataService.getEmergencyIncidents();
  const [activeIncident, setActiveIncident] = useState(incidents[0]);
  const [sosActive, setSosActive] = useState(false);
  const [sosSentMessage, setSosSentMessage] = useState<string | null>(null);

  const handleTriggerSos = () => {
    setSosActive(true);
    setSosSentMessage('🚨 تم إرسال نداء الطوارئ المشفر إلى مركز الإسعاف وأقرب مستشفى متصل بالشبكة!');

    auditService.record({
      actorId: 'usr-emergency-patient',
      actorRole: 'patient',
      actorName: 'نداء استغاثة طارئ',
      action: 'EMERGENCY_ACCESS',
      resourceType: 'PATIENT_RECORD',
      resourceId: activeIncident.id,
      purpose: 'LIFE_SAVING_EMERGENCY_DISPATCH',
      outcome: 'SUCCESS',
      policyApplied: 'POL-BREAK-GLASS-EMERGENCY-DISPATCH',
      provenance: 'Emergency Fast Trigger Button',
    });

    setTimeout(() => {
      setSosSentMessage('✅ تم استلام البلاغ من وحدة الإسعاف (AMB-UNIT-04) — زمن الوصول المتوقع: 4 دقائق.');
    }, 2000);
  };

  return (
    <section id="emergency" className="py-16 bg-slate-950 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-950 text-rose-300 border border-rose-800/80">
            <Flame className="w-4 h-4 text-rose-400 animate-bounce" />
            <span>مركز الطوارئ والاستجابة الفورية (24/7 Global Emergency Dispatch)</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            تنسيق فوري لإنقاذ الحياة بلمسة واحدة
          </h2>
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-200 text-xs font-bold max-w-2xl mx-auto flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>القاعدة السريرية: التنسيق الإسعافي (Emergency Coordination) يسهل الوصول الآني ولا يلغي الفحص الميداني من قِبل المسعف.</span>
          </div>
        </div>

        {/* Big SOS Trigger & Live Incident Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Big Red SOS Button Box */}
          <div className="bg-gradient-to-b from-rose-950/60 to-slate-900 border border-rose-900/60 rounded-2xl p-6 text-center flex flex-col items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-2">
              <span className="text-xs font-extrabold text-rose-400 uppercase tracking-wider block">
                بروتوكول فتح السجل الطارئ (Break-Glass Protocol)
              </span>
              <h3 className="text-lg font-bold text-white">
                نداء النجدة الطبية المباشر
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                يحدد موقعك الجغرافي ويرسل فصيلة الدم، الحساسيات الحرجة، وبيانات التواصل العاجلة إلى طواقم الإسعاف المعتمدة فورياً.
              </p>
            </div>

            <button
              onClick={handleTriggerSos}
              className={`w-36 h-36 rounded-full font-black text-lg text-white shadow-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
                sosActive
                  ? 'bg-rose-500 ring-8 ring-rose-400/30 animate-pulse'
                  : 'bg-rose-600 hover:bg-rose-500 hover:scale-105 shadow-rose-900/70'
              }`}
            >
              <Flame className="w-10 h-10 text-white" />
              <span>SOS طوارئ</span>
            </button>

            {sosSentMessage && (
              <div className="p-3 rounded-xl bg-slate-900 border border-rose-600/50 text-xs text-rose-200 leading-normal animate-fade-in">
                {sosSentMessage}
              </div>
            )}

            <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
              <Phone className="w-3.5 h-3.5 text-rose-400" />
              <span>خط الاتصال الساخن المباشر: 110 أو 911</span>
            </div>
          </div>

          {/* Active Emergency Dispatch Timeline (Live Feed) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center font-bold">
                    <Ambulance className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-white">
                      بلاغ الطوارئ النشط #{activeIncident.id}
                    </h4>
                    <span className="text-xs text-amber-400 font-semibold">
                      الحالة: {activeIncident.status} • الخطورة: {activeIncident.severity}
                    </span>
                  </div>
                </div>

                <div className="text-xs font-mono bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-teal-400">
                  ETA المتوقع: {activeIncident.etaMinutes} دقائق
                </div>
              </div>

              {/* Coordinates & Location */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span>الموقع الجغرافي المبلغ عنه (GPS Link):</span>
                </div>
                <p className="text-xs text-slate-200 font-medium">
                  {activeIncident.locationCoordinates.address}
                </p>
                <div className="text-[11px] text-slate-500 font-mono">
                  Coordinates: Lat {activeIncident.locationCoordinates.lat}, Lng {activeIncident.locationCoordinates.lng}
                </div>
              </div>

              {/* Triage Info & Hospital */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-300">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    <span>المستشفى المستقبل للطوارئ:</span>
                  </div>
                  <p className="text-white font-semibold">{activeIncident.assignedHospitalName}</p>
                  <span className="text-[10px] text-teal-400">تم حجز سرير إنعاش وتحضير الفريق الجراحي</span>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-300">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    <span>العلامات الحيوية عند البلاغ:</span>
                  </div>
                  <p className="text-white font-mono font-bold">{activeIncident.vitalsAtDispatch}</p>
                  <span className="text-[10px] text-slate-400">تم البث مباشرة عبر جهاز المريض اللاسلكي</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>سياسة Break-Glass مفعلة بموافقة مسبقة للطوارئ</span>
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> تم إشعار جهات الاتصال الموثوقة للأسرة
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
