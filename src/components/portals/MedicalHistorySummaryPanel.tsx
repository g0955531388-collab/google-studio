import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  User,
  Stethoscope,
  Building2,
  Calendar,
  Clock,
  Pill,
  Activity,
  HeartPulse,
  FlaskConical,
  FileCheck,
  Lock,
  Fingerprint,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Info,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { biometricService } from '../../services/biometricService';
import { generateMedicalHistorySummaryPDF } from '../../services/medicalHistoryPdfService';
import {
  ComprehensiveMedicalHistory,
  MedicalHistoryExportOptions,
  MedicalReviewPurpose,
} from '../../types';

interface MedicalHistorySummaryPanelProps {
  patientId: string;
  patientName?: string;
  onRequestBiometricVerify?: (onSuccess: () => void) => void;
}

export const MedicalHistorySummaryPanel: React.FC<MedicalHistorySummaryPanelProps> = ({
  patientId,
  patientName,
  onRequestBiometricVerify,
}) => {
  const [history, setHistory] = useState<ComprehensiveMedicalHistory>(() =>
    dataService.getComprehensiveMedicalHistory(patientId)
  );

  // Export Configuration Options
  const [externalPhysicianName, setExternalPhysicianName] = useState<string>('د. كمال الشريف (استشاري باطنية وقلب)');
  const [externalClinicOrHospital, setExternalClinicOrHospital] = useState<string>('مركز الشفاء الطبي التخصصي');
  const [reviewPurpose, setReviewPurpose] = useState<MedicalReviewPurpose>('GENERAL_REFERRAL');
  const [customClinicalNotes, setCustomClinicalNotes] = useState<string>(
    'إحالة سريرية للمراجعة الدورية وتقييم تدرج العلاج الدوائي للضغط والكوليسترول دون أعراض جانبية.'
  );

  const [includedSections, setIncludedSections] = useState({
    demographics: true,
    allergies: true,
    conditions: true,
    medications: true,
    vitals: true,
    labResults: true,
    encounters: true,
    timeline: true,
  });

  const [includeCertificationBlock, setIncludeCertificationBlock] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [lastExportMessage, setLastExportMessage] = useState<string | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'all' | 'allergies' | 'meds' | 'vitals' | 'labs' | 'encounters'>('all');

  // Refresh history on mount or when patient changes
  const refreshHistory = () => {
    setHistory(dataService.getComprehensiveMedicalHistory(patientId));
  };

  const handleToggleSection = (section: keyof typeof includedSections) => {
    setIncludedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSelectAllSections = (val: boolean) => {
    setIncludedSections({
      demographics: val,
      allergies: val,
      conditions: val,
      medications: val,
      vitals: val,
      labResults: val,
      encounters: val,
      timeline: val,
    });
  };

  const executePDFGeneration = () => {
    setIsGenerating(true);
    try {
      const options: MedicalHistoryExportOptions = {
        patientId,
        patientName: patientName || history.patientName,
        externalPhysicianName,
        externalClinicOrHospital,
        reviewPurpose,
        customClinicalNotes: customClinicalNotes.trim() ? customClinicalNotes : undefined,
        includedSections,
        includeDoctorCertificationBlock: includeCertificationBlock,
      };

      const result = generateMedicalHistorySummaryPDF(history, options);
      if (result.success) {
        setLastExportMessage(
          `✅ تم توليد وتصدير ملف ملخص التاريخ الطبي PDF بنجاح (${result.fileName} • ${result.pageCount} صفحات • كود التتبع: ${result.trackingHash})`
        );
      }
    } catch (err: any) {
      setLastExportMessage(`❌ حدث خطأ أثناء إنشاء ملف PDF: ${err.message || 'خطأ غير متوقع'}`);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setLastExportMessage(null), 8000);
    }
  };

  const handleTriggerExport = () => {
    if (!biometricService.isVerified() && onRequestBiometricVerify) {
      onRequestBiometricVerify(executePDFGeneration);
      return;
    }
    executePDFGeneration();
  };

  const selectedSectionsCount = useMemo(() => {
    return Object.values(includedSections).filter(Boolean).length;
  }, [includedSections]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-sky-800/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-bold flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-sky-400" />
                ملف مخصص للمراجعة السريرية الخارجية
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono">
                {history.documentTrackingHash}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold">
                متوافق مع معايير HIPAA & GDPR
              </span>
            </div>

            <h3 className="text-xl font-black text-white flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-sky-400" />
              تصدير ملخص التاريخ الطبي الشامل (Medical History PDF Export)
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              إنشاء وثيقة طبية رسمية موثقة بصيغة PDF تتضمن جميع التشخيصات والحساسيات والأدوية والتحاليل المخبرية والمؤشرات الحيوية للمريض، مصممة للمراجعة السريرية مع أطباء خارج المنظومة أو أثناء السفر وحالات الطوارئ.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleTriggerExport}
              disabled={isGenerating || selectedSectionsCount === 0}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-950/50 transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className={`w-4 h-4 ${isGenerating ? 'animate-bounce' : ''}`} />
              <span>{isGenerating ? 'جاري إنشاء وثيقة PDF...' : 'توليد وتصدير ملف PDF الآن'}</span>
            </button>

            <button
              onClick={refreshHistory}
              className="px-3.5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition cursor-pointer"
              title="تحديث البيانات السريرية اللحظية"
            >
              تحديث البيانات
            </button>
          </div>
        </div>
      </div>

      {lastExportMessage && (
        <div className="p-4 rounded-xl bg-slate-900 border border-sky-500/60 text-xs text-sky-200 font-semibold animate-fade-in flex items-center justify-between gap-3 shadow-lg shadow-sky-950/30">
          <span>{lastExportMessage}</span>
          <button
            onClick={() => setLastExportMessage(null)}
            className="text-slate-400 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Settings & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Export Customization Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Target Physician & Purpose Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-sky-300 flex items-center gap-2 uppercase tracking-wider">
              <Stethoscope className="w-4 h-4 text-sky-400" />
              بيانات الطبيب الخارجي والغرض من الإحالة
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  اسم الطبيب الخارجي / التخصص (Reviewing Physician)
                </label>
                <input
                  type="text"
                  value={externalPhysicianName}
                  onChange={(e) => setExternalPhysicianName(e.target.value)}
                  placeholder="مثال: د. كمال الشريف (استشاري باطنية)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  المركز الطبي أو المستشفى (Clinic / Facility)
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={externalClinicOrHospital}
                    onChange={(e) => setExternalClinicOrHospital(e.target.value)}
                    placeholder="مثال: مستشفى الملك فيصل التخصصي"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  الغرض من المراجعة السريرية (Review Purpose)
                </label>
                <select
                  value={reviewPurpose}
                  onChange={(e) => setReviewPurpose(e.target.value as MedicalReviewPurpose)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition cursor-pointer"
                >
                  <option value="GENERAL_REFERRAL">إحالة سريرية عامة (General Medical Referral)</option>
                  <option value="SECOND_OPINION">رأي طبي مستقل ثانٍ (Second Opinion)</option>
                  <option value="HOSPITAL_ADMISSION">تنويم بالمستشفى أو دخول طوارئ (Hospital Admission)</option>
                  <option value="TRAVEL_EMERGENCY">سفر خارجي وتأهب للطوارئ (Travel & Emergency)</option>
                  <option value="PRE_OPERATIVE">تقييم ما قبل العمليات الجراحية (Pre-Operative Assessment)</option>
                  <option value="CARDIOLOGY_REVIEW">استشارة تخصصية في القلب (Cardiology Consultation)</option>
                  <option value="SPECIALIST_CONSULTATION">استشارة تخصصية دقيقة (Specialist Consultation)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  ملاحظات أو توصيات إضافية للطبيب (Clinical Context Notes)
                </label>
                <textarea
                  rows={2}
                  value={customClinicalNotes}
                  onChange={(e) => setCustomClinicalNotes(e.target.value)}
                  placeholder="أدخل أي ملاحظات خاصة للأعراض أو الأدوية المستفسر عنها..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section Selection Toggles */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-sky-300 flex items-center gap-2 uppercase tracking-wider">
                <Layers className="w-4 h-4 text-sky-400" />
                الأقسام السريرية المضمنة في التقرير ({selectedSectionsCount}/8)
              </h4>
              <div className="flex items-center gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => handleSelectAllSections(true)}
                  className="text-sky-400 hover:text-sky-300 underline cursor-pointer"
                >
                  تحديد الكل
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={() => handleSelectAllSections(false)}
                  className="text-slate-400 hover:text-slate-300 underline cursor-pointer"
                >
                  إلغاء التحديد
                </button>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition">
                <span className="flex items-center gap-2 text-slate-200 font-medium">
                  <User className="w-3.5 h-3.5 text-sky-400" />
                  بيانات المريض والتواصل الطارئ (Demographics)
                </span>
                <input
                  type="checkbox"
                  checked={includedSections.demographics}
                  onChange={() => handleToggleSection('demographics')}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition">
                <span className="flex items-center gap-2 text-rose-300 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  الحساسيات والتحذيرات الدوائية الحرجة (Allergies)
                </span>
                <input
                  type="checkbox"
                  checked={includedSections.allergies}
                  onChange={() => handleToggleSection('allergies')}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition">
                <span className="flex items-center gap-2 text-slate-200 font-medium">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  الأمراض المزمنة وقائمة التشخيصات (ICD-10)
                </span>
                <input
                  type="checkbox"
                  checked={includedSections.conditions}
                  onChange={() => handleToggleSection('conditions')}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition">
                <span className="flex items-center gap-2 text-slate-200 font-medium">
                  <Pill className="w-3.5 h-3.5 text-teal-400" />
                  الأدوية الحالية وجداول الالتزام (Active Medications)
                </span>
                <input
                  type="checkbox"
                  checked={includedSections.medications}
                  onChange={() => handleToggleSection('medications')}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition">
                <span className="flex items-center gap-2 text-slate-200 font-medium">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                  خطوط الأساس للمؤشرات الحيوية (Vitals Baselines)
                </span>
                <input
                  type="checkbox"
                  checked={includedSections.vitals}
                  onChange={() => handleToggleSection('vitals')}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition">
                <span className="flex items-center gap-2 text-slate-200 font-medium">
                  <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
                  النتائج والفحوصات المخبرية المعتمدة (Lab Results)
                </span>
                <input
                  type="checkbox"
                  checked={includedSections.labResults}
                  onChange={() => handleToggleSection('labResults')}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition">
                <span className="flex items-center gap-2 text-slate-200 font-medium">
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                  اللقاءات السريرية وملاحظات الأطباء (Encounters)
                </span>
                <input
                  type="checkbox"
                  checked={includedSections.encounters}
                  onChange={() => handleToggleSection('encounters')}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition">
                <span className="flex items-center gap-2 text-slate-200 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  الجدول الزمني ومحطات الرعاية الصحية (Timeline)
                </span>
                <input
                  type="checkbox"
                  checked={includedSections.timeline}
                  onChange={() => handleToggleSection('timeline')}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
              </label>
            </div>

            {/* Certification Block Toggle */}
            <div className="pt-2 border-t border-slate-800">
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-sky-950/30 border border-sky-800/40 text-xs cursor-pointer">
                <div>
                  <span className="font-bold text-sky-300 block">
                    تضمين صندوق توقيع وختم الطبيب الخارجي
                  </span>
                  <span className="text-[10px] text-slate-400">
                    خانة رسمية مخصصة لتدوين ترخيص الطبيب وخاتم العيادة المستقبلة
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={includeCertificationBlock}
                  onChange={(e) => setIncludeCertificationBlock(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Quick PDF Action Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">جاهزية المستند:</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                جاهز للتصدير الفوري
              </span>
            </div>

            <button
              onClick={handleTriggerExport}
              disabled={isGenerating || selectedSectionsCount === 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 hover:opacity-90 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-950 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>توليد وتنزيل وثيقة PDF السريرية (PDF Download)</span>
            </button>
          </div>
        </div>

        {/* Right Side: Interactive High-Fidelity Clinical Document Preview (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-sky-400 tracking-wider uppercase block">
                  معاينة الوثيقة المعتمدة
                </span>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-400" />
                  سجل التاريخ الطبي السريري الموحد (Live EHR Sheet)
                </h4>
              </div>

              {/* Filter Tabs inside Preview */}
              <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                <button
                  onClick={() => setActivePreviewTab('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    activePreviewTab === 'all' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setActivePreviewTab('allergies')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    activePreviewTab === 'allergies' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  الحساسيات
                </button>
                <button
                  onClick={() => setActivePreviewTab('meds')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    activePreviewTab === 'meds' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  الأدوية
                </button>
                <button
                  onClick={() => setActivePreviewTab('labs')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    activePreviewTab === 'labs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  التحاليل
                </button>
                <button
                  onClick={() => setActivePreviewTab('encounters')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    activePreviewTab === 'encounters' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  اللقاءات
                </button>
              </div>
            </div>

            {/* Document Sheet Simulation */}
            <div className="mt-4 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-6 text-xs text-slate-300">
              {/* Document Header Simulated Letterhead */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-300 font-black text-sm">
                    LX
                  </div>
                  <div>
                    <h5 className="font-black text-white text-sm">LIFEX-AI MEDICAL HISTORY SUMMARY</h5>
                    <p className="text-[10px] text-slate-400">
                      Standard Sovereign Clinical Summary for External Physician Transfer
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right font-mono text-[10px] text-slate-400">
                  <span className="text-sky-400 font-bold block">{history.documentTrackingHash}</span>
                  <span>{new Date(history.generatedAt).toLocaleDateString('ar-SA')}</span>
                </div>
              </div>

              {/* Recipient Notice Box */}
              <div className="p-3 rounded-lg bg-sky-950/30 border border-sky-800/40 text-[11px] flex items-start gap-2.5">
                <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-sky-300 block">
                    موجّه إلى: {externalPhysicianName} • {externalClinicOrHospital}
                  </span>
                  <span className="text-slate-400 block text-[10px]">
                    الغرض: {reviewPurpose} | {customClinicalNotes}
                  </span>
                </div>
              </div>

              {/* Section 1: Demographics */}
              {(activePreviewTab === 'all' || activePreviewTab === 'allergies') && includedSections.demographics && (
                <div className="space-y-2">
                  <h6 className="font-bold text-sky-400 text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
                    <User className="w-3.5 h-3.5" />
                    الملف التعريفي والبيانات الديموغرافية
                  </h6>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">الاسم الرباعي</span>
                      <strong className="text-white">{history.patientName}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">العمر وفصيلة الدم</span>
                      <strong className="text-rose-400">{history.age} سنة • {history.bloodType}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">طبيب الرعاية الأولية</span>
                      <strong className="text-slate-200">{history.primaryCareDoctor?.slice(0, 16)}...</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">رقم الطوارئ (شقيق)</span>
                      <strong className="text-slate-200">{history.emergencyContact?.phone}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 2: Allergies (High Alert) */}
              {(activePreviewTab === 'all' || activePreviewTab === 'allergies') && includedSections.allergies && (
                <div className="space-y-2">
                  <h6 className="font-bold text-rose-400 text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    الحساسيات وموانع الاستعمال الدوائية الحرجة (High Alert)
                  </h6>
                  <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-800/50 space-y-2">
                    {history.allergies.map((alg) => (
                      <div key={alg.id} className="flex items-center justify-between text-xs pb-1.5 border-b border-rose-900/30 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          <strong className="text-rose-200">{alg.allergen}</strong>
                          <span className="text-[10px] text-slate-400">({alg.reaction})</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 font-bold text-[10px] border border-rose-700">
                          {alg.severity === 'SEVERE' ? 'تحذير شديد / منع مطلق' : alg.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 3: Chronic Conditions */}
              {activePreviewTab === 'all' && includedSections.conditions && (
                <div className="space-y-2">
                  <h6 className="font-bold text-amber-400 text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
                    <Activity className="w-3.5 h-3.5" />
                    الأمراض المزمنة المسجلة (ICD-10)
                  </h6>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {history.conditions.map((c) => (
                      <div key={c.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <strong className="text-white block text-[11px]">{c.name}</strong>
                          <span className="text-[10px] text-slate-400">تشخيص: {c.diagnosedYear}</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 text-[10px] font-mono font-bold border border-sky-800">
                          {c.icdCode}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 4: Current Medications */}
              {(activePreviewTab === 'all' || activePreviewTab === 'meds') && includedSections.medications && (
                <div className="space-y-2">
                  <h6 className="font-bold text-teal-400 text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
                    <Pill className="w-3.5 h-3.5" />
                    الخطة الدوائية الحالية ومعدلات الالتزام (Active Medications)
                  </h6>
                  <div className="space-y-2">
                    {history.medications.map((m) => (
                      <div key={m.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <strong className="text-teal-300 block text-xs">{m.name}</strong>
                          <span className="text-[10px] text-slate-400">
                            الجرعة: {m.dosage} • {m.frequency} • بوصفة: {m.prescribedByDoctor}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                            {m.status}
                          </span>
                          <span className="text-[10px] text-sky-300 font-bold bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
                            الالتزام {m.adherencePercentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 5: Diagnostic Lab Results */}
              {(activePreviewTab === 'all' || activePreviewTab === 'labs') && includedSections.labResults && (
                <div className="space-y-2">
                  <h6 className="font-bold text-indigo-400 text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
                    <FlaskConical className="w-3.5 h-3.5" />
                    أحدث نتائج الفحوصات المخبرية (Laboratory Results)
                  </h6>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                          <th className="pb-2 text-right">الفحص المخبري</th>
                          <th className="pb-2 text-center">النتيجة</th>
                          <th className="pb-2 text-center">المعدل الطبيعي</th>
                          <th className="pb-2 text-center">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {history.labResults.map((lab) => (
                          <tr key={lab.id} className="text-slate-300">
                            <td className="py-2 text-right font-medium text-white">{lab.testName}</td>
                            <td className="py-2 text-center font-mono font-bold text-sky-400">
                              {lab.value} {lab.unit}
                            </td>
                            <td className="py-2 text-center text-slate-400 text-[10px]">{lab.referenceRange}</td>
                            <td className="py-2 text-center">
                              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[9px] font-bold border border-emerald-800">
                                {lab.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Section 6: Encounters */}
              {(activePreviewTab === 'all' || activePreviewTab === 'encounters') && includedSections.encounters && (
                <div className="space-y-2">
                  <h6 className="font-bold text-emerald-400 text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
                    <Stethoscope className="w-3.5 h-3.5" />
                    استشارات ولقاءات الأطباء السابقة (Clinical Encounters)
                  </h6>
                  <div className="space-y-2">
                    {history.encounters.map((enc) => (
                      <div key={enc.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <strong className="text-white">{enc.doctorName}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">{enc.date}</span>
                        </div>
                        <p className="text-[11px] text-slate-300">{enc.reasonForVisit}</p>
                        <p className="text-[10px] text-emerald-300 font-medium bg-emerald-950/40 p-1.5 rounded border border-emerald-900/50">
                          الخطة العلاجية: {enc.assessmentPlan}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Doctor Review Sign-off Block Preview */}
              {includeCertificationBlock && (
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-200">
                      اعتماد ومصادقة الطبيب الخارجي المراجع (Physician Sign-off & Stamp)
                    </span>
                    <span className="text-[10px] text-slate-500">وثيقة إحالة رسمية</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-2 text-[10px] text-slate-400">
                      <div>اسم الطبيب المراجع: ___________________________</div>
                      <div>رقم الترخيص المهني: ___________________________</div>
                      <div>تاريخ المراجعة السريرية: ______________________</div>
                    </div>
                    <div className="border border-dashed border-slate-700 rounded-xl p-3 flex flex-col items-center justify-center text-center text-[10px] text-slate-500">
                      <span>مكان الختم الرسمي للمستشفى / العيادة الخارجية</span>
                      <span className="text-[9px] text-slate-600 mt-1">[ Official Medical Stamp ]</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Notice */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span>وثيقة إسقاط سريري مجمعة وفق بروتوكول السيادة الرقمية Lifex-AI</span>
                <span>الصفحة 1 من 3 (معاينة أولية)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
