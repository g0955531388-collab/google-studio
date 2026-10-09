/// =============================================================
/// Lifex-AI — واجهات التطبيق
/// الملف: settings_screen.dart
/// المسار: lib/screens/settings_screen.dart
/// الوصف: شاشة الإعدادات العامة — لغة، وضع ليلي، صلاحيات، خصوصية،
/// وتحديث المحتوى الطبي. ترتبط منطقياً بـ AppConfig وProfilePrivacyManager
/// وMedicalDatabaseManager.
/// =============================================================

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/app_config.dart';
import '../core/app_constants.dart';
import '../data/medical_database_manager.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late bool _darkModeEnabled;
  late bool _voiceGuidanceEnabled;
  late AppLanguage _selectedLanguage;

  bool _isCheckingForUpdate = false;
  bool _isDownloadingUpdate = false;
  String? _updateStatusMessageAr;

  @override
  void initState() {
    super.initState();
    final config = AppConfig.instance;
    _darkModeEnabled = config.darkModeEnabled;
    _voiceGuidanceEnabled = config.voiceGuidanceEnabledByDefault;
    _selectedLanguage = config.defaultLanguage;
  }

  void _persist() {
    AppConfig.instance.updateFrom(
      darkModeEnabled: _darkModeEnabled,
      voiceGuidanceEnabledByDefault: _voiceGuidanceEnabled,
      defaultLanguage: _selectedLanguage,
    );
  }

  Future<void> _checkForMedicalUpdate(
    MedicalDatabaseManager databaseManager,
  ) async {
    setState(() {
      _isCheckingForUpdate = true;
      _updateStatusMessageAr = null;
    });

    final newVersion = await databaseManager.checkForNewerVersion();

    if (!mounted) return;
    setState(() {
      _isCheckingForUpdate = false;
      _updateStatusMessageAr = newVersion != null
          ? 'يتوفر إصدار جديد ($newVersion) لقاعدة البيانات الطبية.'
          : 'قاعدة بياناتك الطبية محدَّثة بالفعل.';
    });
  }

  Future<void> _downloadMedicalUpdate(
    MedicalDatabaseManager databaseManager,
  ) async {
    setState(() {
      _isDownloadingUpdate = true;
      _updateStatusMessageAr = null;
    });

    final result = await databaseManager.downloadAndUpdateBundle();

    if (!mounted) return;
    setState(() {
      _isDownloadingUpdate = false;
      _updateStatusMessageAr = result.messageAr;
    });

    if (result.success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result.messageAr)),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result.messageAr),
          backgroundColor: Colors.orange,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('الإعدادات')),
      body: ListView(
        children: [
          SwitchListTile(
            title: const Text('الوضع الليلي'),
            value: _darkModeEnabled,
            onChanged: (value) {
              setState(() => _darkModeEnabled = value);
              _persist();
            },
          ),
          SwitchListTile(
            title: const Text('الإرشاد الصوتي'),
            subtitle: const Text('قراءة التنبيهات صوتياً تلقائياً'),
            value: _voiceGuidanceEnabled,
            onChanged: (value) {
              setState(() => _voiceGuidanceEnabled = value);
              _persist();
            },
          ),
          Semantics(
            label: 'اللغة، القيمة الحالية: '
                '${_selectedLanguage == AppLanguage.arabic ? "العربية" : "الإنجليزية"}',
            hint: 'اضغط لاختيار لغة مختلفة',
            child: ListTile(
              title: const Text('اللغة'),
              trailing: ExcludeSemantics(
                child: DropdownButton<AppLanguage>(
                  value: _selectedLanguage,
                  items: const [
                    DropdownMenuItem(
                      value: AppLanguage.arabic,
                      child: Text('العربية'),
                    ),
                    DropdownMenuItem(
                      value: AppLanguage.english,
                      child: Text('English'),
                    ),
                  ],
                  onChanged: (value) {
                    if (value == null) return;
                    setState(() => _selectedLanguage = value);
                    _persist();
                  },
                ),
              ),
            ),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.privacy_tip_outlined),
            title: const Text('إعدادات الخصوصية'),
            subtitle: const Text('التحكم بمن يرى بياناتك الصحية'),
            trailing: const Icon(Icons.chevron_left),
            onTap: () {
              // TODO: ربط هذا بشاشة مخصصة تستعرض
              // ProfilePrivacyManager عند بنائها.
            },
          ),
          ListTile(
            leading: const Icon(Icons.family_restroom_outlined),
            title: const Text('إدارة أفراد العائلة'),
            trailing: const Icon(Icons.chevron_left),
            onTap: () {
              // TODO: ربط هذا بـ MultiProfileEngine.
            },
          ),
          const Divider(),
          _buildMedicalUpdateSection(context),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.info_outline),
            title: const Text('حول التطبيق'),
            subtitle: const Text('Lifex-AI'),
            onTap: () {
              showAboutDialog(
                context: context,
                applicationName: 'Lifex-AI',
                applicationVersion: '0.1.0',
                children: [
                  const SizedBox(height: 12),
                  const Text(
                    AppConstants.ownershipStatement,
                    style: TextStyle(fontSize: 12),
                    textAlign: TextAlign.right,
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  /// قسم "تحديث وتوسيع المحتوى الطبي" — يسمح للمستخدم بالتحقق من وجود
  /// إصدار أحدث لقاعدة البيانات الطبية وتحميله بأمان، مع إبقاء النسخة
  /// الحالية تعمل بلا انقطاع في حال فشل أو تأجيل التحديث.
  Widget _buildMedicalUpdateSection(BuildContext context) {
    final databaseManager = Provider.of<MedicalDatabaseManager>(
      context,
      listen: false,
    );

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.medical_information_outlined),
              const SizedBox(width: 12),
              Text(
                'تحديث وتوسيع المحتوى الطبي',
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'قاعدة البيانات الطبية تعمل بالكامل دون إنترنت. يمكنك '
            'التحقق من وجود توسعات جديدة (أمراض، أعراض، تحاليل) '
            'وتحميلها عند توفر اتصال.',
            style: TextStyle(fontSize: 12, color: Colors.grey),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              OutlinedButton.icon(
                icon: _isCheckingForUpdate
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.search),
                label: const Text('التحقق من وجود تحديثات'),
                onPressed: _isCheckingForUpdate || _isDownloadingUpdate
                    ? null
                    : () => _checkForMedicalUpdate(databaseManager),
              ),
              const SizedBox(width: 12),
              FilledButton.icon(
                icon: _isDownloadingUpdate
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.download_outlined),
                label: const Text('تنزيل التحديث'),
                onPressed: _isCheckingForUpdate || _isDownloadingUpdate
                    ? null
                    : () => _downloadMedicalUpdate(databaseManager),
              ),
            ],
          ),
          if (_updateStatusMessageAr != null) ...[
            const SizedBox(height: 8),
            Text(
              _updateStatusMessageAr!,
              style: const TextStyle(fontSize: 13),
            ),
          ],
        ],
      ),
    );
  }
}
