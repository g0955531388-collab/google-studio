// =============================================================
// Lifex-AI — اختبارات الوحدة
// الملف: agent_tool_registry_test.dart
// المسار: test/core/agent/tools/agent_tool_registry_test.dart
// الوصف: يتحقق من أن AgentToolRegistry يفرض الترتيب الصحيح إلزامياً:
// وجود الأداة → الصلاحيات → صحة المدخلات → التنفيذ مع Timeout →
// التسجيل دائماً. يغطي سيناريوهات: ToolNotFound، PermissionDenied،
// InvalidArguments، ToolExecutionFailed، Timeout (بند 34).
// =============================================================

import 'package:flutter_test/flutter_test.dart';
import 'package:lifex_ai/core/agent/agent_context.dart';
import 'package:lifex_ai/core/agent/agent_logger.dart';
import 'package:lifex_ai/core/agent/agent_permissions.dart';
import 'package:lifex_ai/core/agent/tools/agent_tool.dart';
import 'package:lifex_ai/core/agent/tools/agent_tool_registry.dart';

/// أداة وهمية قابلة للتحكم الكامل لأغراض الاختبار.
class _FakeTool implements AgentTool {
  _FakeTool({
    required this.name,
    this.permissionSpec = const AgentToolPermissionSpec(
      requiredPermissions: {},
      riskLevel: AgentActionRiskLevel.low,
    ),
    this.shouldSucceed = true,
    this.shouldTimeout = false,
    this.throwsException = false,
    this.validateResult = true,
  });

  @override
  final String name;

  @override
  String get descriptionAr => 'أداة اختبار';

  @override
  Map<String, String> get inputSchema => const {};

  @override
  final AgentToolPermissionSpec permissionSpec;

  final bool shouldSucceed;
  final bool shouldTimeout;
  final bool throwsException;
  final bool validateResult;

  int executionCount = 0;

  @override
  bool validate(Map<String, dynamic> arguments) => validateResult;

  @override
  Future<AgentToolExecutionResult> execute({
    required Map<String, dynamic> arguments,
    required AgentContext context,
  }) async {
    executionCount++;
    if (shouldTimeout) {
      await Future.delayed(const Duration(seconds: 5));
    }
    if (throwsException) {
      throw StateError('خطأ غير متوقع داخل الأداة');
    }
    return shouldSucceed
        ? AgentToolExecutionResult.success({'ok': true})
        : const AgentToolExecutionResult.failure('فشل متوقع');
  }
}

AgentContext _buildContext({
  Set<AgentPermission> granted = const {},
  Set<String> confirmedActions = const {},
}) {
  return AgentContext(
    taskId: 't1',
    profileId: 'p1',
    userRequest: 'اختبار',
    permissions: AgentGrantedPermissions(
      granted: granted,
      humanConfirmedActionIds: confirmedActions,
    ),
  );
}

void main() {
  setUp(() {
    AgentLogger.instance.clear();
  });

  group('AgentToolRegistry.executeTool', () {
    test('ينجح استدعاء أداة مسجّلة وصلاحياتها متوفرة', () async {
      final registry = AgentToolRegistry();
      registry.register(_FakeTool(name: 'tool_a'));

      final result = await registry.executeTool(
        toolName: 'tool_a',
        arguments: const {},
        context: _buildContext(),
        actionId: 'a1',
        sessionId: 's1',
      );

      expect(result.isSuccess, isTrue);
    });

    test('ToolNotFound: يفشل بوضوح عند استدعاء أداة غير مسجّلة', () async {
      final registry = AgentToolRegistry();

      final result = await registry.executeTool(
        toolName: 'ghost_tool',
        arguments: const {},
        context: _buildContext(),
        actionId: 'a1',
        sessionId: 's1',
      );

      expect(result.isSuccess, isFalse);
      expect(result.errorMessageAr, contains('غير مسجّلة'));
    });

    test('PermissionDenied: يفشل عندما لا تُمنح الصلاحية المطلوبة', () async {
      final registry = AgentToolRegistry();
      registry.register(_FakeTool(
        name: 'needs_permission',
        permissionSpec: const AgentToolPermissionSpec(
          requiredPermissions: {AgentPermission.readUserDocuments},
          riskLevel: AgentActionRiskLevel.low,
        ),
      ));

      final result = await registry.executeTool(
        toolName: 'needs_permission',
        arguments: const {},
        context: _buildContext(granted: const {}), // بلا صلاحيات
        actionId: 'a1',
        sessionId: 's1',
      );

      expect(result.isSuccess, isFalse);
    });

    test('إجراء عالي الخطورة يُرفض دون تأكيد بشري حتى مع الصلاحية العامة',
        () async {
      final registry = AgentToolRegistry();
      registry.register(_FakeTool(
        name: 'high_risk_tool',
        permissionSpec: const AgentToolPermissionSpec(
          requiredPermissions: {},
          riskLevel: AgentActionRiskLevel.high,
        ),
      ));

      final result = await registry.executeTool(
        toolName: 'high_risk_tool',
        arguments: const {},
        context: _buildContext(confirmedActions: const {}), // غير مؤكَّد
        actionId: 'action_needs_confirmation',
        sessionId: 's1',
      );

      expect(result.isSuccess, isFalse);
    });

    test('إجراء عالي الخطورة ينجح بعد تأكيد بشري صريح لنفس معرّف الإجراء',
        () async {
      final registry = AgentToolRegistry();
      registry.register(_FakeTool(
        name: 'high_risk_tool',
        permissionSpec: const AgentToolPermissionSpec(
          requiredPermissions: {},
          riskLevel: AgentActionRiskLevel.high,
        ),
      ));

      final result = await registry.executeTool(
        toolName: 'high_risk_tool',
        arguments: const {},
        context: _buildContext(confirmedActions: const {'action_1'}),
        actionId: 'action_1',
        sessionId: 's1',
      );

      expect(result.isSuccess, isTrue);
    });

    test('InvalidArguments: يفشل عند رفض validate() للمدخلات', () async {
      final registry = AgentToolRegistry();
      registry.register(_FakeTool(name: 'strict_tool', validateResult: false));

      final result = await registry.executeTool(
        toolName: 'strict_tool',
        arguments: const {},
        context: _buildContext(),
        actionId: 'a1',
        sessionId: 's1',
      );

      expect(result.isSuccess, isFalse);
    });

    test('ToolExecutionFailed: استثناء داخل الأداة لا يتسرّب، بل يُعاد كفشل',
        () async {
      final registry = AgentToolRegistry();
      registry.register(_FakeTool(name: 'crashing_tool', throwsException: true));

      final result = await registry.executeTool(
        toolName: 'crashing_tool',
        arguments: const {},
        context: _buildContext(),
        actionId: 'a1',
        sessionId: 's1',
      );

      expect(result.isSuccess, isFalse);
    });

    test('Timeout: أداة بطيئة جداً تفشل بعد المهلة المحددة', () async {
      final registry = AgentToolRegistry();
      registry.register(_FakeTool(name: 'slow_tool', shouldTimeout: true));

      final result = await registry.executeTool(
        toolName: 'slow_tool',
        arguments: const {},
        context: _buildContext(),
        actionId: 'a1',
        sessionId: 's1',
        timeout: const Duration(milliseconds: 50),
      );

      expect(result.isSuccess, isFalse);
    }, timeout: const Timeout(Duration(seconds: 3)));

    test('كل استدعاء يُسجَّل في Audit Log بصرف النظر عن النجاح', () async {
      final registry = AgentToolRegistry();
      registry.register(_FakeTool(name: 'tool_a'));

      await registry.executeTool(
        toolName: 'tool_a',
        arguments: const {},
        context: _buildContext(),
        actionId: 'a1',
        sessionId: 'session_for_log_test',
      );

      final entries = AgentLogger.instance
          .entriesForTask('t1')
          .where((e) => e.sessionId == 'session_for_log_test');
      expect(entries, isNotEmpty);
    });

    test('تسجيل أداتين بنفس الاسم يرمي خطأ (الأسماء يجب أن تبقى فريدة)',
        () {
      final registry = AgentToolRegistry();
      registry.register(_FakeTool(name: 'duplicate'));

      expect(() => registry.register(_FakeTool(name: 'duplicate')),
          throwsStateError);
    });
  });
}
