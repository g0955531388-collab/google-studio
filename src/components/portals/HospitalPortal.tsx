import React, { useState } from 'react';
import {
  Building2,
  Bed,
  Activity,
  ShieldCheck,
  Users,
  AlertCircle,
  Clock,
  HeartPulse,
  Scissors
} from 'lucide-react';

export const HospitalPortal: React.FC = () => {
  const departments = [
    { name: 'قسم العناية القلبية المركزة (CCU)', bedsTotal: 24, bedsOccupied: 19, staff: 12 },
    { name: 'وحدة الجراحة العامة والتنظيرية', bedsTotal: 40, bedsOccupied: 28, staff: 18 },
    { name: 'مركز الطوارئ والإصابات الحرجة (ER)', bedsTotal: 30, bedsOccupied: 22, staff: 25 },
    { name: 'جناح الرعاية الباطنية المتقدمة', bedsTotal: 50, bedsOccupied: 35, staff: 20 },
  ];

  const recentAdmissions = [
    { id: 'adm-101', patient: 'أحمد فهد المنصوري', dept: 'CCU', admissionDate: '2026-10-05', status: 'تحت الملاحظة المستمرة', doc: 'د. سارة المنصور' },
    { id: 'adm-102', patient: 'سالم الكردي', dept: 'الجراحة', admissionDate: '2026-10-07', status: 'مجدول لجراحة تنظيرية', doc: 'د. طارق العلي' },
    { id: 'adm-103', patient: 'فاطمة الزهراء', dept: 'الباطنية', admissionDate: '2026-10-08', status: 'استقرار المؤشرات الحيوية', doc: 'د. ياسمين الشام' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 font-black text-xl">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">مستشفى الحياة التخصصي العام (Hospital Node)</h2>
              <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full font-bold">
                عقدة مستشفى معتمدة ISO 9001
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              إدارة التنويم الداخلي • العمليات الجراحية • الطوارئ وتنسيق الأسِرّة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <span>الأسِرّة المتاحة: <strong className="text-emerald-400">40 / 144</strong></span>
        </div>
      </div>

      <div className="p-3.5 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-xs text-indigo-200 flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
        <span>
          <strong>مبدأ الحوكمة:</strong> المستشفى يملك سجلات التنويم والإجراءات الداخلية الخاصة به فقط، ولا يحق له حيازة أو تصدير التاريخ الطبي العام للمريض بدون موافقة صريحة.
        </span>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {departments.map((dept, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
            <h3 className="text-xs font-bold text-white">{dept.name}</h3>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>نسبة الإشغال:</span>
              <span className="font-bold text-indigo-400">
                {Math.round((dept.bedsOccupied / dept.bedsTotal) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all"
                style={{ width: `${(dept.bedsOccupied / dept.bedsTotal) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>مشغول: {dept.bedsOccupied} / {dept.bedsTotal}</span>
              <span>الكادر: {dept.staff} طبيب وممرض</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Admissions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Bed className="w-4 h-4 text-indigo-400" />
          <span>سجل حالات التنويم النشطة (Active Inpatient Records)</span>
        </h3>

        <div className="space-y-3">
          {recentAdmissions.map((adm) => (
            <div
              key={adm.id}
              className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <strong className="text-white text-sm">{adm.patient}</strong>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    {adm.dept}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  تاريخ الدخول: {adm.admissionDate} • الطبيب المسؤول: {adm.doc}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-teal-400 font-medium">{adm.status}</span>
                <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
                  سجل أصلي موثق
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
