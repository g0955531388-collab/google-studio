/// =============================================================
/// Lifex-AI — وحدة الأسنان
/// الملف: dental_dashboard.dart
/// المسار: lib/features/dental/dental_dashboard.dart
/// الوصف: تتبّع خطط العلاج السنية طويلة المدى (مثل تقويم الأسنان)
/// المكوّنة من عدة جلسات، لعرضها في لوحة تحكم الطبيب.
/// =============================================================

enum TreatmentPlanStatus { active, completed, paused }

class DentalTreatmentStep {
  final String descriptionAr;
  bool completed;
  DateTime? completedAt;

  DentalTreatmentStep({required this.descriptionAr, this.completed = false, this.completedAt});
}

class DentalTreatmentPlan {
  final String planId;
  final String patientProfileId;
  final String dentalProviderId;
  final List<DentalTreatmentStep> steps;
  TreatmentPlanStatus status;

  DentalTreatmentPlan({
    required this.planId,
    required this.patientProfileId,
    required this.dentalProviderId,
    List<DentalTreatmentStep>? steps,
    this.status = TreatmentPlanStatus.active,
  }) : steps = steps ?? [];

  double get completionRatio {
    if (steps.isEmpty) return 0.0;
    final completedCount = steps.where((s) => s.completed).length;
    return completedCount / steps.length;
  }
}

/// لوحة تحكم طبيب الأسنان.
class DentalDashboard {
  DentalDashboard();

  final Map<String, DentalTreatmentPlan> _plans = {};
  int _counter = 0;

  DentalTreatmentPlan createPlan({
    required String patientProfileId,
    required String dentalProviderId,
    required List<String> stepDescriptionsAr,
  }) {
    _counter++;
    final plan = DentalTreatmentPlan(
      planId: 'DEN-$_counter',
      patientProfileId: patientProfileId,
      dentalProviderId: dentalProviderId,
      steps: stepDescriptionsAr
          .map((d) => DentalTreatmentStep(descriptionAr: d))
          .toList(),
    );
    _plans[plan.planId] = plan;
    return plan;
  }

  bool markStepCompleted(String planId, int stepIndex) {
    final plan = _plans[planId];
    if (plan == null || stepIndex >= plan.steps.length) return false;
    plan.steps[stepIndex].completed = true;
    plan.steps[stepIndex].completedAt = DateTime.now();

    if (plan.steps.every((s) => s.completed)) {
      plan.status = TreatmentPlanStatus.completed;
    }
    return true;
  }

  List<DentalTreatmentPlan> activePlansForProvider(String dentalProviderId) {
    return _plans.values
        .where((p) =>
            p.dentalProviderId == dentalProviderId &&
            p.status == TreatmentPlanStatus.active)
        .toList();
  }
}
