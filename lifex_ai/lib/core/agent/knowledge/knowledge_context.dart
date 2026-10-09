/// =============================================================
/// Lifex-AI — طبقة الوكيل الذكي (AI Agent Layer)
/// الملف: knowledge_context.dart
/// المسار: lib/core/agent/knowledge/knowledge_context.dart
/// الوصف: نتيجة استرجاع معرفة واحدة — مجموعة وحدات ذات صلة فقط
/// بالاستعلام الحالي (بند 9)، جاهزة لتُدمَج في AgentContext.knowledgeContext.
/// =============================================================

import 'knowledge_document.dart';

class KnowledgeContext {
  const KnowledgeContext({
    required this.query,
    required this.matches,
  });

  final String query;
  final List<KnowledgeDocument> matches;

  bool get isEmpty => matches.isEmpty;

  /// تحويل مضغوط لإدراجه في AgentContext دون إرسال الحقول الخام كاملة
  /// لكل وحدة معرفة (Context Filtering — بند 11/33).
  Map<String, dynamic> toContextMap({int maxItems = 5}) {
    final limited = matches.take(maxItems);
    return {
      'query': query,
      'matchCount': matches.length,
      'items': limited
          .map((doc) => {
                'id': doc.id,
                'category': doc.category,
                'sourceFile': doc.sourceFile,
                'data': doc.raw,
              })
          .toList(),
    };
  }
}
