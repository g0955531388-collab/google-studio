import React, { useState } from 'react';
import {
  Fingerprint,
  ScanFace,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Lock,
  Sparkles,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { biometricService } from '../../services/biometricService';
import { BiometricAuthMethod } from '../../types';

interface BiometricAuthOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
  patientId?: string;
}

export const BiometricAuthOverlay: React.FC<BiometricAuthOverlayProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'التحقق البيومتري للسجلات الحساسة (Biometric Security Step-Up)',
  description = 'مطلوب توثيق الهوية عبر البصمة البيومترية أو رمز الحماية لفتح السجلات الطبية الحساسة وتصدير البيانات.',
  patientId = 'pat-main',
}) => {
  const [method, setMethod] = useState<BiometricAuthMethod>('FINGERPRINT');
  const [scanState, setScanState] = useState<'IDLE' | 'SCANNING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pinValue, setPinValue] = useState<string>('');

  if (!isOpen) return null;

  const handleStartScan = async (simulateFail: boolean = false) => {
    setScanState('SCANNING');
    setErrorMessage(null);

    const res = await biometricService.authenticate(patientId, method, {
      pin: pinValue,
      simulateFailure: simulateFail,
    });

    if (res.success) {
      setScanState('SUCCESS');
      setTimeout(() => {
        onSuccess();
        onClose();
        setScanState('IDLE');
        setPinValue('');
      }, 700);
    } else {
      setScanState('ERROR');
      setErrorMessage(res.error || 'فشل التحقق البيومتري. يرجى إعادة المحاولة.');
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinValue.length < 4) {
      setErrorMessage('يرجى إدخال رمز مرور مكون من 4 أرقام على الأقل (الافتراضي: 1234)');
      return;
    }
    handleStartScan(false);
  };

  const resetToIdle = () => {
    setScanState('IDLE');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
        {/* Glow Accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-500/20 to-indigo-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-lg shadow-teal-500/10">
            {method === 'FINGERPRINT' ? (
              <Fingerprint className="w-9 h-9" />
            ) : method === 'FACE_ID' ? (
              <ScanFace className="w-9 h-9" />
            ) : (
              <KeyRound className="w-9 h-9" />
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-800/80 px-2.5 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
              <Cpu className="w-3 h-3 text-teal-400" />
              FIDO2 / Hardware Secure Enclave
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-white">{title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed px-2">{description}</p>
        </div>

        {/* Method Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setMethod('FINGERPRINT');
              resetToIdle();
            }}
            className={`py-2 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
              method === 'FINGERPRINT'
                ? 'bg-teal-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            <span>بصمة الإصبع</span>
          </button>

          <button
            onClick={() => {
              setMethod('FACE_ID');
              resetToIdle();
            }}
            className={`py-2 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
              method === 'FACE_ID'
                ? 'bg-teal-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ScanFace className="w-4 h-4" />
            <span>بصمة الوجه</span>
          </button>

          <button
            onClick={() => {
              setMethod('PIN');
              resetToIdle();
            }}
            className={`py-2 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
              method === 'PIN'
                ? 'bg-teal-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>رمز PIN</span>
          </button>
        </div>

        {/* Interactive Authentication Arena */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
          {/* FINGERPRINT MODE */}
          {method === 'FINGERPRINT' && (
            <div className="space-y-4">
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                {/* Concentric Scan Rings */}
                <div
                  className={`absolute inset-0 rounded-full border-2 transition-all duration-700 ${
                    scanState === 'SCANNING'
                      ? 'border-teal-400/80 animate-ping opacity-60'
                      : scanState === 'SUCCESS'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : scanState === 'ERROR'
                      ? 'border-rose-500 bg-rose-500/10'
                      : 'border-slate-800'
                  }`}
                />

                <button
                  type="button"
                  disabled={scanState === 'SCANNING' || scanState === 'SUCCESS'}
                  onClick={() => handleStartScan(false)}
                  className={`w-24 h-24 rounded-full flex flex-col items-center justify-center transition active:scale-95 cursor-pointer relative overflow-hidden shadow-xl ${
                    scanState === 'SCANNING'
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-400/60'
                      : scanState === 'SUCCESS'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : scanState === 'ERROR'
                      ? 'bg-rose-950/50 text-rose-300 border border-rose-500'
                      : 'bg-slate-900 hover:bg-slate-800 text-teal-400 border border-slate-700 hover:border-teal-500'
                  }`}
                >
                  {scanState === 'SCANNING' && (
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-teal-300 to-transparent top-0 animate-bounce" />
                  )}

                  {scanState === 'SUCCESS' ? (
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  ) : (
                    <Fingerprint className={`w-12 h-12 ${scanState === 'SCANNING' ? 'animate-pulse' : ''}`} />
                  )}
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-white">
                  {scanState === 'SCANNING'
                    ? 'جاري فحص التردد الحيوي ومطابقة البصمة...'
                    : scanState === 'SUCCESS'
                    ? 'تم التحقق بنجاح! جاري فك تشفير السجلات...'
                    : scanState === 'ERROR'
                    ? 'فشل التحقق، انقر لإعادة الفحص'
                    : 'المس مستشعر البصمة للمطابقة البيومترية'}
                </p>
                <p className="text-[11px] text-slate-400">انقر فوق أيقونة البصمة لتنشيط مستشعر الجهاز</p>
              </div>
            </div>
          )}

          {/* FACE ID MODE */}
          {method === 'FACE_ID' && (
            <div className="space-y-4">
              <div className="relative w-32 h-32 mx-auto rounded-2xl border-2 border-dashed border-teal-500/40 p-2 flex items-center justify-center bg-slate-900/50">
                {/* Viewfinder Corners */}
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-teal-400" />
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-teal-400" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-teal-400" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-teal-400" />

                {scanState === 'SCANNING' && (
                  <div className="absolute inset-x-2 h-0.5 bg-teal-400 shadow-[0_0_8px_#14b8a6] top-2 animate-pulse" />
                )}

                <button
                  type="button"
                  disabled={scanState === 'SCANNING' || scanState === 'SUCCESS'}
                  onClick={() => handleStartScan(false)}
                  className="w-full h-full rounded-xl flex items-center justify-center hover:bg-slate-800/50 transition cursor-pointer text-teal-400"
                >
                  {scanState === 'SUCCESS' ? (
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                  ) : (
                    <ScanFace className={`w-14 h-14 ${scanState === 'SCANNING' ? 'animate-pulse text-teal-300' : ''}`} />
                  )}
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-white">
                  {scanState === 'SCANNING'
                    ? 'جاري التقاط ملامح الوجه ومطابقة النقاط ثلاثية الأبعاد...'
                    : scanState === 'SUCCESS'
                    ? 'تم توثيق ملامح الوجه بنجاح!'
                    : 'انقر على إطار الكاميرا لبدء مطابقة الوجه'}
                </p>
                <p className="text-[11px] text-slate-400">تستخدم خوارزمية TrueDepth المقاومة للصور المزيفة</p>
              </div>
            </div>
          )}

          {/* PIN MODE */}
          {method === 'PIN' && (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-bold block">رمز الأمان السريري (Clinical Passcode):</label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="••••"
                  value={pinValue}
                  onChange={(e) => {
                    setPinValue(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-36 mx-auto text-center tracking-[0.5em] text-lg font-mono font-bold bg-slate-900 border border-slate-700 rounded-xl py-2 text-white focus:outline-none focus:border-teal-500"
                />
                <p className="text-[11px] text-slate-500">الرمز التجريبي الافتراضي: 1234</p>
              </div>

              <button
                type="submit"
                disabled={scanState === 'SCANNING' || pinValue.length < 4}
                className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-md"
              >
                {scanState === 'SCANNING' ? 'جاري التحقق من الرمز...' : 'تأكيد الرمز وفتح السجلات'}
              </button>
            </form>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => handleStartScan(false)}
                className="text-[11px] text-rose-300 underline font-bold cursor-pointer shrink-0"
              >
                إعادة المحاولة
              </button>
            </div>
          )}
        </div>

        {/* Security & Enclave Footnote */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>بيانات القياس الحيوي لا تغادر جهازك أبداً</span>
          </div>

          <button
            type="button"
            onClick={() => handleStartScan(true)}
            className="text-[10px] text-slate-500 hover:text-amber-400 transition cursor-pointer underline"
            title="اختبار سلوك النظام عند تعذر المطابقة"
          >
            تجربة فشل المسح (Simulate Failure)
          </button>
        </div>
      </div>
    </div>
  );
};
