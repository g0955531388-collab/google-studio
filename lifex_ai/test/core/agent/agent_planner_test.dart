// =============================================================
// Lifex-AI — اختبارات الوحدة
// الملف: agent_planner_test.dart
// المسار: test/core/agent/agent_planner_test.dart
// الوصف: يتحقق من اكتشاف النية وبناء الخطة المناسبة (بند 12)، ومن
// اقتراح بديل منطقي عند فشل خطوة (بند 13).
// =============================================================

import 'package:flutter_test/flutter_test.dart';
import 'package:lifex_ai/core/agent/agent_context.dart';
import 'package:lifex_ai/core/agent/agent_permissions.dart';
import 'package:lifex_ai/core/agent/agent_planner.dart';

AgentContext _context({
  String userRequest = '',
  Map<String, dynamic> taskContext = const {},
}) {
  return AgentContext(
    taskId: 't1',
    profileId: 'p1',
    userRequest: userRequest,
    permissions: const AgentGrantedPermissions(granted: {}),
    taskContext: taskContext,
  );
}

void main() {
  const planner = AgentPlanner();

  group('AgentPlanner.detectIntent', () {
    test('وجود مستند مرفق يُكتشف كنية "تحليل مستند" بصرف النظر عن النص',
        () {
      final ctx = _context(
        userRequest: 'مرحباً',
        taskContext: const {'hasAttachedDocument': true},
      );
      expect(planner.detectIntent(ctx), DetectedIntent.analyzeDocument);
    });

    test('وجود صورة مرفقة يُكتشف كنية "تحليل صورة"', () {
      final ctx = _context(
        userRequest: '',
        taskContext: const {'hasAttachedImage': true},
      );
      expect(planner.detectIntent(ctx), DetectedIntent.analyzeImage);
    });

    test('نص يحتوي كلمة عرض مثل "صداع" يُكتشف كسؤال أعراض', () {
      final ctx = _context(userRequest: 'عندي صداع شديد منذ الصباح');
      expect(planner.detectIntent(ctx), DetectedIntent.symptomQuestion);
    });

    test('نص عام بلا كلمات أعراض يُكتشف كسؤال معرفي عام', () {
      final ctx = _context(userRequest: 'ما فوائد شرب الماء؟');
      expect(planner.detectIntent(ctx), DetectedIntent.generalKnowledgeQuestion);
    });

    test('طلب فارغ تماماً يُكتشف كـ unknown', () {
      final ctx = _context(userRequest: '   ');
      expect(planner.detectIntent(ctx), DetectedIntent.unknown);
    });
  });

  group('AgentPlanner.buildPlan', () {
    test('خطة تحليل المستند تحتوي 3 خطوات بالترتيب الصحيح مع الاعتماديات',
        () {
      final ctx = _context(taskContext: const {'hasAttachedDocument': true});
      final plan = planner.buildPlan(DetectedIntent.analyzeDocument, ctx);

      expect(plan.steps.length, 3);
      expect(plan.steps[0].toolName, 'document_reader');
      expect(plan.steps[1].toolName, 'knowledge_search');
      expect(plan.steps[2].toolName, 'report_generator');
      expect(plan.steps[2].dependsOnStepIds,
          containsAll(['read_document', 'search_knowledge']));
    });

    test('خطة النية unknown فارغة (لا تنفيذ بلا فهم واضح)', () {
      final ctx = _context();
      final plan = planner.buildPlan(DetectedIntent.unknown, ctx);
      expect(plan.isEmpty, isTrue);
    });

    test('خطة سؤال الأعراض تحتوي بحث معرفة ثم تقرير', () {
      final ctx = _context(userRequest: 'عندي حمى');
      final plan = planner.buildPlan(DetectedIntent.symptomQuestion, ctx);

      expect(plan.steps.map((s) => s.toolName),
          ['knowledge_search', 'report_generator']);
    });
  });

  group('AgentPlanner.suggestAlternativeStep', () {
    test('فشل image_analysis يقترح document_reader كبديل نصي', () {
      const failedStep = PlanStep(
        stepId: 'analyze_image',
        toolName: 'image_analysis',
        descriptionAr: 'تحليل صورة',
      );

      final alternative = planner.suggestAlternativeStep(failedStep);
      expect(alternative, isNotNull);
      expect(alternative!.toolName, 'document_reader');
    });

    test('فشل أداة بلا بديل معروف يُرجع null (يجب طلب تدخل المستخدم)', () {
      const failedStep = PlanStep(
        stepId: 'search_knowledge',
        toolName: 'knowledge_search',
        descriptionAr: 'بحث',
      );

      final alternative = planner.suggestAlternativeStep(failedStep);
      expect(alternative, isNull);
    });
  });
}
