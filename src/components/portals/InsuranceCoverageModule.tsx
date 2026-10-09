import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  FileCheck2,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Building,
  Calendar,
  Clock,
  UserCheck,
  Stethoscope,
  ChevronRight,
  ArrowRight,
  Download,
  Send,
  Zap,
  Info,
  Check,
  X,
  Search,
  Receipt,
  FileSignature,
  Activity,
  Layers,
  Lock,
} from 'lucide-react';
import {
  InsurancePolicyRecord,
  InsuranceEligibilityVerificationResult,
  AutoCompletedBillingClaim,
  PatientAppointment,
  ClaimStatus,
} from '../../types';
import { dataService } from '../../services/dataService';
import { aiService } from '../../services/aiService';

interface InsuranceCoverageModuleProps {
  patientId?: string;
  patientName?: string;
  onNavigateToAppointments?: () => void;
}

export const InsuranceCoverageModule: React.FC<InsuranceCoverageModuleProps> = ({
  patientId = 'pat-main',
  patientName = 'أحمد فهد المنصوري',
  onNavigateToAppointments,
}) => {
  const [activeTab, setActiveTab] = useState<'verification' | 'claims' | 'policies'>('verification');

  // Policies and claims from DataService
  const [policies, setPolicies] = useState<InsurancePolicyRecord[]>([]);
  const [claims, setClaims] = useState<AutoCompletedBillingClaim[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<PatientAppointment[]>([]);

  // Selected policy for verification
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('');

  // Selected appointment to verify or auto-claim
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('custom');

  // Verification Form State
  const [serviceType, setServiceType] = useState<
    'CARDIOLOGY_CONSULTATION' | 'ENDOCRINOLOGY_CONSULTATION' | 'FAMILY_MEDICINE' | 'TELEMEDICINE' | 'LAB_WORK' | 'CHRONIC_PRESCRIPTION'
  >('CARDIOLOGY_CONSULTATION');
  const [doctorSpecialty, setDoctorSpecialty] = useState<string>('استشاري أمراض القلب والأوعية الدموية');
  const [hospitalName, setHospitalName] = useState<string>('مستشفى الملك فيصل التخصصي ومركز الأبحاث');
  const [reasonForVisit, setReasonForVisit] = useState<string>(
    'متابعة سريرية دورية لارتفاع ضغط الدم والدهون ومراجعة نتائج التحاليل'
  );

  // Verification Result State
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<InsuranceEligibilityVerificationResult | null>(null);

  // Auto-completed Claim State
  const [isAutoCompletingClaim, setIsAutoCompletingClaim] = useState<boolean>(false);
  const [activeGeneratedClaim, setActiveGeneratedClaim] = useState<AutoCompletedBillingClaim | null>(null);

  // Toast / feedback message
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Detailed Modal for Claim View & Submission
  const [viewingClaimModal, setViewingClaimModal] = useState<AutoCompletedBillingClaim | null>(null);

  const loadInitialData = () => {
    const loadedPolicies = dataService.getPatientInsurancePolicies(patientId);
    const loadedClaims = dataService.getPatientBillingClaims(patientId);
    const loadedAppointments = dataService.getPatientAppointments(patientId).filter(
      (a) => a.status === 'CONFIRMED'
    );

    setPolicies(loadedPolicies);
    setClaims(loadedClaims);
    setUpcomingAppointments(loadedAppointments);

    const activePolicy = loadedPolicies.find((p) => p.isActive) || loadedPolicies[0];
    if (activePolicy) {
      setSelectedPolicyId(activePolicy.id);
    }

    if (loadedAppointments.length > 0) {
      setSelectedAppointmentId(loadedAppointments[0].id);
      syncAppointmentDetails(loadedAppointments[0]);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [patientId]);

  const syncAppointmentDetails = (apt: PatientAppointment) => {
    setHospitalName(apt.hospital);
    setDoctorSpecialty(apt.doctorSpecialty);
    setReasonForVisit(apt.reasonForVisit);
    if (apt.doctorSpecialty.includes('القلب')) {
      setServiceType('CARDIOLOGY_CONSULTATION');
    } else if (apt.doctorSpecialty.includes('غدد') || apt.doctorSpecialty.includes('سكري')) {
      setServiceType('ENDOCRINOLOGY_CONSULTATION');
    } else if (apt.consultationType === 'TELEMEDICINE') {
      setServiceType('TELEMEDICINE');
    } else {
      setServiceType('FAMILY_MEDICINE');
    }
  };

  const handleAppointmentSelectChange = (aptId: string) => {
    setSelectedAppointmentId(aptId);
    if (aptId === 'custom') {
      setHospitalName('مستشفى الملك فيصل التخصصي ومركز الأبحاث');
      setDoctorSpecialty('استشاري أمراض القلب والأوعية الدموية');
      setReasonForVisit('متابعة دورية لحالة القلب وضغط الدم');
      setServiceType('CARDIOLOGY_CONSULTATION');
    } else {
      const apt = upcomingAppointments.find((a) => a.id === aptId);
      if (apt) {
        syncAppointmentDetails(apt);
      }
    }
  };

  const handleVerifyEligibility = async () => {
    setIsVerifying(true);
    setVerificationResult(null);
    try {
      const activePolicy = policies.find((p) => p.id === selectedPolicyId) || policies[0];
      const result = await aiService.verifyInsuranceEligibility({
        patientId,
        policyId: activePolicy?.id,
        appointmentId: selectedAppointmentId !== 'custom' ? selectedAppointmentId : undefined,
        serviceType,
        hospital: hospitalName,
        reasonForVisit,
        patientClinicalProfile: {
          chronicConditions: ['ارتفاع ضغط الدم الأولي', 'مقدمات سكري'],
          medications: ['Lisinopril 10mg', 'Metformin 500mg'],
          recentVitalsSummary: 'متوسط ضغط الدم 124/82 مم زئبق، معدل النبض 72 ن/د',
        },
      });

      setVerificationResult(result);
      setStatusNotification('✓ تم التحقق من الأهلية بنجاح واعتماد التغطية الطبية عبر منصة نفيس (NPHIES).');
      setTimeout(() => setStatusNotification(null), 5000);
    } catch (err) {
      console.error('Error verifying insurance eligibility:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAutoCompleteClaim = async () => {
    setIsAutoCompletingClaim(true);
    try {
      const targetApt = upcomingAppointments.find((a) => a.id === selectedAppointmentId);
      const activePolicy = policies.find((p) => p.id === selectedPolicyId) || policies[0];

      const claim = await aiService.autoCompleteBillingClaim({
        patientId,
        appointmentId: targetApt?.id,
        policyId: activePolicy?.id,
        doctorName: targetApt?.doctorName || 'د. سارة المنصور',
        doctorSpecialty,
        hospitalName,
        serviceDate: targetApt?.date || new Date().toISOString().slice(0, 10),
        reasonForVisit,
      });

      // Save claim to state and persistence
      const saved = dataService.saveBillingClaim(claim);
      setActiveGeneratedClaim(saved);
      setClaims(dataService.getPatientBillingClaims(patientId));
      setStatusNotification('✨ تم توليد وتعبئة المطالبة المالية آلياً وربط أكواد CPT و ICD-10 المعتمدة.');
      setTimeout(() => setStatusNotification(null), 5000);
    } catch (err) {
      console.error('Error auto-completing claim:', err);
    } finally {
      setIsAutoCompletingClaim(false);
    }
  };

  const handleSubmitClaim = (claimId: string) => {
    const updated = dataService.updateClaimStatus(claimId, 'SUBMITTED', patientId);
    if (updated) {
      setClaims(dataService.getPatientBillingClaims(patientId));
      if (viewingClaimModal && viewingClaimModal.id === claimId) {
        setViewingClaimModal(updated);
      }
      if (activeGeneratedClaim && activeGeneratedClaim.id === claimId) {
        setActiveGeneratedClaim(updated);
      }
      setStatusNotification('🚀 تم إرسال المطالبة المالية بنجاح إلى بوابة نفيس (NPHIES Gateway).');
      setTimeout(() => setStatusNotification(null), 5000);
    }
  };

  const activePolicy = policies.find((p) => p.id === selectedPolicyId) || policies[0];

  return (
    <div className="space-y-6 animate-fade-in text-right" dir="rtl">
      {/* Toast Alert */}
      {statusNotification && (
        <div className="p-4 bg-teal-950/90 border border-teal-500/60 rounded-2xl text-teal-200 text-xs font-bold flex items-center justify-between shadow-2xl animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{statusNotification}</span>
          </div>
          <button onClick={() => setStatusNotification(null)} className="text-teal-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-600 flex items-center justify-center text-slate-950 shadow-xl shadow-teal-500/20 font-black shrink-0">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-white">منظومة التأمين الصحي والفوترة الذكية</h2>
                <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-800 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-400" />
                  NPHIES AI Gateway
                </span>
                <span className="text-[10px] bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 rounded font-mono font-bold">
                  CCHI Compliant
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                التحقق الفوري والآلي من الأهلية التأمينية لمواعيدك القادمة وحساب نسبة التحمل (Co-pay) وتعبئة المطالبات المالية الرقمية بالذكاء الاصطناعي مع ربط أكواد CPT و ICD-10 التشخيصية.
              </p>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveTab('verification')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'verification'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>فحص الأهلية والتغطية</span>
            </button>

            <button
              onClick={() => setActiveTab('claims')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'claims'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>المطالبات المالية ({claims.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('policies')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'policies'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>وثائق التأمين ({policies.length})</span>
            </button>
          </div>
        </div>

        {/* Active Policy Highlight Bar */}
        {activePolicy && (
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">الوثيقة النشطة الحالية:</span>
              <strong className="text-white font-bold">{activePolicy.providerName}</strong>
              <span className="font-mono text-teal-400 text-[11px] bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800/60">
                {activePolicy.policyNumber}
              </span>
            </div>

            <div className="flex items-center gap-4 text-slate-400 text-[11px]">
              <span>نسبة التحمل: <strong className="text-emerald-400">{activePolicy.coPayPercentage}%</strong> (سقف {activePolicy.maxCoPayPerVisitSar} ر.س)</span>
              <span>•</span>
              <span>الرصيد المتاح: <strong className="text-teal-300 font-mono">{activePolicy.annualRemainingCoverageSar.toLocaleString()} ر.س</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: ELIGIBILITY VERIFICATION & CLAIMS AUTO-COMPLETION */}
      {activeTab === 'verification' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Input Configuration Column (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-teal-400" />
                  <h3 className="text-sm font-black text-white">بيانات الموعد والخدمة المراد التحقق منها</h3>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">Eligibility Query</span>
              </div>

              {/* Select Upcoming Appointment */}
              <div className="space-y-1.5 text-xs">
                <label className="text-slate-400 font-bold flex items-center justify-between">
                  <span>ربط بموعد قادم مجدول:</span>
                  {upcomingAppointments.length > 0 && (
                    <span className="text-[10px] text-teal-400 font-mono">
                      {upcomingAppointments.length} مواعيد مؤكدة
                    </span>
                  )}
                </label>
                <select
                  value={selectedAppointmentId}
                  onChange={(e) => handleAppointmentSelectChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-teal-500 transition cursor-pointer"
                >
                  <option value="custom">استشارة جديدة مخصصة (إدخال يدوي)</option>
                  {upcomingAppointments.map((apt) => (
                    <option key={apt.id} value={apt.id}>
                      {apt.date} ({apt.startTime}) - {apt.doctorName} ({apt.doctorSpecialty})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Policy */}
              <div className="space-y-1.5 text-xs">
                <label className="text-slate-400 font-bold">بوليصة التأمين المعتمدة:</label>
                <select
                  value={selectedPolicyId}
                  onChange={(e) => setSelectedPolicyId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-teal-500 transition cursor-pointer"
                >
                  {policies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.providerName} - {p.policyNumber} ({p.networkTierName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Type */}
              <div className="space-y-1.5 text-xs">
                <label className="text-slate-400 font-bold">نوع الخدمة الطبية (CCHI Service Category):</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-teal-500 transition cursor-pointer"
                >
                  <option value="CARDIOLOGY_CONSULTATION">عيادة أمراض القلب وتخطيط ECG</option>
                  <option value="ENDOCRINOLOGY_CONSULTATION">استشارة الغدد الصماء وتحاليل السكر</option>
                  <option value="FAMILY_MEDICINE">طب الأسرة والرعاية الوقائية</option>
                  <option value="TELEMEDICINE">استشارة افتراضية عن بُعد (Telehealth)</option>
                  <option value="LAB_WORK">فحوصات وتحاليل مخبرية CMP / Lipid</option>
                  <option value="CHRONIC_PRESCRIPTION">صرف وتغطية أدوية الأمراض المزمنة</option>
                </select>
              </div>

              {/* Hospital & Facility */}
              <div className="space-y-1.5 text-xs">
                <label className="text-slate-400 font-bold">المستشفى أو المركز الطبي:</label>
                <input
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Specialty & Reason */}
              <div className="space-y-1.5 text-xs">
                <label className="text-slate-400 font-bold">السبب السريري للزيارة (Clinical Indication):</label>
                <textarea
                  rows={2}
                  value={reasonForVisit}
                  onChange={(e) => setReasonForVisit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  onClick={handleVerifyEligibility}
                  disabled={isVerifying}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>جاري فحص الأهلية عبر بوابة نفيس الذكية...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>تحقق من الأهلية ونسبة التحمل بالذكاء الاصطناعي</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleAutoCompleteClaim}
                  disabled={isAutoCompletingClaim}
                  className="w-full py-2.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isAutoCompletingClaim ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-300" />
                      <span>جاري تعبئة أكواد الفوترة والمطالبة...</span>
                    </>
                  ) : (
                    <>
                      <FileSignature className="w-4 h-4 text-indigo-400" />
                      <span>توليد وتعبئة المطالبة المالية تلقائياً (Auto-Claim)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Context Card */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>حماية الخصوصية والتكامل السيادي</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                يتم التحقق وفق سياسة الأمان (POL-AI-INSURANCE-ELIGIBILITY) دون تسريب بياناتك الشخصية الحساسة لغير الجهات المصرح لها، مع دعم المعايير الرقمية لمنصة نفيس NPHIES وFHIR Claim.
              </p>
            </div>
          </div>

          {/* Right / Results Column (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* If Verified Result Available */}
            {verificationResult ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 animate-in fade-in">
                <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black text-white">النتيجة: الخدمة مؤهلة ومغطاة بالكامل</h4>
                        <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          ELIGIBLE
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 font-mono">
                        رقم مرجع نفيس: {verificationResult.verificationReferenceNumber} • معاملة #{verificationResult.nphiesTransactionId}
                      </div>
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <span className="text-[10px] text-slate-500 block">ثقة التحقق الذكي</span>
                    <span className="text-xs text-teal-400 font-mono font-bold">
                      {Math.round(verificationResult.aiVerificationConfidence * 100)}%
                    </span>
                  </div>
                </div>

                {/* Co-Pay and Financial Breakdown Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400">التكلفة التقديرية الكلية</span>
                    <div className="text-lg font-black text-white font-mono">
                      {verificationResult.estimatedTotalFeeSar} <span className="text-xs text-slate-400 font-normal">ر.س</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-800/40 space-y-1">
                    <span className="text-[11px] text-emerald-400 font-bold">المبلغ المغطى من التأمين</span>
                    <div className="text-lg font-black text-emerald-400 font-mono">
                      {verificationResult.coveredAmountSar} <span className="text-xs text-slate-400 font-normal">ر.س</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-amber-800/40 space-y-1">
                    <span className="text-[11px] text-amber-400 font-bold">مبلغ التحمل المطلوب (Co-Pay)</span>
                    <div className="text-lg font-black text-amber-400 font-mono">
                      {verificationResult.coPayAmountSar} <span className="text-xs text-slate-400 font-normal">ر.س</span>
                    </div>
                  </div>
                </div>

                {/* Coverage Details Description */}
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
                  <span className="font-bold text-white block">تفاصيل التغطية والموافقة الفورية:</span>
                  <p className="text-slate-300 leading-relaxed">
                    {verificationResult.coverageDetailsAr}
                  </p>
                  <p className="text-slate-400 text-[11px] pt-1 border-t border-slate-800/80">
                    <strong>المبرر الطبي (Medical Necessity):</strong> {verificationResult.clinicalMedicalNecessityAr}
                  </p>
                </div>

                {/* CPT & ICD-10 Codes Generated */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-white block">الأكواد السريرية والإجرائية المعتمدة للموعد:</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* CPT Codes */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <span className="text-[11px] text-indigo-400 font-bold block">أكواد الإجراءات الطبية (CPT-4 Codes):</span>
                      <div className="space-y-1.5">
                        {verificationResult.recommendedCptCodes.map((cpt) => (
                          <div key={cpt.code} className="flex items-center justify-between bg-slate-900/90 p-2 rounded-lg text-[11px]">
                            <div>
                              <strong className="text-teal-300 font-mono">{cpt.code}</strong>
                              <span className="text-slate-300 mr-2">{cpt.description}</span>
                            </div>
                            <span className="font-mono text-slate-400 shrink-0">{cpt.feeSar} ر.س</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ICD-10 Codes */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <span className="text-[11px] text-teal-400 font-bold block">أكواد التشخيص الطبي (ICD-10-AM):</span>
                      <div className="space-y-1.5">
                        {verificationResult.icd10DiagnosticCodes.map((icd) => (
                          <div key={icd.code} className="bg-slate-900/90 p-2 rounded-lg text-[11px] flex items-center justify-between">
                            <strong className="text-amber-400 font-mono">{icd.code}</strong>
                            <span className="text-slate-300 mr-2">{icd.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Patient Guidance Checklist */}
                <div className="space-y-2 bg-indigo-950/20 p-4 rounded-2xl border border-indigo-900/40">
                  <span className="text-xs font-bold text-indigo-200 block">إرشادات هامة للمريض عند زيارة العيادة:</span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {verificationResult.actionablePatientGuidanceAr.map((guide, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
                        <span>{guide}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              /* Placeholder before verification */
              <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-10 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h4 className="text-base font-bold text-white">لم يتم إجراء فحص الأهلية بعد</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    اختر الموعد المجدول أو الخدمة الطبية واضغط على "تحقق من الأهلية" لاستخراج موافقة نفيس اللحظية وحساب نسبة التحمل.
                  </p>
                </div>
              </div>
            )}

            {/* If Auto-Completed Claim Generated */}
            {activeGeneratedClaim && (
              <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border-2 border-indigo-500/50 rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-top-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">مطالبة مالية رقمية جاهزة للإرسال</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        معرّف المطالبة: {activeGeneratedClaim.id} • {activeGeneratedClaim.hospitalName}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] bg-indigo-900/80 text-indigo-300 border border-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
                    {activeGeneratedClaim.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">الطبيب المعالج</span>
                    <strong className="text-white">{activeGeneratedClaim.doctorName}</strong>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">التشخيص الأولي</span>
                    <strong className="text-teal-400 font-mono">{activeGeneratedClaim.primaryIcd10Code}</strong>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">مساهمة التأمين</span>
                    <strong className="text-emerald-400 font-mono">{activeGeneratedClaim.insurancePayableShareSar} ر.س</strong>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">مبلغ التحمل الشخصي</span>
                    <strong className="text-amber-400 font-mono">{activeGeneratedClaim.patientCoPayShareSar} ر.س</strong>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  {activeGeneratedClaim.aiAutoCompleteRationaleAr}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setViewingClaimModal(activeGeneratedClaim)}
                    className="text-xs text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>عرض التفاصيل الكاملة للأكواد والخدمات</span>
                    <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  </button>

                  <button
                    onClick={() => handleSubmitClaim(activeGeneratedClaim.id)}
                    disabled={activeGeneratedClaim.status === 'SUBMITTED'}
                    className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition active:scale-95 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {activeGeneratedClaim.status === 'SUBMITTED' ? 'تم الإرسال مسبقاً' : 'إرسال المطالبة إلكترونياً لنفيس'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BILLING CLAIMS DIRECTORY */}
      {activeTab === 'claims' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-teal-400" />
                <span>سجل المطالبات المالية الإلكترونية والموافقات المسبقة</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                المطالبات المولدة تلقائياً عبر الذكاء الاصطناعي والموثقة بسجل التدقيق السيادي
              </p>
            </div>

            <button
              onClick={() => setActiveTab('verification')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>توليد مطالبة جديدة لموعد قادم</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3.5 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{claim.hospitalName}</h4>
                      <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded">
                        {claim.serviceDate}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {claim.doctorName} • <span className="text-teal-400">{claim.doctorSpecialty}</span>
                    </p>
                  </div>

                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold font-mono ${
                      claim.status === 'PRE_APPROVED' || claim.status === 'SUBMITTED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                    }`}
                  >
                    {claim.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">إجمالي المطالبة</span>
                    <strong className="text-white font-mono">{claim.totalClaimAmountSar} ر.س</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">مساهمة التأمين</span>
                    <strong className="text-emerald-400 font-mono">{claim.insurancePayableShareSar} ر.س</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">تحمل المريض</span>
                    <strong className="text-amber-400 font-mono">{claim.patientCoPayShareSar} ر.س</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                    <span>ICD-10: <strong className="text-teal-300">{claim.primaryIcd10Code}</strong></span>
                    <span>•</span>
                    <span>{claim.cptServiceCodes.length} خدمات CPT</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewingClaimModal(claim)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold text-xs cursor-pointer transition"
                    >
                      معاينة
                    </button>

                    {claim.status !== 'SUBMITTED' && (
                      <button
                        onClick={() => handleSubmitClaim(claim.id)}
                        className="px-3 py-1 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg font-black text-xs cursor-pointer transition"
                      >
                        إرسال
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: INSURANCE POLICIES OVERVIEW */}
      {activeTab === 'policies' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-teal-400" />
              <span>وثائق التأمين الصحي الرقمية المسجلة (Health Insurance Policies)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              بيانات التغطية المعتمدة وحدود الاستهلاك السنوي لشبكات المستشفيات
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {policies.map((pol) => (
              <div
                key={pol.id}
                className={`p-6 rounded-3xl border transition relative space-y-5 ${
                  pol.isActive
                    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border-teal-500/60 shadow-xl'
                    : 'bg-slate-950/80 border-slate-800 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
                      {pol.networkClass}
                    </span>
                    <h4 className="text-lg font-black text-white mt-1.5">{pol.providerName}</h4>
                    <p className="text-xs text-slate-400">{pol.networkTierName}</p>
                  </div>

                  <div className="text-left">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        pol.isActive
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {pol.isActive ? 'وثيقة نشطة' : 'غير نشطة'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">رقم الوثيقة (Policy Number)</span>
                    <span className="text-white font-mono font-bold">{pol.policyNumber}</span>
                  </div>

                  <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">رقم العضوية (Member ID)</span>
                    <span className="text-white font-mono font-bold">{pol.memberId}</span>
                  </div>

                  <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">نسبة التحمل وسقف الزيارة</span>
                    <span className="text-emerald-400 font-bold">
                      {pol.coPayPercentage}% (سقف {pol.maxCoPayPerVisitSar} ر.س)
                    </span>
                  </div>

                  <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">الحد الأقصى السنوي</span>
                    <span className="text-teal-300 font-mono font-bold">
                      {pol.annualCoverageLimitSar.toLocaleString()} ر.س
                    </span>
                  </div>
                </div>

                {/* Covered Benefits Badges */}
                <div className="space-y-2">
                  <span className="text-[11px] text-slate-400 font-bold block">المنافع المغطاة:</span>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {pol.coveredBenefits.telemedicineConsultations && (
                      <span className="bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 text-slate-300">
                        الاستشارات المرئية
                      </span>
                    )}
                    {pol.coveredBenefits.inPersonSpecialist && (
                      <span className="bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 text-slate-300">
                        العيادات التخصصية
                      </span>
                    )}
                    {pol.coveredBenefits.cardiologyDiagnostics && (
                      <span className="bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 text-slate-300">
                        فحوصات القلب ECG
                      </span>
                    )}
                    {pol.coveredBenefits.chronicMedications && (
                      <span className="bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 text-slate-300">
                        أدوية الأمراض المزمنة
                      </span>
                    )}
                    {pol.coveredBenefits.endocrineLaboratory && (
                      <span className="bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 text-slate-300">
                        تحاليل السكر والغدد
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>الصلاحية: {pol.startDate} إلى {pol.expiryDate}</span>
                  <span className="font-mono text-[11px] text-teal-400">هاتف الطوارئ: {pol.emergencyApprovalHelpline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Claim Detail & Submission Modal */}
      {viewingClaimModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <Receipt className="w-6 h-6 text-teal-400" />
                <div>
                  <h3 className="text-base font-black text-white">تفاصيل المطالبة المالية الإلكترونية (NPHIES FHIR Claim)</h3>
                  <span className="text-xs text-slate-400 font-mono">ID: {viewingClaimModal.id}</span>
                </div>
              </div>

              <button
                onClick={() => setViewingClaimModal(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">المستشفى</span>
                <strong className="text-white">{viewingClaimModal.hospitalName}</strong>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">الطبيب المعالج</span>
                <strong className="text-white">{viewingClaimModal.doctorName} ({viewingClaimModal.doctorSpecialty})</strong>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">التشخيص الأساسي (ICD-10)</span>
                <strong className="text-teal-300 font-mono">{viewingClaimModal.primaryIcd10Code} - {viewingClaimModal.primaryIcd10Description}</strong>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">قناة الإرسال</span>
                <strong className="text-indigo-400 font-mono">{viewingClaimModal.claimSubmissionChannel}</strong>
              </div>
            </div>

            {/* CPT Codes List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-white block">الإجراءات والخدمات المفوترة:</span>
              <div className="space-y-2">
                {viewingClaimModal.cptServiceCodes.map((cpt) => (
                  <div key={cpt.code} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-teal-400 font-mono">{cpt.code}</strong>
                      <span className="text-slate-300 mr-2">{cpt.description}</span>
                    </div>
                    <div className="text-left font-mono">
                      <span className="text-white block">{cpt.standardFeeSar} ر.س</span>
                      <span className="text-[10px] text-emerald-400">مغطى: {cpt.coveredPortionSar} ر.س</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>إجمالي المبلغ:</span>
                <span className="font-mono">{viewingClaimModal.totalClaimAmountSar} ر.س</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>المبلغ المدفوع من شركة التأمين (90%):</span>
                <span className="font-mono">{viewingClaimModal.insurancePayableShareSar} ر.س</span>
              </div>
              <div className="flex justify-between text-amber-400 font-bold pt-2 border-t border-slate-800">
                <span>تحمل المريض (Co-Pay):</span>
                <span className="font-mono">{viewingClaimModal.patientCoPayShareSar} ر.س</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setViewingClaimModal(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-700"
              >
                إغلاق
              </button>

              {viewingClaimModal.status !== 'SUBMITTED' && (
                <button
                  onClick={() => handleSubmitClaim(viewingClaimModal.id)}
                  className="px-5 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>تأكيد الإرسال لبوابة نفيس</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
