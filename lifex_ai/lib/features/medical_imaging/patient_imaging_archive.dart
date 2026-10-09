/// =============================================================
/// Lifex-AI — التصوير الطبي والأشعة
/// الملف: patient_imaging_archive.dart
/// المسار: lib/features/medical_imaging/patient_imaging_archive.dart
/// الوصف: أرشيف صور الأشعة/الرنين/السونار الخاصة بمريض معيّن عبر الزمن،
/// لتمكين مقارنة زمنية بين فحصين لنفس المنطقة.
/// =============================================================

import 'imaging_center_profile.dart';

class PatientImagingRecord {
  final String imageId;
  final String patientProfileId;
  final ImagingModality modality;
  final String bodyRegionAr;
  final String storageReference;
  final DateTime capturedAt;

  PatientImagingRecord({
    required this.imageId,
    required this.patientProfileId,
    required this.modality,
    required this.bodyRegionAr,
    required this.storageReference,
    DateTime? capturedAt,
  }) : capturedAt = capturedAt ?? DateTime.now();
}

/// أرشيف الصور الطبية للمريض.
class PatientImagingArchive {
  PatientImagingArchive();

  final Map<String, List<PatientImagingRecord>> _archive = {};
  int _counter = 0;

  PatientImagingRecord addRecord({
    required String patientProfileId,
    required ImagingModality modality,
    required String bodyRegionAr,
    required String storageReference,
  }) {
    _counter++;
    final record = PatientImagingRecord(
      imageId: 'PIMG-$_counter',
      patientProfileId: patientProfileId,
      modality: modality,
      bodyRegionAr: bodyRegionAr,
      storageReference: storageReference,
    );
    _archive.putIfAbsent(patientProfileId, () => []).add(record);
    return record;
  }

  List<PatientImagingRecord> historyForRegion(
    String patientProfileId,
    String bodyRegionAr,
  ) {
    final all = _archive[patientProfileId] ?? const [];
    return all.where((r) => r.bodyRegionAr == bodyRegionAr).toList()
      ..sort((a, b) => a.capturedAt.compareTo(b.capturedAt));
  }

  List<PatientImagingRecord> allRecordsFor(String patientProfileId) =>
      List.unmodifiable(_archive[patientProfileId] ?? const []);
}
