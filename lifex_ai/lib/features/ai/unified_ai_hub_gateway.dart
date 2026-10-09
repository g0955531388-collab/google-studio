/// =============================================================
/// Lifex-AI — الذكاء الاصطناعي الصحي
/// الملف: unified_ai_hub_gateway.dart
/// المسار: lib/features/ai/unified_ai_hub_gateway.dart
/// الوصف: بوابة موحّدة تسمح للمستخدم بربط حسابه/مفتاحه الخاص بمحركات
/// ذكاء اصطناعي خارجية متعددة (Gemini كمحرك أساسي، بالإضافة لأي محرك
/// آخر يدعمه لاحقاً)، واختيار أي محرك يريد استخدامه لكل استعلام.
///
/// ⚠️ أمان حرج: مفاتيح API/بيانات الاعتماد يجب ألا تُخزَّن أبداً كنص
/// عادي (plain text) في التخزين العادي. في التنفيذ الفعلي، استخدم حزمة
/// flutter_secure_storage (تخزين مشفَّر على مستوى نظام التشغيل) بدلاً
/// من أي حل تخزين عادي. هذا الملف يوفر البنية المنطقية فقط.
///
/// ⚠️ هذا الملف لا يخزّن أو "يزوّر" أي عدد مستخدمين — عدد المستخدمين
/// الفعلي يُحسب من طرف الخادم الحقيقي عند وجوده، وليس رقماً ثابتاً هنا.
/// =============================================================

import '../../core/error_handler.dart';

/// محركات الذكاء الاصطناعي الخارجية المدعومة حالياً كهيكل، مع إمكانية
/// إضافة محركات جديدة دون تعديل بنية النظام الأساسية.
enum ExternalAiProvider {
  gemini, // المحرك الأساسي المفضَّل افتراضياً
  chatgpt,
  claude,
  custom, // أي محرك آخر يضيفه المستخدم عبر رابط API عام متوافق
}

/// بيانات اعتماد حساب واحد مربوط بمحرك خارجي معيّن. هذا الكائن يمثّل
/// البنية فقط؛ التخزين الفعلي الآمن يتم عبر طبقة أمان منفصلة.
class ConnectedAiAccount {
  final ExternalAiProvider provider;
  final String accountLabel; // اسم وصفي يختاره المستخدم (مثلاً "حسابي الشخصي")
  final DateTime connectedAt;
  bool isActive;

  ConnectedAiAccount({
    required this.provider,
    required this.accountLabel,
    this.isActive = true,
    DateTime? connectedAt,
  }) : connectedAt = connectedAt ?? DateTime.now();
}

/// عقد أي مزوّد اعتماد آمن فعلي (Secure Credential Store)، يُنفَّذ لاحقاً
/// عبر flutter_secure_storage أو ما يعادله.
abstract class SecureCredentialStore {
  Future<void> saveCredential(String key, String value);
  Future<String?> readCredential(String key);
  Future<void> deleteCredential(String key);
}

/// بوابة الذكاء الاصطناعي الموحّدة — نقطة الدخول الوحيدة لإدارة حسابات
/// المستخدم المربوطة بمحركات الذكاء الاصطناعي الخارجية.
class UnifiedAiHubGateway {
  UnifiedAiHubGateway({required this.credentialStore});

  final SecureCredentialStore credentialStore;

  final Map<String, ConnectedAiAccount> _accountsByProfileId = {};
  final Map<String, ExternalAiProvider> _preferredProviderByProfileId = {};

  /// ربط حساب/مفتاح جديد بمحرك ذكاء اصطناعي معيّن لملف صحي محدد.
  /// المفتاح الفعلي (apiKey) يُخزَّن عبر [credentialStore] الآمن فقط،
  /// ولا يُحفظ أبداً داخل هذا الكائن في الذاكرة كنص دائم.
  Future<bool> connectAccount({
    required String profileId,
    required ExternalAiProvider provider,
    required String accountLabel,
    required String apiKeyOrToken,
  }) async {
    try {
      final credentialKey = _credentialKeyFor(profileId, provider);
      await credentialStore.saveCredential(credentialKey, apiKeyOrToken);

      _accountsByProfileId[_accountKeyFor(profileId, provider)] =
          ConnectedAiAccount(provider: provider, accountLabel: accountLabel);

      // أول محرك يُربط يصبح المفضَّل تلقائياً، وGemini يبقى الافتراضي
      // الموصى به إن لم يُحدَّد المستخدم غيره صراحة.
      _preferredProviderByProfileId.putIfAbsent(profileId, () => provider);

      return true;
    } catch (e, stackTrace) {
      ErrorHandler.instance.report(
        'AI_HUB_CONNECT_FAILED',
        'فشل ربط حساب محرك الذكاء الاصطناعي: ${provider.name}',
        sourceModule: 'unified_ai_hub_gateway',
        exception: e,
        stackTrace: stackTrace,
      );
      return false;
    }
  }

  /// فصل حساب مربوط مسبقاً وحذف بيانات اعتماده الآمنة نهائياً.
  Future<void> disconnectAccount({
    required String profileId,
    required ExternalAiProvider provider,
  }) async {
    final credentialKey = _credentialKeyFor(profileId, provider);
    await credentialStore.deleteCredential(credentialKey);
    _accountsByProfileId.remove(_accountKeyFor(profileId, provider));

    if (_preferredProviderByProfileId[profileId] == provider) {
      _preferredProviderByProfileId.remove(profileId);
    }
  }

  /// تحديد المحرك المفضَّل الذي سيُستخدم افتراضياً لهذا المستخدم.
  void setPreferredProvider(String profileId, ExternalAiProvider provider) {
    _preferredProviderByProfileId[profileId] = provider;
  }

  ExternalAiProvider? preferredProviderFor(String profileId) =>
      _preferredProviderByProfileId[profileId];

  /// كل الحسابات المربوطة حالياً لملف صحي معيّن.
  List<ConnectedAiAccount> connectedAccountsFor(String profileId) {
    return _accountsByProfileId.entries
        .where((entry) => entry.key.startsWith('$profileId::'))
        .map((entry) => entry.value)
        .toList();
  }

  /// استرجاع بيانات الاعتماد الآمنة لمحرك معيّن (تُستخدم داخلياً فقط
  /// من AiServiceRouter عند تنفيذ استعلام فعلي).
  Future<String?> credentialFor({
    required String profileId,
    required ExternalAiProvider provider,
  }) {
    return credentialStore.readCredential(_credentialKeyFor(profileId, provider));
  }

  String _accountKeyFor(String profileId, ExternalAiProvider provider) =>
      '$profileId::${provider.name}';

  String _credentialKeyFor(String profileId, ExternalAiProvider provider) =>
      'lifex_ai_credential::$profileId::${provider.name}';
}
