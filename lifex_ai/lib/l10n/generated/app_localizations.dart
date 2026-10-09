/// =============================================================
/// Lifex-AI — نظام الترجمة
/// الملف: app_localizations.dart (مولَّد يدوياً)
/// المسار: lib/l10n/generated/app_localizations.dart
/// الوصف: هذا الملف يحاكي تماماً الناتج الذي يولّده أمر
/// `flutter gen-l10n` تلقائياً من ملفات lib/l10n/app_ar.arb وapp_en.arb.
/// كُتب يدوياً هنا لضمان أن المشروع يُبنى وينجح فوراً دون انتظار خطوة
/// توليد إضافية، لكنه **يجب استبداله فوراً** بالناتج الرسمي بتشغيل:
///   flutter gen-l10n
/// في كل مرة تُضاف أو تُعدَّل فيها مفاتيح الترجمة في ملفات .arb، حتى لا
/// يفقد هذا الملف اليدوي التزامنه معها بمرور الوقت.
/// =============================================================

import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';

/// الصف الأساسي المجرَّد للترجمة — نفس البنية التي يولّدها Flutter
/// الرسمي، حتى يبقى الاستبدال بالملف الرسمي لاحقاً بلا أي تعديل في بقية
/// الكود الذي يستخدم AppLocalizations.of(context).
abstract class AppLocalizations {
  AppLocalizations(String locale) : localeName = locale;

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    final result = Localizations.of<AppLocalizations>(context, AppLocalizations);
    assert(result != null, 'No AppLocalizations found in context');
    return result!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  static const List<Locale> supportedLocales = [Locale('ar'), Locale('en')];

  String get appTitle;
  String get homeMyHealthProfile;
  String get homeMyMedications;
  String get homeMyAppointments;
  String get homeEmergency;
  String get emergencyConfirmTitle;
  String get emergencyConfirmBody;
  String get cancel;
  String get confirmEmergency;
  String get emergencyAlertSent;
  String get settingsTitle;
  String get settingsDarkMode;
  String get settingsVoiceGuidance;
  String get settingsVoiceGuidanceSubtitle;
  String get settingsLanguage;
  String get settingsPrivacy;
  String get settingsPrivacySubtitle;
  String get settingsFamilyManagement;
  String get settingsMedicalUpdateSectionTitle;
  String get settingsMedicalUpdateSectionBody;
  String get settingsCheckForUpdates;
  String get settingsDownloadUpdate;
  String get settingsAbout;
  String get noHealthProfileLoaded;
  String get accessibilityHomeButton;
  String get accessibilityEmergencyButton;
  String get accessibilitySettingsButton;
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) =>
      ['ar', 'en'].contains(locale.languageCode);

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(
      switch (locale.languageCode) {
        'en' => AppLocalizationsEn(),
        _ => AppLocalizationsAr(),
      },
    );
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

/// النسخة العربية — مطابقة تماماً لمحتوى lib/l10n/app_ar.arb.
class AppLocalizationsAr extends AppLocalizations {
  AppLocalizationsAr() : super('ar');

  @override
  String get appTitle => 'Lifex-AI';
  @override
  String get homeMyHealthProfile => 'ملفي الصحي';
  @override
  String get homeMyMedications => 'أدويتي';
  @override
  String get homeMyAppointments => 'مواعيدي';
  @override
  String get homeEmergency => 'طوارئ';
  @override
  String get emergencyConfirmTitle => 'تأكيد حالة طوارئ';
  @override
  String get emergencyConfirmBody =>
      'سيتم إبلاغ جهات الثقة المسجَّلة لديك فوراً. هل تريد المتابعة؟';
  @override
  String get cancel => 'إلغاء';
  @override
  String get confirmEmergency => 'تأكيد الطوارئ';
  @override
  String get emergencyAlertSent => 'تم إرسال تنبيه الطوارئ لجهات الثقة.';
  @override
  String get settingsTitle => 'الإعدادات';
  @override
  String get settingsDarkMode => 'الوضع الليلي';
  @override
  String get settingsVoiceGuidance => 'الإرشاد الصوتي';
  @override
  String get settingsVoiceGuidanceSubtitle => 'قراءة التنبيهات صوتياً تلقائياً';
  @override
  String get settingsLanguage => 'اللغة';
  @override
  String get settingsPrivacy => 'إعدادات الخصوصية';
  @override
  String get settingsPrivacySubtitle => 'التحكم بمن يرى بياناتك الصحية';
  @override
  String get settingsFamilyManagement => 'إدارة أفراد العائلة';
  @override
  String get settingsMedicalUpdateSectionTitle => 'تحديث وتوسيع المحتوى الطبي';
  @override
  String get settingsMedicalUpdateSectionBody =>
      'قاعدة البيانات الطبية تعمل بالكامل دون إنترنت. يمكنك التحقق من '
      'وجود توسعات جديدة وتحميلها عند توفر اتصال.';
  @override
  String get settingsCheckForUpdates => 'التحقق من وجود تحديثات';
  @override
  String get settingsDownloadUpdate => 'تنزيل التحديث';
  @override
  String get settingsAbout => 'حول التطبيق';
  @override
  String get noHealthProfileLoaded => 'لا يوجد ملف صحي محمَّل حالياً.';
  @override
  String get accessibilityHomeButton => 'الشاشة الرئيسية';
  @override
  String get accessibilityEmergencyButton =>
      'زر الطوارئ. اضغط ضغطاً مزدوجاً لتفعيل حالة طوارئ فورية';
  @override
  String get accessibilitySettingsButton => 'زر الإعدادات';
}

/// النسخة الإنجليزية — مطابقة تماماً لمحتوى lib/l10n/app_en.arb.
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn() : super('en');

  @override
  String get appTitle => 'Lifex-AI';
  @override
  String get homeMyHealthProfile => 'My Health Profile';
  @override
  String get homeMyMedications => 'My Medications';
  @override
  String get homeMyAppointments => 'My Appointments';
  @override
  String get homeEmergency => 'Emergency';
  @override
  String get emergencyConfirmTitle => 'Confirm Emergency';
  @override
  String get emergencyConfirmBody =>
      'Your trusted contacts will be notified immediately. Continue?';
  @override
  String get cancel => 'Cancel';
  @override
  String get confirmEmergency => 'Confirm Emergency';
  @override
  String get emergencyAlertSent => 'Emergency alert sent to your trusted contacts.';
  @override
  String get settingsTitle => 'Settings';
  @override
  String get settingsDarkMode => 'Dark Mode';
  @override
  String get settingsVoiceGuidance => 'Voice Guidance';
  @override
  String get settingsVoiceGuidanceSubtitle => 'Automatically read alerts aloud';
  @override
  String get settingsLanguage => 'Language';
  @override
  String get settingsPrivacy => 'Privacy Settings';
  @override
  String get settingsPrivacySubtitle => 'Control who can see your health data';
  @override
  String get settingsFamilyManagement => 'Manage Family Members';
  @override
  String get settingsMedicalUpdateSectionTitle => 'Update Medical Content';
  @override
  String get settingsMedicalUpdateSectionBody =>
      'The medical database works fully offline. You can check for new '
      'expansions and download them when connected.';
  @override
  String get settingsCheckForUpdates => 'Check for Updates';
  @override
  String get settingsDownloadUpdate => 'Download Update';
  @override
  String get settingsAbout => 'About';
  @override
  String get noHealthProfileLoaded => 'No health profile loaded yet.';
  @override
  String get accessibilityHomeButton => 'Home screen';
  @override
  String get accessibilityEmergencyButton =>
      'Emergency button. Double tap to trigger an immediate emergency alert';
  @override
  String get accessibilitySettingsButton => 'Settings button';
}
