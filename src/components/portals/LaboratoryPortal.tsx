import React from 'react';
import { FlaskConical, CheckCircle2, ShieldCheck, FileCheck, Search, Database } from 'lucide-react';
import { dataService } from '../../services/dataService';

export const LaboratoryPortal: React.FC = () => {
  const labResults = dataService.getLabResults('pat-main');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 font-black text-xl">
            <FlaskConical className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">مختبرات الأمل التشخيصية المركزية (ISO 15189)</h2>
              <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full font-bold">
                عقدة تشخيصية معتمدة
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              إدارة العينات الحيوية • التحاليل الجزيئية • تقارير FHIR R4 المعيارية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-purple-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <span>FHIR Server: https://fhir.lifex-health.org/r4</span>
        </div>
      </div>

      <div className="p-3.5 bg-purple-950/30 border border-purple-800/40 rounded-xl text-xs text-purple-200 flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
        <span>
          <strong>سيادة نتائج المختبر:</strong> النتيجة التشخيصية الأصلية تنتمي بشكل حصري لـ Laboratory Domain، ويتم تصدير نسخة مشفرة متوافقة مع FHIR Observation إلى إسقاط ملف المريض.
        </span>
      </div>

      {/* Lab Results Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-purple-400" />
            <span>النتائج المخبرية الصادرة والمعتمدة سريرياً</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {labResults.length} تحاليل مسجلة
          </span>
        </div>

        <div className="space-y-3">
          {labResults.map((lab) => (
            <div
              key={lab.id}
              className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{lab.testName}</span>
                  <span className="font-mono text-[10px] bg-slate-800 text-purple-300 px-2 py-0.5 rounded">
                    Code: {lab.testCode}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  نوع العينة: <strong className="text-slate-200">{lab.specimenType}</strong> • تاريخ السحب: {new Date(lab.collectedAt).toLocaleDateString('ar-EG')}
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {lab.hl7FhirIdentifier} • المالك: {lab.canonicalLabOwner}
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-1">
                <div className="text-lg font-black text-white font-mono">
                  {lab.value} <span className="text-xs font-normal text-slate-400">{lab.unit}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  المجال المرجعي: <span className="font-mono text-slate-300">{lab.referenceRange}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-900/60">
                  نتيجة طبيعية معتمدة
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
