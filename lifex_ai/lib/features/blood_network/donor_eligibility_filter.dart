/// =============================================================
/// Lifex-AI — شبكة التبرع بالدم
/// الملف: donor_eligibility_filter.dart
/// المسار: lib/features/blood_network/donor_eligibility_filter.dart
/// الوصف: تحديد المتبرعين المؤهلين لطلب دم معيّن حسب فصيلة الدم،
/// القرب الجغرافي، وأهلية التبرع (لم يتبرع مؤخراً، لا مانع صحي معروف).
/// =============================================================

import 'dart:math' as math;

import '../hospital/hospital_blood_bank.dart';
import 'donor_history_registry.dart';

class DonorLocation {
  final String donorLifexId;
  final BloodTypeSimple bloodType;
  final double latitude;
  final double longitude;

  const DonorLocation({
    required this.donorLifexId,
    required this.bloodType,
    required this.latitude,
    required this.longitude,
  });
}

/// فلترة المتبرعين المؤهلين لطلب دم معيّن.
class DonorEligibilityFilter {
  DonorEligibilityFilter({
    required this.historyRegistry,
    required this.donorDirectory,
  });

  final DonorHistoryRegistry historyRegistry;

  /// دالة تُرجع كل المتبرعين المسجَّلين (تُربط لاحقاً بقاعدة بيانات
  /// فعلية عوضاً عن قائمة ثابتة في الذاكرة).
  final List<DonorLocation> Function() donorDirectory;

  /// الحد الأدنى للفاصل الزمني بين تبرعين متتاليين لنفس الشخص (بالأيام)
  /// — قاعدة سلامة طبية عامة معروفة، وليست قابلة للتعديل من واجهة عادية.
  static const int minimumDaysBetweenDonations = 90;

  double _distanceKm(double lat1, double lon1, double lat2, double lon2) {
    const earthRadiusKm = 6371.0;
    final dLat = _degToRad(lat2 - lat1);
    final dLon = _degToRad(lon2 - lon1);
    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(_degToRad(lat1)) *
            math.cos(_degToRad(lat2)) *
            math.sin(dLon / 2) *
            math.sin(dLon / 2);
    return 2 * earthRadiusKm * math.asin(math.sqrt(a));
  }

  double _degToRad(double deg) => deg * (math.pi / 180.0);

  List<DonorLocation> findEligibleDonors({
    required BloodTypeSimple bloodType,
    required double centerLatitude,
    required double centerLongitude,
    required double radiusKm,
  }) {
    final allDonors = donorDirectory();

    return allDonors.where((donor) {
      if (donor.bloodType != bloodType) return false;

      final distance = _distanceKm(
        centerLatitude,
        centerLongitude,
        donor.latitude,
        donor.longitude,
      );
      if (distance > radiusKm) return false;

      final lastDonation = historyRegistry.lastDonationDateFor(donor.donorLifexId);
      if (lastDonation != null) {
        final daysSince = DateTime.now().difference(lastDonation).inDays;
        if (daysSince < minimumDaysBetweenDonations) return false;
      }

      return true;
    }).toList();
  }
}
