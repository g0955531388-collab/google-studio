// =============================================================
// Lifex-AI — اختبارات الوحدة/التكامل
// الملف: agent_executor_test.dart
// المسار: test/core/agent/agent_executor_test.dart
// الوصف: يغطي سيناريوهات (بند 34): مهمة بخطوة واحدة، مهمة متعددة
// الخطوات، فشل أداة مع إعادة محاولة، إلغاء المستخدم، وتخطي خطوة
// تعتمد على خطوة سابقة فشلت.
// =============================================================

import 'package:flutter_test/flutter_test.dart';
import 'package:lifex_ai/core/agent/agent_context.dart';
import 'package:lifex_ai/core/agent/agent_error.dart';
import 'package:lifex_ai/core/agent/agent_executor.dart';
import 'package:lifex_ai/core/agent/agent_permissions.dart';
import 'package:lifex_ai/core/agent/agent_planner.dart';
import 'package:lifex_ai/core/agent/agent_validator.dart';
import 'package:lifex_ai/core/agent/memory/short_term_memory.dart';
import 'package:lifex_ai/core/agent/tools/agent_tool.dart';
import 'package:lifex_ai/core/agent/tools/agent_tool_registry.dart';

class _CountingTool implements AgentTool {
  _CountingTool(this.name, {this.failFirstNCalls = 0, this.alwaysFail = false});

  @override
  final String name;

  final int failFirstNCalls;
  final bool alwaysFail;
  int callCount = 0;

  @override
  String get descriptionAr => 'اختبار';

  @override
  Map<String, String> get inputSchema => const {};

  @override
  AgentToolPermissionSpec get permissionSpec => const AgentToolPermissionSpec(
        requiredPermissions: {},
        riskLevel: AgentActionRiskLevel.low,
      );

  @override
  bool validate(Map<String, dynamic> arguments) => true;

  @override
  Future<AgentToolExecutionResult> execute({
    required Map<String, dynamic> arguments,
    required AgentContext context,
  }) async {
    callCount++;
    if (alwaysFail || callCount <= failFirstNCalls) {
      return const AgentToolExecutionResult.failure('فشل مقصود للاختبار');
    }
    return AgentToolExecutionResult.success({'callCount': callCount});
  }
}

AgentContext _buildContext() {
  return AgentContext(
    taskId: 'task1',
    profileId: 'p1',
    userRequest: 'اختبار',
    permissions: const AgentGrantedPermissions(granted: {}),
  );
}

void main() {
  group('AgentExecutor.executePlan', () {
    test('مهمة بخطوة واحدة ناجحة تُرجع outcome ناجحاً واحداً', () async {
      final tool = _CountingTool('tool_a');
      final registry = AgentToolRegistry()..register(tool);
      final executor = AgentExecutor(
        toolRegistry: registry,
        validator: AgentValidator(),
      );

      const plan = AgentPlan(
        goalAr: 'اختبار',
        steps: [PlanStep(stepId: 's1', toolName: 'tool_a', descriptionAr: 'خطوة')],
      );

      final context = _buildContext();
      final outcomes = await executor.executePlan(
        plan: plan,
        context: context,
        shortTermMemory: ShortTermMemory('task1'),
        sessionId: 'session1',
      );

      expect(outcomes.length, 1);
      expect(outcomes.first.succeeded, isTrue);
    });

    test('مهمة متعددة الخطوات تُنفَّذ بالترتيب وتحترم الاعتماديات', () async {
      final toolA = _CountingTool('tool_a');
      final toolB = _CountingTool('tool_b');
      final registry = AgentToolRegistry()
        ..register(toolA)
        ..register(toolB);
      final executor = AgentExecutor(
        toolRegistry: registry,
        validator: AgentValidator(),
      );

      const plan = AgentPlan(
        goalAr: 'اختبار',
        steps: [
          PlanStep(stepId: 's1', toolName: 'tool_a', descriptionAr: 'خطوة 1'),
          PlanStep(
            stepId: 's2',
            toolName: 'tool_b',
            descriptionAr: 'خطوة 2',
            dependsOnStepIds: ['s1'],
          ),
        ],
      );

      final outcomes = await executor.executePlan(
        plan: plan,
        context: _buildContext(),
        shortTermMemory: ShortTermMemory('task1'),
        sessionId: 'session1',
      );

      expect(outcomes.length, 2);
      expect(outcomes.every((o) => o.succeeded), isTrue);
    });

    test('خطوة تعتمد على خطوة سابقة فشلت تُتخطى ولا تُنفَّذ', () async {
      final toolA = _CountingTool('tool_a', alwaysFail: true);
      final toolB = _CountingTool('tool_b');
      final registry = AgentToolRegistry()
        ..register(toolA)
        ..register(toolB);
      final executor = AgentExecutor(
        toolRegistry: registry,
        validator: AgentValidator(),
        maxRetriesPerStep: 0,
      );

      const plan = AgentPlan(
        goalAr: 'اختبار',
        steps: [
          PlanStep(stepId: 's1', toolName: 'tool_a', descriptionAr: 'خطوة 1'),
          PlanStep(
            stepId: 's2',
            toolName: 'tool_b',
            descriptionAr: 'خطوة 2',
            dependsOnStepIds: ['s1'],
          ),
        ],
      );

      final outcomes = await executor.executePlan(
        plan: plan,
        context: _buildContext(),
        shortTermMemory: ShortTermMemory('task1'),
        sessionId: 'session1',
      );

      // فقط خطوة s1 نُفِّذت وفشلت؛ s2 تُخطّيت تماماً لعدم اكتمال اعتمادها.
      expect(outcomes.length, 1);
      expect(toolB.callCount, 0);
    });

    test('أداة تفشل مرة ثم تنجح: إعادة المحاولة تلتقط النجاح', () async {
      final tool = _CountingTool('flaky_tool', failFirstNCalls: 1);
      final registry = AgentToolRegistry()..register(tool);
      final executor = AgentExecutor(
        toolRegistry: registry,
        validator: AgentValidator(),
        maxRetriesPerStep: 2,
      );

      const plan = AgentPlan(
        goalAr: 'اختبار',
        steps: [
          PlanStep(stepId: 's1', toolName: 'flaky_tool', descriptionAr: 'خطوة')
        ],
      );

      final outcomes = await executor.executePlan(
        plan: plan,
        context: _buildContext(),
        shortTermMemory: ShortTermMemory('task1'),
        sessionId: 'session1',
      );

      expect(outcomes.first.succeeded, isTrue);
      expect(tool.callCount, 2); // فشلت مرة، نجحت في الثانية
    });

    test('أداة تفشل دائماً تستنفد كل المحاولات وتُرجع outcome فاشلاً',
        () async {
      final tool = _CountingTool('always_failing', alwaysFail: true);
      final registry = AgentToolRegistry()..register(tool);
      final executor = AgentExecutor(
        toolRegistry: registry,
        validator: AgentValidator(),
        maxRetriesPerStep: 2,
      );

      const plan = AgentPlan(
        goalAr: 'اختبار',
        steps: [
          PlanStep(stepId: 's1', toolName: 'always_failing', descriptionAr: 'خطوة')
        ],
      );

      final outcomes = await executor.executePlan(
        plan: plan,
        context: _buildContext(),
        shortTermMemory: ShortTermMemory('task1'),
        sessionId: 'session1',
      );

      expect(outcomes.first.succeeded, isFalse);
      // محاولة أولى + محاولتان إعادة = 3 استدعاءات كحد أقصى.
      expect(tool.callCount, 3);
    });

    test('إلغاء المستخدم قبل بدء التنفيذ يرمي UserCancelledError', () async {
      final tool = _CountingTool('tool_a');
      final registry = AgentToolRegistry()..register(tool);
      final executor = AgentExecutor(
        toolRegistry: registry,
        validator: AgentValidator(),
      );

      const plan = AgentPlan(
        goalAr: 'اختبار',
        steps: [PlanStep(stepId: 's1', toolName: 'tool_a', descriptionAr: 'خطوة')],
      );

      final context = _buildContext()..cancel();

      expect(
        () => executor.executePlan(
          plan: plan,
          context: context,
          shortTermMemory: ShortTermMemory('task1'),
          sessionId: 'session1',
        ),
        throwsA(isA<UserCancelledError>()),
      );
    });

    test('تجاوز الحد الأقصى للدورات يرمي MaxIterationsExceededError',
        () async {
      final tools = List.generate(5, (i) => _CountingTool('tool_$i'));
      final registry = AgentToolRegistry();
      for (final t in tools) {
        registry.register(t);
      }
      final executor = AgentExecutor(
        toolRegistry: registry,
        validator: AgentValidator(),
        maxTotalIterations: 2, // أقل من عدد الخطوات عمداً
      );

      final plan = AgentPlan(
        goalAr: 'اختبار',
        steps: [
          for (final t in tools)
            PlanStep(stepId: t.name, toolName: t.name, descriptionAr: 'خطوة'),
        ],
      );

      expect(
        () => executor.executePlan(
          plan: plan,
          context: _buildContext(),
          shortTermMemory: ShortTermMemory('task1'),
          sessionId: 'session1',
        ),
        throwsA(isA<MaxIterationsExceededError>()),
      );
    });
  });
}
