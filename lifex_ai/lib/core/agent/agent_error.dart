/// =============================================================
/// Lifex-AI — طبقة الوكيل الذكي (AI Agent Layer)
/// الملف: agent_error.dart
/// المسار: lib/core/agent/agent_error.dart
/// الوصف: تسلسل هرمي واضح لأخطاء الوكيل (بند 27 من المواصفة). كل خطأ
/// نوع صريح وليس Exception عام، حتى يستطيع AgentOrchestrator اتخاذ
/// قرار مختلف حسب نوع الفشل (إعادة محاولة / بديل / طلب تدخل بشري).
/// =============================================================

/// الأساس المشترك لكل أخطاء الوكيل. لا تُستخدم هذه الفئة مباشرة؛
/// استخدم أحد الأنواع الفرعية الصريحة أدناه.
abstract class AgentError implements Exception {
  const AgentError(this.message, {this.sourceToolName});

  final String message;
  final String? sourceToolName;

  /// اسم صريح لنوع الخطأ يُستخدم في التسجيل (Audit Log) دون الحاجة
  /// لـ runtimeType (الذي قد يتغيّر شكله عند التصغير/Obfuscation).
  String get code;

  @override
  String toString() => '[$code] $message'
      '${sourceToolName != null ? ' (tool: $sourceToolName)' : ''}';
}

class ToolNotFoundError extends AgentError {
  const ToolNotFoundError(String toolName)
      : super('الأداة المطلوبة غير مسجّلة: $toolName',
            sourceToolName: toolName);
  @override
  String get code => 'TOOL_NOT_FOUND';
}

class PermissionDeniedError extends AgentError {
  const PermissionDeniedError(String message, {String? sourceToolName})
      : super(message, sourceToolName: sourceToolName);
  @override
  String get code => 'PERMISSION_DENIED';
}

class InvalidArgumentsError extends AgentError {
  const InvalidArgumentsError(String message, {String? sourceToolName})
      : super(message, sourceToolName: sourceToolName);
  @override
  String get code => 'INVALID_ARGUMENTS';
}

class ToolExecutionFailedError extends AgentError {
  const ToolExecutionFailedError(String message,
      {String? sourceToolName, this.originalException})
      : super(message, sourceToolName: sourceToolName);

  final Object? originalException;

  @override
  String get code => 'TOOL_EXECUTION_FAILED';
}

class ModelError extends AgentError {
  const ModelError(String message) : super(message);
  @override
  String get code => 'MODEL_ERROR';
}

class AgentTimeoutError extends AgentError {
  const AgentTimeoutError(String message, {String? sourceToolName})
      : super(message, sourceToolName: sourceToolName);
  @override
  String get code => 'TIMEOUT';
}

class ValidationFailedError extends AgentError {
  const ValidationFailedError(String message, {String? sourceToolName})
      : super(message, sourceToolName: sourceToolName);
  @override
  String get code => 'VALIDATION_FAILED';
}

class SafetyBlockedError extends AgentError {
  const SafetyBlockedError(String message, {String? sourceToolName})
      : super(message, sourceToolName: sourceToolName);
  @override
  String get code => 'SAFETY_BLOCKED';
}

class UserCancelledError extends AgentError {
  const UserCancelledError([String message = 'ألغى المستخدم المهمة.'])
      : super(message);
  @override
  String get code => 'USER_CANCELLED';
}

/// تجاوز الحد الأقصى لدورات استدعاء الأدوات (بند 26) — يمنع الحلقات
/// اللانهائية بين النموذج وسجل الأدوات.
class MaxIterationsExceededError extends AgentError {
  const MaxIterationsExceededError(int maxIterations)
      : super('تم تجاوز الحد الأقصى لعدد الدورات المسموح بها: $maxIterations');
  @override
  String get code => 'MAX_ITERATIONS_EXCEEDED';
}
