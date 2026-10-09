import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Video,
  Building,
  UserCheck,
  Star,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Filter,
  Check,
  X,
  RefreshCw,
  Bell,
  FileText,
  CalendarCheck,
  CalendarDays,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  Info,
  Phone,
  Download,
} from 'lucide-react';
import {
  PhysicianSlot,
  PatientAppointment,
  TelemedicineDoctor,
  AppointmentSuggestionResult,
} from '../../types';
import { dataService } from '../../services/dataService';
import { aiService } from '../../services/aiService';

interface AppointmentSchedulingModuleProps {
  patientId: string;
  patientName?: string;
  onNavigateToTelemedicine?: () => void;
  onOpenClinicalChat?: (prompt: string) => void;
}

export const AppointmentSchedulingModule: React.FC<AppointmentSchedulingModuleProps> = ({
  patientId,
  patientName = 'أحمد فهد المنصوري',
  onNavigateToTelemedicine,
  onOpenClinicalChat,
}) => {
  const [activeTab, setActiveTab] = useState<'book' | 'my-appointments'>('book');
  const [doctors, setDoctors] = useState<TelemedicineDoctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [consultationType, setConsultationType] = useState<'ANY' | 'IN_PERSON' | 'TELEMEDICINE'>('ANY');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-10');
  const [reasonForVisit, setReasonForVisit] = useState<string>(
    'متابعة دورية لارتفاع ضغط الدم والدهون ومراجعة الخطة الدوائية'
  );
  const [customReason, setCustomReason] = useState<string>('');

  // AI Suggestion State
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<AppointmentSuggestionResult | null>(null);

  // Booking Flow State
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<PhysicianSlot | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(true);
  const [patientNotes, setPatientNotes] = useState<string>('');
  const [bookingSuccessModal, setBookingSuccessModal] = useState<PatientAppointment | null>(null);

  // Appointments List State
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [actionStatusMessage, setActionStatusMessage] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const docList = dataService.getAvailableTelemedicineDoctors();
    setDoctors(docList);
    loadAppointments();
    fetchAiSuggestions();
  }, [patientId]);

  const loadAppointments = () => {
    const apts = dataService.getPatientAppointments(patientId);
    setAppointments(apts);
  };

  const fetchAiSuggestions = async (overrideReason?: string, overrideDoctorId?: string) => {
    setIsLoadingSuggestions(true);
    try {
      const activeReason = overrideReason || reasonForVisit || customReason;
      const docId = overrideDoctorId !== 'all' ? overrideDoctorId : undefined;

      const res = await aiService.suggestOptimalAppointmentSlots({
        patientId,
        preferredDoctorId: docId,
        specialty: selectedSpecialty !== 'all' ? selectedSpecialty : undefined,
        consultationType,
        reasonForVisit: activeReason,
        patientHistoryContext: {
          conditions: ['ارتفاع ضغط الدم الأولي', 'مقدمات سكري'],
          recentVitalsSummary: 'متوسط الضغط: 124/81 مم زئبق، رصد ارتفاعات ذروية مسائية تصل 148 مم زئبق',
          recentSymptoms: ['سعال جاف خفيف مع Lisinopril'],
          medications: ['Lisinopril 10mg', 'Atorvastatin 20mg'],
          lastVisitDate: '2026-08-10',
          urgencyLevel: 'URGENT',
        },
      });

      setAiSuggestions(res);
    } catch (err) {
      console.error('Failed to fetch AI appointment suggestions:', err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Available slots for the selected date and filters
  const displayedSlots: PhysicianSlot[] = useMemo(() => {
    if (aiSuggestions?.suggestedSlots && aiSuggestions.suggestedSlots.length > 0) {
      return aiSuggestions.suggestedSlots.filter((slot) => {
        if (selectedDate && slot.date !== selectedDate) return false;
        if (selectedDoctorId !== 'all' && slot.doctorId !== selectedDoctorId) return false;
        if (
          consultationType !== 'ANY' &&
          slot.consultationType !== 'BOTH' &&
          slot.consultationType !== consultationType
        )
          return false;
        return true;
      });
    }

    return dataService.getPhysicianSlots(
      selectedDoctorId !== 'all' ? selectedDoctorId : undefined,
      selectedDate
    );
  }, [aiSuggestions, selectedDate, selectedDoctorId, consultationType]);

  const specialties = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((d) => set.add(d.specialty));
    return ['all', ...Array.from(set)];
  }, [doctors]);

  const availableDates = [
    { date: '2026-10-10', label: 'السبت 10 أكتوبر', isToday: false },
    { date: '2026-10-11', label: 'الأحد 11 أكتوبر', isToday: false },
    { date: '2026-10-12', label: 'الإثنين 12 أكتوبر', isToday: false },
    { date: '2026-10-13', label: 'الثلاثاء 13 أكتوبر', isToday: false },
    { date: '2026-10-14', label: 'الأربعاء 14 أكتوبر', isToday: false },
  ];

  const handleConfirmBooking = () => {
    if (!selectedSlotForBooking) return;

    const prep = aiSuggestions?.recommendedPreparationAr || [
      'الصيام لمدة 8 ساعات قبل الموعد في حال إجراء تحاليل مخبرية',
      'إحضار سجل قراءات الأجهزة الطبية المنزلية',
    ];

    const booked = dataService.bookAppointment({
      patientId,
      doctorId: selectedSlotForBooking.doctorId,
      doctorName: selectedSlotForBooking.doctorName,
      doctorSpecialty: selectedSlotForBooking.doctorSpecialty,
      hospital: selectedSlotForBooking.hospital,
      date: selectedSlotForBooking.date,
      startTime: selectedSlotForBooking.startTime,
      endTime: selectedSlotForBooking.endTime,
      period: selectedSlotForBooking.period,
      consultationType:
        selectedSlotForBooking.consultationType === 'BOTH'
          ? consultationType === 'TELEMEDICINE'
            ? 'TELEMEDICINE'
            : 'IN_PERSON'
          : selectedSlotForBooking.consultationType,
      status: 'CONFIRMED',
      reasonForVisit: customReason || reasonForVisit,
      clinicalNotes: patientNotes,
      aiSuggestedSlot: selectedSlotForBooking.aiSuggested || false,
      aiCompatibilityScore: selectedSlotForBooking.aiOptimalityScore || 90,
      preparationInstructions: prep,
      reminderEnabled,
    });

    setBookingSuccessModal(booked);
    setSelectedSlotForBooking(null);
    setPatientNotes('');
    loadAppointments();
    fetchAiSuggestions();
  };

  const handleCancelAppointment = (appointmentId: string) => {
    const success = dataService.cancelAppointment(appointmentId, patientId);
    if (success) {
      setActionStatusMessage('✅ تم إلغاء الموعد بنجاح وتحرير التوقيت في جدول العيادة.');
      loadAppointments();
      fetchAiSuggestions();
      setTimeout(() => setActionStatusMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-right" dir="rtl">
      {/* Module Banner with AI Intelligence Branding */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-teal-500/20 font-black">
              <CalendarCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-white">
                  منظومة حجز المواعيد والجدولة السريرية الذكية
                </h2>
                <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-800 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-400" />
                  Gemini Clinical Scheduling Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                تحليل تلقائي لجداول الأطباء والبيانات الحيوية لاقتراح المواعيد المثالية فسيولوجياً وسريرياً
              </p>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('book')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'book'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>حجز موعد ذكي جديد</span>
            </button>

            <button
              onClick={() => setActiveTab('my-appointments')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'my-appointments'
                  ? 'bg-indigo-600 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>مواعيدي المحجوزة ({appointments.filter((a) => a.status === 'CONFIRMED').length})</span>
            </button>
          </div>
        </div>

        {/* Action Status Message */}
        {actionStatusMessage && (
          <div className="mt-4 p-3 rounded-xl bg-teal-950/60 border border-teal-800 text-teal-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>{actionStatusMessage}</span>
          </div>
        )}
      </div>

      {activeTab === 'book' ? (
        <div className="space-y-6">
          {/* AI Clinical Strategy & Health Context Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-black text-white">
                  التوصية السريرية المخصصة (AI Clinical Care Strategy)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-slate-950 text-slate-400 px-2.5 py-1 rounded-full border border-slate-800">
                  الأولوية السريرية:{' '}
                  <strong className="text-amber-400">
                    {aiSuggestions?.suggestedUrgency === 'WITHIN_48H' ? 'خلال 48 ساعة' : 'خلال هذا الأسبوع'}
                  </strong>
                </span>
                <button
                  onClick={() => fetchAiSuggestions()}
                  disabled={isLoadingSuggestions}
                  className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-teal-400 border border-slate-800 cursor-pointer disabled:opacity-50"
                  title="إعادة تحليل التوافق السريري للمواعيد"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSuggestions ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <span className="text-slate-400 font-bold block flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                  تحليل الملف الصحي والتاريخ المرضي:
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {aiSuggestions?.patientClinicalProfileSummaryAr ||
                    'تشير قراءات الضغط الأخيرة لتذبذب انقباضي يستدعي مراجعة استشارية القلب لتقييم جرعة Lisinopril.'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <span className="text-slate-400 font-bold block flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                  الخطة التوقيتية المُثلى:
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {aiSuggestions?.optimalCareStrategyAr ||
                    'الأولوية لحجز موعد صباحي مبكر يجمع بين فحص دهون الدم الصائم وتخطيط القلب المباشر.'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <span className="text-slate-400 font-bold block flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  إرشادات التحضير قبل الزيارة:
                </span>
                <ul className="text-slate-300 space-y-1 text-[11px] list-disc list-inside">
                  {(aiSuggestions?.recommendedPreparationAr || [
                    'الصيام 8 ساعات لسحب عينة دهون الدم وسكر الصائم',
                    'إحضار سجل قراءات الضغط للأسبوع الأخير',
                  ]).slice(0, 2).map((inst, i) => (
                    <li key={i}>{inst}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Step 1: Reason for Visit Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-xs font-mono">
                1
              </span>
              <span>تحديد سبب الزيارة أو الشكوى الطبية:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                'متابعة دورية لارتفاع ضغط الدم والدهون ومراجعة الخطة الدوائية',
                'مراجعة قراءات السكر والتحاليل الصيامية وجهاز CGM',
                'استشارة عاجلة بعد رصد قراءات ضغط مرتفعة في البوابة',
                'متابعة الأعراض الدوائية وبحث بديل لعلاج السعال الجاف',
              ].map((reasonOption, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setReasonForVisit(reasonOption);
                    setCustomReason('');
                    fetchAiSuggestions(reasonOption);
                  }}
                  className={`p-3 rounded-2xl text-xs font-bold text-right transition border cursor-pointer ${
                    reasonForVisit === reasonOption && !customReason
                      ? 'bg-teal-950/60 text-teal-300 border-teal-500 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {reasonOption}
                </button>
              ))}
            </div>

            <div className="pt-2">
              <input
                type="text"
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  if (e.target.value.length > 5) {
                    fetchAiSuggestions(e.target.value);
                  }
                }}
                placeholder="أو اكتب سبباً مخصصاً للزيارة..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Step 2: Physician Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-xs font-mono">
                  2
                </span>
                <span>اختيار الطبيب أو التخصص الطبي:</span>
              </h3>

              {/* Specialty filter pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => {
                    setSelectedSpecialty('all');
                    setSelectedDoctorId('all');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedSpecialty === 'all'
                      ? 'bg-teal-600 text-slate-950 font-black'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  جميع التخصصات
                </button>
                {specialties
                  .filter((s) => s !== 'all')
                  .map((spec) => (
                    <button
                      key={spec}
                      onClick={() => {
                        setSelectedSpecialty(spec);
                        setSelectedDoctorId('all');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        selectedSpecialty === spec
                          ? 'bg-teal-600 text-slate-950 font-black'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {spec.split(' ')[0]} {spec.split(' ')[1] || ''}
                    </button>
                  ))}
              </div>
            </div>

            {/* Doctor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {doctors
                .filter(
                  (doc) => selectedSpecialty === 'all' || doc.specialty.includes(selectedSpecialty)
                )
                .map((doc) => {
                  const isSelected = selectedDoctorId === doc.id;
                  const isTopMatch =
                    (reasonForVisit.includes('ضغط') || reasonForVisit.includes('قلب')) &&
                    doc.id === 'doc-dr-sarah';

                  return (
                    <div
                      key={doc.id}
                      onClick={() => {
                        const newId = isSelected ? 'all' : doc.id;
                        setSelectedDoctorId(newId);
                        fetchAiSuggestions(undefined, newId);
                      }}
                      className={`p-4 rounded-2xl border transition cursor-pointer relative space-y-3 ${
                        isSelected
                          ? 'bg-slate-950 border-teal-500 shadow-xl shadow-teal-500/10 ring-1 ring-teal-500'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {isTopMatch && (
                        <div className="absolute top-2 left-2 text-[9px] bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          الأعلى ملاءمة سريرياً
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-teal-400 font-black text-lg border border-slate-700">
                          {doc.name.slice(3, 4)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{doc.name}</h4>
                          <span className="text-[11px] text-teal-400 block font-medium">
                            {doc.specialty}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-900">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-500" />
                            <span className="truncate max-w-[170px]">{doc.hospital}</span>
                          </span>
                          <span className="flex items-center gap-1 text-amber-400 font-bold">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {doc.rating}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>{doc.consultationFee}</span>
                          <span className="text-emerald-400 font-bold">متاح للحجز</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Step 3: Date & Consultation Mode Strip */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-xs font-mono">
                  3
                </span>
                <span>اختيار اليوم ونوع الاستشارة:</span>
              </h3>

              {/* Mode toggles */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setConsultationType('ANY')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    consultationType === 'ANY'
                      ? 'bg-teal-600 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setConsultationType('IN_PERSON')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    consultationType === 'IN_PERSON'
                      ? 'bg-rose-500 text-white shadow font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building className="w-3 h-3" />
                  <span>حضوري بالعيادة</span>
                </button>
                <button
                  onClick={() => setConsultationType('TELEMEDICINE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    consultationType === 'TELEMEDICINE'
                      ? 'bg-indigo-600 text-white shadow font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Video className="w-3 h-3" />
                  <span>استشارة مرئية</span>
                </button>
              </div>
            </div>

            {/* Dates Strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {availableDates.map((d) => (
                <button
                  key={d.date}
                  onClick={() => setSelectedDate(d.date)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition shrink-0 cursor-pointer border ${
                    selectedDate === d.date
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 border-teal-400 shadow-md font-black'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span className="block">{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 4: AI Suggested & Available Time Slots */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-black text-white">
                  المواعيد المتاحة والمقترحة بالذكاء الاصطناعي ({displayedSlots.length} موعد متاح)
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">
                مرتبة حسب درجة التوافق الفسيولوجي والاستقرار السريري
              </span>
            </div>

            {displayedSlots.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <CalendarX className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  لا توجد مواعيد متاحة تطابق الفلاتر المحددة في هذا اليوم.
                </p>
                <button
                  onClick={() => {
                    setSelectedDoctorId('all');
                    setSelectedSpecialty('all');
                    setConsultationType('ANY');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-teal-300 text-xs font-bold hover:bg-slate-700 transition"
                >
                  إعادة ضبط الفلاتر لعرض كافة المواعيد
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayedSlots.map((slot) => {
                  const isTopAI = slot.aiSuggested && (slot.aiOptimalityScore || 0) >= 90;

                  return (
                    <div
                      key={slot.id}
                      className={`p-4 rounded-2xl border transition relative space-y-3 ${
                        isTopAI
                          ? 'bg-gradient-to-br from-slate-950 via-slate-950 to-teal-950/30 border-teal-500/60 shadow-lg shadow-teal-500/5 hover:border-teal-400'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Top Badge */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-full font-bold">
                          {slot.period === 'MORNING'
                            ? 'صباحاً'
                            : slot.period === 'AFTERNOON'
                            ? 'بعد الظهر'
                            : 'مساءً'}
                        </span>

                        {isTopAI && (
                          <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2.5 py-0.5 rounded-full font-black flex items-center gap-1 shadow-sm">
                            <Sparkles className="w-3 h-3 text-teal-400" />
                            <span>{slot.aiOptimalityScore}% توافق سريري مثالي</span>
                          </span>
                        )}
                      </div>

                      {/* Doctor & Hospital Details */}
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white">{slot.doctorName}</h4>
                          <span className="text-[10px] text-slate-500 font-sans">
                            {slot.consultationType === 'IN_PERSON'
                              ? 'حضوري'
                              : slot.consultationType === 'TELEMEDICINE'
                              ? 'مرئي عن بُعد'
                              : 'حضوري / مرئي'}
                          </span>
                        </div>
                        <span className="text-[11px] text-teal-400 block mt-0.5">
                          {slot.doctorSpecialty}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {slot.hospital}
                        </span>
                      </div>

                      {/* Slot Time Box */}
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-teal-400" />
                          <span className="font-mono text-sm font-black text-white">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-sans">
                          {slot.date}
                        </span>
                      </div>

                      {/* AI Clinical Reasoning Rationale */}
                      {slot.aiRecommendationReasonAr && (
                        <div className="text-[10px] text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60 leading-relaxed">
                          <strong className="text-teal-400 block mb-0.5 font-bold flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            سبب التفضيل السريري:
                          </strong>
                          <span>{slot.aiRecommendationReasonAr}</span>
                        </div>
                      )}

                      {/* Booking Button */}
                      <button
                        onClick={() => setSelectedSlotForBooking(slot)}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer ${
                          isTopAI
                            ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-md font-black'
                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                        }`}
                      >
                        <span>تأكيد واختيار هذا الموعد</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* My Booked Appointments View */
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-indigo-400" />
              <span>قائمة مواعيدي السريرية المؤكدة والمجدولة</span>
            </h3>
            <button
              onClick={() => setActiveTab('book')}
              className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>+ حجز موعد جديد</span>
            </button>
          </div>

          {appointments.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-white">لا توجد مواعيد مسجلة حالياً</h4>
              <p className="text-xs text-slate-400">
                يمكنك الاستفادة من محرك الذكاء الاصطناعي لحجز موعدك القادم المتوافق مع حالتك الصحية.
              </p>
              <button
                onClick={() => setActiveTab('book')}
                className="mt-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs"
              >
                بدء حجز موعد الآن
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className={`bg-slate-900 border rounded-2xl p-5 shadow-lg space-y-3 transition ${
                    apt.status === 'CONFIRMED'
                      ? 'border-slate-800 hover:border-slate-700'
                      : 'border-slate-800/40 opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-950 text-teal-400 border border-teal-800 flex items-center justify-center font-bold">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{apt.doctorName}</h4>
                        <span className="text-xs text-teal-400">{apt.doctorSpecialty}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {apt.aiSuggestedSlot && (
                        <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-teal-400" />
                          مقترح بالذكاء الاصطناعي ({apt.aiCompatibilityScore}%)
                        </span>
                      )}

                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                          apt.status === 'CONFIRMED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {apt.status === 'CONFIRMED' ? 'مؤكد ومحجوز' : 'ملغي'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span>
                        التاريخ:{' '}
                        <strong className="text-white font-mono">
                          {apt.date} ({apt.startTime} - {apt.endTime})
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-slate-500" />
                      <span>
                        النوع:{' '}
                        <strong className="text-white">
                          {apt.consultationType === 'IN_PERSON' ? 'حضوري بالعيادة' : 'استشارة مرئية'}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span className="truncate">{apt.hospital}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl space-y-1 border border-slate-800/80">
                    <div>
                      <strong className="text-slate-400">سبب الزيارة: </strong>
                      <span>{apt.reasonForVisit}</span>
                    </div>

                    {apt.preparationInstructions && apt.preparationInstructions.length > 0 && (
                      <div className="pt-1 text-[11px] text-slate-400">
                        <strong className="text-teal-400">تعليمات التحضير: </strong>
                        <span>{apt.preparationInstructions.join(' • ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions for Confirmed Appointments */}
                  {apt.status === 'CONFIRMED' && (
                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800 gap-2">
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <Bell className="w-3.5 h-3.5 text-teal-400" />
                        <span>التذكير التلقائي: {apt.reminderEnabled ? 'مفعل عبر SMS والتطبيق' : 'معطل'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {apt.consultationType === 'TELEMEDICINE' && onNavigateToTelemedicine && (
                          <button
                            onClick={onNavigateToTelemedicine}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Video className="w-3 h-3" />
                            <span>فتح غرفة الاستشارة المرئية</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleCancelAppointment(apt.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-bold transition cursor-pointer"
                        >
                          إلغاء الموعد
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Booking Confirmation Dialog Modal */}
      {selectedSlotForBooking && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in text-right" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-w-lg w-full space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-black text-white">
                  تأكيد حجز الموعد السريري
                </h3>
              </div>
              <button
                onClick={() => setSelectedSlotForBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Doctor and Slot details */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">{selectedSlotForBooking.doctorName}</h4>
                  <span className="text-teal-400">{selectedSlotForBooking.doctorSpecialty}</span>
                </div>
                {selectedSlotForBooking.aiSuggested && (
                  <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal-400" />
                    <span>{selectedSlotForBooking.aiOptimalityScore}% توافق</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1 border-t border-slate-900 text-[11px]">
                <div>
                  <span className="text-slate-500 block">التاريخ والوقت:</span>
                  <strong className="text-white font-mono">
                    {selectedSlotForBooking.date} ({selectedSlotForBooking.startTime})
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">نوع المقابلة:</span>
                  <strong className="text-white">
                    {consultationType === 'TELEMEDICINE' || selectedSlotForBooking.consultationType === 'TELEMEDICINE'
                      ? 'استشارة مرئية عن بُعد'
                      : 'حضوري بالعيادة'}
                  </strong>
                </div>
              </div>

              <div className="text-slate-400 text-[11px] pt-1 border-t border-slate-900">
                <span className="text-slate-500 block">المنشأة الطبية:</span>
                <span className="text-slate-300 font-medium">{selectedSlotForBooking.hospital}</span>
              </div>
            </div>

            {/* Clinical Reason & Notes Input */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">سبب الزيارة المحدد:</label>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
                  {customReason || reasonForVisit}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  ملاحظات أو أسئلة إضافية تود إرسالها للطبيب (اختياري):
                </label>
                <textarea
                  rows={2}
                  value={patientNotes}
                  onChange={(e) => setPatientNotes(e.target.value)}
                  placeholder="مثال: أود استشارة الطبيب بشأن الجرعة المسائية وعلاقتها بانتظام النوم..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Reminder toggle */}
              <label className="flex items-center gap-2 cursor-pointer bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-300">
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="rounded text-teal-500 focus:ring-teal-500"
                />
                <Bell className="w-3.5 h-3.5 text-teal-400" />
                <span>إرسال تنبيهات وتذكيرات ذكية قبل الموعد عبر الرسائل القصيرة والتطبيق</span>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedSlotForBooking(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                تراجع
              </button>
              <button
                onClick={handleConfirmBooking}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/20 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>تأكيد الحجز النهائي</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Success Modal */}
      {bookingSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in text-right" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full text-center space-y-4 animate-scale-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">تم تأكيد حجز موعدك بنجاح!</h3>
              <p className="text-xs text-slate-400">
                تمت إضافة الموعد إلى سجلك الصحي الموثق وإخطار العيادة الطبية المعنية.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-right space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">الطبيب المعالج:</span>
                <strong className="text-white">{bookingSuccessModal.doctorName}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">الموعد والتوقيت:</span>
                <strong className="text-teal-400 font-mono">
                  {bookingSuccessModal.date} ({bookingSuccessModal.startTime})
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">المركز الطبي:</span>
                <span className="text-slate-300 truncate max-w-[200px]">{bookingSuccessModal.hospital}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  setBookingSuccessModal(null);
                  setActiveTab('my-appointments');
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-black text-xs cursor-pointer"
              >
                عرض في قائمة مواعيدي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
