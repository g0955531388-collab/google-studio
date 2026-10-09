/// =============================================================
/// Lifex-AI — الخدمات السحابية
/// الملف: cloud_backend_client.dart
/// المسار: lib/services/cloud/cloud_backend_client.dart
/// الوصف: عميل HTTP رقيق للتواصل مع خادم Lifex-AI الخلفي (Backend).
/// يستخدم نفس مبدأ "تعريف التطبيق" (App Attribution) المتبع في
/// ai_service_router.dart للحفاظ على اتساق الهوية عبر كل الاتصالات
/// الخارجية للتطبيق.
///
/// ⚠️ لا يحتوي هذا الملف على أي رابط خادم فعلي يعمل حالياً — [baseUrl]
/// يجب استبداله برابط خادم Lifex-AI الحقيقي عند توفره.
/// =============================================================

import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../core/app_constants.dart';
import '../../core/error_handler.dart';
import 'cloud_sync_manager.dart';

/// عميل الاتصال بالخادم السحابي الخلفي لـ Lifex-AI.
class CloudBackendClient {
  CloudBackendClient({
    required this.baseUrl,
    http.Client? httpClient,
  }) : _httpClient = httpClient ?? http.Client();

  final String baseUrl;
  final http.Client _httpClient;

  Map<String, String> get _defaultHeaders => {
        'Content-Type': 'application/json',
        'X-App-Name': AppConstants.appName,
        'X-App-Version': AppConstants.appVersion,
      };

  /// دفع كيان واحد (ملف صحي، موعد، تبرع...) للخادم. تُرجع true عند
  /// النجاح، وfalse عند أي فشل (سيُعاد المحاولة لاحقاً من CloudSyncManager).
  Future<bool> pushEntity({
    required SyncEntityType entityType,
    required String entityId,
    required Map<String, dynamic> payload,
  }) async {
    if (baseUrl.trim().isEmpty) {
      ErrorHandler.instance.report(
        'CLOUD_BACKEND_NOT_CONFIGURED',
        'الخادم السحابي الخلفي غير مكوّن. حدد LIFEX_BACKEND_URL عبر الإعدادات.',
        sourceModule: 'cloud_backend_client',
        severity: ErrorSeverity.info,
      );
      return false;
    }
    try {
      final response = await _httpClient.post(
        Uri.parse('$baseUrl/sync/${entityType.name}/$entityId'),
        headers: _defaultHeaders,
        body: jsonEncode(payload),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e, stackTrace) {
      ErrorHandler.instance.report(
        'CLOUD_PUSH_FAILED',
        'فشل رفع البيانات للخادم السحابي (${entityType.name}/$entityId).',
        sourceModule: 'cloud_backend_client',
        severity: ErrorSeverity.warning,
        exception: e,
        stackTrace: stackTrace,
      );
      return false;
    }
  }

  /// جلب أحدث نسخة من كيان معيّن من الخادم (يُستخدم عند تسجيل الدخول
  /// من جهاز جديد، أو عند حل تعارض بين نسخة محلية وأخرى سحابية).
  Future<Map<String, dynamic>?> pullEntity({
    required SyncEntityType entityType,
    required String entityId,
  }) async {
    if (baseUrl.trim().isEmpty) {
      ErrorHandler.instance.report(
        'CLOUD_BACKEND_NOT_CONFIGURED',
        'الخادم السحابي الخلفي غير مكوّن. حدد LIFEX_BACKEND_URL عبر الإعدادات.',
        sourceModule: 'cloud_backend_client',
        severity: ErrorSeverity.info,
      );
      return null;
    }
    try {
      final response = await _httpClient.get(
        Uri.parse('$baseUrl/sync/${entityType.name}/$entityId'),
        headers: _defaultHeaders,
      );
      if (response.statusCode != 200) return null;
      return jsonDecode(response.body) as Map<String, dynamic>;
    } catch (e, stackTrace) {
      ErrorHandler.instance.report(
        'CLOUD_PULL_FAILED',
        'فشل جلب البيانات من الخادم السحابي (${entityType.name}/$entityId).',
        sourceModule: 'cloud_backend_client',
        severity: ErrorSeverity.warning,
        exception: e,
        stackTrace: stackTrace,
      );
      return null;
    }
  }
}
