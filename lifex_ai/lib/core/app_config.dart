/// =============================================================
/// Lifex-AI — النواة الأساسية للنظام
/// الملف: app_config.dart
/// المسار: lib/core/app_config.dart
/// الوصف: إعدادات النظام العامة القابلة للتغيير أثناء التشغيل
/// (بيئة التشغيل، اللغة الافتراضية، إعدادات الخصوصية العامة...).
/// =============================================================

/// بيئات التشغيل الممكنة للتطبيق.
enum AppEnvironment { development, staging, production }

/// اللغات المدعومة حالياً داخل التطبيق.
enum AppLanguage { arabic, english }

/// إعدادات عامة قابلة للتعديل من قبل المستخدم أو المدير.
///
/// هذا الكلاس Singleton بسيط يحمل الإعدادات في الذاكرة أثناء تشغيل التطبيق.
/// التخزين الدائم (SharedPreferences/Hive/إلخ) يُضاف لاحقاً كطبقة تخزين
/// منفصلة تستدعي هذا الكلاس عند بدء التشغيل وعند كل تعديل.
class AppConfig {
  AppConfig._internal();
  static final AppConfig instance = AppConfig._internal();

  AppEnvironment environment = AppEnvironment.development;

  AppLanguage defaultLanguage = AppLanguage.arabic;

  /// هل الوضع الليلي مفعّل؟
  bool darkModeEnabled = false;

  /// هل يُسمح بجمع بيانات استخدام مجهولة الهوية لتحسين النظام؟
  bool anonymousAnalyticsEnabled = false;

  /// هل الوضع الصوتي (قراءة تلقائية للتنبيهات) مفعّل افتراضياً؟
  bool voiceGuidanceEnabledByDefault = true;

  /// هل يُسمح بالعمل بدون اتصال إنترنت (Offline-first)؟
  bool offlineModeSupported = true;

  /// الحد الأقصى لعدد الملفات الصحية داخل الحساب الواحد (نظام الحسابات
  /// المتعددة للعائلة).
  int maxFamilyProfilesPerAccount = 8;

  /// مدة صلاحية جلسة تسجيل الدخول قبل طلب إعادة التحقق (بالدقائق).
  int sessionTimeoutMinutes = 30;

  /// رابط خادم المانيفست الطبي (قابل للضبط عبر --dart-define=LIFEX_MEDICAL_MANIFEST_URL)
  String remoteManifestUrl = const String.fromEnvironment(
    'LIFEX_MEDICAL_MANIFEST_URL',
    defaultValue: '',
  );

  /// رابط خادم السحابة الخلفي (قابل للضبط عبر --dart-define=LIFEX_BACKEND_URL)
  String cloudBackendUrl = const String.fromEnvironment(
    'LIFEX_BACKEND_URL',
    defaultValue: '',
  );

  /// تحديث مجموعة من الإعدادات دفعة واحدة.
  void updateFrom({
    AppEnvironment? environment,
    AppLanguage? defaultLanguage,
    bool? darkModeEnabled,
    bool? anonymousAnalyticsEnabled,
    bool? voiceGuidanceEnabledByDefault,
    bool? offlineModeSupported,
    int? maxFamilyProfilesPerAccount,
    int? sessionTimeoutMinutes,
  }) {
    if (environment != null) this.environment = environment;
    if (defaultLanguage != null) this.defaultLanguage = defaultLanguage;
    if (darkModeEnabled != null) this.darkModeEnabled = darkModeEnabled;
    if (anonymousAnalyticsEnabled != null) {
      this.anonymousAnalyticsEnabled = anonymousAnalyticsEnabled;
    }
    if (voiceGuidanceEnabledByDefault != null) {
      this.voiceGuidanceEnabledByDefault = voiceGuidanceEnabledByDefault;
    }
    if (offlineModeSupported != null) {
      this.offlineModeSupported = offlineModeSupported;
    }
    if (maxFamilyProfilesPerAccount != null) {
      this.maxFamilyProfilesPerAccount = maxFamilyProfilesPerAccount;
    }
    if (sessionTimeoutMinutes != null) {
      this.sessionTimeoutMinutes = sessionTimeoutMinutes;
    }
  }

  Map<String, dynamic> toJson() => {
        'environment': environment.name,
        'defaultLanguage': defaultLanguage.name,
        'darkModeEnabled': darkModeEnabled,
        'anonymousAnalyticsEnabled': anonymousAnalyticsEnabled,
        'voiceGuidanceEnabledByDefault': voiceGuidanceEnabledByDefault,
        'offlineModeSupported': offlineModeSupported,
        'maxFamilyProfilesPerAccount': maxFamilyProfilesPerAccount,
        'sessionTimeoutMinutes': sessionTimeoutMinutes,
      };
}
