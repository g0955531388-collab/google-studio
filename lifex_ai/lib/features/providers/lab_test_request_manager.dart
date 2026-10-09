/// =============================================================
/// Lifex-AI — الصيدليات والمخابر
/// الملف: lab_test_request_manager.dart
/// المسار: lib/features/providers/lab_test_request_manager.dart
/// الوصف: إدارة طلبات التحاليل من المريض/الطبيب إلى المخبر، وتتبّع
/// حالة النتيجة حتى استلامها.
/// =============================================================

import '../../core/health_event_manager.dart';

enum LabRequestStatus { pending, sampleCollected, processing, resultReady, delivered }

class LabTestRequest {
  final String requestId;
  final String patientProfileId;
  final String laboratoryId;
  final List<String> testIds; // معرّفات من tests_database.json
  LabRequestStatus status;
  Map<String, dynamic>? resultData;

  LabTestRequest({
    required this.requestId,
    required this.patientProfileId,
    required this.laboratoryId,
    required this.testIds,
    this.status = LabRequestStatus.pending,
    this.resultData,
  });
}

/// مدير طلبات التحاليل.
class LabTestRequestManager {
  LabTestRequestManager();

  final Map<String, LabTestRequest> _requests = {};
  int _counter = 0;

  LabTestRequest createRequest({
    required String patientProfileId,
    required String laboratoryId,
    required List<String> testIds,
  }) {
    _counter++;
    final request = LabTestRequest(
      requestId: 'LAB-$_counter',
      patientProfileId: patientProfileId,
      laboratoryId: laboratoryId,
      testIds: testIds,
    );
    _requests[request.requestId] = request;
    return request;
  }

  void advanceStatus(String requestId, LabRequestStatus newStatus) {
    _requests[requestId]?.status = newStatus;
  }

  /// تسجيل النتيجة النهائية — يُصدر حدث "استلام نتيجة تحليل" ليستفيد
  /// منه الذكاء الاصطناعي أو تنبيهات المستخدم.
  void submitResult(String requestId, Map<String, dynamic> resultData) {
    final request = _requests[requestId];
    if (request == null) return;
    request.resultData = resultData;
    request.status = LabRequestStatus.resultReady;

    HealthEventManager.instance.emitQuick(
      HealthEventType.labResultReceived,
      sourceModule: 'lab_test_request_manager',
      profileId: request.patientProfileId,
      data: {'requestId': requestId},
    );
  }

  List<LabTestRequest> pendingRequestsFor(String laboratoryId) {
    return _requests.values
        .where((r) =>
            r.laboratoryId == laboratoryId &&
            r.status != LabRequestStatus.resultReady &&
            r.status != LabRequestStatus.delivered)
        .toList();
  }

  List<LabTestRequest> readyResultsFor(String laboratoryId) {
    return _requests.values
        .where((r) =>
            r.laboratoryId == laboratoryId &&
            r.status == LabRequestStatus.resultReady)
        .toList();
  }
}
