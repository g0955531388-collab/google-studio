import React, { useState } from 'react';
import {
  Pill,
  Sparkles,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Plus,
  X,
  RefreshCw,
  BookOpen,
  ShieldAlert,
  Info,
  Download,
  Printer,
  FileText,
  HelpCircle,
  Activity,
  ArrowRightLeft,
} from 'lucide-react';
import { aiService } from '../../services/aiService';
import { dataService } from '../../services/dataService';
import { DrugInteractionAnalysisResult, DrugDrugInteractionPair, InteractionSeverity } from '../../types';

export const DrugInteractionChecker: React.FC = () => {
  const [medications, setMedications] = useState<string[]>([
    'Lisinopril 10mg',
    'Potassium Chloride 20mEq',
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DrugInteractionAnalysisResult | null>(null);

  const commonSuggestions = [
    'Lisinopril',
    'Potassium Chloride',
    'Ibuprofen',
    'Atorvastatin',
    'Clarithromycin',
    'Warfarin',
    'Aspirin',
    'Clopidogrel',
    'Omeprazole',
    'Metformin XR',
    'Tramadol',
    'Fluoxetine',
    'Sildenafil',
    'Nitroglycerin',
    'Ciprofloxacin',
    'Calcium Carbonate',
  ];

  const presets = [
    {
      title: 'Lisinopril + Potassium (فرط بوتاسيوم الدم)',
      severity: 'CRITICAL',
      drugs: ['Lisinopril 10mg', 'Potassium Chloride 20mEq'],
    },
    {
      title: 'Atorvastatin + Clarithromycin (انحلال الربيدات)',
      severity: 'CRITICAL',
      drugs: ['Atorvastatin 20mg', 'Clarithromycin 500mg'],
    },
    {
      title: 'Warfarin + Aspirin + Ibuprofen (نزيف حاد)',
      severity: 'CRITICAL',
      drugs: ['Warfarin 5mg', 'Aspirin 81mg', 'Ibuprofen 400mg'],
    },
    {
      title: 'Clopidogrel + Omeprazole (تثبيط مفعول بلافيكس)',
      severity: 'MAJOR',
      drugs: ['Clopidogrel 75mg', 'Omeprazole 20mg'],
    },
    {
      title: 'Metformin + Lisinopril (توافق آمن - سكري وضغط)',
      severity: 'SAFE',
      drugs: ['Metformin XR 500mg', 'Lisinopril 10mg'],
    },
  ];

  const handleAddMedication = (nameToAdd?: string) => {
    const medName = (nameToAdd || inputValue).trim();
    if (!medName) return;

    if (!medications.some((m) => m.toLowerCase() === medName.toLowerCase())) {
      setMedications([...medications, medName]);
    }
    setInputValue('');
  };

  const handleRemoveMedication = (index: number) => {
    const updated = medications.filter((_, idx) => idx !== index);
    setMedications(updated);
  };

  const handleLoadPatientMedications = () => {
    const patientProjections = dataService.getPatientProjections('pat-main');
    const patientMeds = patientProjections.medications.map((m) => `${m.name} ${m.dosage}`.trim());
    const merged = Array.from(new Set([...medications, ...patientMeds]));
    setMedications(merged);
  };

  const handleAnalyze = async () => {
    if (medications.length < 2) {
      alert('يرجى إدخال دوائين على الأقل لإجراء فحص التقاطع والتداخلات الدوائية.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await aiService.analyzeDrugDrugInteractions(medications, {
        patientId: 'pat-main',
      });
      setResult(res);
    } catch (err) {
      console.error('DDI analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportJSON = () => {
    if (!result) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `Lifex_DDI_Analysis_${result.analysisId}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20 font-black">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  فاحص التداخلات الدوائية بالذكاء الاصطناعي (AI Drug-Drug Interaction Checker)
                </h3>
                <span className="text-[10px] bg-pink-950 text-pink-300 border border-pink-800 px-2 py-0.5 rounded-full font-bold">
                  Clinical Pharmacovigilance
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                إدخال أسماء أدوية متعددة وتقاطع مسارات الاستقلاب الكبدي (CYP450) وشلال التخثر لتحديد التداخلات الدوائية الحرجة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-teal-400 bg-teal-950/60 px-3 py-1.5 rounded-xl border border-teal-800/60">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>Gemini Clinical Pharmacovigilance</span>
          </div>
        </div>

        {/* Input & Medication Tags Section */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
          <label className="text-xs text-slate-300 font-bold block">
            قائمة الأدوية المراد فحصها (أدخل دوائين أو أكثر):
          </label>

          {/* Input Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Pill className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="اكتب اسم الدواء (مثال: Lisinopril, Potassium, Ibuprofen, Atorvastatin)..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMedication();
                  }
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
              />
            </div>

            <button
              type="button"
              onClick={() => handleAddMedication()}
              className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة</span>
            </button>

            <button
              type="button"
              onClick={handleLoadPatientMedications}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              title="استيراد وصفات المريض أحمد المنصوري (pat-main)"
            >
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              <span>استيراد أدوية المريض</span>
            </button>
          </div>

          {/* Active Medication Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {medications.length === 0 ? (
              <span className="text-xs text-slate-500 italic">لم تتم إضافة أي أدوية بعد. أضف دوائين للبدء.</span>
            ) : (
              medications.map((med, idx) => (
                <span
                  key={idx}
                  className="bg-slate-900 border border-slate-700 text-white text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 shadow-sm"
                >
                  <Pill className="w-3.5 h-3.5 text-pink-400" />
                  <span>{med}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMedication(idx)}
                    className="w-4 h-4 rounded-full hover:bg-slate-800 text-slate-400 hover:text-rose-400 flex items-center justify-center transition cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}

            {medications.length > 0 && (
              <button
                type="button"
                onClick={() => setMedications([])}
                className="text-[11px] text-slate-500 hover:text-rose-400 transition cursor-pointer underline mr-2"
              >
                مسح الكل
              </button>
            )}
          </div>

          {/* Quick Suggestions Chips */}
          <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-slate-500 font-bold">اقتراحات سريعة:</span>
            {commonSuggestions.slice(0, 10).map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddMedication(sug)}
                className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition cursor-pointer"
              >
                + {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Clinical Presets */}
        <div className="space-y-1.5">
          <span className="text-xs text-slate-400 font-bold block">سيناريوهات سريرية جاهزة للاختبار:</span>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setMedications(preset.drugs);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                  preset.severity === 'CRITICAL'
                    ? 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/50'
                    : preset.severity === 'MAJOR'
                    ? 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/50'
                    : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/50'
                }`}
              >
                <span>{preset.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Analyze Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
          <span className="text-xs text-slate-500">
            {medications.length} دواء محدد للفحص المتقاطع
          </span>

          <button
            type="button"
            disabled={isLoading || medications.length < 2}
            onClick={handleAnalyze}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-pink-600/25 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري فحص التداخلات ومطابقة المسارات الحيوية...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>فحص وتقاطع التداخلات الدوائية بالذكاء الاصطناعي</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results Display */}
      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in">
          {/* Top Result Banner */}
          <div
            className={`p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              result.overallRiskLevel === 'CRITICAL'
                ? 'bg-rose-950/30 border-rose-800 text-rose-200'
                : result.overallRiskLevel === 'MAJOR'
                ? 'bg-amber-950/30 border-amber-800 text-amber-200'
                : result.overallRiskLevel === 'MODERATE'
                ? 'bg-indigo-950/30 border-indigo-800 text-indigo-200'
                : 'bg-emerald-950/30 border-emerald-800 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${
                  result.overallRiskLevel === 'CRITICAL'
                    ? 'bg-rose-950 text-rose-400 border border-rose-700'
                    : result.overallRiskLevel === 'MAJOR'
                    ? 'bg-amber-950 text-amber-400 border border-amber-700'
                    : result.overallRiskLevel === 'MODERATE'
                    ? 'bg-indigo-950 text-indigo-400 border border-indigo-700'
                    : 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                }`}
              >
                {result.overallRiskLevel === 'CRITICAL' ? (
                  <AlertOctagon className="w-6 h-6" />
                ) : result.overallRiskLevel === 'MAJOR' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black">
                    {result.overallRiskLevel === 'CRITICAL'
                      ? 'تحذير تداخل دوائي حرج مهدد للحياة (Critical Risk)'
                      : result.overallRiskLevel === 'MAJOR'
                      ? 'تداخل دوائي رئيسي يستوجب التدخل (Major Risk)'
                      : result.overallRiskLevel === 'MODERATE'
                      ? 'تداخل دوائي متوسط (Moderate Precaution)'
                      : 'توافق دوائي آمن (Safe Compatibility)'}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider bg-slate-900 border border-current">
                    {result.overallRiskLevel}
                  </span>
                </div>
                <p className="text-xs mt-1 leading-relaxed opacity-90">{result.summary}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleExportJSON}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير التقرير</span>
              </button>
            </div>
          </div>

          {/* Interactions Breakdown Cards */}
          <div className="space-y-4">
            <h5 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-pink-400" />
              <span>تفاصيل التداخلات المرصودة ({result.interactions.length}):</span>
            </h5>

            {result.interactions.length === 0 ? (
              <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs text-white font-bold">لا توجد تفاعلات عكسية معروفة بين الأدوية المحددة</p>
                <p className="text-[11px] text-slate-400">
                  تم فحص المسارات الأنزيمية ومضادات التخثر ولم يتم رصد أي تعارض صيدلاني مباشر.
                </p>
              </div>
            ) : (
              result.interactions.map((pair, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border space-y-3 shadow-md ${
                    pair.severity === 'CRITICAL'
                      ? 'bg-rose-950/20 border-rose-800/60'
                      : pair.severity === 'MAJOR'
                      ? 'bg-amber-950/20 border-amber-800/60'
                      : 'bg-indigo-950/20 border-indigo-800/60'
                  }`}
                >
                  {/* Pair Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-white font-bold text-xs rounded-lg">
                        {pair.drugA}
                      </span>
                      <ArrowRightLeft className="w-4 h-4 text-pink-400" />
                      <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-white font-bold text-xs rounded-lg">
                        {pair.drugB}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold font-mono ${
                        pair.severity === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {pair.severity} INTERACTION
                    </span>
                  </div>

                  {/* Title & Mechanism */}
                  <div className="space-y-1">
                    <h6 className="text-xs sm:text-sm font-bold text-white">{pair.interactionTitle}</h6>
                    <div className="text-xs text-slate-300 leading-relaxed pt-1">
                      <strong className="text-slate-400">الآلية الصيدلانية: </strong>
                      {pair.mechanism}
                    </div>
                  </div>

                  {/* Clinical Impact Box */}
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                    <div className="text-rose-400 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>المخاطر السريرية المحتملة:</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{pair.clinicalImpact}</p>
                  </div>

                  {/* Pharmacist Management Recommendation */}
                  <div className="p-3 bg-teal-950/30 rounded-xl border border-teal-800/50 space-y-1 text-xs">
                    <div className="text-teal-300 font-bold flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>توصية الصيدلي الإكلينيكي والإجراء البديل:</span>
                    </div>
                    <p className="text-teal-100 leading-relaxed">{pair.managementRecommendation}</p>
                  </div>

                  {/* Citations */}
                  <div className="pt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span className="text-slate-500">المراجع السريرية:</span>
                    {pair.citations.map((cite, cIdx) => (
                      <span key={cIdx} className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {cite}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Special Precautions & Counseling */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
            <h6 className="font-bold text-white flex items-center gap-1.5">
              <Info className="w-4 h-4 text-teal-400" />
              <span>إرشادات التوعية الصيدلانية للمريض (Patient Counseling Points):</span>
            </h6>
            <ul className="space-y-1 text-slate-300 list-disc list-inside text-[11px] leading-relaxed">
              {result.specialClinicalPrecautions.map((prec, pIdx) => (
                <li key={pIdx}>{prec}</li>
              ))}
            </ul>
          </div>

          {/* Footnote & Mandatory Disclaimer */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-slate-500">
            <div>
              <span className="font-mono text-slate-400">Analysis ID: {result.analysisId}</span> • Model: {result.modelUsed}
            </div>
            <div className="text-right text-[10px] text-slate-500 italic max-w-md">
              {result.medicalDisclaimer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
