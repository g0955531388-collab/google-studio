import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  ShieldCheck,
  Stethoscope,
  Clock,
  User,
  MessageSquare,
  Send,
  FileText,
  Pill,
  HeartPulse,
  RefreshCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Settings,
  Activity,
  Share2,
  Download,
  Check,
  AlertCircle,
  Calendar,
  Sparkles,
  ChevronRight,
  Eye,
  Sliders,
  Layers,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { consentService } from '../../services/consentService';
import {
  TelemedicineDoctor,
  TelemedicineChatMessage,
  TelemedicineConsultationRecord,
  VitalReading,
} from '../../types';

interface TelemedicineConsultationProps {
  patientId: string;
  onNavigateToTimeline?: () => void;
  onNavigateToMeds?: () => void;
}

export const TelemedicineConsultation: React.FC<TelemedicineConsultationProps> = ({
  patientId,
  onNavigateToTimeline,
  onNavigateToMeds,
}) => {
  // Navigation sub-tabs within Telemedicine module
  const [teleSubTab, setTeleSubTab] = useState<'session' | 'history'>('session');

  // Consultation state: 'setup' -> 'connecting' -> 'in_call' -> 'summary'
  const [sessionState, setSessionState] = useState<'setup' | 'connecting' | 'in_call' | 'summary'>('setup');

  // Selected doctor
  const availableDoctors = dataService.getAvailableTelemedicineDoctors();
  const [selectedDoctor, setSelectedDoctor] = useState<TelemedicineDoctor>(availableDoctors[0]);
  const [chiefComplaint, setChiefComplaint] = useState<string>('متابعة دورية لضغط الدم ومراجعة خطة العلاج الدوائي');

  // Media streams & hardware controls
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isBlurBackground, setIsBlurBackground] = useState<boolean>(false);
  const [isSimulatedCamera, setIsSimulatedCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [availableDevices, setAvailableDevices] = useState<{ video: MediaDeviceInfo[]; audio: MediaDeviceInfo[] }>({
    video: [],
    audio: [],
  });

  // Call duration and layout
  const [callDuration, setCallDuration] = useState<number>(0);
  const [callLayout, setCallLayout] = useState<'pip' | 'split' | 'doctor_focus'>('pip');
  const [activeSidePanel, setActiveSidePanel] = useState<'chat' | 'vitals' | 'notes'>('chat');
  const [isDoctorSpeaking, setIsDoctorSpeaking] = useState<boolean>(false);
  const [doctorCurrentSubtitle, setDoctorCurrentSubtitle] = useState<string>(
    'أهلاً بك يا أحمد في عيادة الطب الاتصالي التخصصية. كيف تشعر اليوم بعد تعديل جرعة الميتفورمين؟'
  );
  const [isVoiceAudioEnabled, setIsVoiceAudioEnabled] = useState<boolean>(true);

  // Chat in session
  const [chatMessages, setChatMessages] = useState<TelemedicineChatMessage[]>([]);
  const [inputChatText, setInputChatText] = useState<string>('');

  // Doctor in-call clinical notes & e-prescription
  const [clinicalNotes, setClinicalNotes] = useState<string>(
    'المريض ملتزم بالعلاج بنسبة 85%. قراءات ضغط الدم مستقرة عند 122/80 مم زئبق. لا توجد أعراض خفقان أو هبوط.'
  );
  const [recommendedRx, setRecommendedRx] = useState<string[]>([
    'Concor 5mg - قرص يومياً صباحاً بعد الإفطار',
    'Metformin XR 500mg - قرص يومياً بعد العشاء',
  ]);
  const [completedSummary, setCompletedSummary] = useState<TelemedicineConsultationRecord | null>(null);

  // Past consultations
  const [pastConsultations, setPastConsultations] = useState<TelemedicineConsultationRecord[]>([]);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Vitals from patient projections
  const projections = dataService.getPatientProjections(patientId);
  const latestVitals = projections.vitals || [];

  // Load past consultations
  useEffect(() => {
    setPastConsultations(dataService.getTelemedicineConsultations(patientId));
  }, [patientId, sessionState]);

  // Request browser camera & microphone
  const initUserMedia = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('المتصفح لا يدعم الوصول للكاميرا والميكروفون مباشرة');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setMediaStream(stream);
      setIsSimulatedCamera(false);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Setup audio analyzer for volume meter
      setupAudioAnalyzer(stream);

      // Enumerate devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAvailableDevices({
          video: devices.filter((d) => d.kind === 'videoinput'),
          audio: devices.filter((d) => d.kind === 'audioinput'),
        });
      } catch {
        // Enumerate error is non-fatal
      }
    } catch (err: any) {
      console.warn('Camera/mic access fallback:', err);
      setCameraError(err.message || 'تعذر تشغيل الكاميرا والميكروفون تلقائياً');
      setIsSimulatedCamera(true);
    }
  };

  // Setup Web Audio API Analyser for live visualizer
  const setupAudioAnalyzer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch {
      // AudioContext fallback
    }
  };

  // Start media preview on mount
  useEffect(() => {
    initUserMedia();

    return () => {
      // Cleanup streams on unmount
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Update video element srcObject when mediaStream changes
  useEffect(() => {
    if (localVideoRef.current && mediaStream) {
      localVideoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, sessionState]);

  // Call timer during 'in_call'
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (sessionState === 'in_call') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [sessionState]);

  // Doctor speaking simulation cycles
  useEffect(() => {
    if (sessionState !== 'in_call') return;

    const phrases = [
      'أرى أن ضغط دمك الأخير 122/80 ممتاز جداً وضمن النطاق الطبيعي المستهدف.',
      'هل واجهت أي دوار خفيف عند النهوض صباحاً بعد تناول دواء الكونكور؟',
      'نسبة التزامك بالأدوية 85% ممتازة، الاستمرارية هي مفتاح الوقاية القلبية.',
      'سأقوم بتثبيت الوصفة الطبية وإرسالها مباشرة إلى ملفك الصحي وصيدلية المستشفى.',
      'هل لديك أي استفسار حول المكملات الغذائية أو نظام الغذاء اليومي؟',
    ];

    let count = 0;
    const interval = setInterval(() => {
      setIsDoctorSpeaking(true);
      const text = phrases[count % phrases.length];
      setDoctorCurrentSubtitle(text);
      count++;

      // Trigger text-to-speech if enabled and supported
      if (isVoiceAudioEnabled && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'ar-SA';
          utterance.rate = 1.0;
          window.speechSynthesis.speak(utterance);
        } catch {
          // Speech synthesis error fallback
        }
      }

      setTimeout(() => {
        setIsDoctorSpeaking(false);
      }, 5500);
    }, 14000);

    return () => {
      clearInterval(interval);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [sessionState, isVoiceAudioEnabled]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Toggle Mute
  const handleToggleMute = () => {
    if (mediaStream) {
      mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setIsMuted(!isMuted);
  };

  // Toggle Video
  const handleToggleVideo = () => {
    if (mediaStream) {
      mediaStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setIsVideoOff(!isVideoOff);
  };

  // Toggle Screen Share
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
    } else {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          alert('ميزة مشاركة الشاشة غير مدعومة في بيئة المتصفح الحالية');
          return;
        }
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
        };
      } catch (err) {
        console.warn('Screen share cancelled or failed:', err);
      }
    }
  };

  // Start Consultation Flow
  const handleStartConsultation = () => {
    setSessionState('connecting');

    // Simulate connection handshake (WebRTC DTLS/SRTP)
    setTimeout(() => {
      setSessionState('in_call');
      setCallDuration(0);

      // Initialize chat with welcome message from doctor
      setChatMessages([
        {
          id: 'msg-init-1',
          sender: 'SYSTEM',
          text: 'تم إنشاء اتصال فيديو مشفر E2EE بتقنية WebRTC بين المريض والطبيب بنجاح.',
          timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: 'msg-init-2',
          sender: 'DOCTOR',
          text: `مرحباً أحمد، معك ${selectedDoctor.name}. اطلعت على سجل مؤشراتك الحيوية وأنا جاهزة لمتابعتك اليوم.`,
          timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 2400);
  };

  // Send message from patient
  const handleSendMessage = () => {
    if (!inputChatText.trim()) return;

    const userMsgText = inputChatText.trim();
    const newMsg: TelemedicineChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'PATIENT',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setInputChatText('');

    // Generate responsive clinical reply from doctor
    setTimeout(() => {
      let doctorResponseText = 'شكراً لملاحظتك. هذا يتماشى مع الخطة العلاجية الحالية وسأقوم بتوثيقه في ملفك.';

      if (userMsgText.includes('دوار') || userMsgText.includes('دوخة')) {
        doctorResponseText = 'الدوار الخفيف قد ينجم عن انخفاض طفيف في الضغط عند الوقوف المفاجئ. ننصحك بالنهوض تدريجياً والإكثار من شرب السوائل.';
      } else if (userMsgText.includes('ميتفورمين') || userMsgText.includes('سكر')) {
        doctorResponseText = 'الاستمرار على ميتفورمين 500 ملغ بعد العشاء مناسب جداً. حافظ على موعد الجرعة مع وجبة رئيسية لتجنب اضطراب المعدة.';
      } else if (userMsgText.includes('ضغط') || userMsgText.includes('122')) {
        doctorResponseText = 'قراءة 122/80 قراءة نموذجية لمريض ضغط يتناول الكونكور. نحن راضون تماماً عن هذا المستوى.';
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-doc-${Date.now()}`,
          sender: 'DOCTOR',
          text: doctorResponseText,
          timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      setDoctorCurrentSubtitle(doctorResponseText);
      setIsDoctorSpeaking(true);
      setTimeout(() => setIsDoctorSpeaking(false), 4500);
    }, 1200);
  };

  // Share Live Vitals into Consultation
  const handleShareVitals = () => {
    const bp = latestVitals.find((v) => v.type === 'BLOOD_PRESSURE')?.value || '122/80 mmHg';
    const hr = latestVitals.find((v) => v.type === 'HEART_RATE')?.value || '72 bpm';
    const glucose = latestVitals.find((v) => v.type === 'GLUCOSE')?.value || '104 mg/dL';

    const vitalsSummary = `📊 قراءات المؤشرات الحيوية المباشرة للمريض: ضغط الدم (${bp}) · نبض القلب (${hr} نبضة/د) · سكر الدم (${glucose})`;

    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-vit-${Date.now()}`,
        sender: 'PATIENT',
        text: vitalsSummary,
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        type: 'VITALS_SHARE',
      },
      {
        id: `msg-doc-vit-${Date.now()}`,
        sender: 'DOCTOR',
        text: 'استلمت القراءات الحيوية المحدثة، النتائج ممتازة ومتناسقة مع الفحوصات الدورية.',
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // End Consultation
  const handleEndConsultation = () => {
    const sessionRecord: TelemedicineConsultationRecord = {
      id: `tele-${Date.now()}`,
      patientId,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      doctorSpecialty: selectedDoctor.specialty,
      hospital: selectedDoctor.hospital,
      scheduledAt: new Date().toISOString(),
      durationSeconds: Math.max(callDuration, 30),
      status: 'COMPLETED',
      chiefComplaint,
      clinicalSummary: clinicalNotes,
      prescriptions: recommendedRx,
      followUpDate: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split('T')[0],
    };

    dataService.saveTelemedicineConsultation(sessionRecord);
    setCompletedSummary(sessionRecord);
    setSessionState('summary');

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Format call duration MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Header and Sub Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Video className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">العيادة المرئية عن بُعد (Telemedicine)</h2>
              <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                استشارة فورية مشفرة
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              تواصل مرئي مباشر مع استشاريي الطب المتخصصين باستخدام كاميرا وميكروفون المتصفح الآمن بتقنية WebRTC
            </p>
          </div>
        </div>

        {/* View Switcher: Session vs History */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setTeleSubTab('session')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              teleSubTab === 'session'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>جلسة الاستشارة الحالية</span>
          </button>
          <button
            onClick={() => setTeleSubTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              teleSubTab === 'history'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>سجل الاستشارات ({pastConsultations.length})</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: PAST CONSULTATIONS HISTORY */}
      {teleSubTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>سجل الاستشارات الطبية المرئية السابقة</span>
            </h3>

            {pastConsultations.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">لا توجد استشارات سابقة مسجلة حتى الآن.</p>
            ) : (
              <div className="space-y-3">
                {pastConsultations.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3 hover:border-slate-700 transition"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
                          <Stethoscope className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{item.doctorName}</h4>
                          <p className="text-xs text-slate-400">{item.doctorSpecialty} · {item.hospital}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(item.scheduledAt).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
                          مدة الجلسة: {Math.round(item.durationSeconds / 60)} دقيقة
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1.5">
                      <p>
                        <strong className="text-slate-400">سبب الاستشارة:</strong> {item.chiefComplaint}
                      </p>
                      <p>
                        <strong className="text-slate-400">الخلاصة السريرية:</strong> {item.clinicalSummary}
                      </p>
                      {item.prescriptions && item.prescriptions.length > 0 && (
                        <div className="pt-1">
                          <strong className="text-slate-400">الوصفات الصادرة:</strong>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {item.prescriptions.map((rx, idx) => (
                              <span
                                key={idx}
                                className="text-[11px] bg-slate-900 text-teal-300 border border-teal-800/60 px-2 py-0.5 rounded-md"
                              >
                                {rx}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: ACTIVE SESSION WORKFLOW */}
      {teleSubTab === 'session' && (
        <>
          {/* ======================================================== */}
          {/* STEP 1: PRE-CALL SETUP & DEVICE CHECK                    */}
          {/* ======================================================== */}
          {sessionState === 'setup' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Camera Preview & Device Diagnostics */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Settings className="w-4 h-4 text-indigo-400" />
                      <span>فحص الكاميرا والصوت قبل بدء الاستشارة</span>
                    </h3>
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      جاهز للبث
                    </span>
                  </div>

                  {/* Video Preview Box */}
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                    {/* Real Video Element */}
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover transition duration-300 ${
                        isVideoOff ? 'hidden' : 'block'
                      } ${isBlurBackground ? 'blur-sm scale-105' : ''}`}
                    />

                    {/* Placeholder when video is turned off */}
                    {isVideoOff && (
                      <div className="text-center space-y-2 p-6">
                        <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                          <VideoOff className="w-8 h-8" />
                        </div>
                        <p className="text-xs text-slate-400 font-medium">الكاميرا معطلة مؤقتاً</p>
                      </div>
                    )}

                    {/* Simulated Camera Overlay if hardware denied */}
                    {isSimulatedCamera && !isVideoOff && (
                      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-900/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full bg-indigo-600/30 border-2 border-indigo-400 flex items-center justify-center text-indigo-300 font-black text-2xl shadow-xl">
                            أحمد
                          </div>
                          <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-bold">
                            ✓
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">محاكاة تدفق الكاميرا للمريض</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm">
                            تم تفعيل قناة المحاكاة المرئية التفاعلية. الجلسة والاستشارة ستعمل بكامل الوظائف السريرية.
                          </p>
                        </div>
                        <button
                          onClick={initUserMedia}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>إعادة طلب إذن الكاميرا الحقيقية</span>
                        </button>
                      </div>
                    )}

                    {/* Live overlay badges */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur border border-slate-700/60 text-[10px] font-bold text-slate-200">
                        HD 720p • 30 FPS
                      </span>
                    </div>

                    {/* Bottom controls preview bar */}
                    <div className="absolute bottom-3 inset-x-3 flex items-center justify-between bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/60">
                      <div className="flex items-center gap-2">
                        {/* Audio Meter Visualizer */}
                        <div className="flex items-center gap-1.5">
                          {isMuted ? (
                            <MicOff className="w-4 h-4 text-rose-400" />
                          ) : (
                            <Mic className="w-4 h-4 text-emerald-400" />
                          )}
                          <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-75 ${
                                isMuted ? 'w-0' : 'bg-emerald-400'
                              }`}
                              style={{ width: `${isMuted ? 0 : Math.max(8, audioLevel)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleToggleMute}
                          className={`p-2 rounded-lg text-xs font-bold transition ${
                            isMuted
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                          }`}
                          title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الميكروفون'}
                        >
                          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={handleToggleVideo}
                          className={`p-2 rounded-lg text-xs font-bold transition ${
                            isVideoOff
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                          }`}
                          title={isVideoOff ? 'تشغيل الكاميرا' : 'إيقاف الكاميرا'}
                        >
                          {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => setIsBlurBackground(!isBlurBackground)}
                          className={`p-2 rounded-lg text-xs font-bold transition ${
                            isBlurBackground
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                          }`}
                          title="تمويه الخلفية (Virtual Blur)"
                        >
                          <Layers className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Device Status & Permissions Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-slate-400 font-semibold">ميكروفون الإدخال:</span>
                      <p className="font-mono text-slate-200 truncate">
                        {availableDevices.audio[0]?.label || 'Default Web Audio Microphone'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-slate-400 font-semibold">كاميرا الفيديو:</span>
                      <p className="font-mono text-slate-200 truncate">
                        {availableDevices.video[0]?.label || 'Default WebRTC Video Source'}
                      </p>
                    </div>
                  </div>

                  {cameraError && (
                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800 text-xs text-amber-200 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>تنبيه المتصفح:</strong> {cameraError}
                        <p className="text-[11px] text-amber-300/80 mt-0.5">
                          تم تفعيل وضع المحاكاة تلقائياً، يمكنك النقر على "بدء الاستشارة الآمنة" ومتابعة الجلسة مباشرة.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Doctor Selection & Consultation Details */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">اختيار الطبيب الاستشاري</h3>
                    <p className="text-xs text-slate-400">الأطباء المتاحون الآن للاستشارة الفورية المباشرة</p>
                  </div>

                  {/* Doctors List */}
                  <div className="space-y-2.5">
                    {availableDoctors.map((doc) => {
                      const isSelected = selectedDoctor.id === doc.id;
                      return (
                        <div
                          key={doc.id}
                          onClick={() => setSelectedDoctor(doc)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3.5 ${
                            isSelected
                              ? 'bg-indigo-950/50 border-indigo-500 shadow-md shadow-indigo-950'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shrink-0 shadow">
                            <Stethoscope className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-white truncate">{doc.name}</h4>
                              <span className="text-[10px] font-mono text-amber-400 font-bold">
                                ★ {doc.rating}
                              </span>
                            </div>
                            <p className="text-xs text-indigo-300 mt-0.5">{doc.specialty}</p>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{doc.hospital}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Chief Complaint Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">سبب الاستشارة أو الشكوى الرئيسية</label>
                    <textarea
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                      placeholder="اذكر بإيجاز سبب الاستشارة..."
                    />
                  </div>

                  {/* Security & Consent Notice */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      الاتصال مشفر وفق معايير WebRTC DTLS/SRTP. يحصل الطبيب فقط على إسقاط معتمد للمؤشرات الحيوية والأدوية.
                    </span>
                  </div>

                  {/* Start Button */}
                  <button
                    onClick={handleStartConsultation}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition active:scale-[0.99] cursor-pointer"
                  >
                    <Video className="w-4 h-4" />
                    <span>بدء الاستشارة الآمنة مع {selectedDoctor.name}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: CONNECTING / WAITING ROOM                        */}
          {/* ======================================================== */}
          {sessionState === 'connecting' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-6 max-w-xl mx-auto shadow-2xl animate-fade-in">
              <div className="relative w-24 h-24 mx-auto">
                <div className="w-full h-full rounded-full bg-indigo-600/20 border-2 border-indigo-500 flex items-center justify-center text-indigo-400 animate-pulse">
                  <Stethoscope className="w-10 h-10" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/40 border-t-indigo-400 animate-spin" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">جاري الاتصال بالطبيب...</h3>
                <p className="text-xs text-indigo-300 mt-1 font-semibold">{selectedDoctor.name}</p>
                <p className="text-xs text-slate-400 mt-2">
                  يتم التحقق من تشفير القناة وتبادل مفاتيح الجلسة ومراجعة المؤشرات الحيوية المحدثة.
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  E2EE DTLS
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  HD Audio/Video
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  HIPAA Compliant
                </span>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: IN-CALL CONSULTATION (ACTIVE CALL)                */}
          {/* ======================================================== */}
          {sessionState === 'in_call' && (
            <div className="space-y-4 animate-fade-in">
              {/* Call Top Header Strip */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-xs font-bold text-white font-mono">{formatDuration(callDuration)}</span>
                  </div>
                  <span className="text-slate-600">|</span>
                  <div className="flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-bold text-white">{selectedDoctor.name}</span>
                    <span className="text-[11px] text-slate-400">({selectedDoctor.specialty})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsVoiceAudioEnabled(!isVoiceAudioEnabled)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1.5 ${
                      isVoiceAudioEnabled
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                    title="التعليق الصوتي للطبيب (Text-to-Speech)"
                  >
                    {isVoiceAudioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span>الصوت السريري</span>
                  </button>

                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                    <button
                      onClick={() => setCallLayout('pip')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        callLayout === 'pip' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      صورة داخل صورة
                    </button>
                    <button
                      onClick={() => setCallLayout('split')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        callLayout === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      شاشة منقسمة
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Call Stage & Side Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* VIDEO STAGE (Left / Center) */}
                <div className="lg:col-span-8 space-y-3">
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center">
                    {/* DOCTOR VIDEO SIMULATION STREAM */}
                    <div className="w-full h-full relative bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-6 select-none">
                      {/* Doctor Clinical Office Background Visual */}
                      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]" />

                      {/* Doctor Avatar / Presence */}
                      <div className="relative z-10 text-center space-y-3">
                        <div className="relative inline-block">
                          <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-900 p-1 shadow-2xl transition duration-500 ${
                            isDoctorSpeaking ? 'ring-4 ring-indigo-400 ring-offset-4 ring-offset-slate-950 scale-105' : ''
                          }`}>
                            <div className="w-full h-full rounded-full bg-slate-900 flex flex-col items-center justify-center text-white overflow-hidden relative">
                              <User className="w-16 h-16 md:w-20 md:h-20 text-indigo-300" />
                              <div className="absolute bottom-2 inset-x-0 text-center">
                                <span className="text-[10px] font-bold bg-indigo-950/90 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-700/60">
                                  د. سارة
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Speaking pulse animation waves */}
                          {isDoctorSpeaking && (
                            <div className="absolute -bottom-2 inset-x-0 flex items-center justify-center gap-1">
                              <span className="w-1.5 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                              <span className="w-1.5 h-6 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                              <span className="w-1.5 h-8 bg-emerald-400 rounded-full animate-bounce" />
                              <span className="w-1.5 h-6 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                              <span className="w-1.5 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-2">
                            <h3 className="text-base md:text-lg font-black text-white">{selectedDoctor.name}</h3>
                            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                              متصل الآن
                            </span>
                          </div>
                          <p className="text-xs text-indigo-300">{selectedDoctor.specialty}</p>
                          <p className="text-[11px] text-slate-400">{selectedDoctor.hospital}</p>
                        </div>
                      </div>

                      {/* Closed Captions / Subtitles Bar (Live Doctor Speech) */}
                      <div className="absolute bottom-4 inset-x-6 z-20">
                        <div className="bg-slate-950/85 backdrop-blur-md border border-slate-700/80 rounded-xl px-4 py-2.5 shadow-xl text-center">
                          <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">
                            <span className="text-indigo-400 font-bold ml-1.5">الطبيب:</span>
                            {doctorCurrentSubtitle}
                          </p>
                        </div>
                      </div>

                      {/* Top Badges */}
                      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur border border-slate-700/60 text-[10px] font-bold text-emerald-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          WebRTC E2EE
                        </span>
                      </div>
                    </div>

                    {/* PATIENT VIDEO FEED (Picture-in-Picture or Split) */}
                    {callLayout === 'pip' ? (
                      <div className="absolute top-4 left-4 z-20 w-32 sm:w-44 aspect-video rounded-xl overflow-hidden bg-slate-900 border-2 border-indigo-500/70 shadow-2xl">
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'} ${
                            isBlurBackground ? 'blur-sm scale-105' : ''
                          }`}
                        />
                        {isVideoOff && (
                          <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-2 text-center">
                            <VideoOff className="w-5 h-5 text-slate-500" />
                            <span className="text-[9px] text-slate-400 mt-1">الكاميرا معطلة</span>
                          </div>
                        )}
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-[9px] font-bold text-white">
                          أنت (المريض)
                        </div>
                        {isMuted && (
                          <div className="absolute top-1 left-1 p-1 rounded-full bg-rose-600 text-white">
                            <MicOff className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  {/* Split View Secondary Video if layout is 'split' */}
                  {callLayout === 'split' && (
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl flex items-center justify-center">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'} ${
                          isBlurBackground ? 'blur-sm scale-105' : ''
                        }`}
                      />
                      {isVideoOff && (
                        <div className="text-center space-y-2 p-6">
                          <VideoOff className="w-8 h-8 text-slate-500 mx-auto" />
                          <p className="text-xs text-slate-400">كاميرا المريض معطلة</p>
                        </div>
                      )}
                      <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur text-xs font-bold text-white">
                        بث المريض المباشر (أحمد)
                      </div>
                    </div>
                  )}

                  {/* IN-CALL CALL CONTROLS TOOLBAR */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {/* Audio Level Indicator */}
                      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                        <span className="text-[10px] text-slate-400">صوتك:</span>
                        <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-75 ${
                              isMuted ? 'w-0' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${isMuted ? 0 : Math.max(10, audioLevel)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Central Control Buttons */}
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={handleToggleMute}
                        className={`p-3 rounded-xl transition text-sm font-bold flex items-center justify-center cursor-pointer ${
                          isMuted
                            ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                        title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الميكروفون'}
                      >
                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </button>

                      <button
                        onClick={handleToggleVideo}
                        className={`p-3 rounded-xl transition text-sm font-bold flex items-center justify-center cursor-pointer ${
                          isVideoOff
                            ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                        title={isVideoOff ? 'تشغيل الكاميرا' : 'إيقاف الكاميرا'}
                      >
                        {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                      </button>

                      <button
                        onClick={handleToggleScreenShare}
                        className={`p-3 rounded-xl transition text-sm font-bold flex items-center justify-center cursor-pointer ${
                          isScreenSharing
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                        title="مشاركة الشاشة"
                      >
                        <Monitor className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => setIsBlurBackground(!isBlurBackground)}
                        className={`p-3 rounded-xl transition text-sm font-bold flex items-center justify-center cursor-pointer ${
                          isBlurBackground
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                        title="تمويه الخلفية"
                      >
                        <Layers className="w-5 h-5" />
                      </button>

                      <button
                        onClick={handleShareVitals}
                        className="px-3.5 py-3 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                        title="مشاركة القياسات الحيوية فوراً"
                      >
                        <HeartPulse className="w-4 h-4 text-teal-400" />
                        <span className="hidden md:inline">مشاركة المؤشرات الحيوية</span>
                      </button>

                      {/* End Call Button */}
                      <button
                        onClick={handleEndConsultation}
                        className="p-3 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition active:scale-95 cursor-pointer"
                        title="إنهاء الاستشارة"
                      >
                        <PhoneOff className="w-5 h-5" />
                        <span className="hidden sm:inline">إنهاء الجلسة</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Active Side Panel Buttons */}
                      <button
                        onClick={() => setActiveSidePanel('chat')}
                        className={`p-2.5 rounded-xl text-xs font-bold transition ${
                          activeSidePanel === 'chat'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                        title="الدردشة"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setActiveSidePanel('vitals')}
                        className={`p-2.5 rounded-xl text-xs font-bold transition ${
                          activeSidePanel === 'vitals'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                        title="المؤشرات الحيوية"
                      >
                        <Activity className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setActiveSidePanel('notes')}
                        className={`p-2.5 rounded-xl text-xs font-bold transition ${
                          activeSidePanel === 'notes'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                        title="الملاحظات والوصفة"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* IN-CALL CLINICAL SIDEBAR (Right Column) */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl h-[560px] flex flex-col shadow-xl overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="flex border-b border-slate-800 bg-slate-950/70 p-2 gap-1">
                      <button
                        onClick={() => setActiveSidePanel('chat')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          activeSidePanel === 'chat'
                            ? 'bg-indigo-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>الدردشة</span>
                      </button>

                      <button
                        onClick={() => setActiveSidePanel('vitals')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          activeSidePanel === 'vitals'
                            ? 'bg-indigo-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>المؤشرات</span>
                      </button>

                      <button
                        onClick={() => setActiveSidePanel('notes')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          activeSidePanel === 'notes'
                            ? 'bg-indigo-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>الوصفة والخطة</span>
                      </button>
                    </div>

                    {/* SIDEBAR PANEL 1: IN-CALL LIVE CHAT */}
                    {activeSidePanel === 'chat' && (
                      <div className="flex-1 flex flex-col p-3 min-h-0">
                        {/* Messages Container */}
                        <div
                          ref={chatScrollRef}
                          className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs"
                        >
                          {chatMessages.map((msg) => {
                            if (msg.sender === 'SYSTEM') {
                              return (
                                <div
                                  key={msg.id}
                                  className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 text-center"
                                >
                                  {msg.text}
                                </div>
                              );
                            }

                            const isPatient = msg.sender === 'PATIENT';
                            return (
                              <div
                                key={msg.id}
                                className={`flex flex-col ${isPatient ? 'items-end' : 'items-start'}`}
                              >
                                <span className="text-[10px] text-slate-500 mb-1">
                                  {isPatient ? 'أنت' : selectedDoctor.name} • {msg.timestamp}
                                </span>
                                <div
                                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                                    isPatient
                                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-900/30'
                                      : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none'
                                  }`}
                                >
                                  {msg.text}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Quick Prompts Bar */}
                        <div className="py-2 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[10px]">
                          <button
                            onClick={() => {
                              setInputChatText('هل أستمر على نفس جرعة دواء الضغط الحالية؟');
                            }}
                            className="whitespace-nowrap px-2 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
                          >
                            جرعة الضغط؟
                          </button>
                          <button
                            onClick={() => {
                              setInputChatText('أشعر بدوار خفيف عند النهوض صباحاً.');
                            }}
                            className="whitespace-nowrap px-2 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
                          >
                            دوار خفيف صباحاً
                          </button>
                          <button
                            onClick={handleShareVitals}
                            className="whitespace-nowrap px-2 py-1 rounded-md bg-teal-950 border border-teal-800 text-teal-300 hover:text-white"
                          >
                            مشاركة القياسات الحيوية
                          </button>
                        </div>

                        {/* Input Box */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                          <input
                            type="text"
                            value={inputChatText}
                            onChange={(e) => setInputChatText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSendMessage();
                            }}
                            placeholder="اكتب رسالة للطبيب أثناء الجلسة..."
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            onClick={handleSendMessage}
                            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition active:scale-95"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* SIDEBAR PANEL 2: LIVE VITALS TELEMETRY OVERLAY */}
                    {activeSidePanel === 'vitals' && (
                      <div className="p-4 space-y-4 overflow-y-auto">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-teal-400" />
                            <span>المؤشرات الحيوية المباشرة للمريض</span>
                          </h4>
                          <button
                            onClick={handleShareVitals}
                            className="text-[11px] text-teal-300 hover:underline font-bold"
                          >
                            مشاركة مع الطبيب
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                            <span className="text-[10px] text-slate-400">ضغط الدم</span>
                            <p className="text-base font-black text-white font-mono mt-0.5">122/80</p>
                            <span className="text-[10px] text-emerald-400 font-semibold">mmHg (طبيعي)</span>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                            <span className="text-[10px] text-slate-400">نبض القلب</span>
                            <p className="text-base font-black text-rose-400 font-mono mt-0.5">72</p>
                            <span className="text-[10px] text-slate-400">bpm (منتظم)</span>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                            <span className="text-[10px] text-slate-400">تشبع الأكسجين</span>
                            <p className="text-base font-black text-cyan-400 font-mono mt-0.5">98%</p>
                            <span className="text-[10px] text-slate-400">SpO2</span>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                            <span className="text-[10px] text-slate-400">سكر الدم الصائم</span>
                            <p className="text-base font-black text-amber-400 font-mono mt-0.5">104</p>
                            <span className="text-[10px] text-slate-400">mg/dL</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-xs text-indigo-200">
                          <strong>ملاحظة التزامن السريري:</strong>
                          <p className="text-[11px] text-indigo-300/80 mt-1">
                            يتم تحديث هذه القراءات من أجهزة القياس المقترنة بالمريض ويتم التحقق منها بواسطة استشاري القلب أثناء المكالمة.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* SIDEBAR PANEL 3: DOCTOR'S NOTES & e-Rx */}
                    {activeSidePanel === 'notes' && (
                      <div className="p-4 space-y-4 overflow-y-auto">
                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5 mb-1.5">
                            <FileText className="w-4 h-4 text-indigo-400" />
                            <span>الملاحظات السريرية الحية للطبيب</span>
                          </h4>
                          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                            {clinicalNotes}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5 mb-1.5">
                            <Pill className="w-4 h-4 text-emerald-400" />
                            <span>الوصفة الطبية الإلكترونية المعتمدة (e-Rx)</span>
                          </h4>
                          <div className="space-y-2">
                            {recommendedRx.map((rx, idx) => (
                              <div
                                key={idx}
                                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between text-slate-200"
                              >
                                <span>{rx}</span>
                                <span className="text-[10px] text-emerald-400 font-bold">معتمد ✓</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                          <span className="text-slate-400 font-semibold">موعد المتابعة القادم:</span>
                          <p className="font-bold text-white">بعد شهرين (استشارة مرئية تتبعية)</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 4: POST-CALL CONSULTATION SUMMARY                   */}
          {/* ======================================================== */}
          {sessionState === 'summary' && completedSummary && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl animate-fade-in max-w-3xl mx-auto">
              <div className="text-center space-y-2 border-b border-slate-800 pb-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-white">اكتملت جلسة الاستشارة المرئية بنجاح</h3>
                <p className="text-xs text-slate-400">
                  تم حفظ تفاصيل الجلسة والتقرير السريري وتوثيقها في سجلك الصحي والجدول الزمني (Timeline Projection)
                </p>
              </div>

              {/* Consultation Details Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold">الطبيب الاستشاري:</span>
                  <p className="text-sm font-bold text-white">{completedSummary.doctorName}</p>
                  <p className="text-indigo-300">{completedSummary.doctorSpecialty} · {completedSummary.hospital}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold">مدة الجلسة والتوقيت:</span>
                  <p className="text-sm font-bold text-white font-mono">
                    {Math.round(completedSummary.durationSeconds / 60)} دقيقة ({formatDuration(completedSummary.durationSeconds)})
                  </p>
                  <p className="text-slate-400">
                    {new Date(completedSummary.scheduledAt).toLocaleString('ar-SA')}
                  </p>
                </div>
              </div>

              {/* Clinical Summary */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>الخلاصة والتوصيات السريرية:</span>
                </h4>
                <p className="text-slate-300 leading-relaxed">{completedSummary.clinicalSummary}</p>
              </div>

              {/* Prescriptions */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-emerald-400" />
                  <span>الوصفات المعتمدة خلال الجلسة:</span>
                </h4>
                <div className="space-y-1.5">
                  {completedSummary.prescriptions.map((rx, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-900 text-teal-300 border border-teal-800/40">
                      {rx}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const dataStr =
                        'data:text/json;charset=utf-8,' +
                        encodeURIComponent(JSON.stringify(completedSummary, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute('href', dataStr);
                      downloadAnchor.setAttribute('download', `Telemedicine_Report_${completedSummary.id}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>تنزيل تقرير الاستشارة (JSON)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSessionState('setup');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
                  >
                    بدء استشارة جديدة
                  </button>

                  {onNavigateToTimeline && (
                    <button
                      onClick={onNavigateToTimeline}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-indigo-600/30"
                    >
                      <span>عرض في الجدول الزمني الصحي</span>
                      <ChevronRight className="w-4 h-4 rotate-180" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
