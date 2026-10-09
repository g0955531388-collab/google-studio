import React, { useState } from 'react';
import { Pill, ShieldCheck, AlertOctagon, CheckCircle2, Box, Calendar, ArrowRightLeft, Layers } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { DrugInteractionChecker } from './DrugInteractionChecker';

export const PharmacyPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'interaction-checker' | 'dispense-ledger'>('interaction-checker');
  const dispenses = dataService.getPharmacyDispenses('pat-main');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Pharmacy Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20 font-black text-xl">
            <Pill className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">صيدلية الرعاية الذكية المركزية (Pharmacy Node)</h2>
              <span className="text-[10px] bg-pink-950 text-pink-300 border border-pink-800 px-2 py-0.5 rounded-full font-bold">
                ترخيص صيدلاني PH-9932
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              فحص التداخلات الدوائية بالذكاء الاصطناعي • صرف الوصفات المعتمدة • تتبع أرقام الدفعات وسجل الصرف
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3.5 py-2 rounded-xl border border-emerald-800/60">
          <CheckCircle2 className="w-4 h-4" />
          <span>نظام تتبع الدفعات نشط (Track & Trace)</span>
        </div>
      </div>

      {/* Strict Governance Clinical Rule */}
      <div className="p-3.5 bg-pink-950/30 border border-pink-800/40 rounded-xl text-xs text-pink-200 flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-pink-400 shrink-0" />
        <span>
          <strong>القاعدة الصيدلانية الصارمة:</strong> يتم الفصل بين:
          <span className="font-mono text-teal-300 mx-1">الوصفة الطبية (Prescription) ≠ الصرف الفعلي (Dispense) ≠ تناول المريض للدواء (Taken)</span>.
        </span>
      </div>

      {/* Pharmacy Portal Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 p-2 rounded-2xl border border-slate-800 shadow-lg">
        <button
          onClick={() => setActiveTab('interaction-checker')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'interaction-checker'
              ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white font-black shadow-lg shadow-pink-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>فاحص التداخلات الدوائية بالذكاء الاصطناعي (AI Drug Interaction Checker)</span>
        </button>

        <button
          onClick={() => setActiveTab('dispense-ledger')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'dispense-ledger'
              ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white font-black shadow-lg shadow-pink-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>سجل صرف الأدوية وتتبع الدفعات (Dispense Ledger - {dispenses.length})</span>
        </button>
      </div>

      {/* Tab 1: AI Drug Interaction Checker */}
      {activeTab === 'interaction-checker' && <DrugInteractionChecker />}

      {/* Tab 2: Dispense Records Ledger */}
      {activeTab === 'dispense-ledger' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Box className="w-4 h-4 text-pink-400" />
              <span>سجل صرف الأدوية وتتبع الدفعات (Dispense Ledger)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Blockchain Notarized</span>
          </div>

          <div className="space-y-3">
            {dispenses.map((dsp) => (
              <div
                key={dsp.id}
                className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{dsp.medicationName}</span>
                    <span className="text-[10px] font-mono bg-slate-800 text-teal-300 px-2 py-0.5 rounded">
                      Batch: {dsp.batchLotNumber}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    الوصفة: <span className="font-mono text-slate-300">{dsp.prescriptionId}</span> • تاريخ الصلاحية: <strong className="text-amber-400">{dsp.expiryDate}</strong>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {dsp.canonicalPharmacyOwner} • تاريخ الصرف: {new Date(dsp.dispensedAt).toLocaleDateString('ar-EG')}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="block text-xs font-bold text-white">الكمية: {dsp.quantityDispensed} قرص</span>
                    <span className="text-[10px] text-emerald-400">تم التحقق من عدم الاستدعاء</span>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-1 rounded-lg">
                    صرف معتمد
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
