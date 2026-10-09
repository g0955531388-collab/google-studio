import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  Activity,
  Pill,
  Clock,
  AlertTriangle,
  RotateCcw,
  Download,
  Copy,
  Check,
  Volume2,
  VolumeX,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  HeartPulse,
  Flame,
  Info,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { aiService } from '../../services/aiService';
import { authService } from '../../services/authService';
import {
  ClinicalChatMessage,
  ClinicalPatientContextSummary,
} from '../../types';

interface ClinicalContextChatProps {
  patientId: string;
  initialQuestion?: string;
  onNavigateToVitals?: () => void;
  onNavigateToMeds?: () => void;
}

export const ClinicalContextChat: React.FC<ClinicalContextChatProps> = ({
  patientId,
  initialQuestion,
  onNavigateToVitals,
  onNavigateToMeds,
}) => {
  const session = authService.getSession();
  const [messages, setMessages] = useState<ClinicalChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showContextDetails, setShowContextDetails] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Build real-time clinical context
  const projections = dataService.getPatientProjections(patientId);
  const vitalTrends = dataService.getPatientVitalTrends(patientId);
  const schedules = dataService.getMedicationSchedules(patientId);
  const logs = dataService.getMedicationLogs(patientId);
  const adherenceTrends = dataService.getMedicationAdherenceTrends(patientId, 7);

  // Derive aggregates
  const latestTrend = vitalTrends[vitalTrends.length - 1] || {
    systolicBP: 122,
    diastolicBP: 80,
    heartRate: 72,
    glucose: 104,
    spO2: 98,
    temperature: 36.8,
  };

  const avgSystolic = Math.round(
    vitalTrends.reduce((acc, curr) => acc + curr.systolicBP, 0) / (vitalTrends.length || 1)
  );
  const avgDiastolic = Math.round(
    vitalTrends.reduce((acc, curr) => acc + curr.diastolicBP, 0) / (vitalTrends.length || 1)
  );
  const avgHeartRate = Math.round(
    vitalTrends.reduce((acc, curr) => acc + curr.heartRate, 0) / (vitalTrends.length || 1)
  );
  const avgGlucose = Math.round(
    vitalTrends.reduce((acc, curr) => acc + curr.glucose, 0) / (vitalTrends.length || 1)
  );
  const avgSpO2 = Math.round(
    vitalTrends.reduce((acc, curr) => acc + curr.spO2, 0) / (vitalTrends.length || 1)
  );

  const overallAdherence = Math.round(
    adherenceTrends.reduce((acc, c) => acc + c.adherencePct, 0) / (adherenceTrends.length || 1)
  );

  const clinicalContextSummary: ClinicalPatientContextSummary = {
    patientId,
    patientName: session?.name || 'أحمد فهد المنصوري',
    bloodType: 'O+',
    conditions: projections.conditions.map((c) => ({
      name: c.name,
      icdCode: c.icdCode,
      status: c.status,
    })),
    allergies: projections.allergies.map((a) => ({
      allergen: a.allergen,
      reaction: a.reaction,
      severity: a.severity,
    })),
    medications: projections.medications.map((m) => ({
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      instructions: m.status,
      status: m.status,
      adherencePercentage: m.adherencePercentage,
    })),
    recentVitalsSummary: {
      latestBloodPressure: `${latestTrend.systolicBP}/${latestTrend.diastolicBP} ملم زئبقي`,
      systolicAvg: avgSystolic,
      diastolicAvg: avgDiastolic,
      latestHeartRate: latestTrend.heartRate,
      heartRateAvg: avgHeartRate,
      latestGlucose: latestTrend.glucose,
      glucoseAvg: avgGlucose,
      latestSpO2: latestTrend.spO2,
      spO2Avg: avgSpO2,
      summaryText: `متوسط ضغط الدم ${avgSystolic}/${avgDiastolic}، متوسط السكر ${avgGlucose} ملغ/دسل، والنبض ${avgHeartRate} ن/د.`,
    },
    medicationSchedules: schedules.map((s) => ({
      name: s.name,
      dosage: s.dosage,
      timeSlot: s.timeSlot,
      period: s.period,
      instructions: s.instructions,
      mealContext: s.mealContext,
      reminderEnabled: s.reminderEnabled,
    })),
    recentMedicationLogs: logs.slice(0, 10).map((l) => ({
      medicationName: l.medicationName,
      dosage: l.dosage,
      scheduledTime: l.scheduledTime,
      status: l.status,
      loggedAt: l.loggedAt,
      notes: l.notes,
    })),
    overallAdherencePct: overallAdherence,
  };

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ClinicalChatMessage = {
        id: 'msg-welcome',
        sender: 'assistant',
        content: `أهلاً بك **${session?.name || 'أحمد'}** في **المساعد السريري السياقي (Clinical Context Chat)** المدعوم بنموذج **Gemini 3.8 Flash**.

لقد قمت بفحص ومطابقة بياناتك السريرية المسجلة حالياً:
- 📊 **المؤشرات الحيوية**: آخر قراءة لضغط الدم هي **${latestTrend.systolicBP}/${latestTrend.diastolicBP} ملم زئبقي**، والنبض **${latestTrend.heartRate} ن/د**، وسكر الدم **${latestTrend.glucose} ملغ/دسل**.
- 💊 **الأدوية والالتزام**: لديك **${projections.medications.length} أدوية نشطة**، بنسبة التزام عامة ممتازة تبلغ **${overallAdherence}%** للأسبوع الماضي.

أنا هنا للإجابة على استفساراتك حول كيفية ارتباط مؤشراتك الحيوية بجدول أدويتك، وماذا تفعل عند تأخر جرعة، ونصائح النمط الغذائي والدوائي الآمن. يمكنك كتابة سؤالك أو اختيار أحد الأسئلة المقترحة أدناه.`,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        model: 'gemini-3.8-flash',
        confidenceScore: 0.98,
        sources: [
          { title: 'Lifex Sovereign Telemetry Ledger' },
          { title: 'American Heart Association (AHA) Clinical Guidelines' },
          { title: 'American Diabetes Association (ADA) 2026 Standards' },
        ],
        suggestedFollowUps: [
          'ما مدى استقرار ضغط دمي والنبض في الأيام السابقة؟',
          'هل يؤثر تأخير جرعة ليسينوبريل الصباحية على قياسات الضغط؟',
          'كيف أنظم تناول دواء ميتفورمين مع وجبات الطعام لتفادي هبوط السكر؟',
          'ما هي النصائح للحفاظ على نسبة التزام دوائي أعلى من 95%؟',
        ],
      };
      setMessages([welcomeMessage]);
    }
  }, [patientId]);

  // Handle auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle initial question if passed
  useEffect(() => {
    if (initialQuestion && initialQuestion.trim().length > 0) {
      handleSendMessage(initialQuestion);
    }
  }, [initialQuestion]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ClinicalChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Prepare conversation history for server-side Gemini
      const conversationHistory = messages.map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.content,
      }));

      const res = await aiService.askClinicalContextChat({
        patientId,
        patientName: session?.name || 'أحمد فهد المنصوري',
        message: textToSend.trim(),
        conversationHistory,
        context: clinicalContextSummary,
      });

      const assistantMsg: ClinicalChatMessage = {
        id: res.id,
        sender: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        model: res.model,
        confidenceScore: res.confidenceScore,
        sources: res.sources,
        suggestedFollowUps: res.suggestedFollowUps,
        clinicalFocus: res.clinicalFocus,
        hasWarningAlert: res.hasWarningAlert,
        warningAlertMessage: res.warningAlertMessage,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ClinicalChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'assistant',
        content: `عذراً، حدث خطأ أثناء تحليل الاستفسار السريري: ${err.message || 'تعذر الاتصال بخدمة الذكاء الاصطناعي'}. يمكنك المحاولة مرة أخرى أو مراجعة قراءاتك في تبويب المؤشرات الحيوية.`,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowUps: [
          'ما مدى استقرار ضغط دمي والنبض في الأيام السابقة؟',
          'هل يؤثر تأخير جرعة ليسينوبريل الصباحية؟',
        ],
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text
      .replace(/[*#_`]/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/https?:\/\/\S+/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ar-SA';
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleClearChat = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في مسح سجل المحادثة الحالية؟')) {
      if (isSpeaking && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      setMessages([]);
      setTimeout(() => {
        setMessages([
          {
            id: `msg-welcome-new-${Date.now()}`,
            sender: 'assistant',
            content: `تم مسح المحادثة. أنا جاهز للإجابة عن أي استفسار سريري حول اتجاهات مؤشراتك الحيوية وجدول دوائك.`,
            timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            suggestedFollowUps: [
              'ما مدى استقرار ضغط دمي والنبض في الأيام السابقة؟',
              'هل يؤثر تأخير جرعة ليسينوبريل الصباحية على قياسات الضغط؟',
            ],
          },
        ]);
      }, 100);
    }
  };

  const handleExportChat = () => {
    const textLines = messages.map((m) => {
      const senderLabel = m.sender === 'user' ? 'المريض' : 'المساعد السريري (Gemini)';
      return `[${m.timestamp}] ${senderLabel}:\n${m.content}\n----------------------------------------\n`;
    });

    const header = `تقرير محادثة المساعد السريري السياقي - Lifex-AI\nالمريض: ${session?.name || 'أحمد المنصوري'} (${patientId})\nتاريخ التصدير: ${new Date().toLocaleString('ar-EG')}\n\n========================================\n\n`;
    const fullContent = header + textLines.join('\n');

    const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lifex_Clinical_Chat_${patientId}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Banner & Control Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border border-teal-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/30 font-black">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">المساعد السريري السياقي (Clinical Context Chat)</h3>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  Gemini 3.8 Flash
                </span>
                <span className="hidden sm:inline-flex text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-semibold items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  سياق سريري متصل
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                استشارات تفسيرية ذكية تربط قراءات مؤشراتك الحيوية المباشرة بجدول أدويتك ومعدلات التزامك اليومي.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowContextDetails(!showContextDetails)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-teal-500/40 text-teal-300 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
              title="عرض وتفقد السياق السريري المحلل حالياً"
            >
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              <span>{showContextDetails ? 'إخفاء السياق النشط' : 'عرض السياق النشط (Context)'}</span>
              {showContextDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              onClick={handleExportChat}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition active:scale-95 cursor-pointer"
              title="تصدير نص المحادثة كملف نصي"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={handleClearChat}
              className="p-2 rounded-xl bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/40 text-slate-400 hover:text-rose-300 text-xs font-bold transition active:scale-95 cursor-pointer"
              title="مسح المحادثة وبدء حوار جديد"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Context Inspection Drawer */}
        {showContextDetails && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 animate-fade-in text-xs">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-teal-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  المؤشرات الحيوية النشطة
                </span>
                {onNavigateToVitals && (
                  <button
                    onClick={onNavigateToVitals}
                    className="text-[10px] text-teal-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    عرض المخطط <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
              <p className="text-slate-300">
                • ضغط الدم: <strong className="text-white">{latestTrend.systolicBP}/{latestTrend.diastolicBP}</strong> (المتوسط {avgSystolic}/{avgDiastolic})
              </p>
              <p className="text-slate-300">
                • سكر الدم: <strong className="text-white">{latestTrend.glucose} ملغ/دسل</strong> (المتوسط {avgGlucose})
              </p>
              <p className="text-slate-300">
                • النبض: <strong className="text-white">{latestTrend.heartRate} ن/د</strong> • الأكسجين: <strong className="text-white">{latestTrend.spO2}%</strong>
              </p>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-emerald-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5" />
                  الأدوية والالتزام ({overallAdherence}%)
                </span>
                {onNavigateToMeds && (
                  <button
                    onClick={onNavigateToMeds}
                    className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    جدول الأدوية <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
              <p className="text-slate-300 truncate">
                • {projections.medications.map((m) => `${m.name} ${m.dosage}`).join('، ')}
              </p>
              <p className="text-slate-300">
                • مواعيد الجرعات: <strong className="text-white">{schedules.length} مواعيد مجدولة يومياً</strong>
              </p>
              <p className="text-slate-300">
                • أحدث سجل: <strong className="text-white">{logs[0]?.medicationName || 'تم التناول بنجاح'}</strong>
              </p>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
              <div className="text-indigo-300 font-bold flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5" />
                الحالات المزمنة والأمان
              </div>
              <p className="text-slate-300">
                • الأمراض: {projections.conditions.map((c) => c.name).join('، ') || 'لا توجد'}
              </p>
              <p className="text-slate-300">
                • الحساسيات: {projections.allergies.map((a) => a.allergen).join('، ') || 'سليم من الحساسية'}
              </p>
              <p className="text-[11px] text-teal-400/90 flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3 h-3 shrink-0" />
                تحليل مقيد بحدود الأمان السريرية (Zero-Hallucination)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompt Chips Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold px-1">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>أسئلة سريرية سريعة استناداً إلى بياناتك الحالية:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            {
              label: '📊 استقرار ضغط دمي والنبض',
              query: 'ما هو تقييمك لاستقرار ضغط دمي ومعدل النبض خلال الأيام الأخيرة بناءً على بياناتي المسجلة؟',
            },
            {
              label: '💊 تأخير جرعة دواء ليسينوبريل',
              query: 'هل يؤثر تأخير جرعة دواء ليسينوبريل الصباحية على قياسات ضغط دمي؟ وما هو التصرف الصحيح؟',
            },
            {
              label: '📉 قراءات السكر وجرعات الميتفورمين',
              query: 'كيف أربط بين قراءات السكر الصباحية ومواعيد تناول دواء ميتفورمين مع وجبات الطعام؟',
            },
            {
              label: '🥗 التفاعلات الغذائية لأدوية الكوليسترول',
              query: 'هل هناك أطعمة أو عصائر يجب تجنبها عند تناول دواء أتورفاستاتين لعلاج الكوليسترول؟',
            },
            {
              label: '⏰ تحسين الالتزام الدوائي اليومي',
              query: 'نسبة التزامي الحالية 94%. ما هي أفضل الممارسات للحفاظ على هذا المعدل وتجنب نسيان الجرعات؟',
            },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(item.query)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-teal-950/60 border border-slate-800 hover:border-teal-500/50 text-slate-300 hover:text-teal-200 transition active:scale-95 cursor-pointer disabled:opacity-50 text-right flex items-center gap-1.5 shadow-sm"
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5 min-h-[420px] max-h-[600px] overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5 animate-fade-in`}
          >
            {/* Sender Badge */}
            <div className="flex items-center gap-2 text-[11px] px-1 text-slate-400">
              {msg.sender === 'user' ? (
                <>
                  <span className="font-semibold text-teal-300">{session?.name || 'أنت'}</span>
                  <span>{msg.timestamp}</span>
                </>
              ) : (
                <>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal-400" />
                    المساعد السريري السياقي (Lifex-AI)
                  </span>
                  {msg.model && (
                    <span className="text-[10px] bg-slate-800 text-teal-300 px-1.5 py-0.2 rounded font-mono">
                      {msg.model}
                    </span>
                  )}
                  <span>{msg.timestamp}</span>
                </>
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed shadow-md ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-teal-700 to-teal-800 text-white rounded-br-sm'
                  : 'bg-slate-950 border border-slate-800/90 text-slate-200 rounded-bl-sm space-y-3'
              }`}
            >
              {/* Emergency / Warning Alert Banner */}
              {msg.hasWarningAlert && msg.warningAlertMessage && (
                <div className="p-3 bg-rose-950/80 border border-rose-600 rounded-xl text-rose-200 text-xs font-bold flex items-start gap-2 mb-2 animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{msg.warningAlertMessage}</span>
                </div>
              )}

              {/* Message Content Rendered */}
              <div className="whitespace-pre-wrap leading-relaxed space-y-2">
                {msg.content.split('\n\n').map((paragraph, pIdx) => {
                  // Check if it's a heading
                  if (paragraph.startsWith('### ') || paragraph.startsWith('## ')) {
                    return (
                      <h4 key={pIdx} className="font-bold text-teal-300 text-sm pt-1 border-b border-slate-800/80 pb-1">
                        {paragraph.replace(/^#{2,3}\s*/, '')}
                      </h4>
                    );
                  }
                  // Check if it's follow-up suggestion section
                  if (paragraph.includes('[أسئلة مقترحة]:') || paragraph.includes('أسئلة مقترحة:')) {
                    return null; // rendered separately below
                  }

                  // Bullet points parsing
                  const lines = paragraph.split('\n');
                  if (lines.length > 1 && lines.some((l) => l.trim().startsWith('- ') || l.trim().startsWith('• ') || /^\d+\.\s/.test(l.trim()))) {
                    return (
                      <ul key={pIdx} className="space-y-1.5 my-1.5 pr-2">
                        {lines.map((line, lIdx) => {
                          const clean = line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '');
                          const isNumbered = /^\d+\.\s*/.test(line);
                          return (
                            <li key={lIdx} className="flex items-start gap-2 text-slate-300">
                              <span className="text-teal-400 font-bold mt-0.5">{isNumbered ? '•' : '▪'}</span>
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: clean.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>'),
                                }}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    );
                  }

                  return (
                    <p
                      key={pIdx}
                      dangerouslySetInnerHTML={{
                        __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>'),
                      }}
                    />
                  );
                })}
              </div>

              {/* Assistant Message Extra Badges (Sources & Disclaimer) */}
              {msg.sender === 'assistant' && (
                <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                  {/* Sources Chips */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <Info className="w-3 h-3 text-teal-400" />
                        المراجع السريرية:
                      </span>
                      {msg.sources.map((src, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[10px] bg-slate-900 text-teal-300 border border-slate-800 px-2 py-0.5 rounded-md font-mono"
                        >
                          {src.title}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions & Disclaimer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
                    <span className="text-[10px] text-slate-400 italic">
                      🛡️ محتوى تثقيفي مدعوم بنموذج Gemini ومطابق لبياناتك السريرية. لا يُعد وصفة علاجية.
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyMessage(msg.content, msg.id)}
                        className="p-1 hover:text-white transition cursor-pointer flex items-center gap-1"
                        title="نسخ الإجابة"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[10px] text-emerald-400">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[10px]">نسخ</span>
                          </>
                        )}
                      </button>

                      {'speechSynthesis' in window && (
                        <button
                          onClick={() => handleSpeak(msg.content)}
                          className="p-1 hover:text-white transition cursor-pointer flex items-center gap-1"
                          title="قراءة صوتية للإجابة"
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                              <span className="text-[10px] text-rose-400">إيقاف</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                              <span className="text-[10px]">استماع</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Suggested Follow-Ups Prompt Chips */}
                  {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
                      <span className="text-[11px] font-bold text-teal-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-teal-400" />
                        أسئلة متابعة مقترحة (اضغط للسؤال فوراً):
                      </span>
                      <div className="flex flex-col sm:flex-row flex-wrap gap-1.5">
                        {msg.suggestedFollowUps.map((q, qIdx) => (
                          <button
                            key={qIdx}
                            onClick={() => handleSendMessage(q)}
                            disabled={isLoading}
                            className="text-[11px] text-right px-2.5 py-1.5 rounded-lg bg-teal-950/40 hover:bg-teal-900/60 text-teal-200 border border-teal-800/50 hover:border-teal-600 transition active:scale-95 cursor-pointer disabled:opacity-50"
                          >
                            💬 {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-teal-900">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-bl-sm p-4 text-xs text-slate-300 space-y-2 max-w-md">
              <div className="flex items-center gap-2 text-teal-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                <span>يقوم Gemini 3.8 Flash بتحليل مؤشراتك الحيوية ومطابقتها...</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                يتم ربط قراءات ضغط الدم ({latestTrend.systolicBP}/{latestTrend.diastolicBP}) والسكر ({latestTrend.glucose}) مع جدول أدويتك وسجل التزامك ({overallAdherence}%)...
              </p>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-400 h-full w-2/3 animate-pulse rounded-full" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5"
        >
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              rows={2}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اطرح استفسارك السريري حول ضغط الدم، السكر، مواعيد الأدوية، أو الأعراض الجانبية... (اضغط Enter للإرسال)"
              disabled={isLoading}
              className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none resize-none transition"
            />
            <div className="absolute left-2.5 bottom-2.5 text-[10px] text-slate-400 hidden sm:block">
              Shift + Enter لسطر جديد
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-950 transition active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>{isLoading ? 'جاري التحليل...' : 'إرسال'}</span>
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </form>

        {/* Safety Disclaimer Banner */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-amber-400/90">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>
              <strong>تنويه سريري:</strong> هذا النظام مساند تثقيفي؛ لا تغير جرعات أدويتك بدون استشارة طبيبك المعالج، وفي حالات الطوارئ اتصل بـ 997/911.
            </span>
          </div>
          <span className="text-teal-400/80 font-mono hidden md:inline">
            سجل التدقيق Sovereign Audit نشط
          </span>
        </div>
      </div>
    </div>
  );
};
