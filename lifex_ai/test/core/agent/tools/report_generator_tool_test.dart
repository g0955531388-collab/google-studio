// =============================================================
// Lifex-AI — اختبارات الوحدة
// الملف: report_generator_tool_test.dart
// المسار: test/core/agent/tools/report_generator_tool_test.dart
// الوصف: يختبر ReportGeneratorTool — تجميع البيانات، دمج مستوى الثقة
// (الأضعف يفوز — بند 17)، الفشل عند غياب بيانات كافية، وأن التقرير
// يُصنَّف دائماً "تحليل مساعد" وليس قراراً سريرياً (بند 31).
// =============================================================

import 'package:flutter_test/flutter_test.dart';
import 'package:lifex_ai/core/agent/agent_context.dart';
import 'package:lifex_ai/core/agent/agent_permissions.dart';
import 'package:lifex_ai/core/agent/tools/report_generator_tool.dart';

AgentContext _context() {
  return AgentContext(
    taskId: 't1',
    profileId: 'p1',
    userRequest: 'اختبار',
    permissions: const AgentGrantedPermissions(granted: {}),
  );
}

void main() {
  const tool = ReportGeneratorTool();

  test('يفشل عند عدم وجود أي نتائج سابقة قابلة للاستخدام', () async {
    final result = await tool.execute(
      arguments: const {'priorObservations': <Map<String, dynamic>>[]},
      context: _context(),
    );
    expect(result.isSuccess, isFalse);
  });

  test('يبني قسماً من نتيجة document_ocr', () async {
    final result = await tool.execute(
      arguments: const {
        'priorObservations': [
          {
            'dataType': 'document_ocr',
            'extractedText': 'نص تجريبي من تقرير طبي',
            'documentType': 'labReport',
            'confidence': 'high',
          }
        ],
      },
      context: _context(),
    );

    expect(result.isSuccess, isTrue);
    final sections = result.data['sections'] as List;
    expect(sections, isNotEmpty);
    expect(sections.first['contentAr'], 'نص تجريبي من تقرير طبي');
  });

  test('دمج ثقة high مع low عبر خطوتين يُنتج low (الأضعف يفوز)', () async {
    final result = await tool.execute(
      arguments: const {
        'priorObservations': [
          {
            'dataType': 'document_ocr',
            'extractedText': 'نص',
            'confidence': 'high',
          },
          {
            'dataType': 'knowledge_search',
            'matchCount': 0,
            'items': <Map<String, dynamic>>[],
            'confidence': 'low',
          },
        ],
      },
      context: _context(),
    );

    expect(result.data['confidence'], 'low');
  });

  test('التقرير يُصنَّف دائماً "تحليل مساعد" وليس قراراً سريرياً', () async {
    final result = await tool.execute(
      arguments: const {
        'priorObservations': [
          {
            'dataType': 'document_ocr',
            'extractedText': 'نص',
            'confidence': 'medium',
          }
        ],
      },
      context: _context(),
    );

    expect(result.data['reportKindAr'], contains('تحليل مساعد'));
    expect(result.data['reportKindAr'], isNot(contains('قرار سريري')));
  });

  test('يجمع أسماء ملفات المصادر من نتائج knowledge_search دون تكرار',
      () async {
    final result = await tool.execute(
      arguments: const {
        'priorObservations': [
          {
            'dataType': 'knowledge_search',
            'matchCount': 2,
            'items': [
              {'sourceFile': 'diseases_database.json'},
              {'sourceFile': 'diseases_database.json'},
            ],
            'confidence': 'medium',
          }
        ],
      },
      context: _context(),
    );

    expect(result.data['sourceFiles'], ['diseases_database.json']);
  });
}
