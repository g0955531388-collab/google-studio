// =============================================================
// Lifex-AI — اختبارات الوحدة
// الملف: knowledge_context_test.dart
// المسار: test/core/agent/knowledge/knowledge_context_test.dart
// الوصف: يختبر منطق KnowledgeDocument/KnowledgeContext النقي (بدون
// أي اعتماد على قراءة ملفات JSON فعلية أو rootBundle). اختبار
// KnowledgeRetriever.retrieve() الكامل (الذي يعتمد على
// MedicalDatabaseManager.readFullBundle() القائم على rootBundle
// وgetApplicationDocumentsDirectory) يتطلب تهيئة منصة اختبار كاملة
// (Widget Test Binding + Platform Channel Mocking) ويُترك لاختبار
// تكامل منفصل خارج نطاق اختبارات الوحدة الصرفة هنا (بند 34: نطاق
// موثَّق صراحة بدل اختبار وهمي يبدو أنه يغطي شيئاً لا يغطيه فعلياً).
// =============================================================

import 'package:flutter_test/flutter_test.dart';
import 'package:lifex_ai/core/agent/knowledge/knowledge_context.dart';
import 'package:lifex_ai/core/agent/knowledge/knowledge_document.dart';

void main() {
  group('KnowledgeContext', () {
    test('isEmpty صحيح عند عدم وجود نتائج', () {
      const context = KnowledgeContext(query: 'صداع', matches: []);
      expect(context.isEmpty, isTrue);
    });

    test('isEmpty خاطئ عند وجود نتيجة واحدة على الأقل', () {
      const doc = KnowledgeDocument(
        id: 'd001',
        sourceFile: 'diseases_database.json',
        category: 'disease',
        searchableText: 'صداع نصفي',
        raw: {'id': 'd001', 'nameAr': 'صداع نصفي'},
      );
      const context = KnowledgeContext(query: 'صداع', matches: [doc]);
      expect(context.isEmpty, isFalse);
    });

    test('toContextMap يحترم الحد الأقصى maxItems', () {
      final docs = List.generate(
        10,
        (i) => KnowledgeDocument(
          id: 'd$i',
          sourceFile: 'diseases_database.json',
          category: 'disease',
          searchableText: 'مرض $i',
          raw: {'id': 'd$i'},
        ),
      );
      final context = KnowledgeContext(query: 'مرض', matches: docs);

      final map = context.toContextMap(maxItems: 3);
      expect((map['items'] as List).length, 3);
      expect(map['matchCount'], 10); // العدد الكلي يبقى صحيحاً حتى مع القص
    });

    test('toContextMap يتضمن sourceFile لكل عنصر (لإضافة المصادر لاحقاً)',
        () {
      const doc = KnowledgeDocument(
        id: 'd001',
        sourceFile: 'medications_database.json',
        category: 'medication',
        searchableText: 'باراسيتامول',
        raw: {'id': 'd001', 'nameAr': 'باراسيتامول'},
      );
      const context = KnowledgeContext(query: 'مسكن', matches: [doc]);

      final map = context.toContextMap();
      final items = map['items'] as List;
      expect(items.first['sourceFile'], 'medications_database.json');
    });
  });
}
