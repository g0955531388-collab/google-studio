import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookmarkCheck,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Flame,
  Heart,
  HeartPulse,
  HelpCircle,
  History,
  Info,
  Layers,
  MessageSquare,
  Pill,
  Printer,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  Thermometer,
  Video,
  X,
  Zap,
} from 'lucide-react';
import {
  SymptomAssessmentInput,
  SymptomTriageResult,
  TriageUrgencyLevel,
  TriageCareSetting,
} from '../../types';
import { aiService } from '../../services/aiService';
import { dataService } from '../../services/dataService';

interface SymptomAssessmentModuleProps {
  patientId?: string;
  onNavigateToTelemedicine?: (triageContext?: {
    symptomSummary: string;
    urgencyLevel: string;
    advice: string;
  }) => void;
  onNavigateToSymptomsLog?: () => void;
  onClose?: () => void;
}

// Structured Clinical Body Regions
type BodyRegionKey =
  | 'CHEST_CARDIO'
  | 'RESPIRATORY'
  | 'NEURO_HEAD'
  | 'GI_ABDOMINAL'
  | 'MUSCULOSKELETAL'
  | 'SYSTEMIC_GENERAL';

interface SymptomPreset {
  id: string;
  name: string;
  nameEn: string;
  region: BodyRegionKey;
  severityDefault: 'MILD' | 'MODERATE' | 'SEVERE';
  painDefault: number;
  secondarySuggestions: string[];
  redFlagTriggers?: string[];
}

const SYMPTOM_PRESETS: SymptomPreset[] = [
  {
    id: 'chest-tightness',
    name: 'ألم أو ثقل ضاغط في منتصف الصدر',
    nameEn: 'Crushing or tight retrosternal chest pressure',
    region: 'CHEST_CARDIO',
    severityDefault: 'SEVERE',
    painDefault: 7,
    secondarySuggestions: ['تعرق بارد', 'ألم في الكتف أو الذراع الأيسر', 'ضيق تنفس مصاحب'],
    redFlagTriggers: ['ألم صدري ممتد إلى الذراع الأيسر أو الفك أو الرقبة'],
  },
  {
    id: 'palpitations',
    name: 'خفقان وتسارع مفاجئ في ضربات القلب',
    nameEn: 'Sudden rapid palpitations / irregular heartbeats',
    region: 'CHEST_CARDIO',
    severityDefault: 'MODERATE',
    painDefault: 5,
    secondarySuggestions: ['دوار خفيف', 'شعور بالقلق أو التوتر', 'ضيق تنفس عابر'],
  },
  {
    id: 'dry-cough-lisinopril',
    name: 'سعال جاف مستمر وغير مصحوب ببلغم',
    nameEn: 'Persistent non-productive dry tickly cough',
    region: 'RESPIRATORY',
    severityDefault: 'MODERATE',
    painDefault: 4,
    secondarySuggestions: ['دغدغة في الحلق', 'يزداد سوءاً عند الاستلقاء ليلاً', 'بحة خفيفة في الصوت'],
  },
  {
    id: 'exertional-dyspnea',
    name: 'ضيق تنفس تدريجي عند المشي أو صعود الدرج',
    nameEn: 'Exertional dyspnea / shortness of breath on exertion',
    region: 'RESPIRATORY',
    severityDefault: 'MODERATE',
    painDefault: 6,
    secondarySuggestions: ['تعب سريع', 'ثقل خفيف في الساقين', 'سرعة التنفس'],
  },
  {
    id: 'orthostatic-dizziness',
    name: 'دوار ودوخة عابرة عند الوقوف من الفراش',
    nameEn: 'Postural / orthostatic dizziness upon standing up',
    region: 'NEURO_HEAD',
    severityDefault: 'MILD',
    painDefault: 3,
    secondarySuggestions: ['تشوش خفيف في الرؤية لثوانٍ', 'عدم اتزان مؤقت', 'خفة في الرأس'],
  },
  {
    id: 'tension-headache',
    name: 'صداع ضاغط في الصدغين ومؤخرة الرأس',
    nameEn: 'Bilateral tension headache in temples or occiput',
    region: 'NEURO_HEAD',
    severityDefault: 'MODERATE',
    painDefault: 5,
    secondarySuggestions: ['شد في عضلات الرقبة', 'إجهاد عيني', 'قلة نوم'],
  },
  {
    id: 'statin-myalgia',
    name: 'ألم ووهن عضلي منتشر في الفخذين والكتفين',
    nameEn: 'Bilateral diffuse muscle ache / myalgia in thighs & shoulders',
    region: 'MUSCULOSKELETAL',
    severityDefault: 'MODERATE',
    painDefault: 5,
    secondarySuggestions: ['ثقل في الأطراف', 'صعوبة صعود الدرج', 'يبوسة صباحية'],
  },
  {
    id: 'metformin-nausea',
    name: 'غثيان واضطراب هضمي بعد تناول الجرعة',
    nameEn: 'Post-dose nausea, bloating & mild epigastric discomfort',
    region: 'GI_ABDOMINAL',
    severityDefault: 'MILD',
    painDefault: 3,
    secondarySuggestions: ['فقدان مؤقت للشهية', 'غازات معوية', 'طعم معدني في الفم'],
  },
  {
    id: 'fever-malaise',
    name: 'حمى خفيفة مع قشعريرة وإرهاق عام',
    nameEn: 'Low-grade fever with chills and general malaise',
    region: 'SYSTEMIC_GENERAL',
    severityDefault: 'MODERATE',
    painDefault: 4,
    secondarySuggestions: ['تعرق ليلي', 'فقدان الشهية', 'آلام في المفاصل'],
  },
];

const RED_FLAG_OPTIONS = [
  {
    id: 'rf-chest-radiating',
    label: 'ألم ضاغط أو عاصر في الصدر يمتد للذراع الأيسر أو الفك أو الرقبة',
    critical: true,
  },
  {
    id: 'rf-dyspnea-rest',
    label: 'ضيق حاد وشديد في التنفس أثناء الراحة التامة أو عند الاستلقاء',
    critical: true,
  },
  {
    id: 'rf-neuro-focal',
    label: 'ضعف أو خدر مفاجئ في جانب من الجسم أو الوجه أو صعوبة في النطق',
    critical: true,
  },
  {
    id: 'rf-syncope',
    label: 'نوبة إغماء كاملة، أو شحوب مفاجئ مع تعرق بارد غزير',
    critical: true,
  },
  {
    id: 'rf-thunderclap-headache',
    label: 'صداع مفاجئ وشديد للغاية كالرعد ("أسوأ صداع في حياتي")',
    critical: true,
  },
  {
    id: 'rf-intractable-vomiting',
    label: 'قيء مستمر مع عدم القدرة على استبقاء أي سوائل لأكثر من 12 ساعة',
    critical: false,
  },
  {
    id: 'rf-high-fever',
    label: 'حمى مرتفعة جداً تتجاوز 39 مئوية مع هبوط في النشاط أو ارتباك',
    critical: true,
  },
];

const SECONDARY_SYMPTOMS_POOL = [
  'تعرق بارد غزير',
  'غثيان خفيف',
  'شعور بالخفقان',
  'ألم خفيف بالكتف الأيسر',
  'دوار وعدم اتزان',
  'إرهاق وخمول بدني',
  'تشوش مؤقت بالرؤية',
  'شد في عضلات الرقبة',
  'غازات وانتفاخ بالبطن',
  'سعال جاف متقطع',
  'رجفة خفيفة في اليدين',
  'عطش متكرر وجفاف فم',
];

export const SymptomAssessmentModule: React.FC<SymptomAssessmentModuleProps> = ({
  patientId = 'pat-main',
  onNavigateToTelemedicine,
  onNavigateToSymptomsLog,
  onClose,
}) => {
  // Assessment input state
  const [selectedRegion, setSelectedRegion] = useState<BodyRegionKey | 'ALL'>('ALL');
  const [primarySymptom, setPrimarySymptom] = useState<string>('');
  const [primarySymptomEn, setPrimarySymptomEn] = useState<string>('');
  const [secondarySymptoms, setSecondarySymptoms] = useState<string[]>([]);
  const [severityLevel, setSeverityLevel] = useState<'MILD' | 'MODERATE' | 'SEVERE' | 'INCAPACITATING'>('MODERATE');
  const [painScale, setPainScale] = useState<number>(5);
  const [onset, setOnset] = useState<string>('اليوم (خلال الساعات الماضية)');
  const [progression, setProgression] = useState<'IMPROVING' | 'STABLE' | 'WORSENING' | 'FLUCTUATING'>('STABLE');
  const [notes, setNotes] = useState<string>('');
  const [selectedRedFlags, setSelectedRedFlags] = useState<string[]>([]);
  const [customSecondaryInput, setCustomSecondaryInput] = useState<string>('');

  // Patient live telemetry state
  const patientVitals = useMemo(() => {
    const raw = dataService.getPatientProjections(patientId);
    const latestBp = raw.vitals.find((v) => v.type === 'BLOOD_PRESSURE');
    const latestHr = raw.vitals.find((v) => v.type === 'HEART_RATE');
    const latestGl = raw.vitals.find((v) => v.type === 'GLUCOSE');
    const latestSpo2 = raw.vitals.find((v) => v.type === 'SPO2');

    return {
      bloodPressure: latestBp ? `${latestBp.value} ${latestBp.unit}` : '122/80 ملم زئبقي',
      heartRate: latestHr ? Number(latestHr.value) : 74,
      glucose: latestGl ? Number(latestGl.value) : 105,
      spO2: latestSpo2 ? Number(latestSpo2.value) : 98,
      temperature: 37.0,
      activeMeds: raw.medications.map((m) => `${m.name} (${m.dosage})`),
      conditions: raw.conditions.map((c) => c.name),
    };
  }, [patientId]);

  // Loading, Analysis & Result States
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStepText, setAnalysisStepText] = useState<string>('');
  const [triageResult, setTriageResult] = useState<SymptomTriageResult | null>(null);
  const [assessmentHistory, setAssessmentHistory] = useState<SymptomTriageResult[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'ASSESSMENT' | 'HISTORY'>('ASSESSMENT');
  const [hasSavedToLog, setHasSavedToLog] = useState<boolean>(false);
  const [showVitalsDetails, setShowVitalsDetails] = useState<boolean>(false);

  // Follow-up interaction state
  const [followUpQuestion, setFollowUpQuestion] = useState<string>('');
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState<boolean>(false);
  const [followUpConversation, setFollowUpConversation] = useState<Array<{ q: string; a: string }>>([]);

  // Filter presets based on selected region
  const filteredPresets = useMemo(() => {
    if (selectedRegion === 'ALL') return SYMPTOM_PRESETS;
    return SYMPTOM_PRESETS.filter((p) => p.region === selectedRegion);
  }, [selectedRegion]);

  // Handle selecting preset
  const handleSelectPreset = (preset: SymptomPreset) => {
    setPrimarySymptom(preset.name);
    setPrimarySymptomEn(preset.nameEn);
    setSeverityLevel(preset.severityDefault);
    setPainScale(preset.painDefault);
    setSecondarySymptoms(preset.secondarySuggestions.slice(0, 2));
    if (preset.redFlagTriggers && preset.redFlagTriggers.length > 0) {
      setSelectedRedFlags((prev) => Array.from(new Set([...prev, ...preset.redFlagTriggers!])));
    }
  };

  // Toggle secondary symptom
  const toggleSecondarySymptom = (sym: string) => {
    if (secondarySymptoms.includes(sym)) {
      setSecondarySymptoms(secondarySymptoms.filter((s) => s !== sym));
    } else {
      setSecondarySymptoms([...secondarySymptoms, sym]);
    }
  };

  // Add custom secondary symptom
  const handleAddCustomSecondary = () => {
    if (customSecondaryInput.trim() && !secondarySymptoms.includes(customSecondaryInput.trim())) {
      setSecondarySymptoms([...secondarySymptoms, customSecondaryInput.trim()]);
      setCustomSecondaryInput('');
    }
  };

  // Toggle Red Flag
  const toggleRedFlag = (label: string) => {
    if (selectedRedFlags.includes(label)) {
      setSelectedRedFlags(selectedRedFlags.filter((rf) => rf !== label));
    } else {
      setSelectedRedFlags([...selectedRedFlags, label]);
    }
  };

  // Perform AI Clinical Triage
  const handleRunTriage = async () => {
    if (!primarySymptom.trim()) return;

    setIsAnalyzing(true);
    setHasSavedToLog(false);
    setFollowUpConversation([]);

    // Multi-phase progress indicator
    setAnalysisStepText('1. فحص الرايات الحمراء وعلامات السلامة السريرية الحرجة...');
    await new Promise((r) => setTimeout(r, 400));

    setAnalysisStepText('2. ربط الأعراض بالقراءات الحيوية وجدول الأدوية الحالي للمريض...');
    await new Promise((r) => setTimeout(r, 400));

    setAnalysisStepText('3. تطبيق بروتوكولات الفرز السريري العالمي (ESI/MTS) عبر Gemini API...');

    try {
      const inputPayload: SymptomAssessmentInput = {
        patientId,
        primarySymptom,
        primarySymptomEn,
        secondarySymptoms,
        severityLevel,
        painScale,
        onset,
        progression,
        bodyRegion: selectedRegion,
        notes,
        redFlagsIdentified: selectedRedFlags,
        vitalContext: {
          bloodPressure: patientVitals.bloodPressure,
          heartRate: patientVitals.heartRate,
          glucose: patientVitals.glucose,
          spO2: patientVitals.spO2,
          temperature: patientVitals.temperature,
        },
        relevantMedications: patientVitals.activeMeds,
        relevantConditions: patientVitals.conditions,
      };

      const result = await aiService.assessSymptomTriage(inputPayload);
      setTriageResult(result);
      setAssessmentHistory((prev) => [result, ...prev]);
    } catch (err) {
      console.error('Failed to run clinical triage:', err);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStepText('');
    }
  };

  // Save as symptom in dataService
  const handleSaveToPatientLog = () => {
    if (!triageResult) return;

    const mappedSeverity: 'MILD' | 'MODERATE' | 'SEVERE' =
      severityLevel === 'INCAPACITATING' || severityLevel === 'SEVERE'
        ? 'SEVERE'
        : severityLevel === 'MODERATE'
        ? 'MODERATE'
        : 'MILD';

    dataService.logSymptom({
      patientId,
      symptomName: primarySymptom,
      symptomNameEn: primarySymptomEn,
      severity: mappedSeverity,
      duration: onset,
      notes: `[تقييم الفرز الذكي: ${triageResult.urgencyBadgeText}] ${notes || ''}`,
      associatedFactors: [...secondarySymptoms, ...selectedRedFlags],
      flaggedAlertIds: [triageResult.assessmentId],
    });

    setHasSavedToLog(true);
  };

  // Handle follow up inquiry
  const handleFollowUpAsk = async () => {
    if (!followUpQuestion.trim() || !triageResult) return;
    setIsSubmittingFollowUp(true);

    const q = followUpQuestion.trim();
    setFollowUpQuestion('');

    try {
      const response = await aiService.askClinicalContextChat({
        patientId,
        message: `استفسار متابعة حول الفرز السريري لعَرَض (${primarySymptom}): ${q}`,
      });

      setFollowUpConversation((prev) => [
        ...prev,
        {
          q,
          a: response.reply || 'تم تحليل استفسارك السريري؛ يُنصح بمناقشته مع طبيبك المعتمد.',
        },
      ]);
    } catch (err) {
      setFollowUpConversation((prev) => [
        ...prev,
        {
          q,
          a: 'تنبيه: تعذر إتمام الرد المباشر حالياً؛ التزم بتوجيهات الفرز الرئيسية واستشر طبيبك.',
        },
      ]);
    } finally {
      setIsSubmittingFollowUp(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setPrimarySymptom('');
    setPrimarySymptomEn('');
    setSecondarySymptoms([]);
    setSeverityLevel('MODERATE');
    setPainScale(5);
    setOnset('اليوم (خلال الساعات الماضية)');
    setProgression('STABLE');
    setNotes('');
    setSelectedRedFlags([]);
    setTriageResult(null);
    setHasSavedToLog(false);
    setFollowUpConversation([]);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border border-teal-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 flex items-center gap-1.5 shadow-md shadow-teal-950">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gemini 3.8 Flash Clinical Engine</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-950 text-teal-300 border border-teal-800/80">
                MTS & ESI Triage Standard
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-950 text-emerald-300 border border-emerald-800/80">
                Non-Diagnostic Safety Protocol
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <Stethoscope className="w-6 h-6 text-teal-400" />
              <span>تقييم الأعراض والفرز السريري الأولي (Interactive Symptom Triage)</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              وحدة تقييم سريري استرشادي ذكية تتيح إدخال الأعراض ورصد الرايات الحمراء (Red Flags)، مع ربط المؤشرات الحيوية والأدوية المزمنة لتقديم توجيه سريري فوري يحدد درجة الإلحاح والإجراء الموصى به.
            </p>
          </div>

          {/* Action toggle / stats */}
          <div className="flex items-center gap-2 self-start lg:self-center">
            <div className="bg-slate-950/80 border border-slate-800 p-1 rounded-2xl flex items-center">
              <button
                onClick={() => setActiveSubTab('ASSESSMENT')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeSubTab === 'ASSESSMENT'
                    ? 'bg-teal-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>إجراء التقييم</span>
              </button>
              <button
                onClick={() => setActiveSubTab('HISTORY')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeSubTab === 'HISTORY'
                    ? 'bg-teal-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>سجل الجلسة ({assessmentHistory.length})</span>
              </button>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Telemetry Snapshot Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-300">
            <span className="text-slate-400 font-bold flex items-center gap-1">
              <HeartPulse className="w-3.5 h-3.5 text-teal-400" />
              <span>المؤشرات الحيوية المقيدة:</span>
            </span>
            <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-teal-300">
              ضغط الدم: {patientVitals.bloodPressure}
            </span>
            <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-teal-300">
              النبض: {patientVitals.heartRate} ن/د
            </span>
            <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-teal-300">
              السكر: {patientVitals.glucose} ملغ/دسل
            </span>
            <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-emerald-300">
              الأكسجين SpO2: {patientVitals.spO2}%
            </span>
          </div>

          <button
            onClick={() => setShowVitalsDetails(!showVitalsDetails)}
            className="text-[11px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 cursor-pointer transition"
          >
            <span>الأدوية والأمراض المرتبطة ({patientVitals.activeMeds.length})</span>
            {showVitalsDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showVitalsDetails && (
          <div className="mt-3 p-4 bg-slate-950/90 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
            <div>
              <span className="text-slate-400 font-bold block mb-1">الأدوية الموصوفة حالياً:</span>
              <div className="flex flex-wrap gap-1.5">
                {patientVitals.activeMeds.map((med, idx) => (
                  <span key={idx} className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px] text-teal-300 font-mono">
                    {med}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-slate-400 font-bold block mb-1">الأمراض المزمنة الموثقة:</span>
              <div className="flex flex-wrap gap-1.5">
                {patientVitals.conditions.map((c, idx) => (
                  <span key={idx} className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main View: Assessment Form or History */}
      {activeSubTab === 'HISTORY' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-teal-400" />
              <span>سجل تقييمات الفرز السريري في هذه الجلسة</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">إجمالي التقييمات: {assessmentHistory.length}</span>
          </div>

          {assessmentHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              لم تقم بإجراء أي تقييم سريري بعد. استخدم تبويب "إجراء التقييم" للبدء.
            </div>
          ) : (
            <div className="space-y-4">
              {assessmentHistory.map((item) => (
                <div
                  key={item.assessmentId}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          item.urgencyLevel === 'EMERGENCY'
                            ? 'bg-rose-600 text-white animate-pulse'
                            : item.urgencyLevel === 'URGENT'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : item.urgencyLevel === 'SEMI_URGENT'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {item.urgencyBadgeText}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {new Date(item.timestamp).toLocaleTimeString('ar-EG')}
                      </span>
                    </div>

                    <span className="text-xs text-teal-400 font-mono">
                      المهلة: {item.estimatedActionTimeframe}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{item.chiefComplaintSummary}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {item.clinicalReasoning}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">
                      بيئة الرعاية: <strong className="text-white">{item.recommendedCareSetting}</strong>
                    </span>

                    <button
                      onClick={() => {
                        setTriageResult(item);
                        setActiveSubTab('ASSESSMENT');
                      }}
                      className="text-xs text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1"
                    >
                      <span>عرض تفاصيل التقرير كاملة</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Input Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
              {/* Step Header */}
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[11px] text-teal-400 font-mono font-bold tracking-wider uppercase block">
                  الخطوة الأولى: تحديد وتوصيف العَرَض
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  ما هو العَرَض الرئيسي الذي تشعر به حالياً؟
                </h3>
              </div>

              {/* Body System Filters */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  اختر الجهاز الحيوي أو المنطقة (Body Region):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: 'ALL', label: 'كافة الأجهزة' },
                    { key: 'CHEST_CARDIO', label: 'القلب والصدر' },
                    { key: 'RESPIRATORY', label: 'الجهاز التنفسي' },
                    { key: 'NEURO_HEAD', label: 'الرأس والأعصاب' },
                    { key: 'GI_ABDOMINAL', label: 'الجهاز الهضمي' },
                    { key: 'MUSCULOSKELETAL', label: 'العضلات والمفاصل' },
                    { key: 'SYSTEMIC_GENERAL', label: 'أعراض عامة وحرارة' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setSelectedRegion(tab.key as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        selectedRegion === tab.key
                          ? 'bg-teal-500 text-slate-950 font-black shadow-md'
                          : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Presets Carousel / Cards */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    أعراض سريرية شائعة (انقر للاختيار السريع):
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {filteredPresets.length} خيارات متاحة
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {filteredPresets.map((preset) => {
                    const isSelected = primarySymptom === preset.name;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`text-right p-3 rounded-2xl border transition flex flex-col justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-teal-950/60 border-teal-500 text-white shadow-md shadow-teal-950/40'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-white line-clamp-1">{preset.name}</span>
                            {isSelected && <Check className="w-4 h-4 text-teal-400 shrink-0" />}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block line-clamp-1">
                            {preset.nameEn}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
                          <span>الشدة المتوقعة: <strong>{preset.severityDefault}</strong></span>
                          <span>•</span>
                          <span>مقياس الألم: <strong>{preset.painDefault}/10</strong></span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Primary Symptom Free Text Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  أو اكتب وصف العَرَض الرئيسي بالتفصيل:
                </label>
                <input
                  type="text"
                  value={primarySymptom}
                  onChange={(e) => {
                    setPrimarySymptom(e.target.value);
                    if (!primarySymptomEn) setPrimarySymptomEn('');
                  }}
                  placeholder="مثال: ألم مستمر أسفل الصدر أو صداع نابض عند الوقوف..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
                />
              </div>

              {/* Secondary Symptoms Multi-Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  الأعراض المصاحبة أو الإضافية (Secondary Symptoms):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SECONDARY_SYMPTOMS_POOL.map((sec) => {
                    const isChecked = secondarySymptoms.includes(sec);
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => toggleSecondarySymptom(sec)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isChecked
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                      >
                        {isChecked ? <Check className="w-3 h-3 text-teal-400" /> : <span className="w-3 h-3 rounded-full border border-slate-700" />}
                        <span>{sec}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom secondary symptom addition */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={customSecondaryInput}
                    onChange={(e) => setCustomSecondaryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSecondary();
                      }
                    }}
                    placeholder="+ إضافة عَرَض مصاحب مخصص..."
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSecondary}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
                  >
                    إضافة
                  </button>
                </div>
              </div>

              {/* Severity & Pain Scale Slider */}
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    مستوى الشدة ومقياس الألم (Pain Scale 1 - 10):
                  </label>
                  <span
                    className={`text-xs font-black px-2.5 py-0.5 rounded-full font-mono ${
                      painScale >= 8
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : painScale >= 5
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-teal-950 text-teal-300 border border-teal-800'
                    }`}
                  >
                    {painScale} / 10 ({severityLevel})
                  </span>
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={painScale}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setPainScale(val);
                      if (val <= 3) setSeverityLevel('MILD');
                      else if (val <= 6) setSeverityLevel('MODERATE');
                      else if (val <= 8) setSeverityLevel('SEVERE');
                      else setSeverityLevel('INCAPACITATING');
                    }}
                    className="w-full accent-teal-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>1 (خفيف جداً)</span>
                    <span>3 (محتمل)</span>
                    <span>5 (متوسط)</span>
                    <span>7 (شديد)</span>
                    <span>10 (عاجز تماماً)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  {[
                    { key: 'MILD', label: 'خفيف (Mild)', desc: 'لا يعيق العمل' },
                    { key: 'MODERATE', label: 'متوسط (Moderate)', desc: 'يزعج جزئياً' },
                    { key: 'SEVERE', label: 'شديد (Severe)', desc: 'يعيق الأنشطة' },
                    { key: 'INCAPACITATING', label: 'عاجز (Extreme)', desc: 'ألم لا يُحتمل' },
                  ].map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => {
                        setSeverityLevel(s.key as any);
                        if (s.key === 'MILD') setPainScale(2);
                        else if (s.key === 'MODERATE') setPainScale(5);
                        else if (s.key === 'SEVERE') setPainScale(8);
                        else setPainScale(10);
                      }}
                      className={`p-2 rounded-xl border text-right transition ${
                        severityLevel === s.key
                          ? 'bg-teal-500/20 border-teal-500 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="block text-xs font-bold">{s.label}</span>
                      <span className="block text-[10px] text-slate-500">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Onset & Progression */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    تاريخ بدء العَرَض (Onset):
                  </label>
                  <select
                    value={onset}
                    onChange={(e) => setOnset(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="خلال الساعات الأخيرة (فجائي)">خلال الساعات الأخيرة (بدء فجائي)</option>
                    <option value="اليوم (منذ الصباح)">اليوم (منذ الصباح)</option>
                    <option value="منذ 2 إلى 3 أيام">منذ 2 إلى 3 أيام</option>
                    <option value="منذ أسبوع أو أكثر (مزمن)">منذ أسبوع أو أكثر (مزمن)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    مسار تطور العَرَض (Progression):
                  </label>
                  <select
                    value={progression}
                    onChange={(e) => setProgression(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="STABLE">مستقر دون تغيير (Stable)</option>
                    <option value="WORSENING">يتفاقم ويزداد شدة (Worsening)</option>
                    <option value="IMPROVING">يتحسن تدريجياً (Improving)</option>
                    <option value="FLUCTUATING">متردد ويأتي كنوبات (Fluctuating)</option>
                  </select>
                </div>
              </div>

              {/* RED FLAGS SCREENING CHECKLIST */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold text-rose-300">
                      فحص الرايات الحمراء وعلامات الخطر الحرجة (Red Flags Checklist)
                    </span>
                  </div>
                  {selectedRedFlags.length > 0 && (
                    <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                      تم رصد {selectedRedFlags.length} رايات خطر!
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  حدد أي من الأعراض الحرجة التالية إذا كانت تنطبق عليك حالياً:
                </p>

                <div className="space-y-2">
                  {RED_FLAG_OPTIONS.map((rf) => {
                    const isChecked = selectedRedFlags.includes(rf.label);
                    return (
                      <button
                        key={rf.id}
                        type="button"
                        onClick={() => toggleRedFlag(rf.label)}
                        className={`w-full text-right p-2.5 rounded-xl border text-xs transition flex items-start gap-2.5 cursor-pointer ${
                          isChecked
                            ? 'bg-rose-950/60 border-rose-500/80 text-rose-200 font-bold'
                            : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                            isChecked ? 'bg-rose-600 text-white' : 'border border-slate-700 bg-slate-900'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </span>
                        <span className="flex-1 leading-snug">{rf.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Patient Notes Textarea */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <label className="text-xs font-bold text-slate-300 block">
                  ملاحظات أو سياق إضافي تود توضيحه:
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="مثال: ظهر العَرَض بعد نصف ساعة من تناول جرعة الدواء الصباحية، أو شعرت به أثناء صعود الدرج..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleRunTriage}
                  disabled={isAnalyzing || !primarySymptom.trim()}
                  className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-teal-950/50 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>جارٍ التحليل السريري عبر Gemini API...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>بدء الفرز السريري الذكي للأعراض (Analyze Triage)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة ضبط</span>
                </button>
              </div>

              {/* Real-time scanning progress */}
              {isAnalyzing && (
                <div className="p-4 bg-teal-950/30 border border-teal-500/40 rounded-2xl space-y-2 animate-pulse">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>{analysisStepText}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full w-2/3 animate-pulse" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right / Results Column (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {!triageResult ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 text-center space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto">
                  <Stethoscope className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">بانتظار إدخال الأعراض</h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                    قم بتحديد العَرَض الرئيسي من القوائم السريعة، وأكمل التوصيف، ثم اضغط على زر "بدء الفرز السريري الذكي" لعرض تقرير التقييم ومستوى الإلحاح.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 text-right space-y-2 text-xs text-slate-400">
                  <strong className="text-slate-300 block">ما يقدمه التقييم السريري:</strong>
                  <ul className="space-y-1.5 list-disc list-inside text-[11px] text-slate-400">
                    <li>تحديد مستوى الإلحاح المعتمد (طوارئ ESI-1/2، ملحة ESI-3، شبه ملحة ESI-4، رعاية منزلية ESI-5).</li>
                    <li>احتمالات سريرية للمناقشة مع طبيبك (Differential Considerations).</li>
                    <li>ربط آمن مع أدويتك الحالية (مثل Lisinopril و Metformin و Atorvastatin).</li>
                    <li>إرشادات التدخل الفوري وأسئلة مقترحة لطبيبك.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in duration-300">
                {/* URGENCY STATUS BANNER */}
                <div
                  className={`p-5 rounded-2xl border space-y-3 ${
                    triageResult.urgencyLevel === 'EMERGENCY'
                      ? 'bg-rose-950/80 border-rose-500 text-rose-100 shadow-xl shadow-rose-950/50'
                      : triageResult.urgencyLevel === 'URGENT'
                      ? 'bg-amber-950/70 border-amber-500 text-amber-100 shadow-lg shadow-amber-950/40'
                      : triageResult.urgencyLevel === 'SEMI_URGENT'
                      ? 'bg-sky-950/70 border-sky-500 text-sky-100'
                      : 'bg-emerald-950/70 border-emerald-500 text-emerald-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {triageResult.urgencyLevel === 'EMERGENCY' ? (
                        <ShieldAlert className="w-6 h-6 text-rose-400 animate-bounce" />
                      ) : triageResult.urgencyLevel === 'URGENT' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      )}
                      <div>
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wider opacity-80">
                          {triageResult.urgencyBadgeTextEn}
                        </span>
                        <h4 className="text-base font-black leading-tight">
                          {triageResult.urgencyBadgeText}
                        </h4>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/20">
                      {triageResult.modelUsed}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 bg-black/20 p-2.5 rounded-xl border border-white/10">
                    <div>
                      <span className="opacity-75 block">بيئة الرعاية الأنسب:</span>
                      <strong className="font-bold text-white">
                        {triageResult.recommendedCareSetting === 'EMERGENCY_ROOM'
                          ? 'قسم الطوارئ بالمستشفى (ER)'
                          : triageResult.recommendedCareSetting === 'URGENT_CARE'
                          ? 'مركز الرعاية العاجلة (Urgent Care)'
                          : triageResult.recommendedCareSetting === 'TELEHEALTH'
                          ? 'استشارة مرئية عن بُعد (Telehealth)'
                          : 'رعاية ومتابعة منزلية (Home Care)'}
                      </strong>
                    </div>

                    <div>
                      <span className="opacity-75 block">المهلة الزمنية للإجراء:</span>
                      <strong className="font-bold text-white font-mono">
                        {triageResult.estimatedActionTimeframe}
                      </strong>
                    </div>
                  </div>

                  {triageResult.urgencyLevel === 'EMERGENCY' && (
                    <div className="p-3 bg-rose-600 text-white rounded-xl text-xs font-black flex items-center justify-between gap-2">
                      <span>اتصل بالإسعاف الوطني فوراً (911 أو 997) ولا تقد بنفسك!</span>
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                    </div>
                  )}
                </div>

                {/* Chief Complaint & Reasoning */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 block">ملخص الشكوى والتقييم:</span>
                  <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    <strong className="text-white block mb-1">{triageResult.chiefComplaintSummary}</strong>
                    <p>{triageResult.clinicalReasoning}</p>
                  </div>
                </div>

                {/* Differential Considerations */}
                {triageResult.differentialConsiderations && triageResult.differentialConsiderations.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-teal-400" />
                      <span>احتمالات سريرية للمناقشة مع طبيبك (Differential Considerations):</span>
                    </span>

                    <div className="space-y-2">
                      {triageResult.differentialConsiderations.map((diff, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <strong className="text-white text-xs">{diff.conditionName}</strong>
                            <span
                              className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${
                                diff.likelihood === 'HIGH'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : diff.likelihood === 'POSSIBLE'
                                  ? 'bg-teal-950 text-teal-300 border border-teal-800'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {diff.likelihood === 'HIGH' ? 'احتمال مرتفع' : diff.likelihood === 'POSSIBLE' ? 'احتمال وارد' : 'احتمال منخفض'}
                            </span>
                          </div>
                          {diff.conditionNameEn && (
                            <span className="text-[10px] text-slate-500 font-mono block">{diff.conditionNameEn}</span>
                          )}
                          <p className="text-[11px] text-slate-400 pt-0.5 leading-relaxed">{diff.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Medication Safety Impact */}
                {triageResult.medicationSafetyImpact && triageResult.medicationSafetyImpact.alertPresent && (
                  <div className="p-3.5 bg-amber-950/40 border border-amber-500/50 rounded-2xl space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-amber-300 font-bold">
                      <Pill className="w-4 h-4 text-amber-400" />
                      <span>ربط أمان دوائي مع علاجاتك المسجلة</span>
                    </div>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed">
                      {triageResult.medicationSafetyImpact.clinicalNote}
                    </p>
                  </div>
                )}

                {/* Immediate Action Steps */}
                {triageResult.immediateActionSteps && triageResult.immediateActionSteps.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-teal-400" />
                      <span>الإجراءات الفورية الآمنة الموصى بها:</span>
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                      {triageResult.immediateActionSteps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-teal-950 text-teal-300 border border-teal-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-snug">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Red Flag Warnings to Watch */}
                {triageResult.redFlagWarnings && triageResult.redFlagWarnings.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      <span>رايات الخطر التي تستوجب التوجه الفوري للطوارئ:</span>
                    </span>
                    <ul className="space-y-1 text-[11px] text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 list-disc list-inside">
                      {triageResult.redFlagWarnings.slice(0, 3).map((rf, idx) => (
                        <li key={idx} className="leading-relaxed">{rf}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons: Telehealth, Save to Log, Print */}
                <div className="pt-2 flex flex-col gap-2">
                  {onNavigateToTelemedicine && (
                    <button
                      type="button"
                      onClick={() =>
                        onNavigateToTelemedicine({
                          symptomSummary: triageResult.chiefComplaintSummary,
                          urgencyLevel: triageResult.urgencyBadgeText,
                          advice: triageResult.clinicalTriageAdvice,
                        })
                      }
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
                    >
                      <Video className="w-4 h-4" />
                      <span>حجز استشارة مرئية مباشرة (Telemedicine) بهذا التقرير</span>
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveToPatientLog}
                      disabled={hasSavedToLog}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        hasSavedToLog
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 cursor-default'
                          : 'bg-slate-950 hover:bg-slate-800 text-teal-300 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {hasSavedToLog ? (
                        <>
                          <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>تم الحفظ في سجل الأعراض</span>
                        </>
                      ) : (
                        <>
                          <Activity className="w-3.5 h-3.5" />
                          <span>حفظ في سجل الأعراض</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      title="طباعة التقرير"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>طباعة</span>
                    </button>
                  </div>
                </div>

                {/* Follow-up Question Input */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                    <span>اسأل الذكاء الاصطناعي سؤال متابعة حول هذا التقرير:</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={followUpQuestion}
                      onChange={(e) => setFollowUpQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleFollowUpAsk();
                        }
                      }}
                      placeholder="مثال: هل يمكنني الانتظار للغد أم يجب زيارة الطبيب اليوم؟"
                      className="flex-1 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleFollowUpAsk}
                      disabled={isSubmittingFollowUp || !followUpQuestion.trim()}
                      className="p-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 rounded-xl transition cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  {followUpConversation.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto pt-2">
                      {followUpConversation.map((conv, idx) => (
                        <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                          <strong className="text-teal-300 block">سؤالك: {conv.q}</strong>
                          <p className="text-slate-300 leading-relaxed">{conv.a}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Clinical Disclaimer */}
                <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-[10px] text-slate-500 leading-relaxed flex items-start gap-2">
                  <Info className="w-4 h-4 text-teal-500/70 shrink-0 mt-0.5" />
                  <span>{triageResult.disclaimer}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
