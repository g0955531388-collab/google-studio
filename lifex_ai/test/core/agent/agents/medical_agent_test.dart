// =============================================================
// Lifex-AI — اختبارات الوحدة
// الملف: medical_agent_test.dart
// المسار: test/core/agent/agents/medical_agent_test.dart
// الوصف: يختبر مسار MedicalAgent الاحتياطي (عندما لا تتوفر
// HealthAnalysisEngine/DoctorGuidanceEngine — مثلاً في اختبار وحدة
// معزول) — يجب ألا يُصدر أبداً تشخيصاً قطعياً، وأن يخفّض الثقة تلقائياً
// عند غياب نتائج معرفة (بند 31: عدم التشخيص القطعي بإشارة واحدة).
// المسار الكامل (مع المحركات الحقيقية) يُغطّى ضمن اختبار تكامل أوسع
// لأنه يحتاج بيانات symptomBodySystemMap فعلية من medical_knowledge.json.
// =============================================================

import 'package:flutter_test/flutter_test.dart';
import 'package:lifex_ai/core/agent/agent_confidence.dart';
import 'package:lifex_ai/core/agent/agents/medical_agent.dart';
import 'package:lifex_ai/core/agent/knowledge/knowledge_context.dart';
import 'package:lifex_ai/core/agent/knowledge/knowledge_document.dart';

void main() {
  group('MedicalAgent (fallback path, no advanced engines)', () {
    late MedicalAgent agent;

    setUp(() {
      agent = MedicalAgent(); // بلا analysisEngine/guidanceEngine
    });

    test('سياق معرفة فارغ ينتج ثقة unknown ولا يقدّم تشخيصاً', () {
      const knowledgeContext = KnowledgeContext(query: 'صداع', matches: []);

      final analysis = agent.analyze(
        userTextAr: 'عندي صداع',
        knowledgeContext: knowledgeContext,
      );

      expect(analysis.confidence, AgentConfidence.unknown);
      expect(analysis.summaryAr, isNot(contains('تشخيص')));
    });

    test('سياق معرفة يحتوي نتائج ينتج ثقة low وليس high (حذر افتراضي)',
        () {
      const doc = KnowledgeDocument(
        id: 's001',
        sourceFile: 'symptoms_database.json',
        category: 'symptom',
        searchableText: 'صداع',
        raw: {'id': 's001', 'nameAr': 'صداع'},
      );
      const knowledgeContext = KnowledgeContext(query: 'صداع', matches: [doc]);

      final analysis = agent.analyze(
        userTextAr: 'عندي صداع',
        knowledgeContext: knowledgeContext,
      );

      expect(analysis.confidence, AgentConfidence.low);
    });

    test('التنويه غير فارغ دائماً بصرف النظر عن النتيجة', () {
      const knowledgeContext = KnowledgeContext(query: '', matches: []);
      final analysis = agent.analyze(
        userTextAr: '',
        knowledgeContext: knowledgeContext,
      );
      expect(analysis.disclaimerAr, isNotEmpty);
    });

    test('التخصص المقترح افتراضياً هو "طب عام" في المسار الاحتياطي', () {
      const knowledgeContext = KnowledgeContext(query: '', matches: []);
      final analysis = agent.analyze(
        userTextAr: '',
        knowledgeContext: knowledgeContext,
      );
      expect(analysis.recommendedSpecialtyAr, 'طب عام');
    });
  });
}
