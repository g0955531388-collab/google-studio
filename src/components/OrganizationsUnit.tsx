import React, { useState } from 'react';
import {
  Building2,
  Search,
  Filter,
  PlusCircle,
  FileText,
  HeartHandshake,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  Users,
  Award,
  UploadCloud,
  FileUp,
  X,
  Send,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { Organization, OrganizationCategory, JoinApplication, AssistanceRequest } from '../types';

const INITIAL_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-1',
    name: 'اتحاد الأطباء للإغاثة الإنسانية والعمليات الجراحية',
    type: 'union',
    typeAr: 'اتحاد طبي إنساني',
    category: 'medical_aid',
    categoryAr: 'كفالة علاج وجراحة',
    licenseNumber: 'UN-MED-8834',
    country: 'سورية',
    city: 'دمشق واللاذقية',
    phone: '+963 11 2233445',
    email: 'doctors.relief@lifex-ai.org',
    website: 'https://relief.lifex-ai.org',
    descriptionAr:
      'اتحاد طبي تخصصي يضم نخبة من الجراحين والاستشاريين لتغطية العمليات القلبية والجراحية الدقيقة للأسر غير القادرة وكفالة المستلزمات الطبية الحرجة.',
    beneficiariesCount: 14200,
    activeProjectsCount: 18,
    acceptsVolunteers: true,
    acceptsAssistanceRequests: true,
    verified: true,
    logoColor: 'from-blue-600 to-indigo-800',
  },
  {
    id: 'org-2',
    name: 'جمعية الحياة لتأمين أدوية الأمراض المزمنة والسرطان',
    type: 'charity',
    typeAr: 'جمعية خيرية معتمدة',
    category: 'medication_supply',
    categoryAr: 'تأمين أدوية ومستلزمات',
    licenseNumber: 'CH-PHARM-4412',
    country: 'سورية',
    city: 'حلب واللاذقية وحمص',
    phone: '+963 21 8899001',
    email: 'meds.charity@lifex-ai.org',
    descriptionAr:
      'مؤسسة صيدلانية إنسانية تتولى صرف الأدوية الشهرية التخصصية، هرمونات النمو، أدوية الأورام، والإنسولين للأطفال وكبار السن بالمجان.',
    beneficiariesCount: 8900,
    activeProjectsCount: 12,
    acceptsVolunteers: true,
    acceptsAssistanceRequests: true,
    verified: true,
    logoColor: 'from-emerald-600 to-teal-800',
  },
  {
    id: 'org-3',
    name: 'مؤسسة الأمل للكراسي والأطراف الصناعية وإعادة التأهيل',
    type: 'foundation',
    typeAr: 'مؤسسة وقفية وتأهيلية',
    category: 'disability_rehab',
    categoryAr: 'كراسي وأطراف صناعية ورعاية ذوي الإعاقة',
    licenseNumber: 'FD-DISAB-1109',
    country: 'سورية',
    city: 'اللاذقية وطرطوس',
    phone: '+963 41 5566778',
    email: 'hope.rehab@lifex-ai.org',
    descriptionAr:
      'توفير الأطراف الصناعية الذكية، الكراسي المتحركة الكهربائية، المعينات السمعية والبصرية، وجلسات العلاج الفيزيائي والنفسي لتمكين ذوي الهمم.',
    beneficiariesCount: 6150,
    activeProjectsCount: 9,
    acceptsVolunteers: true,
    acceptsAssistanceRequests: true,
    verified: true,
    logoColor: 'from-amber-600 to-orange-800',
  },
  {
    id: 'org-4',
    name: 'جمعية البلسم لرعاية مرضى الفشل الكلوي وغسيل الكلى',
    type: 'charity',
    typeAr: 'جمعية صحية تخصصية',
    category: 'dialysis_chronic',
    categoryAr: 'غسيل كلى ورعاية مزمنة',
    licenseNumber: 'CH-RENAL-9921',
    country: 'سورية',
    city: 'دمشق وريفها',
    phone: '+963 11 9911223',
    email: 'dialysis.balsam@lifex-ai.org',
    descriptionAr:
      'كفالة جلسات الديلزة وغسيل الكلى، تأمين الفلاتر والمستهلكات الوريدية، ومتابعة برامج زراعة الكلى للمرضى من ذوي الدخل المحدود.',
    beneficiariesCount: 3400,
    activeProjectsCount: 6,
    acceptsVolunteers: true,
    acceptsAssistanceRequests: true,
    verified: true,
    logoColor: 'from-cyan-600 to-blue-800',
  },
  {
    id: 'org-5',
    name: 'مؤسسة الرعاية الشاملة للأيتام والأسر المتعففة',
    type: 'institution',
    typeAr: 'مؤسسة رعاية اجتماعية وصحية',
    category: 'orphan_family_care',
    categoryAr: 'رعاية أيتام وأسر محتاجة',
    licenseNumber: 'IN-ORPH-3342',
    country: 'سورية والمنطقة',
    city: 'حماة واللاذقية ودمشق',
    phone: '+963 33 4455667',
    email: 'care.orphans@lifex-ai.org',
    descriptionAr:
      'كفالة صحية وغذائية وتعليمية متكاملة للأيتام وأمهاتهم، مع توفير بطاقات التأمين الصحي الخيري الشامل داخل شبكة Lifex-AI.',
    beneficiariesCount: 19800,
    activeProjectsCount: 22,
    acceptsVolunteers: true,
    acceptsAssistanceRequests: true,
    verified: true,
    logoColor: 'from-rose-600 to-pink-800',
  },
];

export default function OrganizationsUnit() {
  const [organizations, setOrganizations] = useState<Organization[]>(INITIAL_ORGANIZATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal States
  const [isRegisterOrgOpen, setIsRegisterOrgOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isAssistanceModalOpen, setIsAssistanceModalOpen] = useState(false);
  const [activeOrgForAction, setActiveOrgForAction] = useState<Organization | null>(null);

  // Success Notification state
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // New Organization Form State (similar to doctor/pharmacist onboarding)
  const [orgFormData, setOrgFormData] = useState({
    name: '',
    type: 'charity' as Organization['type'],
    category: 'medical_aid' as OrganizationCategory,
    licenseNumber: '',
    country: 'سورية',
    city: '',
    phone: '',
    email: '',
    descriptionAr: '',
  });

  // Join Application Form State (with CV)
  const [joinFormData, setJoinFormData] = useState({
    applicantName: '',
    email: '',
    phone: '',
    profession: 'طبيب',
    specialty: '',
    yearsOfExperience: '3',
    cvFileName: '',
    motivationNotes: '',
  });

  // Assistance Request Form State
  const [assistanceFormData, setAssistanceFormData] = useState({
    beneficiaryName: '',
    nationalId: '',
    phone: '',
    assistanceType: 'surgery' as AssistanceRequest['assistanceType'],
    estimatedCost: '',
    conditionDescription: '',
    reportFileName: '',
  });

  const categories: { id: string; labelAr: string }[] = [
    { id: 'all', labelAr: 'جميع المؤسسات والاتحادات' },
    { id: 'medical_aid', labelAr: 'كفالة علاج وجراحة' },
    { id: 'medication_supply', labelAr: 'تأمين أدوية ومستلزمات' },
    { id: 'disability_rehab', labelAr: 'أطراف صناعية وذوي الإعاقة' },
    { id: 'dialysis_chronic', labelAr: 'غسيل كلى ورعاية مزمنة' },
    { id: 'orphan_family_care', labelAr: 'رعاية أيتام وأسر محتاجة' },
  ];

  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch =
      org.name.includes(searchQuery) ||
      org.descriptionAr.includes(searchQuery) ||
      org.city.includes(searchQuery) ||
      org.licenseNumber.includes(searchQuery);
    const matchesCategory = selectedCategory === 'all' || org.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle Organization Registration
  const handleRegisterOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgFormData.name || !orgFormData.licenseNumber || !orgFormData.email) {
      alert('يرجى ملء الحقول الإلزامية لتوثيق المؤسسة.');
      return;
    }

    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name: orgFormData.name,
      type: orgFormData.type,
      typeAr:
        orgFormData.type === 'charity'
          ? 'جمعية خيرية معتمدة'
          : orgFormData.type === 'union'
          ? 'اتحاد مهني طبي'
          : orgFormData.type === 'foundation'
          ? 'مؤسسة وقفية'
          : 'مؤسسة رعاية صحية',
      category: orgFormData.category,
      categoryAr:
        categories.find((c) => c.id === orgFormData.category)?.labelAr || 'رعاية صحية وإنسانية',
      licenseNumber: orgFormData.licenseNumber,
      country: orgFormData.country,
      city: orgFormData.city || 'اللاذقية',
      phone: orgFormData.phone || '+963 9X XXX XXXX',
      email: orgFormData.email,
      descriptionAr: orgFormData.descriptionAr || 'مؤسسة إنسانية مسجلة حديثاً في شبكة Lifex-AI الصحية.',
      beneficiariesCount: 0,
      activeProjectsCount: 1,
      acceptsVolunteers: true,
      acceptsAssistanceRequests: true,
      verified: true,
      logoColor: 'from-teal-600 to-cyan-800',
    };

    setOrganizations([newOrg, ...organizations]);
    setIsRegisterOrgOpen(false);
    setSuccessBanner(
      `تهانينا! تم إنشاء حساب واعتماد مؤسسة "${newOrg.name}" برقم الترخيص (${newOrg.licenseNumber}) ضمن شبكة Lifex-AI بنجاح.`
    );
    setTimeout(() => setSuccessBanner(null), 6000);
  };

  // Handle Join Application Submit
  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinFormData.applicantName || !joinFormData.phone) {
      alert('يرجى ملء الاسم ورقم الهاتف.');
      return;
    }

    setIsJoinModalOpen(false);
    setSuccessBanner(
      `تم استلام طلب انتسابك إلى (${activeOrgForAction?.name}) مع ملف السيرة الذاتية (${
        joinFormData.cvFileName || 'CV_Uploaded.pdf'
      }) بنجاح. سيتم التواصل معك عبر الهاتف/البريد خلال 48 ساعة.`
    );
    setJoinFormData({
      applicantName: '',
      email: '',
      phone: '',
      profession: 'طبيب',
      specialty: '',
      yearsOfExperience: '3',
      cvFileName: '',
      motivationNotes: '',
    });
    setTimeout(() => setSuccessBanner(null), 7000);
  };

  // Handle Assistance Request Submit
  const handleAssistanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistanceFormData.beneficiaryName || !assistanceFormData.phone) {
      alert('يرجى إدخال اسم المستفيد ورقم الهاتف.');
      return;
    }

    const trackingCode = `REQ-${Math.floor(100000 + Math.random() * 900000)}`;
    setIsAssistanceModalOpen(false);
    setSuccessBanner(
      `تم تسجيل طلب المساعدة الإنسانية بنجاح لدى (${activeOrgForAction?.name})! كود التتبع السري لطلبك هو: [${trackingCode}]. تم ربط التقارير الطبية بملف الحالة.`
    );
    setAssistanceFormData({
      beneficiaryName: '',
      nationalId: '',
      phone: '',
      assistanceType: 'surgery',
      estimatedCost: '',
      conditionDescription: '',
      reportFileName: '',
    });
    setTimeout(() => setSuccessBanner(null), 8000);
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/60 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  وحدة المنظمات والاتحادات والمؤسسات والجمعيات الخيرية
                </h1>
                <p className="text-xs sm:text-sm text-indigo-200">
                  شبكة التكافل الطبي والإنساني العالمي المعتمدة ضمن منظومة Lifex-AI
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              تتيح هذه الوحدة استعراض كافة الجمعيات والاتحادات المنتسبة، البحث حسب التخصص الدقيق، تقديم طلبات
              الانتساب والتطوع الطبي مع إرفاق السيرة الذاتية (CV)، أو تقديم طلبات كفالة العمليات والمساعدات العلاجية.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              id="btn-register-org"
              onClick={() => setIsRegisterOrgOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-950 flex items-center gap-2 transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إنشاء حساب مؤسسة / جمعية</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Alert Banner */}
      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs sm:text-sm font-semibold flex items-center gap-3 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="flex-1 leading-relaxed">{successBanner}</span>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Search and Category Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المؤسسة، الاختصاص، المدينة، أو رقم الترخيص..."
              className="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat.labelAr}
            </button>
          ))}
        </div>
      </div>

      {/* Organizations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOrgs.map((org) => (
          <div
            key={org.id}
            className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 space-y-4 transition shadow-lg flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Header Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${org.logoColor} flex items-center justify-center text-white font-black text-lg shadow-md shrink-0`}
                  >
                    {org.name.slice(0, 1)}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white leading-snug">{org.name}</h2>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900/50">
                        {org.typeAr}
                      </span>
                      <span className="text-[11px] text-slate-400">{org.categoryAr}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {org.verified && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-900/60 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" /> موثقة
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setOrganizations((prev) => prev.filter((o) => o.id !== org.id));
                      setSuccessBanner(`تم حذف منظومة ${org.name} بنجاح.`);
                      setTimeout(() => setSuccessBanner(null), 3500);
                    }}
                    className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition"
                    title="حذف هذه المنظومة / الجمعية"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed">{org.descriptionAr}</p>

              {/* Metadata row */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    الترخيص: <strong className="text-slate-200">{org.licenseNumber}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    المقر: <strong className="text-slate-200">{org.country} — {org.city}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    المستفيدون: <strong className="text-emerald-400">+{org.beneficiariesCount.toLocaleString()}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span>{org.phone}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setActiveOrgForAction(org);
                  setIsJoinModalOpen(true);
                }}
                className="py-2.5 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>طلب انتساب / تطوع (CV)</span>
              </button>

              <button
                onClick={() => {
                  setActiveOrgForAction(org);
                  setIsAssistanceModalOpen(true);
                }}
                className="py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>طلب مساعدة علاجية</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ================================================= */}
      {/* مودال 1: إنشاء حساب مؤسسة / جمعية / اتحاد */}
      {/* ================================================= */}
      {isRegisterOrgOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-5 sm:p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-white">تسجيل حساب مؤسسة أو جمعية خيرية جديدة</h3>
              </div>
              <button
                onClick={() => setIsRegisterOrgOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterOrgSubmit} className="space-y-3.5 text-xs">
              <p className="text-slate-400 leading-relaxed">
                إنشاء حساب المؤسسة شبيه بحسابات الصيادلة والأطباء في المنظومة، لتوثيق الصلاحيات وإدارة
                المساعدات والانتسابات بدقة.
              </p>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">اسم المؤسسة أو الجمعية الكامل *</label>
                <input
                  type="text"
                  required
                  value={orgFormData.name}
                  onChange={(e) => setOrgFormData({ ...orgFormData, name: e.target.value })}
                  placeholder="مثال: جمعية الشفاء للأورام وكفالة العلاج"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">نوع الكيان *</label>
                  <select
                    value={orgFormData.type}
                    onChange={(e) =>
                      setOrgFormData({ ...orgFormData, type: e.target.value as Organization['type'] })
                    }
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  >
                    <option value="charity">جمعية خيرية</option>
                    <option value="union">اتحاد مهني / طبي</option>
                    <option value="foundation">مؤسسة وقفية</option>
                    <option value="institution">مؤسسة رعاية صحية</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-200 mb-1">المجال / الاختصاص الإنساني *</label>
                  <select
                    value={orgFormData.category}
                    onChange={(e) =>
                      setOrgFormData({ ...orgFormData, category: e.target.value as OrganizationCategory })
                    }
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  >
                    <option value="medical_aid">كفالة علاج وجراحة</option>
                    <option value="medication_supply">تأمين أدوية ومستلزمات</option>
                    <option value="disability_rehab">كراسي وأطراف صناعية ورعاية ذوي الإعاقة</option>
                    <option value="dialysis_chronic">غسيل كلى ورعاية مزمنة</option>
                    <option value="orphan_family_care">رعاية أيتام وأسر محتاجة</option>
                    <option value="emergency_relief">إغاثة طوارئ وكوارث</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">رقم الترخيص الرسمي *</label>
                  <input
                    type="text"
                    required
                    value={orgFormData.licenseNumber}
                    onChange={(e) => setOrgFormData({ ...orgFormData, licenseNumber: e.target.value })}
                    placeholder="SY-NGO-XXXX"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-200 mb-1">المدينة والمقر الرئيسي *</label>
                  <input
                    type="text"
                    required
                    value={orgFormData.city}
                    onChange={(e) => setOrgFormData({ ...orgFormData, city: e.target.value })}
                    placeholder="مثال: اللاذقية، دمشق..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">البريد الإلكتروني الرسمي *</label>
                  <input
                    type="email"
                    required
                    value={orgFormData.email}
                    onChange={(e) => setOrgFormData({ ...orgFormData, email: e.target.value })}
                    placeholder="contact@org.org"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-200 mb-1">رقم الهاتف الرسمي *</label>
                  <input
                    type="tel"
                    required
                    value={orgFormData.phone}
                    onChange={(e) => setOrgFormData({ ...orgFormData, phone: e.target.value })}
                    placeholder="+963 9X XXX XXXX"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">نبذة عن نشاط ورسالة المؤسسة</label>
                <textarea
                  rows={2}
                  value={orgFormData.descriptionAr}
                  onChange={(e) => setOrgFormData({ ...orgFormData, descriptionAr: e.target.value })}
                  placeholder="وصف البرامج الطبية والإنسانية والفئات المستهدفة..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>

              {/* Document upload simulation */}
              <div className="p-3 bg-slate-950 border border-dashed border-slate-700 rounded-xl text-center space-y-1">
                <UploadCloud className="w-6 h-6 text-indigo-400 mx-auto" />
                <div className="font-semibold text-slate-200">إرفاق صورة الترخيص الرسمي أو قرار التأسيس (PDF, PNG)</div>
                <div className="text-[10px] text-slate-500">للتدقيق السريع والتفعيل ضمن الحسابات المعتمدة</div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterOrgOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  تأكيد وإنشاء الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* مودال 2: تقديم طلب انتساب / استبيان مع CV */}
      {/* ================================================= */}
      {isJoinModalOpen && activeOrgForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileUp className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-base text-white">استمارة الانتساب والتطوع الطبي</h3>
                  <p className="text-[11px] text-indigo-300">{activeOrgForAction.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsJoinModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-200 mb-1">الاسم الثلاثي لمقدم الطلب *</label>
                <input
                  type="text"
                  required
                  value={joinFormData.applicantName}
                  onChange={(e) => setJoinFormData({ ...joinFormData, applicantName: e.target.value })}
                  placeholder="مثال: د. سامر العلي"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">الصفة / المهنة *</label>
                  <select
                    value={joinFormData.profession}
                    onChange={(e) => setJoinFormData({ ...joinFormData, profession: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  >
                    <option value="طبيب">طبيب بشري</option>
                    <option value="صيدلي">صيدلي</option>
                    <option value="ممرض">تمريض وإسعاف</option>
                    <option value="إخصائي تأهيل">إخصائي أطراف / علاج فيزيائي</option>
                    <option value="إداري ومنسق ميداني">إداري ومنسق ميداني</option>
                    <option value="متطوع عام">متطوع إنساني عام</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-200 mb-1">سنوات الخبرة *</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={joinFormData.yearsOfExperience}
                    onChange={(e) => setJoinFormData({ ...joinFormData, yearsOfExperience: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">البريد الإلكتروني *</label>
                  <input
                    type="email"
                    required
                    value={joinFormData.email}
                    onChange={(e) => setJoinFormData({ ...joinFormData, email: e.target.value })}
                    placeholder="applicant@example.com"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-200 mb-1">رقم الهاتف للتواصل *</label>
                  <input
                    type="tel"
                    required
                    value={joinFormData.phone}
                    onChange={(e) => setJoinFormData({ ...joinFormData, phone: e.target.value })}
                    placeholder="+963 9X XXX XXXX"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>
              </div>

              {/* CV Upload Field */}
              <div className="p-3 bg-slate-950 border border-indigo-500/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">إرفاق السيرة الذاتية (CV / Resume) *</span>
                  <span className="text-[10px] text-indigo-400">PDF, DOCX (أقصى حجم 10MB)</span>
                </div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setJoinFormData({
                        ...joinFormData,
                        cvFileName: e.target.files[0].name,
                      });
                    }
                  }}
                  className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:font-bold"
                />
                {joinFormData.cvFileName && (
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> تم اختيار الملف: {joinFormData.cvFileName}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">رسالة الدافع ومجالات الرغبة بالتطوع</label>
                <textarea
                  rows={2}
                  value={joinFormData.motivationNotes}
                  onChange={(e) => setJoinFormData({ ...joinFormData, motivationNotes: e.target.value })}
                  placeholder="حدد رغبتك بالعيادات الميدانية، الاستشارات عن بعد، أو الدعم اللوجستي..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  إرسال طلب الانتساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* مودال 3: تقديم استبيان طلب مساعدة إنسانية / علاجية */}
      {/* ================================================= */}
      {isAssistanceModalOpen && activeOrgForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-base text-white">استبيان طلب مساعدة علاجية أو مستلزمات</h3>
                  <p className="text-[11px] text-emerald-300">مقدمة إلى: {activeOrgForAction.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAssistanceModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssistanceSubmit} className="space-y-3.5 text-xs">
              <p className="text-slate-400 leading-relaxed">
                يتم تدقيق كافة البيانات الطبية والتقارير بسرية تامة من قبل اللجنة الطبية للمؤسسة.
              </p>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">اسم المريض / المستفيد *</label>
                <input
                  type="text"
                  required
                  value={assistanceFormData.beneficiaryName}
                  onChange={(e) =>
                    setAssistanceFormData({ ...assistanceFormData, beneficiaryName: e.target.value })
                  }
                  placeholder="اسم المريض الرباعي"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">نوع المساعدة المطلوبة *</label>
                  <select
                    value={assistanceFormData.assistanceType}
                    onChange={(e) =>
                      setAssistanceFormData({
                        ...assistanceFormData,
                        assistanceType: e.target.value as AssistanceRequest['assistanceType'],
                      })
                    }
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  >
                    <option value="surgery">تغطية عملية جراحية</option>
                    <option value="medications">تأمين أدوية مزمنة أو جرعات كيماوي</option>
                    <option value="medical_equipment">كرسي متحرك / طرف صناعي / أجهزة تنفس</option>
                    <option value="financial_aid">كفالة جلسات غسيل كلى أو علاج فيزيائي</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-200 mb-1">التكلفة التقديرية التقريبية</label>
                  <input
                    type="text"
                    value={assistanceFormData.estimatedCost}
                    onChange={(e) =>
                      setAssistanceFormData({ ...assistanceFormData, estimatedCost: e.target.value })
                    }
                    placeholder="مثال: 500,000 ل.س أو حسب الفاتورة"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">الرقم الوطني / المعرف الشخصي</label>
                  <input
                    type="text"
                    value={assistanceFormData.nationalId}
                    onChange={(e) =>
                      setAssistanceFormData({ ...assistanceFormData, nationalId: e.target.value })
                    }
                    placeholder="010XXXXXXXX"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-200 mb-1">رقم الهاتف الفعال للتواصل *</label>
                  <input
                    type="tel"
                    required
                    value={assistanceFormData.phone}
                    onChange={(e) =>
                      setAssistanceFormData({ ...assistanceFormData, phone: e.target.value })
                    }
                    placeholder="+963 9X XXX XXXX"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">شرح موجز للحالة والتشخيص الطبي *</label>
                <textarea
                  rows={2}
                  required
                  value={assistanceFormData.conditionDescription}
                  onChange={(e) =>
                    setAssistanceFormData({ ...assistanceFormData, conditionDescription: e.target.value })
                  }
                  placeholder="وصف الحالة، المستشفى المتابع، ونوع الدواء أو الجراحة المطلوبة عاجلاً..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>

              {/* Upload Medical Reports */}
              <div className="p-3 bg-slate-950 border border-emerald-500/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">إرفاق التقرير الطبي أو الوصفة المعتمدة *</span>
                  <span className="text-[10px] text-emerald-400">PDF, صور JPG/PNG</span>
                </div>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setAssistanceFormData({
                        ...assistanceFormData,
                        reportFileName: e.target.files[0].name,
                      });
                    }
                  }}
                  className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:font-bold"
                />
                {assistanceFormData.reportFileName && (
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> تم إرفاق الملف: {assistanceFormData.reportFileName}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAssistanceModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  تقديم طلب المساعدة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
