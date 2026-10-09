import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Calendar,
  Clock,
  MessageCircle,
  FileUp,
  Download,
  Send,
  UserCheck,
  BellRing,
  Volume2,
  VolumeX,
  CheckCircle,
  AlertCircle,
  Stethoscope,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  HelpCircle,
  Edit3,
  Settings2,
  X,
  RotateCcw,
  Save,
  Trash2
} from 'lucide-react';

export interface DoctorProfile {
  name: string;
  specialty: string;
  subSpecialty: string;
  idCode: string;
  licenseNumber: string;
  location: string;
  email: string;
  phone: string;
  announcement: string;
}

const DEFAULT_DOCTOR: DoctorProfile = {
  name: 'الدكتور أحمد الخالدي',
  specialty: 'استشاري أمراض وجراحة القلب',
  subSpecialty: 'أمراض القلب والقثطرة',
  idCode: 'DOC-AHD-001',
  licenseNumber: 'SY-MED-2025',
  location: 'سورية — اللاذقية',
  email: 'ahmad.khalidi@example.com',
  phone: '+963 9X XXX XXXX',
  announcement: 'خصم إنساني 30% للحالات الحرجة — رسائل التقدير تُسجّل تلقائيًا عند تفعيل الخصم.',
};

interface BookedSlot {
  date: string;
  time: string;
}

interface ChatMessage {
  id: string;
  sender: 'doctor' | 'patient';
  text: string;
  time: string;
}

interface UploadedFile {
  name: string;
  size: string;
  type: 'report' | 'image' | 'lab' | 'other';
}

export default function DoctorPorcelainInterface() {
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [selectedDate, setSelectedDate] = useState('2025-12-17');
  const [userBookedSlot, setUserBookedSlot] = useState<BookedSlot | null>({
    date: '2025-12-17',
    time: '10:00',
  });
  const [modifyingSlot, setModifyingSlot] = useState<BookedSlot | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic user-controlled Doctor Profile (No forced hardcoded info)
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile>(() => {
    try {
      const saved = localStorage.getItem('lifex_doctor_custom_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_DOCTOR;
  });
  const [isEditingDoctor, setIsEditingDoctor] = useState(false);
  const [doctorForm, setDoctorForm] = useState<DoctorProfile>(doctorProfile);

  const handleOpenEditDoctor = () => {
    setDoctorForm(doctorProfile);
    setIsEditingDoctor(true);
  };

  const handleSaveDoctorProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setDoctorProfile(doctorForm);
    try {
      localStorage.setItem('lifex_doctor_custom_profile', JSON.stringify(doctorForm));
    } catch {}
    setIsEditingDoctor(false);
    showToast(`تم حفظ بيانات الطبيب بنجاح: ${doctorForm.name || 'الطبيب المخصص'}`);
  };

  const handleClearDoctorProfile = () => {
    const emptyProfile: DoctorProfile = {
      name: '',
      specialty: '',
      subSpecialty: '',
      idCode: '',
      licenseNumber: '',
      location: '',
      email: '',
      phone: '',
      announcement: '',
    };
    setDoctorForm(emptyProfile);
    showToast('تم مسح الحقول بالكامل. يمكنك الآن إدخال بيانات الطبيب الخاص بك بحرية.');
  };

  const handleResetDoctorProfile = () => {
    setDoctorForm(DEFAULT_DOCTOR);
    showToast('تم استرجاع النموذج المرجعي.');
  };

  // Other patients' booked slots per date
  const [bookedSlotsMap, setBookedSlotsMap] = useState<Record<string, Record<string, string>>>({
    '2025-12-17': {
      '10:30': 'Patient Z',
      '16:30': 'Patient Y',
    },
  });

  const [waitlist, setWaitlist] = useState<string[]>([]);
  const [isFollowed, setIsFollowed] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'doctor',
      text: 'أهلاً بك، يرجى اختيار موعد مناسب وإرسال تقاريرك الطبية أو نتائج الفحوصات.',
      time: '09:15',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Files state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
    { name: 'مثال تقرير_تخطيط_قلب.pdf', size: '220 KB', type: 'report' },
    { name: 'صورة_إيكو_قلبي.png', size: '540 KB', type: 'image' },
  ]);

  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Voice speech synthesis
  const speak = (text: string) => {
    if (!ttsEnabled || !text || typeof window === 'undefined') return;
    try {
      window.speechSynthesis?.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      const voices = window.speechSynthesis?.getVoices() || [];
      const arabicVoice =
        voices.find((v) => v.lang === 'ar-SA') ||
        voices.find((v) => v.lang.startsWith('ar')) ||
        null;
      if (arabicVoice) utterance.voice = arabicVoice;
      window.speechSynthesis?.speak(utterance);
    } catch {
      // safe fallback
    }
  };

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    speak(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Generate 30m intervals (09:00 - 11:30 and 15:00 - 18:30)
  const getTimes = () => {
    const times: string[] = [];
    const pushRange = (startH: number, endH: number) => {
      for (let h = startH; h < endH; h++) {
        for (let m = 0; m < 60; m += 30) {
          times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        }
      }
    };
    pushRange(9, 12);
    pushRange(15, 19);
    return times;
  };

  const allTimes = getTimes();

  // 12-hour rule check
  const canModify = (dateStr: string, timeStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [hh, mm] = timeStr.split(':').map(Number);
    const slotDate = new Date(y, m - 1, d, hh, mm);
    const now = new Date();
    return slotDate.getTime() - now.getTime() > 12 * 60 * 60 * 1000;
  };

  // Slot action handler
  const handleSlotAction = (time: string, actionType: 'book' | 'modify' | 'waitlist') => {
    if (actionType === 'book') {
      if (userBookedSlot) {
        showToast('لديك موعد محجوز مسبقاً. لتغييره يرجى الضغط على زر تعديل الموعد في خانة موعدك الحالي.');
        return;
      }
      setUserBookedSlot({ date: selectedDate, time });
      setBookedSlotsMap((prev) => ({
        ...prev,
        [selectedDate]: {
          ...(prev[selectedDate] || {}),
          [time]: 'My Reservation',
        },
      }));
      showToast(`تم تأكيد حجزك بنجاح في الساعة ${time} بتاريخ ${selectedDate}`);
    } else if (actionType === 'modify') {
      if (!canModify(selectedDate, time)) {
        showToast('تنبيه طبي: لا يمكن تعديل الموعد، يجب أن يكون التعديل قبل 12 ساعة على الأقل من موعدك.');
        return;
      }
      setModifyingSlot({ date: selectedDate, time });
      showToast('الآن اختر حصة متاحة جديدة لتأكيد التعديل، موعدك الحالي قيد الانتظار.');
    } else if (actionType === 'waitlist') {
      setWaitlist((prev) => [...prev, `${selectedDate} ${time}`]);
      showToast(`تم تسجيلك في قائمة الانتظار للحصة ${time}. سيتم إشعارك فور توفرها.`);
    }
  };

  // Confirm reschedule to a new slot
  const handleConfirmReschedule = (newTime: string) => {
    if (!modifyingSlot) return;

    // Remove old slot
    setBookedSlotsMap((prev) => {
      const copy = { ...prev };
      if (copy[modifyingSlot.date]) {
        delete copy[modifyingSlot.date][modifyingSlot.time];
      }
      copy[selectedDate] = {
        ...(copy[selectedDate] || {}),
        [newTime]: 'My Reservation',
      };
      return copy;
    });

    setUserBookedSlot({ date: selectedDate, time: newTime });
    setModifyingSlot(null);
    showToast(`تم تعديل موعدك بنجاح إلى الساعة ${newTime} بتاريخ ${selectedDate}.`);
  };

  // Export calendar records
  const handleExport = () => {
    const data = {
      doctorId: doctorProfile.idCode || 'CUSTOM-DOC',
      doctorName: doctorProfile.name || 'Custom Doctor',
      selectedDate,
      userBooking: userBookedSlot,
      schedule: bookedSlotsMap[selectedDate] || {},
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifex_doctor_schedule_${selectedDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تصدير سجل المواعيد كملف JSON بنجاح.');
  };

  // Send message
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const newMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'patient',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setChatInput('');
    showToast('تم إرسال الرسالة إلى العيادة الخاصة بالطبيب.');

    // Simulated reply from the doctor's clinical assistant
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'doctor',
          text: 'تم استلام استفسارك وملفاتك بنجاح. سيتم تدقيق الحالة وإرفاق الرد الطبي في سجلك الصحي.',
          time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      speak('طبيبك: تم استلام استفسارك وملفاتك بنجاح.');
    }, 1200);
  };

  // File upload simulation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: UploadedFile['type']) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeKB = (file.size / 1024).toFixed(0) + ' KB';
      const newFile: UploadedFile = {
        name: file.name,
        size: sizeKB,
        type,
      };
      setUploadedFiles((prev) => [newFile, ...prev]);
      showToast(`تم رفع الملف بنجاح: ${file.name}`);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#f6f9ff] text-[#0f2b5c] font-sans pb-16 selection:bg-[#2a5fa8] selection:text-white"
      style={{
        backgroundImage: `
          radial-gradient(circle at 18% 10%, rgba(42,95,168,0.08) 0 38%, transparent 40%),
          radial-gradient(circle at 78% 32%, rgba(42,95,168,0.07) 0 34%, transparent 35%),
          radial-gradient(circle at 40% 86%, rgba(42,95,168,0.09) 0 46%, transparent 47%)
        `,
      }}
    >
      <div className="max-w-4xl mx-auto p-3 sm:p-4 space-y-4">
        {/* ================================================= */}
        {/* البنر المتحرك بالخلفية السوداء والقلب الأحمر والنبض الأخضر */}
        {/* ================================================= */}
        <div
          id="banner-tile"
          className="rounded-2xl border border-slate-900 bg-black text-[#2a5fa8] shadow-2xl overflow-hidden cursor-pointer"
          onClick={() =>
            speak(
              'اتحاد الأطباء والصيادلة العالمي Lifex-AI system للمخترع العالمي غازي سليم بكفلاوي، مساعده الشريف المرشد الرباب، البريد G0955531388@gmail.com'
            )
          }
          title="انقر هنا لسماع البنر كاملاً بصوت واضح"
        >
          <div className="flex items-center gap-3 px-3 py-2.5 bg-black overflow-hidden select-none">
            <span className="shrink-0 font-extrabold text-xs sm:text-sm px-3 py-1 rounded-full bg-white text-[#2a5fa8] border border-[#375a8a] shadow-md">
              Lifex‑AI
            </span>
            <div className="overflow-hidden whitespace-nowrap flex-1 relative">
              <div className="inline-flex items-center gap-3 animate-[marquee_24s_linear_infinite] hover:[animation-play-state:paused]">
                {/* Heart */}
                <Heart className="w-5 h-5 text-red-500 fill-red-500 shrink-0 animate-pulse drop-shadow-[0_2px_4px_rgba(239,68,68,0.6)]" />

                {/* Green ECG Medical Pulse */}
                <svg
                  className="w-20 h-5 shrink-0 text-emerald-400 drop-shadow-[0_2px_4px_rgba(16,185,129,0.5)]"
                  viewBox="0 0 120 24"
                  fill="none"
                >
                  <path
                    d="M0,12 L16,12 L20,10 L22,14 L24,8 L26,14 L30,12 L120,12"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <span className="text-sm sm:text-base font-bold text-[#38bdf8] tracking-wide">
                  اتحاد الأطباء و الصيادلة العالمي Lifex‑AI system للمخترع العالمي غازي سليم بكفلاوي{' '}
                  <span className="text-red-500">♥️</span> — مساعده الشريف المرشد الرباب 🦽 —{' '}
                  <span className="text-red-500 font-bold">البريد:</span> G0955531388@gmail.com
                </span>

                {/* Repeat item for seamless loop */}
                <span className="text-sm sm:text-base font-bold text-[#38bdf8] tracking-wide">
                  • اتحاد الأطباء و الصيادلة العالمي Lifex‑AI system للمخترع العالمي غازي سليم بكفلاوي{' '}
                  <span className="text-red-500">♥️</span> — مساعده الشريف المرشد الرباب 🦽
                </span>
              </div>
            </div>

            {/* Audio narration button */}
            <button
              id="btn-toggle-tts"
              onClick={(e) => {
                e.stopPropagation();
                setTtsEnabled(!ttsEnabled);
                showToast(!ttsEnabled ? 'تم تفعيل النطق الصوتي للمكفوفين' : 'تم إيقاف النطق الصوتي');
              }}
              className="shrink-0 p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:text-white border border-slate-700 transition"
              title={ttsEnabled ? 'النطق مفعّل' : 'النطق متوقف'}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>

        {/* ================================================= */}
        {/* بطاقة هوية الطبيب الخزفية ثلاثية الأبعاد */}
        {/* ================================================= */}
        <div className="bg-white rounded-2xl border border-[#e3e9f6] shadow-[0_18px_36px_rgba(15,43,92,0.1)] overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-b from-white to-[#f1f6ff] border-b border-[#e3e9f6] font-bold text-[#0f2b5c] flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-[#2a5fa8]" />
              هوية الطبيب المعتمد — البطاقة السريرية
            </span>
            <div className="flex items-center gap-2">
              <button
                id="btn-edit-doctor-profile"
                onClick={handleOpenEditDoctor}
                className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg bg-[#2a5fa8] hover:bg-[#1d4ed8] text-white font-bold transition shadow-sm active:scale-95"
                title="تخصيص وتعديل اسم الطبيب وأرقام التواصل والعنوان بحرية تامة"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل بيانات الطبيب</span>
              </button>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
                معتمد في منظومة Lifex-AI
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Doctor Avatar 3D Style */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#eef4ff] to-[#cfe2ff] border-2 border-[#8fb2e6] flex items-center justify-center shadow-[0_10px_24px_rgba(15,43,92,0.15)] overflow-hidden">
                  <Stethoscope className="w-12 h-12 text-[#2a5fa8]" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white">
                  <ShieldCheck className="w-3 h-3" />
                </div>
              </div>

              {/* Info Details */}
              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#0f2b5c]">
                    {doctorProfile.name || '(اضغط زر التعديل لكتابة اسم الطبيب)'}
                  </h1>
                  {doctorProfile.specialty && (
                    <span className="text-xs bg-[#eef4ff] text-[#2a5fa8] border border-[#2a5fa8]/30 px-2 py-0.5 rounded-md font-bold">
                      {doctorProfile.specialty}
                    </span>
                  )}
                  <button
                    onClick={handleOpenEditDoctor}
                    className="p-1 rounded text-[#2a5fa8] hover:bg-blue-50 transition"
                    title="تعديل"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs sm:text-sm text-[#375a8a] space-y-1 leading-relaxed">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <span>
                      <strong>المعرّف:</strong> {doctorProfile.idCode || 'لم يحدد'}
                    </span>
                    <span>•</span>
                    <span>
                      <strong>الترخيص:</strong> {doctorProfile.licenseNumber || 'لم يحدد'}
                    </span>
                    {doctorProfile.subSpecialty && (
                      <>
                        <span>•</span>
                        <span>
                          <strong>الاختصاص:</strong> {doctorProfile.subSpecialty}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#2a5fa8]" /> {doctorProfile.location || 'العنوان: قابل للتخصيص'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-[#2a5fa8]" /> {doctorProfile.email || 'البريد: قابل للتخصيص'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#2a5fa8]" /> {doctorProfile.phone || 'الهاتف: قابل للتخصيص'}
                    </span>
                  </div>
                </div>

                {/* Announcement box */}
                {doctorProfile.announcement && (
                  <div className="mt-2 p-2.5 rounded-xl border border-[#e3e9f6] bg-gradient-to-b from-[#ffffff] to-[#eef4ff] text-xs text-[#375a8a] font-medium shadow-sm flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{doctorProfile.announcement}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Toolbar Buttons (3D Porcelain buttons) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-[#e3e9f6]">
              <button
                id="btn-my-doctor"
                onClick={() => {
                  setIsFavorite(!isFavorite);
                  showToast(!isFavorite ? 'تمت إضافة الطبيب إلى مفضلتي بنجاح' : 'تمت إزالة الطبيب من المفضلة');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border transition-all text-xs sm:text-sm font-bold shadow-[4px_4px_10px_rgba(15,43,92,0.1),-4px_-4px_10px_rgba(255,255,255,0.9)] active:scale-95 ${
                  isFavorite ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gradient-to-br from-white to-[#eef4ff] text-[#0f2b5c] border-white/80'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-[#375a8a]'}`} />
                <span>طبيبي</span>
              </button>

              <button
                id="btn-follow-doctor"
                onClick={() => {
                  setIsFollowed(!isFollowed);
                  showToast(!isFollowed ? 'تم تفعيل المتابعة لتلقي تحديثات الطبيب والمقالات الطبية' : 'تم إلغاء المتابعة');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border transition-all text-xs sm:text-sm font-bold shadow-[4px_4px_10px_rgba(15,43,92,0.1),-4px_-4px_10px_rgba(255,255,255,0.9)] active:scale-95 ${
                  isFollowed ? 'bg-blue-50 text-[#2a5fa8] border-blue-200' : 'bg-gradient-to-br from-white to-[#eef4ff] text-[#0f2b5c] border-white/80'
                }`}
              >
                <BellRing className={`w-4 h-4 ${isFollowed ? 'text-[#2a5fa8]' : 'text-[#375a8a]'}`} />
                <span>متابعة</span>
              </button>

              <button
                id="btn-private-chat"
                onClick={() => {
                  const el = document.getElementById('chat-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                  showToast('تم الانتقال إلى نافذة المحادثة الخاصة مع الطبيب');
                }}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-br from-white to-[#eef4ff] border border-white/80 text-[#0f2b5c] text-xs sm:text-sm font-bold shadow-[4px_4px_10px_rgba(15,43,92,0.1),-4px_-4px_10px_rgba(255,255,255,0.9)] active:scale-95"
              >
                <MessageCircle className="w-4 h-4 text-[#375a8a]" />
                <span>محادثة خاصة</span>
              </button>

              <button
                id="btn-send-files"
                onClick={() => {
                  const el = document.getElementById('files-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                  showToast('تم الانتقال إلى نافذة إرسال التقارير والصور الطبية');
                }}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-br from-white to-[#eef4ff] border border-white/80 text-[#0f2b5c] text-xs sm:text-sm font-bold shadow-[4px_4px_10px_rgba(15,43,92,0.1),-4px_-4px_10px_rgba(255,255,255,0.9)] active:scale-95"
              >
                <FileUp className="w-4 h-4 text-[#375a8a]" />
                <span>إرسال ملفات</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* جدول المواعيد الخزفي (مفصل مع قاعدة الـ 12 ساعة) */}
        {/* ================================================= */}
        <div className="bg-white rounded-2xl border border-[#e3e9f6] shadow-[0_18px_36px_rgba(15,43,92,0.1)] overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-b from-white to-[#f1f6ff] border-b border-[#e3e9f6] font-bold text-[#0f2b5c] flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm sm:text-base">
              <Calendar className="w-4 h-4 text-[#2a5fa8]" />
              جدول المواعيد — التعديل متاح قبل ١٢ ساعة فقط
            </span>
            {userBookedSlot && (
              <span className="text-xs bg-blue-100 text-[#0f2b5c] font-bold px-2 py-0.5 rounded-full">
                لديك موعد: {userBookedSlot.time} ({userBookedSlot.date})
              </span>
            )}
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {/* Date Picker and Export Button */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="date-input-field" className="block text-xs font-bold text-[#375a8a] mb-1">
                  اختر تاريخ الحجز المطلوب:
                </label>
                <input
                  id="date-input-field"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setModifyingSlot(null);
                    showToast(`تم تغيير اليوم إلى ${e.target.value}. يمكنك مراجعة الحصص المتاحة.`);
                  }}
                  className="w-full p-2.5 bg-white border border-[#e3e9f6] rounded-xl text-sm font-semibold text-[#0f2b5c] shadow-inner focus:outline-none focus:ring-2 focus:ring-[#2a5fa8]"
                />
              </div>

              <div className="self-end">
                <button
                  id="btn-export-schedule"
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-br from-white to-[#eef4ff] border border-white text-xs sm:text-sm font-bold text-[#0f2b5c] shadow-[4px_4px_8px_rgba(15,43,92,0.1),-3px_-3px_6px_rgba(255,255,255,0.9)] active:scale-95"
                >
                  <Download className="w-4 h-4 text-[#375a8a]" />
                  <span>تصدير السجلات</span>
                </button>
              </div>
            </div>

            {/* Instruction status banner */}
            <div className="p-2.5 rounded-xl bg-[#eef4ff] border border-[#cfe2ff] text-xs sm:text-sm text-[#0f2b5c] flex items-center justify-between">
              <span>
                {modifyingSlot
                  ? '⚠️ وضع التعديل نشط: انقر على أي حصة زمنية "متاحة" باللون الأخضر لنقل موعدك إليها.'
                  : userBookedSlot
                  ? 'لديك موعد مؤكد. لتغيير التوقيت انقر على "تعديل الموعد" باللون الأزرق أدناه.'
                  : 'الرجاء اختيار حصة زمنية متاحة (خضراء) للحجز.'}
              </span>
              {modifyingSlot && (
                <button
                  onClick={() => {
                    setModifyingSlot(null);
                    showToast('تم إلغاء عملية التعديل والاحتفاظ بموعدك الأصلي.');
                  }}
                  className="text-xs text-red-600 underline font-bold"
                >
                  إلغاء التعديل
                </button>
              )}
            </div>

            {/* Slots Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {allTimes.map((time) => {
                const isBooked = !!bookedSlotsMap[selectedDate]?.[time];
                const isUserSlot = userBookedSlot?.date === selectedDate && userBookedSlot?.time === time;
                const isModifyingThis = modifyingSlot?.date === selectedDate && modifyingSlot?.time === time;

                let slotBg = 'bg-[#d1fae5] text-[#047857] border-[#86efac]'; // available (light green)
                let stateLabel = 'متاح';
                let actionBtnText = 'حجز';
                let actionType: 'book' | 'modify' | 'waitlist' = 'book';

                if (isModifyingThis) {
                  slotBg = 'bg-[#ef4444] text-white border-red-600 ring-4 ring-red-300';
                  stateLabel = 'قيد التعديل';
                  actionBtnText = 'جاري التعديل';
                } else if (isUserSlot) {
                  slotBg = 'bg-[#2a5fa8] text-white border-[#1d4ed8] shadow-[0_0_15px_rgba(42,95,168,0.5)]';
                  stateLabel = 'موعدك الحالي';
                  actionBtnText = 'تعديل الموعد';
                  actionType = 'modify';
                } else if (isBooked) {
                  slotBg = 'bg-[#87c08a] text-white border-[#68a86c]';
                  stateLabel = 'محجوز';
                  actionBtnText = 'قائمة انتظار';
                  actionType = 'waitlist';
                }

                return (
                  <div
                    key={time}
                    onClick={() => {
                      if (modifyingSlot && !isBooked && !isUserSlot) {
                        handleConfirmReschedule(time);
                      } else {
                        speak(`حصة الساعة ${time}. الحالة: ${stateLabel}`);
                      }
                    }}
                    className={`rounded-2xl border p-3 flex flex-col items-center justify-center text-center transition-all cursor-pointer shadow-md ${slotBg} ${
                      modifyingSlot && !isBooked ? 'hover:ring-4 hover:ring-emerald-400 scale-[1.02]' : ''
                    }`}
                  >
                    <div className="text-lg font-black tracking-tight">{time}</div>
                    <div className="text-xs font-semibold opacity-90 mb-2">{stateLabel}</div>

                    {/* Action button inside slot */}
                    {isModifyingThis ? (
                      <span className="text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded">اختر وقتاً بديلاً</span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (modifyingSlot && !isBooked) {
                            handleConfirmReschedule(time);
                          } else {
                            handleSlotAction(time, actionType);
                          }
                        }}
                        disabled={!modifyingSlot && isBooked && isUserSlot}
                        className={`text-xs font-bold py-1 px-2.5 rounded-lg shadow-sm transition active:scale-95 ${
                          isUserSlot
                            ? 'bg-white text-[#2a5fa8] hover:bg-slate-100'
                            : isBooked
                            ? 'bg-slate-800 text-white hover:bg-slate-700'
                            : modifyingSlot
                            ? 'bg-emerald-700 text-white hover:bg-emerald-800 ring-2 ring-white'
                            : 'bg-[#047857] text-white hover:bg-emerald-800'
                        }`}
                      >
                        {modifyingSlot && !isBooked ? 'تأكيد النقل هنا' : actionBtnText}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* رفع الملفات والمحادثة الخاصة */}
        {/* ================================================= */}
        <div id="files-section" className="bg-white rounded-2xl border border-[#e3e9f6] shadow-[0_18px_36px_rgba(15,43,92,0.1)] overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-b from-white to-[#f1f6ff] border-b border-[#e3e9f6] font-bold text-[#0f2b5c] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileUp className="w-5 h-5 text-[#2a5fa8]" />
              المحادثة الخاصة وإرسال التقارير والتحاليل
            </span>
            <span className="text-xs text-[#375a8a]">مشفر ومحمي وفق معايير HIPAA و GDPR</span>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {/* File Upload Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-[#eef4ff] rounded-xl border border-[#cfe2ff] space-y-1">
                <label className="font-bold text-[#0f2b5c] block">تقارير (PDF, DOCX)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload(e, 'report')}
                  className="text-[11px] file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-[#2a5fa8] file:text-white file:font-semibold"
                />
              </div>

              <div className="p-3 bg-[#eef4ff] rounded-xl border border-[#cfe2ff] space-y-1">
                <label className="font-bold text-[#0f2b5c] block">صور طبية (JPG, PNG)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'image')}
                  className="text-[11px] file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-[#2a5fa8] file:text-white file:font-semibold"
                />
              </div>

              <div className="p-3 bg-[#eef4ff] rounded-xl border border-[#cfe2ff] space-y-1">
                <label className="font-bold text-[#0f2b5c] block">تحاليل (CSV, XLSX)</label>
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={(e) => handleFileUpload(e, 'lab')}
                  className="text-[11px] file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-[#2a5fa8] file:text-white file:font-semibold"
                />
              </div>

              <div className="p-3 bg-[#eef4ff] rounded-xl border border-[#cfe2ff] space-y-1">
                <label className="font-bold text-[#0f2b5c] block">مستندات أخرى</label>
                <input
                  type="file"
                  onChange={(e) => handleFileUpload(e, 'other')}
                  className="text-[11px] file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-[#2a5fa8] file:text-white file:font-semibold"
                />
              </div>
            </div>

            {/* Uploaded File Pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {uploadedFiles.map((file, idx) => (
                <div
                  key={idx}
                  onClick={() => speak(`ملف مرفق: ${file.name} بحجم ${file.size}`)}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-[#e6effc] border border-[#cfe2ff] text-xs font-semibold text-[#0f2b5c] shadow-sm cursor-pointer hover:bg-[#d5e5fb] transition"
                >
                  {file.type === 'report' ? (
                    <FileText className="w-3.5 h-3.5 text-[#2a5fa8]" />
                  ) : file.type === 'image' ? (
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
                  )}
                  <span>{file.name}</span>
                  <span className="text-[10px] text-[#375a8a]">({file.size})</span>
                </div>
              ))}
            </div>

            {/* Private Chat Box */}
            <div id="chat-section" className="space-y-2 pt-2">
              <div className="font-bold text-xs text-[#375a8a]">صندوق المحادثة المباشرة مع عيادة الطبيب:</div>
              <div className="h-44 overflow-y-auto p-3 bg-white border border-[#e3e9f6] rounded-2xl shadow-inner space-y-2.5">
                {messages.map((m) => {
                  const isDoctor = m.sender === 'doctor';
                  return (
                    <div
                      key={m.id}
                      onClick={() => speak(`${isDoctor ? 'الطبيب' : 'أنت'}: ${m.text}`)}
                      className={`flex flex-col ${isDoctor ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-[85%] p-2.5 rounded-2xl text-xs sm:text-sm font-medium shadow-sm leading-relaxed ${
                          isDoctor
                            ? 'bg-[#eef4ff] text-[#0f2b5c] border border-[#cfe2ff] rounded-tr-sm'
                            : 'bg-[#2a5fa8] text-white rounded-tl-sm'
                        }`}
                      >
                        <div className="text-[10px] font-bold opacity-75 mb-0.5">
                          {isDoctor ? (doctorProfile.name || 'طبيبك') : 'أنت'}
                        </div>
                        {m.text}
                      </div>
                      <span className="text-[10px] text-slate-400 px-1 mt-0.5">{m.time}</span>
                    </div>
                  );
                })}
              </div>

              {/* Chat input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="اكتب استفسارك الطبي أو أرفق ملاحظاتك للطبيب..."
                  className="flex-1 p-2.5 bg-white border border-[#e3e9f6] rounded-xl text-xs sm:text-sm text-[#0f2b5c] focus:outline-none focus:ring-2 focus:ring-[#2a5fa8]"
                />
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-2.5 bg-[#2a5fa8] hover:bg-[#1d4ed8] text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition"
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* نافذة تحرير وتخصيص بيانات الطبيب (التحكم الكامل للمستخدم) */}
      {/* ================================================= */}
      {isEditingDoctor && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
        >
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-[#cfe2ff] shadow-2xl overflow-hidden my-6">
            <div className="px-5 py-4 bg-gradient-to-r from-[#0f2b5c] to-[#2a5fa8] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-[#38bdf8]" />
                <h3 className="font-extrabold text-sm sm:text-base">تخصيص بيانات الطبيب والعيادة (تحكم كامل)</h3>
              </div>
              <button
                onClick={() => setIsEditingDoctor(false)}
                className="p-1 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDoctorProfile} className="p-5 space-y-3.5 text-xs sm:text-sm">
              <p className="text-[#375a8a] text-xs">
                يمكنك كتابة اسم طبيبك الحقيقي، وتعديل رقم هاتفه، وعنوان عيادته، وتخصصه بحرية تامة دون أي قيود مسبقة:
              </p>

              <div>
                <label className="block font-bold text-[#0f2b5c] mb-1">اسم الطبيب واللقب العلمي:</label>
                <input
                  type="text"
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                  placeholder="مثال: د. محمد العلي"
                  className="w-full p-2.5 rounded-xl border border-[#cfe2ff] bg-[#f8fbff] text-[#0f2b5c] focus:outline-none focus:ring-2 focus:ring-[#2a5fa8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0f2b5c] mb-1">التخصص الرئيسي:</label>
                  <input
                    type="text"
                    value={doctorForm.specialty}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
                    placeholder="مثال: استشاري طب الباطنة"
                    className="w-full p-2.5 rounded-xl border border-[#cfe2ff] bg-[#f8fbff] text-[#0f2b5c] focus:outline-none focus:ring-2 focus:ring-[#2a5fa8]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0f2b5c] mb-1">التخصص الدقيق:</label>
                  <input
                    type="text"
                    value={doctorForm.subSpecialty}
                    onChange={(e) => setDoctorForm({ ...doctorForm, subSpecialty: e.target.value })}
                    placeholder="مثال: أمراض الغدد الصم والسكري"
                    className="w-full p-2.5 rounded-xl border border-[#cfe2ff] bg-[#f8fbff] text-[#0f2b5c] focus:outline-none focus:ring-2 focus:ring-[#2a5fa8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0f2b5c] mb-1">رمز / معرف الطبيب:</label>
                  <input
                    type="text"
                    value={doctorForm.idCode}
                    onChange={(e) => setDoctorForm({ ...doctorForm, idCode: e.target.value })}
                    placeholder="مثال: DOC-MHD-002"
                    className="w-full p-2.5 rounded-xl border border-[#cfe2ff] bg-[#f8fbff] text-[#0f2b5c] focus:outline-none focus:ring-2 focus:ring-[#2a5fa8]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0f2b5c] mb-1">رقم الترخيص الطبي:</label>
                  <input
                    type="text"
                    value={doctorForm.licenseNumber}
                    onChange={(e) => setDoctorForm({ ...doctorForm, licenseNumber: e.target.value })}
                    placeholder="مثال: LIC-2025-998"
                    className="w-full p-2.5 rounded-xl border border-[#cfe2ff] bg-[#f8fbff] text-[#0f2b5c] focus:outline-none focus:ring-2 focus:ring-[#2a5fa8]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0f2b5c] mb-1">عنوان العيادة / المدينة:</label>
                <input
                  type="text"
                  value={doctorForm.location}
                  onChange={(e) => setDoctorForm({ ...doctorForm, location: e.target.value })}
                  placeholder="مثال: دمشق — شارع بغداد — مجمع الشفاء"
                  className="w-full p-2.5 rounded-xl border border-[#cfe2ff] bg-[#f8fbff] text-[#0f2b5c] focus:outline-none focus:ring-2 focus:ring-[#2a5fa8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0f2b5c] mb-1">رقم الهاتف للتواصل:</label>
                  <input
                    type="text"
                    value={doctorForm.phone}
                    onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                    placeholder="مثال: +963 933 123 456"
                    className="w-full p-2.5 rounded-xl border border-[#cfe2ff] bg-[#f8fbff] text-[#0f2b5c] focus:outline-none focus:ring-2 focus:ring-[#2a5fa8]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0f2b5c] mb-1">البريد الإلكتروني للعيادة:</label>
                  <input
                    type="email"
                    value={doctorForm.email}
                    onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                    placeholder="doctor@example.com"
                    className="w-full p-2.5 rounded-xl border border-[#cfe2ff] bg-[#f8fbff] text-[#0f2b5c] focus:outline-none focus:ring-2 focus:ring-[#2a5fa8]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0f2b5c] mb-1">ملاحظة الخصم الإنساني أو إعلان العيادة:</label>
                <textarea
                  rows={2}
                  value={doctorForm.announcement}
                  onChange={(e) => setDoctorForm({ ...doctorForm, announcement: e.target.value })}
                  placeholder="مثال: تقديم استشارات مجانية أو تخفيض 50% لأصحاب الهمم وذوي الشهداء..."
                  className="w-full p-2.5 rounded-xl border border-[#cfe2ff] bg-[#f8fbff] text-[#0f2b5c] focus:outline-none focus:ring-2 focus:ring-[#2a5fa8]"
                />
              </div>

              <div className="pt-3 border-t border-[#e3e9f6] flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleClearDoctorProfile}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 text-xs font-bold transition"
                    title="مسح الحقول للبدء بملف فارغ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>مسح الكل</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetDoctorProfile}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                    title="استعادة النموذج التوضيحي"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استعادة</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingDoctor(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#2a5fa8] hover:bg-[#1d4ed8] text-white font-extrabold text-xs shadow-md transition active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ البيانات</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification with TTS */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 left-5 sm:left-auto sm:max-w-md bg-[#0f2b5c] text-white text-xs sm:text-sm font-bold p-3.5 rounded-2xl shadow-2xl border border-blue-400/40 flex items-center gap-3 z-50 animate-bounce"
        >
          <Volume2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="flex-1">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-300 hover:text-white text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
