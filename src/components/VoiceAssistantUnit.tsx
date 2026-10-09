import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Sparkles,
  Play,
  Radio,
  HelpCircle,
  Stethoscope
} from 'lucide-react';

interface VoiceAssistantUnitProps {
  onTriggerAlert: (severity: 'informational' | 'important' | 'critical') => void;
  onOpenProfile: () => void;
  onNavigateToTab: (tab: string) => void;
}

export default function VoiceAssistantUnit({
  onTriggerAlert,
  onOpenProfile,
  onNavigateToTab,
}: VoiceAssistantUnitProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [systemResponse, setSystemResponse] = useState(
    'أنا مرشد Lifex-AI الصوتي الذكي. اضغط على الميكروفون أو انقر أحد الأوامر السريعة أدناه.'
  );
  const [wakeWordActive, setWakeWordActive] = useState(true);

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ar-SA';
      u.rate = 1.0;
      window.speechSynthesis.speak(u);
    } catch {
      // safe fallback
    }
  };

  const processVoiceCommand = (cmd: string) => {
    setTranscript(cmd);
    setIsListening(false);

    const lower = cmd.toLowerCase();
    let reply = '';

    if (lower.includes('طوارئ') || lower.includes('ساعدني') || lower.includes('تنفس') || lower.includes('ألم')) {
      reply = '⚠️ تم التقاط أمر استغاثة صوتي حرج! جاري تفعيل بروتوكول الطوارئ والاهتزاز وإشعار جهات الاتصال.';
      onTriggerAlert('critical');
    } else if (lower.includes('طبيب') || lower.includes('موعد') || lower.includes('حجز')) {
      reply = 'جاري نقلك إلى واجهة الطبيب الخزفية المعتمدة وجدول المواعيد.';
      onNavigateToTab('doctor');
    } else if (lower.includes('جمعية') || lower.includes('مؤسسة') || lower.includes('مساعدة') || lower.includes('تبرع')) {
      reply = 'جاري نقلك إلى وحدة المنظمات والجمعيات الخيرية للبحث وتقديم الطلبات.';
      onNavigateToTab('organizations');
    } else if (lower.includes('مرأة') || lower.includes('حمل') || lower.includes('ولادة') || lower.includes('دورة')) {
      reply = 'جاري نقلك إلى وحدة رعاية صحة المرأة والحمل.';
      onNavigateToTab('women_health');
    } else if (lower.includes('ملف') || lower.includes('صحة') || lower.includes('حساسية')) {
      reply = 'ملفك الصحي نشط ومحمي. لديك حساسية مسجلة من Penicillin وتاريخ مراقبة ضغط الدم.';
      onOpenProfile();
    } else {
      reply = `تم استلام الأمر الصوتي: "${cmd}". جاري تنفيذه وتوجيهه عبر محرك الذكاء اللغوي.`;
    }

    setSystemResponse(reply);
    speakText(reply);
  };

  const handleSimulateSpeech = (phrase: string) => {
    setIsListening(true);
    setTranscript('جارٍ الاستماع والتعرف على اللهجة والمعنى...');
    setTimeout(() => {
      processVoiceCommand(phrase);
    }, 700);
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-cyan-950 to-slate-900 border border-blue-900/50 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Radio className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  وحدة الصوت والذكاء اللغوي (Voice Intelligence System)
                </h1>
                <p className="text-xs sm:text-sm text-cyan-200">
                  الأذن الرقمية واللسان الناطق لمنظومة Lifex-AI الطبية الشاملة
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              نظام سمعي منخفض الطاقة يدعم التعرف التلقائي على اللغات واللهجات، فهم النوايا والمعاني، نطق
              الشاشة كاملاً للمكفوفين، واستشعار كلمات الاستغاثة والأصوات الحرجة في الطوارئ.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-3 py-1.5 rounded-full font-bold">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              كلمة التنبيه: "Lifex" أو "ليفكس"
            </span>
          </div>
        </div>
      </div>

      {/* Main Microphone Interaction Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg text-center space-y-5">
        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="text-lg font-bold text-white">الاستماع والتفاعل الصوتي الفوري</h2>
          <p className="text-xs text-slate-400">
            انقر على الميكروفون وتحدث بأي طلب طبي، أو انقر على الأوامر السريعة الجاهزة:
          </p>
        </div>

        {/* Big Animated Mic Circle */}
        <div className="flex justify-center py-2">
          <button
            onClick={() => handleSimulateSpeech('ليفكس كيف وضعي الصحي؟')}
            className={`w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform active:scale-95 ${
              isListening
                ? 'bg-red-600 ring-8 ring-red-500/30 scale-105 animate-pulse'
                : 'bg-gradient-to-tr from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 ring-4 ring-cyan-500/20'
            }`}
          >
            {isListening ? (
              <Mic className="w-12 h-12 text-white animate-bounce" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )}
          </button>
        </div>

        <div className="text-xs font-semibold text-slate-300">
          {isListening ? 'يستمع إليك الآن... قل طلبك بوضوح' : 'اضغط للتحدث بالأمر الصوتي'}
        </div>

        {/* Response Box */}
        <div className="max-w-2xl mx-auto p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner text-right space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-slate-800/80 pb-2">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Sparkles className="w-4 h-4" /> استجابة المرشد الصوتي:
            </span>
            <button
              onClick={() => speakText(systemResponse)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <Volume2 className="w-3.5 h-3.5" /> إعادة النطق
            </button>
          </div>

          <p className="text-sm font-semibold text-white leading-relaxed">{systemResponse}</p>
        </div>

        {/* Quick Voice Command Pills */}
        <div className="space-y-2 max-w-2xl mx-auto pt-2">
          <div className="text-xs font-bold text-slate-400 text-right">أوامر صوتية نموذجية للاختبار السريع:</div>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <button
              onClick={() => handleSimulateSpeech('ليفكس كيف وضعي الصحي؟')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              "كيف وضعي الصحي؟"
            </button>

            <button
              onClick={() => handleSimulateSpeech('احجز لي موعد عند دكتور قلبية')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              "احجز لي عند طبيب قلبية"
            </button>

            <button
              onClick={() => handleSimulateSpeech('أريد البحث عن جمعية لكفالة عملية')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              "ابحث عن جمعية لكفالة عملية"
            </button>

            <button
              onClick={() => handleSimulateSpeech('افتح متابعة الحمل وصحة المرأة')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              "افتح متابعة الحمل"
            </button>

            <button
              onClick={() => handleSimulateSpeech('طوارئ أنا لا أستطيع التنفس وصدري يؤلمني')}
              className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-red-300 text-xs font-bold border border-red-800/60 transition flex items-center gap-1"
            >
              <Flame className="w-3.5 h-3.5" />
              "طوارئ: لا أستطيع التنفس!"
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
