import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

export const ContactSection: React.FC = () => {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 4000);
  };

  return (
    <section id="contact" className="py-16 bg-slate-900/40 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-950 text-teal-300 border border-teal-800/80">
            <Mail className="w-4 h-4 text-teal-400" />
            <span>التواصل الرسمي والدعم الفني</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            فريق الحوكمة والدعم الفني في خدمتكم
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            لأي استفسار تقني أو إداري حول انضمام المستشفيات والمختبرات والكوادر الصحية إلى الشبكة العالمية.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Details */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white">بيانات المنظومة الرسمية</h3>
              <p className="text-xs text-slate-400">
                منصة Lifex-AI مسجلة وتعمل بموجب اتفاقيات الخدمة واتفاقية مستوى الأداء (SLA 99.98%).
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3 text-slate-300">
                <Mail className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white">البريد الإلكتروني للإدارة:</strong>
                  <span>governance@lifex-health.org</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-slate-300">
                <Phone className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white">هاتف الدعم الفني المباشر:</strong>
                  <span>+963 11 000 9999 (خط الدعم السريري)</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-slate-300">
                <MapPin className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white">العقدة السحابية الرئيسية:</strong>
                  <span>المركز الإقليمي المعتمد لتبادل المعلومات الصحية</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 text-[11px] text-slate-400">
              <div className="text-slate-200">المالك: <strong className="text-teal-400">{t('owner')}</strong></div>
              <div className="text-slate-300">الإشراف: <strong className="text-indigo-400">{t('supervisor')}</strong></div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-8">
                <CheckCircle2 className="w-12 h-12 text-teal-400 animate-bounce" />
                <h4 className="text-lg font-bold text-white">تم استلام رسالتكم بنجاح</h4>
                <p className="text-xs text-slate-400 max-w-md">
                  سيقوم فريق الحوكمة والدعم الفني بمراجعة طلبكم والرد خلال 24 ساعة عبر البريد الإلكتروني.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">الاسم الكامل *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="د. / أ. ..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">البريد الإلكتروني *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@organization.org"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">موضوع الرسالة / نوع الاستفسار *</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="استفسار ربط مستشفى، اعتماد مختبر، أو دعم فني..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">نص الرسالة *</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="اكتب تفاصيل الاستفسار هنا..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>مراسلات مشفرة وفق معايير الأمان المؤسسي</span>
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-teal-950 flex items-center gap-2 transition active:scale-95 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال الرسالة</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
