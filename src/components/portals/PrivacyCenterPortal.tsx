import React, { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  FileText,
  Download,
  AlertOctagon,
  RefreshCw,
  Eye,
  CheckCircle2,
  Trash2,
  XCircle,
  FileCheck2
} from 'lucide-react';
import { consentService } from '../../services/consentService';
import { auditService } from '../../services/auditService';
import { authService } from '../../services/authService';
import { dataService } from '../../services/dataService';

export const PrivacyCenterPortal: React.FC = () => {
  const session = authService.getSession();
  const patientId = session?.id || 'pat-main';
  const [consents, setConsents] = useState(consentService.getConsentsForPatient(patientId));
  const [auditLogs, setAuditLogs] = useState(auditService.getLogs());
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  // New Consent Form State
  const [newGranteeName, setNewGranteeName] = useState('');
  const [newGranteeRole, setNewGranteeRole] = useState<'doctor' | 'hospital' | 'researcher'>('doctor');
  const [newScope, setNewScope] = useState<'FULL_PROJECTION' | 'VITALS_ONLY' | 'LABS_ONLY' | 'EMERGENCY_ONLY'>('FULL_PROJECTION');

  const handleRevokeConsent = (consentId: string) => {
    consentService.revokeConsent(consentId, patientId);
    setConsents([...consentService.getConsentsForPatient(patientId)]);
    setAuditLogs([...auditService.getLogs()]);
  };

  const handleGrantConsent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGranteeName.trim()) return;

    consentService.grantConsent(
      patientId,
      `grantee-${Date.now()}`,
      newGranteeName,
      newGranteeRole,
      newScope,
      'TREATMENT',
      6
    );

    setConsents([...consentService.getConsentsForPatient(patientId)]);
    setAuditLogs([...auditService.getLogs()]);
    setNewGranteeName('');
  };

  const handleExportData = () => {
    const res = dataService.exportPatientRecord(patientId, session?.role || 'patient');
    if (res.success) {
      setExportMessage('✅ تم تصدير نسخة مشفرة ومصرح بها من الإسقاط السريري بنجاح.');
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `Lifex_Data_Export_${patientId}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      setExportMessage(`❌ ${res.error}`);
    }
    setAuditLogs([...auditService.getLogs()]);
    setTimeout(() => setExportMessage(null), 5000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 font-black text-xl">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">مركز الخصوصية وحوكمة السيادة على البيانات</h2>
              <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded-full font-bold">
                GDPR & HIPAA Compliant
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              إدارة أذونات الوصول • إلغاء فوري للموافقات • سجل تدقيق حي غير قابل للتعديل
            </p>
          </div>
        </div>

        <button
          onClick={handleExportData}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-black text-xs shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>تصدير البيانات المصرح بها (JSON)</span>
        </button>
      </div>

      {exportMessage && (
        <div className="p-3.5 rounded-xl bg-slate-900 border border-teal-500/50 text-xs text-teal-200 font-bold animate-fade-in">
          {exportMessage}
        </div>
      )}

      {/* Grant New Consent Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>منح موافقة جديدة لطبيب أو مستشفى (Granular Consent Scope)</span>
        </h3>

        <form onSubmit={handleGrantConsent} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="sm:col-span-2">
            <label className="block text-slate-300 font-semibold mb-1">اسم الطبيب أو المستشفى *</label>
            <input
              type="text"
              required
              value={newGranteeName}
              onChange={(e) => setNewGranteeName(e.target.value)}
              placeholder="مثال: د. مازن الأحمد (استشاري سكري)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">الصفة / الدور</label>
            <select
              value={newGranteeRole}
              onChange={(e) => setNewGranteeRole(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
            >
              <option value="doctor">طبيب معالج</option>
              <option value="hospital">مستشفى / مركز صحي</option>
              <option value="researcher">باحث أكاديمي (مجهول الهوية)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">نطاق الوصول (Data Scope)</label>
            <select
              value={newScope}
              onChange={(e) => setNewScope(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
            >
              <option value="FULL_PROJECTION">إسقاط كامل (Full)</option>
              <option value="VITALS_ONLY">العلامات الحيوية فقط</option>
              <option value="LABS_ONLY">التحاليل فقط</option>
              <option value="EMERGENCY_ONLY">بيانات الطوارئ فقط</option>
            </select>
          </div>

          <div className="sm:col-span-4 flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
            >
              اعتماد ومنح الموافقة رسمياً
            </button>
          </div>
        </form>
      </div>

      {/* Active Consents List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-teal-400" />
          <span>الموافقات الفعالة والملغاة ({consents.length})</span>
        </h3>

        <div className="space-y-3">
          {consents.map((c) => (
            <div
              key={c.id}
              className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <strong className="text-white text-sm">{c.granteeName}</strong>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      c.status === 'ACTIVE'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  النطاق: <strong className="text-teal-300">{c.scope}</strong> • الغرض: <strong className="text-slate-200">{c.purpose}</strong> • الصلاحية حتى: {new Date(c.expiresAt).toLocaleDateString('ar-EG')}
                </div>
              </div>

              {c.status === 'ACTIVE' && (
                <button
                  onClick={() => handleRevokeConsent(c.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition active:scale-95 cursor-pointer"
                >
                  إلغاء فوري
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Live Immutable Audit Log Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-400" />
            <span>سجل التدقيق الحي غير القابل للتعديل (Immutable Audit Trail)</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {auditLogs.length} عمليات مسجلة
          </span>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-[11px] space-y-1"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-teal-400 font-bold">[{log.action}] on {log.resourceType}</span>
                <span>{new Date(log.timestamp).toLocaleTimeString('ar-EG')}</span>
              </div>
              <div className="text-slate-200">
                Actor: <strong className="text-white">{log.actorName}</strong> ({log.actorRole}) • Purpose: {log.purpose}
              </div>
              <div className="flex items-center justify-between text-slate-500 text-[10px]">
                <span>Policy: {log.policyApplied}</span>
                <span
                  className={
                    log.outcome === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400 font-bold'
                  }
                >
                  Outcome: {log.outcome}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
