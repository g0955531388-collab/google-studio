import React, { useState } from 'react';
import { X, Lock, User, Mail, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { authService } from '../../services/authService';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>('patient');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [is2FAStage, setIs2FAStage] = useState(false);

  const session = authService.getSession();

  if (!isOpen) return null;

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!is2FAStage) {
      // Advance to 2FA step
      setIs2FAStage(true);
      return;
    }

    // Complete login/register
    authService.login(email || 'user@lifex-health.org', role, name);
    setIs2FAStage(false);
    onSuccess();
    onClose();
  };

  const handleQuickSwitchRole = (newRole: UserRole) => {
    authService.switchRole(newRole);
    onSuccess();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-base text-white">
              {is2FAStage
                ? 'التحقق الثنائي (2FA Verification)'
                : mode === 'login'
                ? 'تسجيل الدخول الآمن'
                : 'إنشاء حساب في الشبكة الصحية'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Switch Role Bar */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
          <span className="text-[11px] font-bold text-slate-400 block">
            تبديل فوري للدور السريري (RBAC Testing):
          </span>
          <div className="grid grid-cols-3 gap-1.5 font-bold text-[11px]">
            <button
              onClick={() => handleQuickSwitchRole('patient')}
              className="p-1.5 rounded-lg bg-teal-950 text-teal-300 border border-teal-800 hover:bg-teal-900 transition"
            >
              المريض (Patient)
            </button>
            <button
              onClick={() => handleQuickSwitchRole('doctor')}
              className="p-1.5 rounded-lg bg-blue-950 text-blue-300 border border-blue-800 hover:bg-blue-900 transition"
            >
              الطبيب (Doctor)
            </button>
            <button
              onClick={() => handleQuickSwitchRole('hospital')}
              className="p-1.5 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 hover:bg-indigo-900 transition"
            >
              المستشفى (Hospital)
            </button>
            <button
              onClick={() => handleQuickSwitchRole('laboratory')}
              className="p-1.5 rounded-lg bg-purple-950 text-purple-300 border border-purple-800 hover:bg-purple-900 transition"
            >
              المختبر (Lab)
            </button>
            <button
              onClick={() => handleQuickSwitchRole('pharmacy')}
              className="p-1.5 rounded-lg bg-pink-950 text-pink-300 border border-pink-800 hover:bg-pink-900 transition"
            >
              الصيدلية (Pharmacy)
            </button>
            <button
              onClick={() => handleQuickSwitchRole('administrator')}
              className="p-1.5 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900 transition"
            >
              الإدارة (Admin)
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs sm:text-sm">
          {!is2FAStage ? (
            <>
              {mode === 'register' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">الاسم الكامل *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: د. حسام النجار أو ريم سالم"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">البريد الإلكتروني المعتمد *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@lifex-health.org"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">نوع الكيان / الدور (Role) *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  <option value="patient">مريض أو فرد عائلة (Patient)</option>
                  <option value="doctor">طبيب معتمد (Physician / Specialist)</option>
                  <option value="hospital">مستشفى أو مركز جراحي (Hospital)</option>
                  <option value="laboratory">مختبر تشخيصي (Laboratory)</option>
                  <option value="pharmacy">صيدلية وصرف دواء (Pharmacy)</option>
                  <option value="administrator">مدير المنظومة والامتثال (Admin)</option>
                </select>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-teal-950/40 border border-teal-800 rounded-xl text-xs text-teal-300">
                تم إرسال رمز التحقق الثنائي (2FA OTP) المكون من 6 أرقام إلى جهازك المسجل لضمان حماية السجلات السريرية.
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">أدخل رمز 2FA (مثال: 849201) *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="849201"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-center tracking-widest font-mono text-lg text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-teal-950 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{is2FAStage ? 'تأكيد الرمز والدخول' : 'متابعة المصادقة'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="border-t border-slate-800 pt-3 text-center text-xs text-slate-400">
          {mode === 'login' ? (
            <button
              onClick={() => {
                setMode('register');
                setIs2FAStage(false);
              }}
              className="text-teal-400 hover:underline"
            >
              ليس لديك حساب؟ إنشاء حساب جديد في الشبكة
            </button>
          ) : (
            <button
              onClick={() => {
                setMode('login');
                setIs2FAStage(false);
              }}
              className="text-teal-400 hover:underline"
            >
              لديك حساب بالفعل؟ تسجيل الدخول
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
