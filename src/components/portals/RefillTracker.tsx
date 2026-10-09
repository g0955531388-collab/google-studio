import React, { useState, useEffect } from 'react';
import {
  Package,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Pill,
  Phone,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  Plus,
  Minus,
  Info,
  ExternalLink,
  Check,
  X,
  Bell,
  ArrowRight,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import {
  MedicationScheduleEntry,
  MedicationRefillCalculation,
  RefillSummaryStats,
} from '../../types';

interface RefillTrackerProps {
  patientId?: string;
  onNavigateToSchedule?: () => void;
  onRefillUpdated?: () => void;
}

export const RefillTracker: React.FC<RefillTrackerProps> = ({
  patientId = 'pat-main',
  onNavigateToSchedule,
  onRefillUpdated,
}) => {
  const [calculations, setCalculations] = useState<MedicationRefillCalculation[]>([]);
  const [stats, setStats] = useState<RefillSummaryStats>({
    totalTrackedMedications: 0,
    refillsNeededCount: 0,
    criticalLowCount: 0,
    totalPillsInStock: 0,
    averageDaysRemaining: 0,
    pendingOrdersCount: 0,
  });

  const [filterUrgency, setFilterUrgency] = useState<'ALL' | 'NEEDS_REFILL' | 'ADEQUATE'>('ALL');
  const [selectedMedForAdjust, setSelectedMedForAdjust] = useState<MedicationRefillCalculation | null>(null);
  const [adjustCountInput, setAdjustCountInput] = useState<number>(30);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [refillOrderModalMed, setRefillOrderModalMed] = useState<MedicationRefillCalculation | null>(null);

  const loadData = () => {
    const calcs = dataService.getRefillCalculations(patientId);
    const summary = dataService.getRefillSummaryStats(patientId);
    setCalculations(calcs);
    setStats(summary);
  };

  useEffect(() => {
    loadData();
  }, [patientId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRequestRefill = (schedId: string, medName: string) => {
    dataService.requestPrescriptionRefill(schedId, patientId);
    loadData();
    if (onRefillUpdated) onRefillUpdated();
    showToast(`✓ تم إرسال طلب إعادة صرف الدواء لـ "${medName}" إلى الصيدلية بنجاح.`);
  };

  const handleRecordFulfillment = (schedId: string, medName: string, qty: number = 30) => {
    dataService.recordPrescriptionRefill(schedId, qty, patientId);
    loadData();
    if (onRefillUpdated) onRefillUpdated();
    showToast(`✓ تم تحديث المخزون وإضافة +${qty} حبة لـ "${medName}".`);
  };

  const handleSavePillAdjustment = () => {
    if (!selectedMedForAdjust) return;
    dataService.updatePillCount(selectedMedForAdjust.scheduleId, adjustCountInput, patientId);
    loadData();
    if (onRefillUpdated) onRefillUpdated();
    showToast(`✓ تم تعديل الرصيد الفعلي لـ "${selectedMedForAdjust.medicationName}" إلى ${adjustCountInput} حبة.`);
    setSelectedMedForAdjust(null);
  };

  const filteredCalculations = calculations.filter((item) => {
    if (filterUrgency === 'NEEDS_REFILL') return item.needsRefill;
    if (filterUrgency === 'ADEQUATE') return !item.needsRefill;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-teal-500 text-slate-950 font-bold px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>الوصفات قيد المتابعة</span>
            <Package className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {stats.totalTrackedMedications}
          </div>
          <p className="text-[11px] text-slate-500">أدوية مجدولة مع أرصدة حبوب</p>
        </div>

        <div className={`border rounded-2xl p-4 space-y-1 shadow-lg ${
          stats.refillsNeededCount > 0
            ? 'bg-amber-950/20 border-amber-500/40'
            : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className={stats.refillsNeededCount > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
              بحاجة لإعادة الصرف
            </span>
            <AlertTriangle className={`w-4 h-4 ${stats.refillsNeededCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
          </div>
          <div className={`text-2xl font-black font-mono ${stats.refillsNeededCount > 0 ? 'text-amber-300' : 'text-white'}`}>
            {stats.refillsNeededCount}
          </div>
          <p className="text-[11px] text-slate-400">
            {stats.criticalLowCount > 0 ? `${stats.criticalLowCount} دواء بنفاد حرج (≤ 3 أيام)` : 'رصيد أقل من حد الأمان'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>إجمالي الحبوب المتوفرة</span>
            <Pill className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 font-mono">
            {stats.totalPillsInStock}
          </div>
          <p className="text-[11px] text-slate-500">حبة متبقية في الصيدلية المنزلية</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>متوسط الأيام المتبقية</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono">
            {stats.averageDaysRemaining} <span className="text-xs font-normal text-slate-400">يوم</span>
          </div>
          <p className="text-[11px] text-slate-500">متوسط تغطية العلاج الحالي</p>
        </div>
      </div>

      {/* Proactive Refill Alert Banner if any medication is low */}
      {stats.refillsNeededCount > 0 && (
        <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-rose-950/70 border border-amber-500/50 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                <Bell className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md">
                    تنبيه إعادة الصرف الفوري (Prescription Refill Alert)
                  </span>
                  <span className="text-xs text-amber-300/80 font-medium">
                    {stats.refillsNeededCount} علاج اقترب من النفاد
                  </span>
                </div>
                <h4 className="text-base font-black text-white">
                  حان موعد طلب إعادة صرف الوصفة الطبية لتجنب انقطاع الخطة العلاجية
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  بناءً على حساب وتيرة الجرعات اليومية، انخفض رصيد بعض أدويتك الحيوية إلى أقل من حد الأمان المحدد. يوصى بتقديم طلب إعادة الصرف للصيدلية قبل موعد النفاد.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setFilterUrgency('NEEDS_REFILL')}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-950/50 transition cursor-pointer flex items-center gap-2"
              >
                <span>عرض الأدوية المحتاجة للصرف ({stats.refillsNeededCount})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterUrgency('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterUrgency === 'ALL'
                ? 'bg-teal-500 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            كافة الأدوية ({calculations.length})
          </button>
          <button
            onClick={() => setFilterUrgency('NEEDS_REFILL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              filterUrgency === 'NEEDS_REFILL'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>بحاجة لإعادة صرف</span>
            {stats.refillsNeededCount > 0 && (
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-black/30">
                {stats.refillsNeededCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilterUrgency('ADEQUATE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterUrgency === 'ADEQUATE'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            الرصيد كافٍ ومستقر
          </button>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          الحساب التلقائي: استهلاك الجرعة اليومية × عدد الحبات لكل جرعة
        </div>
      </div>

      {/* Medication Refill Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCalculations.map((item) => {
          const isCritical = item.urgency === 'CRITICAL' || item.urgency === 'EMPTY';
          const isLow = item.urgency === 'LOW';
          const fillPercentage = Math.min(100, Math.round((item.currentPillCount / item.totalPillCapacity) * 100));

          return (
            <div
              key={item.scheduleId}
              className={`rounded-3xl border p-5 space-y-4 shadow-xl transition-all relative overflow-hidden flex flex-col justify-between ${
                isCritical
                  ? 'bg-slate-900 border-rose-500/50 shadow-rose-950/20'
                  : isLow
                  ? 'bg-slate-900 border-amber-500/40 shadow-amber-950/20'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                {/* Header: Medication Name and Urgency Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                        {item.dosage}
                      </span>
                      {item.rxNumber && (
                        <span className="text-[10px] font-mono text-teal-400">
                          {item.rxNumber}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white tracking-wide">
                      {item.medicationName}
                    </h3>
                  </div>

                  <div>
                    {isCritical ? (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-rose-500 text-white flex items-center gap-1 shadow-md animate-pulse">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>نفاد حرج ({item.daysRemaining} أيام)</span>
                      </span>
                    ) : isLow ? (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>طلب الصرف مطلوب</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>الرصيد كافٍ</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Pill Level Indicator Bar */}
                <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-teal-400" />
                      <span>رصيد الحبوب المتبقي</span>
                    </span>
                    <span className="font-mono font-bold text-white">
                      {item.currentPillCount} / {item.totalPillCapacity} حبة
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCritical
                          ? 'bg-gradient-to-r from-rose-600 to-rose-400'
                          : isLow
                          ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                          : 'bg-gradient-to-r from-teal-500 to-emerald-400'
                      }`}
                      style={{ width: `${Math.max(5, fillPercentage)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-500">
                      استهلاك: {item.dailyConsumption} حبة / يوم
                    </span>
                    <span className={`font-mono font-bold ${
                      isCritical ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      يكفي لـ {item.daysRemaining} يوم
                    </span>
                  </div>
                </div>

                {/* Calculation Details */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 space-y-0.5">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>تاريخ النفاد المتوقع</span>
                    </span>
                    <div className="font-mono font-bold text-slate-200">
                      {new Date(item.estimatedDepletionDate).toLocaleDateString('ar-EG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 space-y-0.5">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>آخر إعادة تعبئة</span>
                    </span>
                    <div className="font-mono text-slate-400">
                      {item.lastRefillDate || 'غير مسجل'}
                    </div>
                  </div>
                </div>

                {/* Pharmacy Contact Info */}
                {item.pharmacyName && (
                  <div className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <Package className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span className="truncate">{item.pharmacyName}</span>
                    </div>
                    {item.pharmacyPhone && (
                      <span className="font-mono text-slate-300 text-[10px] shrink-0 ml-1">
                        {item.pharmacyPhone}
                      </span>
                    )}
                  </div>
                )}

                {/* Pending Refill Notice */}
                {item.refillOrderPending && (
                  <div className="p-2.5 rounded-xl bg-teal-950/40 border border-teal-500/30 text-teal-300 text-xs flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
                    <span>طلب الصرف قيد المراجعة لدى الصيدلية</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                {item.refillOrderPending ? (
                  <button
                    onClick={() => handleRecordFulfillment(item.scheduleId, item.medicationName, 30)}
                    className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تأكيد استلام العبوة (+30 حبة)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleRequestRefill(item.scheduleId, item.medicationName)}
                    className={`flex-1 px-3 py-2 font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      item.needsRefill
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/50'
                        : 'bg-teal-500/20 hover:bg-teal-500 text-teal-300 hover:text-slate-950 border border-teal-500/40'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>طلب إعادة الصرف (Refill)</span>
                  </button>
                )}

                {/* Quick Add +30 button */}
                <button
                  onClick={() => handleRecordFulfillment(item.scheduleId, item.medicationName, 30)}
                  className="px-2.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-teal-300 font-mono text-xs rounded-xl border border-slate-800 transition cursor-pointer"
                  title="إضافة 30 حبة للمخزون فوراً"
                >
                  +30
                </button>

                {/* Adjust inventory manual modal toggle */}
                <button
                  onClick={() => {
                    setSelectedMedForAdjust(item);
                    setAdjustCountInput(item.currentPillCount);
                  }}
                  className="px-2.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white text-xs rounded-xl border border-slate-800 transition cursor-pointer"
                  title="تعديل الرصيد الفعلي يدوياً"
                >
                  جرد
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Inventory Adjustment Modal */}
      {selectedMedForAdjust && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Pill className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">
                  تعديل رصيد الحبوب الفعلي
                </h3>
              </div>
              <button
                onClick={() => setSelectedMedForAdjust(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs space-y-1">
                <span className="text-slate-500">العلاج:</span>
                <p className="font-bold text-white text-sm">{selectedMedForAdjust.medicationName}</p>
                <p className="text-slate-400 font-mono">الاستهلاك اليومي: {selectedMedForAdjust.dailyConsumption} حبة/يوم</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-bold block">
                  عدد الحبات المتبقية في العبوة الحالية:
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAdjustCountInput((c) => Math.max(0, c - 1))}
                    className="p-3 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={adjustCountInput}
                    onChange={(e) => setAdjustCountInput(Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-3 text-center text-lg font-mono font-bold text-teal-300 focus:outline-none focus:border-teal-500"
                  />

                  <button
                    type="button"
                    onClick={() => setAdjustCountInput((c) => c + 1)}
                    className="p-3 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-teal-950/30 border border-teal-500/20 p-3 rounded-xl text-xs text-teal-300 flex items-center justify-between">
                <span>تغطية الرصيد الجديد:</span>
                <span className="font-mono font-bold">
                  {Math.floor(adjustCountInput / selectedMedForAdjust.dailyConsumption)} يوم إضافي
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedMedForAdjust(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSavePillAdjustment}
                className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-teal-950/50 transition cursor-pointer"
              >
                حفظ الرصيد الجديد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
