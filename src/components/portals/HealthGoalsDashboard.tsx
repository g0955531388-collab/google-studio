import React, { useState } from 'react';
import {
  Target,
  Trophy,
  Flame,
  Plus,
  Check,
  CheckCircle2,
  Droplets,
  Footprints,
  Pill,
  Heart,
  Moon,
  Apple,
  Sparkles,
  TrendingUp,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  BarChart3,
  RotateCcw,
  Clock,
  Award,
  Activity,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { dataService } from '../../services/dataService';
import {
  HealthGoal,
  HealthGoalCategory,
  HealthGoalFrequency,
  CreateGoalInput,
} from '../../types';

interface HealthGoalsDashboardProps {
  patientId: string;
}

const PRESET_TEMPLATES: Array<CreateGoalInput & { icon: string; categoryName: string }> = [
  {
    title: 'زيادة الخطوات اليومية',
    titleEn: 'Increase Daily Steps',
    description: 'المشي بانتظام لتنشيط الدورة الدموية وتقوية عضلة القلب والحد من خمول الشرايين.',
    category: 'ACTIVITY',
    frequency: 'DAILY',
    targetValue: 8000,
    currentValue: 0,
    unit: 'خطوة',
    unitEn: 'steps',
    quickIncrements: [500, 1000, 2000],
    icon: 'Footprints',
    categoryName: 'نشاط بدني',
  },
  {
    title: 'الحفاظ على الترطيب اليومي',
    titleEn: 'Maintain Daily Hydration',
    description: 'شرب 2.5 لتر من الماء يومياً لدعم كفاءة الكلى وتوازن الأملاح في الجسم.',
    category: 'HYDRATION',
    frequency: 'DAILY',
    targetValue: 2500,
    currentValue: 0,
    unit: 'مل',
    unitEn: 'ml',
    quickIncrements: [250, 500, 750],
    icon: 'Droplets',
    categoryName: 'ترطيب وسوائل',
  },
  {
    title: 'الالتزام التام بجدول الأدوية',
    titleEn: '100% Medication Adherence',
    description: 'تناول جميع جرعات أدوية القلب وضغط الدم في مواعيدها دون تأخير أو تفويت.',
    category: 'MEDICATION',
    frequency: 'WEEKLY',
    targetValue: 7,
    currentValue: 0,
    unit: 'أيام التزام',
    unitEn: 'days',
    quickIncrements: [1],
    icon: 'Pill',
    categoryName: 'التزام دوائي',
  },
  {
    title: 'تمارين اللياقة الهوائية',
    titleEn: 'Aerobic Exercise',
    description: 'ممارسة 30 دقيقة يومياً من التمارين الهوائية المعتدلة كالمشي السريع أو الدراجة.',
    category: 'ACTIVITY',
    frequency: 'DAILY',
    targetValue: 30,
    currentValue: 0,
    unit: 'دقيقة',
    unitEn: 'mins',
    quickIncrements: [5, 10, 15],
    icon: 'Activity',
    categoryName: 'نشاط بدني',
  },
  {
    title: 'تنظيم ساعات النوم الصحي',
    titleEn: 'Consistent Restful Sleep',
    description: 'النوم العميق لمدة 8 ساعات ليلاً لدعم التعافي العصبي وتوازن الهرمونات.',
    category: 'SLEEP',
    frequency: 'DAILY',
    targetValue: 8,
    currentValue: 0,
    unit: 'ساعات',
    unitEn: 'hours',
    quickIncrements: [0.5, 1],
    icon: 'Moon',
    categoryName: 'نوم واستشفاء',
  },
  {
    title: 'استقرار ضغط الدم الانقباضي',
    titleEn: 'Systolic Blood Pressure Control',
    description: 'المحافظة على قراءة ضغط الدم الانقباضي عند 120 مم زئبق عند القياس اليومي.',
    category: 'VITALS',
    frequency: 'DAILY',
    targetValue: 120,
    currentValue: 0,
    unit: 'مم زئبق',
    unitEn: 'mmHg',
    quickIncrements: [1, 2, 5],
    icon: 'Heart',
    categoryName: 'مؤشرات حيوية',
  },
];

export const HealthGoalsDashboard: React.FC<HealthGoalsDashboardProps> = ({ patientId }) => {
  const [goals, setGoals] = useState<HealthGoal[]>(() => dataService.getHealthGoals(patientId));
  const [stats, setStats] = useState(() => dataService.getHealthGoalStats(patientId));
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | HealthGoalCategory>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  // Modals & expansion states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<HealthGoal | null>(null);
  const [expandedGoalHistoryId, setExpandedGoalHistoryId] = useState<string | null>(null);
  const [customLogGoalId, setCustomLogGoalId] = useState<string | null>(null);
  const [customLogValue, setCustomLogValue] = useState<string>('');
  const [customLogNote, setCustomLogNote] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New goal form state
  const [modalTab, setModalTab] = useState<'PRESETS' | 'CUSTOM'>('PRESETS');
  const [newTitle, setNewTitle] = useState('');
  const [newTitleEn, setNewTitleEn] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<HealthGoalCategory>('ACTIVITY');
  const [newFrequency, setNewFrequency] = useState<HealthGoalFrequency>('DAILY');
  const [newTargetValue, setNewTargetValue] = useState<number>(8000);
  const [newUnit, setNewUnit] = useState('خطوة');
  const [newUnitEn, setNewUnitEn] = useState('steps');
  const [newTargetDate, setNewTargetDate] = useState('');

  const refreshData = () => {
    setGoals(dataService.getHealthGoals(patientId));
    setStats(dataService.getHealthGoalStats(patientId));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Quick increment handler
  const handleQuickIncrement = (goal: HealthGoal, increment: number) => {
    const updated = dataService.logGoalProgressEntry(patientId, goal.id, increment, 'increment');
    if (updated) {
      refreshData();
      showToast(`✅ تمت إضافة ${increment} ${goal.unit} إلى "${goal.title}" بنجاح!`);
    }
  };

  // Custom log entry submission
  const handleCustomLogSubmit = (goalId: string) => {
    const val = parseFloat(customLogValue);
    if (isNaN(val)) return;

    const updated = dataService.updateHealthGoalProgress(patientId, goalId, val, customLogNote);
    if (updated) {
      refreshData();
      setCustomLogGoalId(null);
      setCustomLogValue('');
      setCustomLogNote('');
      showToast(`✅ تم تسجيل القيمة الجديدة (${val} ${updated.unit}) بنجاح!`);
    }
  };

  // Toggle status
  const handleToggleStatus = (goalId: string) => {
    const res = dataService.toggleGoalStatus(patientId, goalId);
    if (res) {
      refreshData();
      showToast(res.status === 'COMPLETED' ? '🎉 تم تعليم الهدف كمكتمل!' : '🔄 تم إعادة تنشيط الهدف.');
    }
  };

  // Delete goal
  const handleDeleteGoal = (goalId: string, title: string) => {
    if (confirm(`هل أنت متأكد من حذف الهدف: "${title}"؟`)) {
      dataService.deleteHealthGoal(patientId, goalId);
      refreshData();
      showToast('🗑️ تم حذف الهدف بنجاح.');
    }
  };

  // Create from preset
  const handleSelectPreset = (preset: (typeof PRESET_TEMPLATES)[0]) => {
    dataService.createHealthGoal(patientId, {
      ...preset,
      isCustom: false,
    });
    refreshData();
    setIsAddModalOpen(false);
    showToast(`🎯 تم تفعيل الهدف الجديد "${preset.title}" بنجاح!`);
  };

  // Create custom goal
  const handleCreateCustomGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newTargetValue <= 0) return;

    dataService.createHealthGoal(patientId, {
      title: newTitle.trim(),
      titleEn: newTitleEn.trim() || undefined,
      description: newDesc.trim() || undefined,
      category: newCategory,
      frequency: newFrequency,
      targetValue: newTargetValue,
      currentValue: 0,
      unit: newUnit.trim(),
      unitEn: newUnitEn.trim() || undefined,
      targetDate: newTargetDate || undefined,
      isCustom: true,
    });

    refreshData();
    setIsAddModalOpen(false);
    // Reset form
    setNewTitle('');
    setNewTitleEn('');
    setNewDesc('');
    setNewTargetValue(8000);
    showToast(`🎯 تم حفظ الهدف المخصص "${newTitle}" بنجاح!`);
  };

  // Update existing goal
  const handleSaveEditGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;

    dataService.updateHealthGoal(patientId, editingGoal.id, {
      title: editingGoal.title,
      titleEn: editingGoal.titleEn,
      description: editingGoal.description,
      targetValue: editingGoal.targetValue,
      unit: editingGoal.unit,
      frequency: editingGoal.frequency,
      targetDate: editingGoal.targetDate,
    });

    refreshData();
    setEditingGoal(null);
    showToast('💾 تم تحديث بيانات الهدف بنجاح.');
  };

  // Filtered goals
  const filteredGoals = goals.filter((g) => {
    if (categoryFilter !== 'ALL' && g.category !== categoryFilter) return false;
    if (statusFilter === 'ACTIVE' && (g.status !== 'ACTIVE' && g.currentValue >= g.targetValue)) return false;
    if (statusFilter === 'COMPLETED' && (g.status !== 'COMPLETED' && g.currentValue < g.targetValue)) return false;
    return true;
  });

  const getCategoryIcon = (category: HealthGoalCategory) => {
    switch (category) {
      case 'ACTIVITY':
        return <Footprints className="w-4 h-4 text-emerald-400" />;
      case 'HYDRATION':
        return <Droplets className="w-4 h-4 text-cyan-400" />;
      case 'MEDICATION':
        return <Pill className="w-4 h-4 text-amber-400" />;
      case 'VITALS':
        return <Heart className="w-4 h-4 text-rose-400" />;
      case 'SLEEP':
        return <Moon className="w-4 h-4 text-indigo-400" />;
      case 'NUTRITION':
        return <Apple className="w-4 h-4 text-lime-400" />;
      default:
        return <Activity className="w-4 h-4 text-teal-400" />;
    }
  };

  const getProgressColorClasses = (category: HealthGoalCategory, pct: number) => {
    if (pct >= 100) {
      return {
        bar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
        text: 'text-emerald-400',
        bg: 'bg-emerald-950/40',
        border: 'border-emerald-800/60',
      };
    }
    switch (category) {
      case 'ACTIVITY':
        return {
          bar: 'bg-gradient-to-r from-teal-500 to-emerald-400',
          text: 'text-emerald-400',
          bg: 'bg-emerald-950/30',
          border: 'border-emerald-900/50',
        };
      case 'HYDRATION':
        return {
          bar: 'bg-gradient-to-r from-cyan-500 to-sky-400',
          text: 'text-cyan-400',
          bg: 'bg-cyan-950/30',
          border: 'border-cyan-900/50',
        };
      case 'MEDICATION':
        return {
          bar: 'bg-gradient-to-r from-amber-500 to-yellow-400',
          text: 'text-amber-400',
          bg: 'bg-amber-950/30',
          border: 'border-amber-900/50',
        };
      case 'VITALS':
        return {
          bar: 'bg-gradient-to-r from-rose-500 to-pink-400',
          text: 'text-rose-400',
          bg: 'bg-rose-950/30',
          border: 'border-rose-900/50',
        };
      case 'SLEEP':
        return {
          bar: 'bg-gradient-to-r from-indigo-500 to-violet-400',
          text: 'text-indigo-400',
          bg: 'bg-indigo-950/30',
          border: 'border-indigo-900/50',
        };
      default:
        return {
          bar: 'bg-gradient-to-r from-teal-500 to-cyan-400',
          text: 'text-teal-400',
          bg: 'bg-slate-900',
          border: 'border-slate-800',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 bg-slate-900 border border-teal-500/50 text-teal-200 text-xs font-semibold rounded-xl flex items-center justify-between shadow-xl animate-fade-in">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Quick Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shadow-inner">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>لوحة الأهداف الصحية الشخصية</span>
                <span className="text-xs font-mono font-normal text-slate-400">Health Goals</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تحديد ومتابعة المستهدفات الوقائية (الخطوات، الترطيب، النوم، الأدوية) مع منحنيات تقدم بصرية.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-950/40 transition active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة هدف مخصص جديد (New Goal)</span>
        </button>
      </div>

      {/* Overview Analytics Bar (Zero-pill, clean typographic styling) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Total & Active Goals */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>الأهداف المتابعة</span>
            <Target className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{stats.activeGoals}</span>
            <span className="text-xs text-slate-400">نشطة من أصل {stats.totalGoals}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span>{stats.completedGoals} هدف محقق بالكامل</span>
          </div>
        </div>

        {/* Metric 2: Average Progress */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>متوسط الإنجاز الكلي</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">{stats.averageProgressPct}%</span>
            <span className="text-xs text-slate-400">لجميع الأهداف</span>
          </div>
          <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.averageProgressPct}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Longest Streak */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>أطول سلسلة التزام</span>
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">{stats.longestStreak}</span>
            <span className="text-xs text-slate-400">أيام متتالية (Days)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            <span>ثبات سريري ووقائي ممتاز</span>
          </div>
        </div>

        {/* Metric 4: Today's Logged Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>تسجيلات تقدم اليوم</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{stats.todayLoggedCount}</span>
            <span className="text-xs text-slate-400">من أصل {stats.totalGoals} هدف</span>
          </div>
          <div className="mt-2 text-[11px] text-cyan-400/80">
            <span>{stats.todayLoggedCount === stats.totalGoals ? '✓ تم تحديث جميع الأهداف اليوم' : 'تحديثات مستمرة على مدار اليوم'}</span>
          </div>
        </div>
      </div>

      {/* Filter and Category Segmented Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
        {/* Category filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: 'الكل' },
            { id: 'ACTIVITY', label: 'النشاط البدني' },
            { id: 'HYDRATION', label: 'الترطيب' },
            { id: 'MEDICATION', label: 'الأدوية' },
            { id: 'SLEEP', label: 'النوم' },
            { id: 'VITALS', label: 'العلامات الحيوية' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-teal-600 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1 self-end sm:self-auto bg-slate-950 p-1 rounded-lg border border-slate-800">
          {[
            { id: 'ALL', label: 'الكل' },
            { id: 'ACTIVE', label: 'قيد المتابعة' },
            { id: 'COMPLETED', label: 'المكتملة' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id as any)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition cursor-pointer ${
                statusFilter === st.id
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Health Goal Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGoals.map((goal) => {
          const pct = goal.targetValue > 0 ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)) : 0;
          const isCompleted = goal.status === 'COMPLETED' || goal.currentValue >= goal.targetValue;
          const styling = getProgressColorClasses(goal.category, pct);
          const isExpanded = expandedGoalHistoryId === goal.id;
          const isCustomLogging = customLogGoalId === goal.id;

          return (
            <div
              key={goal.id}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-lg flex flex-col justify-between transition ${
                isCompleted ? 'border-emerald-800/60 bg-gradient-to-b from-slate-900 to-emerald-950/20' : 'border-slate-800'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                      {getCategoryIcon(goal.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{goal.title}</h4>
                        {isCompleted && (
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded font-bold">
                            مكتمل
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{goal.frequency === 'DAILY' ? 'هدف يومي' : goal.frequency === 'WEEKLY' ? 'هدف أسبوعي' : 'هدف شهري'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{goal.titleEn || goal.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Streak & Edit Menu */}
                  <div className="flex items-center gap-1.5">
                    {goal.streakDays > 0 && (
                      <div
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-950/40 border border-amber-800/40 text-amber-300 text-xs font-bold"
                        title={`سلسلة التزام متواصلة لمدة ${goal.streakDays} أيام`}
                      >
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>{goal.streakDays}d</span>
                      </div>
                    )}
                    <button
                      onClick={() => setEditingGoal(goal)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      title="تعديل الهدف"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id, goal.title)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                      title="حذف الهدف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description if present */}
                {goal.description && (
                  <p className="text-xs text-slate-400 mt-2.5 line-clamp-2">
                    {goal.description}
                  </p>
                )}

                {/* Progress Bar & Numerical Metrics */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-white">{goal.currentValue.toLocaleString()}</span>
                      <span className="text-xs text-slate-400 font-semibold">/ {goal.targetValue.toLocaleString()} {goal.unit}</span>
                    </div>
                    <span className={`text-sm font-black ${styling.text}`}>
                      {pct}%
                    </span>
                  </div>

                  {/* Visual Progress Bar with gradient */}
                  <div className="relative w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800/80">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${styling.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                    {/* Milestones markers at 25%, 50%, 75% */}
                    <div className="absolute inset-0 flex justify-between px-1 pointer-events-none opacity-20">
                      <span className="w-0.5 h-full bg-white ml-[25%]" />
                      <span className="w-0.5 h-full bg-white ml-[50%]" />
                      <span className="w-0.5 h-full bg-white ml-[75%]" />
                    </div>
                  </div>

                  {/* Celebratory badge if completed */}
                  {isCompleted && (
                    <div className="mt-1 text-[11px] text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-950/30 p-1.5 rounded-lg border border-emerald-900/50">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>رائع! تم إنجاز المستهدف بالكامل بنجاح لهذا اليوم.</span>
                    </div>
                  )}
                </div>

                {/* Quick Add Increments Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-500 font-semibold">إضافة سريعة:</span>
                    {(goal.quickIncrements || [1]).map((inc) => (
                      <button
                        key={inc}
                        onClick={() => handleQuickIncrement(goal, inc)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-800 text-teal-300 hover:bg-slate-700 hover:text-white transition active:scale-95 cursor-pointer border border-slate-700/60"
                        title={`إضافة ${inc} ${goal.unit}`}
                      >
                        +{inc} {goal.unit}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setCustomLogGoalId(isCustomLogging ? null : goal.id);
                        setCustomLogValue(goal.currentValue.toString());
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition active:scale-95 cursor-pointer"
                    >
                      تعديل القيمة
                    </button>
                  </div>

                  {/* Toggle status */}
                  <button
                    onClick={() => handleToggleStatus(goal.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                      isCompleted
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50 border border-emerald-800/50'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isCompleted ? 'إعادة تنشيط' : 'اكتمل اليوم'}</span>
                  </button>
                </div>

                {/* Custom Log Inline Input Form */}
                {isCustomLogging && (
                  <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-teal-500/40 space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-300">تسجيل قيمة مخصصة</span>
                      <button onClick={() => setCustomLogGoalId(null)} className="text-slate-400 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={customLogValue}
                        onChange={(e) => setCustomLogValue(e.target.value)}
                        placeholder="القيمة الجديدة"
                        className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-400"
                      />
                      <input
                        type="text"
                        value={customLogNote}
                        onChange={(e) => setCustomLogNote(e.target.value)}
                        placeholder="ملاحظة (اختياري مثل: مشي بالحديقة)"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-400"
                      />
                      <button
                        onClick={() => handleCustomLogSubmit(goal.id)}
                        className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition active:scale-95 cursor-pointer shrink-0"
                      >
                        حفظ
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* History & Progression Trend Expander */}
              <div className="mt-3 pt-2">
                <button
                  onClick={() => setExpandedGoalHistoryId(isExpanded ? null : goal.id)}
                  className="w-full text-xs text-slate-400 hover:text-teal-300 flex items-center justify-between py-1 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>سجل التقدم والمنحنى البياني ({goal.progressHistory.length} تسجيلات)</span>
                  </span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {isExpanded && (
                  <div className="mt-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3 animate-fade-in">
                    {/* Mini Trend Chart */}
                    {goal.progressHistory.length > 1 ? (
                      <div className="h-28 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={goal.progressHistory}
                            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id={`color-${goal.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.6} />
                                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis
                              dataKey="date"
                              stroke="#64748b"
                              fontSize={10}
                              tickFormatter={(val) => val.slice(5)}
                            />
                            <YAxis stroke="#64748b" fontSize={10} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                borderColor: '#334155',
                                borderRadius: '8px',
                                fontSize: '11px',
                              }}
                              formatter={(val: any) => [`${val} ${goal.unit}`, 'القيمة']}
                              labelFormatter={(label) => `التاريخ: ${label}`}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="#14b8a6"
                              strokeWidth={2}
                              fillOpacity={1}
                              fill={`url(#color-${goal.id})`}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 text-center py-2">
                        سيبدأ المنحنى البياني بالظهور بعد تسجيل أكثر من قراءة يومية.
                      </p>
                    )}

                    {/* Historical logs table/list */}
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {goal.progressHistory
                        .slice()
                        .reverse()
                        .map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-900 border border-slate-800/80"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] text-slate-400">{entry.date}</span>
                              {entry.note && (
                                <span className="text-[11px] text-slate-300 max-w-[160px] truncate">
                                  {entry.note}
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-teal-300">
                              {entry.value.toLocaleString()} {goal.unit}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredGoals.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <Target className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-base font-bold text-white">لا توجد أهداف مطابقة للمحددات</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            يمكنك تغيير فلتر التصنيف أو البدء بإضافة أهداف صحية جديدة لبرنامجك اليومي.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs"
          >
            إضافة هدف جديد
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW GOAL (PRESETS OR CUSTOM) */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-teal-400" />
                  <span>تحديد هدف صحي شخصي جديد</span>
                </h3>
                <p className="text-xs text-slate-400">
                  اختر من النماذج الطبية المعتمدة أو حدد هدفاً مخصصاً يناسب نمط حياتك.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs: Presets vs Custom */}
            <div className="flex gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setModalTab('PRESETS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  modalTab === 'PRESETS'
                    ? 'bg-teal-500 text-slate-950'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                نماذج جاهزة موصى بها (Presets)
              </button>
              <button
                onClick={() => setModalTab('CUSTOM')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  modalTab === 'CUSTOM'
                    ? 'bg-teal-500 text-slate-950'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                هدف مخصص شخصي (Custom)
              </button>
            </div>

            {modalTab === 'PRESETS' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {PRESET_TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.title}
                    className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 hover:border-teal-500/50 transition cursor-pointer flex flex-col justify-between space-y-3 group"
                    onClick={() => handleSelectPreset(tmpl)}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-teal-400 font-semibold">{tmpl.categoryName}</span>
                        <Plus className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition" />
                      </div>
                      <h5 className="text-xs font-bold text-white mt-1 group-hover:text-teal-300 transition">
                        {tmpl.title}
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {tmpl.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-900">
                      <span className="font-bold text-white">
                        {tmpl.targetValue.toLocaleString()} {tmpl.unit}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {tmpl.frequency === 'DAILY' ? 'يومي' : 'أسبوعي'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <form onSubmit={handleCreateCustomGoal} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      عنوان الهدف (بالعربية) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="مثال: زيادة استهلاك الخضروات"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      العنوان بالإنجليزية (اختياري)
                    </label>
                    <input
                      type="text"
                      value={newTitleEn}
                      onChange={(e) => setNewTitleEn(e.target.value)}
                      placeholder="e.g. Daily Greens Intake"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      التصنيف *
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                    >
                      <option value="ACTIVITY">نشاط بدني (Activity)</option>
                      <option value="HYDRATION">ترطيب وسوائل (Hydration)</option>
                      <option value="MEDICATION">أدوية وعلاجات (Medication)</option>
                      <option value="VITALS">مؤشرات حيوية (Vitals)</option>
                      <option value="SLEEP">نوم وراحة (Sleep)</option>
                      <option value="NUTRITION">تغذية ونظام غذائي (Nutrition)</option>
                      <option value="MINDFULNESS">استرخاء وصحة نفسية (Mindfulness)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      الدورية *
                    </label>
                    <select
                      value={newFrequency}
                      onChange={(e) => setNewFrequency(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                    >
                      <option value="DAILY">هدف يومي (Daily)</option>
                      <option value="WEEKLY">هدف أسبوعي (Weekly)</option>
                      <option value="MONTHLY">هدف شهري (Monthly)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      المستهدف العددي *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newTargetValue}
                      onChange={(e) => setNewTargetValue(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      وحدة القياس *
                    </label>
                    <input
                      type="text"
                      required
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      placeholder="مثال: حصة، مل، خطوة، دقيقة"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      تاريخ المستهدف النهائي (اختياري)
                    </label>
                    <input
                      type="date"
                      value={newTargetDate}
                      onChange={(e) => setNewTargetDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    الوصف أو التوصية السريرية
                  </label>
                  <textarea
                    rows={2}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="ملاحظات حول الهدف وأهميته..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl transition shadow-md"
                  >
                    حفظ الهدف الجديد
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT GOAL */}
      {/* ========================================================================= */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-teal-400" />
                <span>تعديل الهدف: {editingGoal.title}</span>
              </h3>
              <button
                onClick={() => setEditingGoal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  عنوان الهدف
                </label>
                <input
                  type="text"
                  required
                  value={editingGoal.title}
                  onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    المستهدف العددي
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingGoal.targetValue}
                    onChange={(e) =>
                      setEditingGoal({
                        ...editingGoal,
                        targetValue: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    وحدة القياس
                  </label>
                  <input
                    type="text"
                    required
                    value={editingGoal.unit}
                    onChange={(e) => setEditingGoal({ ...editingGoal, unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  الوصف
                </label>
                <textarea
                  rows={2}
                  value={editingGoal.description || ''}
                  onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingGoal(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl transition shadow-md"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
