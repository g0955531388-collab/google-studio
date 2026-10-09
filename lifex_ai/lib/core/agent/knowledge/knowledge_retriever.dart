/// =============================================================
/// Lifex-AI — طبقة الوكيل الذكي (AI Agent Layer)
/// الملف: knowledge_retriever.dart
/// المسار: lib/core/agent/knowledge/knowledge_retriever.dart
/// الوصف: طبقة استرجاع مستقلة فوق MedicalDatabaseManager الموجود فعلاً
/// (بند 9: "لا تقم بتغيير البيانات الأصلية دون ضرورة... أنشئ طبقة
/// Retrieval مستقلة"). تبني فهرساً في الذاكرة مرة واحدة فقط عند أول
/// استخدام (بند 33: عدم إعادة تحميل قاعدة المعرفة في كل طلب)، ثم تجيب
/// عن كل استعلام لاحق من الفهرس المبني مسبقاً دون قراءة JSON مجدداً.
/// =============================================================

import '../../../data/medical_database_manager.dart';
import 'knowledge_context.dart';
import 'knowledge_document.dart';

class KnowledgeRetriever {
  KnowledgeRetriever({required MedicalDatabaseManager databaseManager})
      : _databaseManager = databaseManager;

  final MedicalDatabaseManager _databaseManager;

  List<KnowledgeDocument>? _index;

  /// يبني الفهرس مرة واحدة فقط، ثم يُعاد استخدامه لكل الاستعلامات
  /// التالية. لا يُعاد البناء إلا عبر [invalidateCache] الصريح (مثلاً
  /// بعد تحديث الحزمة الطبية من الخادم).
  Future<List<KnowledgeDocument>> _ensureIndex() async {
    if (_index != null) return _index!;

    final bundle = await _databaseManager.readFullBundle();
    final documents = <KnowledgeDocument>[];

    documents.addAll(_indexEntityFile(
      bundle[MedicalBundleFiles.diseases],
      listKey: 'diseases',
      category: 'disease',
      sourceFile: MedicalBundleFiles.diseases,
    ));
    documents.addAll(_indexEntityFile(
      bundle[MedicalBundleFiles.symptoms],
      listKey: 'symptoms',
      category: 'symptom',
      sourceFile: MedicalBundleFiles.symptoms,
    ));
    documents.addAll(_indexEntityFile(
      bundle[MedicalBundleFiles.medications],
      listKey: 'medications',
      category: 'medication',
      sourceFile: MedicalBundleFiles.medications,
    ));
    documents.addAll(_indexEntityFile(
      bundle[MedicalBundleFiles.tests],
      listKey: 'tests',
      category: 'test',
      sourceFile: MedicalBundleFiles.tests,
    ));

    _index = documents;
    return documents;
  }

  List<KnowledgeDocument> _indexEntityFile(
    Map<String, dynamic>? json, {
    required String listKey,
    required String category,
    required String sourceFile,
  }) {
    if (json == null) return const [];
    final list = json[listKey] as List<dynamic>? ?? const [];

    return list.map((entry) {
      final map = entry as Map<String, dynamic>;
      final id = (map['id'] as String?) ?? '';
      final nameAr = (map['nameAr'] as String?) ?? '';
      final nameEn = (map['nameEn'] as String?) ?? '';
      // ملاحظة: ملفات JSON الحالية لا تحتوي حقل synonymsAr فعلياً (تم
      // التحقق من البنية الفعلية) — هذا السطر يبقى متسامحاً (null-safe)
      // حتى يعمل تلقائياً إن أُضيف الحقل مستقبلاً دون تعديل هذا الملف.
      final synonyms = (map['synonymsAr'] as List<dynamic>?)
              ?.map((s) => s.toString())
              .join(' ') ??
          '';

      return KnowledgeDocument(
        id: id,
        sourceFile: sourceFile,
        category: category,
        searchableText: _normalize('$nameAr $nameEn $synonyms'),
        raw: map,
      );
    }).toList();
  }

  /// تطبيع بسيط للنص العربي للمطابقة (إزالة تشكيل بسيطة، توحيد مسافات،
  /// أحرف صغيرة للنصوص اللاتينية). ليس معالجة لغوية كاملة عمداً —
  /// الهدف مطابقة كلمات مفتاحية موثوقة، وليس فهماً لغوياً عميقاً (ذاك
  /// يبقى دور المحرك اللغوي الخارجي إن استُدعي).
  String _normalize(String input) {
    return input
        .trim()
        .replaceAll(RegExp(r'[\u064B-\u0652]'), '') // تشكيل عربي
        .replaceAll(RegExp(r'\s+'), ' ')
        .toLowerCase();
  }

  /// الاسترجاع الفعلي: تطبيع الاستعلام، ثم مطابقة نصية بسيطة وشفافة
  /// (وليس بحثاً دلالياً معقداً) ضد الفهرس. يُرجع فقط الوحدات ذات
  /// الصلة، وليس القاعدة كاملة (بند 9).
  Future<KnowledgeContext> retrieve(String query, {int maxResults = 8}) async {
    final normalizedQuery = _normalize(query);
    if (normalizedQuery.isEmpty) {
      return KnowledgeContext(query: query, matches: const []);
    }

    final index = await _ensureIndex();
    final terms = normalizedQuery.split(' ').where((t) => t.length >= 2);

    final scored = <MapEntry<KnowledgeDocument, int>>[];
    for (final doc in index) {
      int score = 0;
      for (final term in terms) {
        if (doc.searchableText.contains(term)) score++;
      }
      if (score > 0) scored.add(MapEntry(doc, score));
    }

    scored.sort((a, b) => b.value.compareTo(a.value));

    return KnowledgeContext(
      query: query,
      matches: scored.take(maxResults).map((e) => e.key).toList(),
    );
  }

  /// إبطال الفهرس المبني — يُستدعى فقط بعد تحديث فعلي للحزمة الطبية
  /// (مثال: بعد نجاح MedicalDatabaseManager.updateFromServer() أو ما
  /// يعادلها)، حتى لا تُستخدم بيانات قديمة صامتة.
  void invalidateCache() {
    _index = null;
  }
}
