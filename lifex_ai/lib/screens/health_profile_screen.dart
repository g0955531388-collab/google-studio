/// =============================================================
/// Lifex-AI — واجهات التطبيق
/// الملف: health_profile_screen.dart
/// المسار: lib/screens/health_profile_screen.dart
/// الوصف: عرض بيانات الملف الصحي الأساسية (health_profile.dart) بشكل
/// مبسّط للقراءة، مع تنويه واضح دائم الظهور حول طبيعة البيانات، ودعم
/// كامل لقارئ الشاشة (TalkBack/VoiceOver) لكل قسم.
/// =============================================================

import 'package:flutter/material.dart';

import '../features/profile/health_profile.dart';
import '../l10n/generated/app_localizations.dart';

class HealthProfileScreen extends StatelessWidget {
  const HealthProfileScreen({super.key, this.profile});

  /// الملف الصحي المعروض. في هذه المرحلة الأولية يُمرَّر مباشرة؛ لاحقاً
  /// سيُستبدل هذا بحقن اعتماديات فعلي (Provider/Riverpod/GetIt) يجلب
  /// الملف النشط من MultiProfileEngine.
  final HealthProfile? profile;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.homeMyHealthProfile)),
      body: profile == null
          ? Center(child: Text(l10n.noHealthProfileLoaded))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Semantics(
                    header: true,
                    child: Text(
                      profile!.fullName,
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text('العمر: ${profile!.ageInYears} سنة'),
                  const SizedBox(height: 16),
                  _InfoSection(
                    titleAr: 'معلومات أساسية',
                    children: [
                      _InfoRow(labelAr: 'فصيلة الدم', valueAr: profile!.bloodType.name),
                      if (profile!.heightCm != null)
                        _InfoRow(labelAr: 'الطول', valueAr: '${profile!.heightCm} سم'),
                      if (profile!.weightKg != null)
                        _InfoRow(labelAr: 'الوزن', valueAr: '${profile!.weightKg} كغم'),
                      if (profile!.bodyMassIndex != null)
                        _InfoRow(
                          labelAr: 'مؤشر كتلة الجسم',
                          valueAr: profile!.bodyMassIndex!.toStringAsFixed(1),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _InfoSection(
                    titleAr: 'الحساسية',
                    children: profile!.allergies.isEmpty
                        ? [const Text('لا توجد حساسية مسجَّلة.')]
                        : profile!.allergies
                            .map((a) => _InfoRow(
                                  labelAr: a.substance,
                                  valueAr: a.severity,
                                ))
                            .toList(),
                  ),
                  const SizedBox(height: 16),
                  _InfoSection(
                    titleAr: 'الحالات المزمنة',
                    children: profile!.chronicConditions.isEmpty
                        ? [const Text('لا توجد حالات مزمنة مسجَّلة.')]
                        : profile!.chronicConditions
                            .map((c) => Text(c.conditionName))
                            .toList(),
                  ),
                  const SizedBox(height: 24),
                  Semantics(
                    label: 'تنويه: هذه البيانات للاطلاع الشخصي فقط وليست '
                        'بديلاً عن الفحص الطبي المباشر. يُرجى إبقاء هذه '
                        'المعلومات محدَّثة لتكون مفيدة في حالات الطوارئ.',
                    child: ExcludeSemantics(
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.blue.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'هذه البيانات للاطلاع الشخصي فقط وليست بديلاً عن '
                          'الفحص الطبي المباشر. يُرجى إبقاء هذه المعلومات '
                          'محدَّثة لتكون مفيدة في حالات الطوارئ.',
                          style: TextStyle(fontSize: 12),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}

class _InfoSection extends StatelessWidget {
  const _InfoSection({required this.titleAr, required this.children});

  final String titleAr;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Semantics(
          header: true,
          child: Text(titleAr, style: Theme.of(context).textTheme.titleMedium),
        ),
        const SizedBox(height: 8),
        ...children,
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.labelAr, required this.valueAr});

  final String labelAr;
  final String valueAr;

  @override
  Widget build(BuildContext context) {
    // دمج التسمية والقيمة في إعلان واحد متصل لقارئ الشاشة ("فصيلة الدم:
    // O positive") بدلاً من نطق نصّين منفصلين قد يفصل بينهما القارئ.
    return Semantics(
      label: '$labelAr: $valueAr',
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            ExcludeSemantics(
              child: Text(labelAr, style: const TextStyle(color: Colors.grey)),
            ),
            ExcludeSemantics(
              child: Text(valueAr, style: const TextStyle(fontWeight: FontWeight.w600)),
            ),
          ],
        ),
      ),
    );
  }
}
