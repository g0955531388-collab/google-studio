import React, { useState, useEffect } from 'react';
import {
  Activity,
  X,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  Check,
  CheckCircle2,
  Clock,
  Calendar,
  Pill,
  Info,
} from 'lucide-react';
import { SymptomSeverity, PatientSymptomLog, SmartAlert } from '../../types';
import { dataService } from '../../services/dataService';
import { aiService } from '../../services/aiService';

interface SymptomLogModalProps {
  patientId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (symptom: PatientSymptomLog) => void;
}

const COMMON_SYMPTOM_PRESETS = [
  {
    name: 'دوار ودوخة خفيفة عند الوقوف',
    nameEn: 'Mild postural dizziness upon standing',
    severity: 'MILD' as SymptomSeverity,
    defaultFactors: ['بعد تناول جرعة خافض الضغط الصباحية', 'عند النهوض من السرير'],
  },
  {
    name: 'سعال جاف مستمر وغير مصحوب ببلغم',
    nameEn: 'Persistent dry non-productive cough',
    severity: 'MODERATE' as SymptomSeverity,
    defaultFactors: ['مستمر على مدار اليوم', 'يزداد ليلاً'],
  },
  {
    name: 'ألم أو وهن عضلي غير مبرر',
    nameEn: 'Unexplained muscle ache or weakness',
    severity: 'MODERATE' as SymptomSeverity,
    defaultFactors: ['في عضلات الساقين والكتفين', 'بدون إجهاد رياضي عنيف'],
  },
  {
    name: 'غثيان واضطراب هضمي بعد الوجبة',
    nameEn: 'Post-meal nausea and GI discomfort',
    severity: 'MILD' as SymptomSeverity,
    defaultFactors: ['بعد تناول جرعة ميتفورمين', 'اضطراب معوي'],
  },
  {
    name: 'صداع خفيف في مؤخرة الرأس',
    nameEn: 'Tension headache in occipital region',
    severity: 'MILD' as SymptomSeverity,
    defaultFactors: ['إجهاد عمل', 'قلة نوم'],
  },
  {
    name: 'خفقان أو تسارع في ضربات القلب',
    nameEn: 'Palpitations or rapid heart rate',
    severity: 'MODERATE' as SymptomSeverity,
    defaultFactors: ['أثناء الراحة', 'بعد تناول القهوة'],
  },
];

export const SymptomLogModal: React.FC<SymptomLogModalProps> = ({
  patientId = 'pat-main',
  isOpen,
  onClose,
  onSaved,
}) => {
  const [symptomName, setSymptomName] = useState<string>('');
  const [symptomNameEn, setSymptomNameEn] = useState<string>('');
  const [severity, setSeverity] = useState<SymptomSeverity>('MILD');
  const [duration, setDuration] = useState<string>('مستمر منذ ساعات');
  const [notes, setNotes] = useState<string>('');
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [customFactorInput, setCustomFactorInput] = useState<string>('');

  // Proactive Real-time AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [previewAlert, setPreviewAlert] = useState<SmartAlert | null>(null);
  const [hasAcknowledgedAlert, setHasAcknowledgedAlert] = useState<boolean>(false);

  // Trigger real-time proactive AI sentinel check when symptom changes
  useEffect(() => {
    if (!symptomName || symptomName.trim().length < 3) {
      setPreviewAlert(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsAnalyzing(true);
      try {
        const res = await aiService.analyzeSmartAlerts({
          patientId,
          triggerType: 'SYMPTOM_LOG',
          symptom: {
            name: symptomName,
            severity,
            duration,
            notes,
            associatedFactors: selectedFactors,
          },
        });

        if (res.alerts && res.alerts.length > 0) {
          setPreviewAlert(res.alerts[0]);
        } else {
          setPreviewAlert(null);
        }
      } catch (err) {
        console.warn('Real-time symptom check warning:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [symptomName, severity, patientId]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof COMMON_SYMPTOM_PRESETS[0]) => {
    setSymptomName(preset.name);
    setSymptomNameEn(preset.nameEn);
    setSeverity(preset.severity);
    setSelectedFactors(preset.defaultFactors);
    setHasAcknowledgedAlert(false);
  };

  const handleAddFactor = () => {
    if (customFactorInput.trim() && !selectedFactors.includes(customFactorInput.trim())) {
      setSelectedFactors([...selectedFactors, customFactorInput.trim()]);
      setCustomFactorInput('');
    }
  };

  const handleRemoveFactor = (factor: string) => {
    setSelectedFactors(selectedFactors.filter((f) => f !== factor));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomName.trim()) return;

    const flaggedAlertIds: string[] = [];
    if (previewAlert) {
      flaggedAlertIds.push(previewAlert.id);
      dataService.addSmartAlert(previewAlert);
    }

    const newSymptom = dataService.logSymptom({
      patientId,
      symptomName: symptomName.trim(),
      symptomNameEn: symptomNameEn || undefined,
      severity,
      duration,
      notes: notes.trim() || undefined,
      associatedFactors: selectedFactors,
      flaggedAlertIds,
    });

    if (onSaved) {
      onSaved(newSymptom);
    }

    // Reset and close
    setSymptomName('');
    setSymptomNameEn('');
    setNotes('');
    setSelectedFactors([]);
    setPreviewAlert(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">تسجيل عَرَض صحي جديد (Log Symptom)</h3>
              <p className="text-[11px] text-slate-400">
                يقوم محرك الذكاء الاصطناعي بربط العَرَض استباقياً بأدويتك الحالية ومؤشراتك الحيوية.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset chips */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300">أعراض شائعة للاختيار السريع:</label>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_SYMPTOM_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer text-right ${
                  symptomName === preset.name
                    ? 'bg-teal-600 text-slate-950 border-teal-400 font-bold'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Symptom Name */}
          <div>
            <label className="block text-xs text-slate-300 mb-1 font-bold">
              اسم العَرَض أو الشكوى الصحية *
            </label>
            <input
              type="text"
              required
              value={symptomName}
              onChange={(e) => setSymptomName(e.target.value)}
              placeholder="مثال: سعال جاف مستمر، أو دوار عند النهوض، أو ألم عضلات..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Severity & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1 font-bold">مستوى الشدة *</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['MILD', 'MODERATE', 'SEVERE'] as SymptomSeverity[]).map((sev) => {
                  const isSelected = severity === sev;
                  const label = sev === 'MILD' ? 'خفيف' : sev === 'MODERATE' ? 'متوسط' : 'شديد';
                  const activeColor =
                    sev === 'MILD'
                      ? 'bg-teal-600 text-slate-950'
                      : sev === 'MODERATE'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-rose-600 text-white';

                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        isSelected
                          ? `${activeColor} border-transparent shadow`
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1 font-bold">مدة استمرار العَرَض</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="مثال: منذ ساعتين، أو مستمر لـ 3 أيام..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Associated Factors */}
          <div className="space-y-1.5">
            <label className="block text-xs text-slate-300 font-bold">عوامل أو ملابسات مرافقة:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customFactorInput}
                onChange={(e) => setCustomFactorInput(e.target.value)}
                placeholder="أضف عاملاً مرتبطاً (مثال: بعد أخذ الدواء بنصف ساعة)..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFactor();
                  }
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-teal-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddFactor}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition cursor-pointer text-xs"
              >
                إضافة
              </button>
            </div>

            {selectedFactors.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedFactors.map((factor, i) => (
                  <span
                    key={i}
                    className="bg-slate-950 border border-slate-800 text-teal-300 px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1.5 font-mono"
                  >
                    <span>{factor}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFactor(factor)}
                      className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-slate-300 mb-1 font-bold">ملاحظات سريرية إضافية</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="صف شعورك بدقة أو أي أدوية مسكنة تناولتها..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Real-time Proactive Sentinel AI Alert Warning Card */}
          {isAnalyzing && (
            <div className="p-3 rounded-xl bg-slate-950 border border-teal-500/30 text-teal-300 text-xs flex items-center gap-2 animate-pulse">
              <Sparkles className="w-4 h-4 text-teal-400 animate-spin" />
              <span>جاري الفحص الاستباقي للتداخلات والآثار الدوائية بالذكاء الاصطناعي...</span>
            </div>
          )}

          {previewAlert && !isAnalyzing && (
            <div
              className={`p-4 rounded-2xl border space-y-2.5 animate-fade-in ${
                previewAlert.severity === 'CRITICAL'
                  ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                  : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                    previewAlert.severity === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        previewAlert.severity === 'CRITICAL'
                          ? 'bg-rose-600 text-white'
                          : 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                      }`}
                    >
                      {previewAlert.severity === 'CRITICAL' ? 'تنبيه سريري حرج' : 'تنبيه أثر عكسي'}
                    </span>
                    <span className="text-[10px] bg-slate-950 text-teal-300 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-teal-400" />
                      Gemini Sentinel
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{previewAlert.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{previewAlert.summary}</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <div>
                  <strong className="text-teal-400">الآلية المكتشفة:</strong>{' '}
                  {previewAlert.clinicalMechanism}
                </div>
                <div>
                  <strong className="text-emerald-400">الإجراء الموصى به:</strong>{' '}
                  {previewAlert.recommendedAction}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px]">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={hasAcknowledgedAlert}
                    onChange={(e) => setHasAcknowledgedAlert(e.target.checked)}
                    className="accent-teal-500 rounded"
                  />
                  <span>قرأت التنبيه وأدرك ارتباطه بالأدوية المسجلة</span>
                </label>
              </div>
            </div>
          )}

          {/* Legal / Non-diagnostic Disclaimer */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-slate-400 leading-relaxed">
            <strong>تنبيه سريري:</strong> تسجيل الأعراض يهدف لتعزيز اليقظة الدوائية والمتابعة الذاتية، ولا يُغني عن استشارة الطبيب المعالج أو التوجه للطوارئ في الحالات الحرجة.
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer text-xs"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold transition cursor-pointer shadow-lg shadow-teal-950/40 text-xs flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>حفظ العَرَض وتثبيت التنبيهات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
