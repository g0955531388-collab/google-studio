/// =============================================================
/// Lifex-AI — شبكة الرعاية والمرافقين الموثوقين
/// الملف: caregiver_network_screen.dart
/// المسار: lib/screens/caregiver_network_screen.dart
/// الوصف: شاشة إدارة جهات الثقة والمرافقين (Caregivers / Family Network)
/// تتيح للمريض أو ذوي الإعاقة أو كبار السن تحديد من يُسمح له بمتابعة
/// حالتهم الصحية عن بعد، وتحديد مستويات الوصول وإرسال تنبيهات الطوارئ.
/// =============================================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../core/health_event_manager.dart';
import '../features/profile/active_profile_controller.dart';
import '../features/remote_health/trusted_contacts_manager.dart';
import '../widgets/accessible_widgets.dart';

class CaregiverNetworkScreen extends StatefulWidget {
  const CaregiverNetworkScreen({super.key, required this.profileId});

  final String profileId;

  @override
  State<CaregiverNetworkScreen> createState() => _CaregiverNetworkScreenState();
}

class _CaregiverNetworkScreenState extends State<CaregiverNetworkScreen> {
  late final TrustedContactsManager _contactsManager;

  final _nameController = TextEditingController();
  final _idController = TextEditingController();
  TrustedContactPermission _selectedPermission = TrustedContactPermission.remoteMonitoring;

  @override
  void initState() {
    super.initState();
    _contactsManager = TrustedContactsManager(profileId: widget.profileId);
    // إدراج جهات افتراضية للتمثيل السريري
    _contactsManager.addContact(
      TrustedContact(
        contactLifexId: 'caregiver-01',
        displayName: 'أحمد (الابن الأكبر / المرافق الرئيسي)',
        permission: TrustedContactPermission.fullDelegate,
      ),
    );
    _contactsManager.addContact(
      TrustedContact(
        contactLifexId: 'doc-44',
        displayName: 'د. خالد (طبيب الأسرة المتابع)',
        permission: TrustedContactPermission.remoteMonitoring,
      ),
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _idController.dispose();
    super.dispose();
  }

  String _permissionLabel(TrustedContactPermission permission) {
    switch (permission) {
      case TrustedContactPermission.emergencyNotifyOnly:
        return 'إشعار عند الطوارئ فقط';
      case TrustedContactPermission.remoteMonitoring:
        return 'متابعة المؤشرات والتقارير الصحية';
      case TrustedContactPermission.fullDelegate:
        return 'تفويض كامل ومتابعة حية مستمرة';
    }
  }

  Color _permissionColor(TrustedContactPermission permission) {
    switch (permission) {
      case TrustedContactPermission.emergencyNotifyOnly:
        return Colors.orange;
      case TrustedContactPermission.remoteMonitoring:
        return Colors.teal;
      case TrustedContactPermission.fullDelegate:
        return Colors.indigo;
    }
  }

  void _addContactDialog() {
    showDialog(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('إضافة مرافق أو جهة اتصال موثوقة'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'الاسم أو صفة القرابة',
                    hintText: 'مثال: سارة (الابنة)، د. عمر',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _idController,
                  decoration: const InputDecoration(
                    labelText: 'معرف Lifex أو رقم الهاتف',
                    hintText: 'مثال: LX-9942 أو 050xxxxxxx',
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<TrustedContactPermission>(
                  value: _selectedPermission,
                  decoration: const InputDecoration(labelText: 'مستوى الصلاحية'),
                  items: const [
                    DropdownMenuItem(
                      value: TrustedContactPermission.emergencyNotifyOnly,
                      child: Text('إشعار عند الطوارئ فقط'),
                    ),
                    DropdownMenuItem(
                      value: TrustedContactPermission.remoteMonitoring,
                      child: Text('متابعة المؤشرات الحيوية'),
                    ),
                    DropdownMenuItem(
                      value: TrustedContactPermission.fullDelegate,
                      child: Text('تفويض كامل وإدارة الرعاية'),
                    ),
                  ],
                  onChanged: (val) {
                    if (val != null) {
                      setDialogState(() {
                        _selectedPermission = val;
                      });
                    }
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('إلغاء'),
            ),
            FilledButton(
              onPressed: () {
                if (_nameController.text.trim().isEmpty) return;
                final contact = TrustedContact(
                  contactLifexId: _idController.text.trim().isEmpty
                      ? 'cg-${DateTime.now().millisecondsSinceEpoch}'
                      : _idController.text.trim(),
                  displayName: _nameController.text.trim(),
                  permission: _selectedPermission,
                );

                setState(() {
                  _contactsManager.addContact(contact);
                });

                HapticFeedback.mediumImpact();

                HealthEventManager.instance.emitQuick(
                  HealthEventType.profileUpdated,
                  sourceModule: 'caregiver_network_screen',
                  profileId: widget.profileId,
                  data: {
                    'action': 'trusted_contact_added',
                    'contactId': contact.contactLifexId,
                  },
                );

                _nameController.clear();
                _idController.clear();
                Navigator.of(dialogContext).pop();
              },
              child: const Text('إضافة'),
            ),
          ],
        ),
      ),
    );
  }

  void _sendBroadcastUpdate() {
    HapticFeedback.heavyImpact();
    HealthEventManager.instance.emitQuick(
      HealthEventType.profileUpdated,
      sourceModule: 'caregiver_network_screen',
      profileId: widget.profileId,
      data: {'action': 'broadcast_health_status_to_caregivers'},
    );

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('تم إرسال ملخص الحالة الصحية لجميع المرافقين المعتمدين.'),
        backgroundColor: Colors.teal,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final profileController = Provider.of<ActiveProfileController>(context);
    final profile = profileController.getProfileById(widget.profileId);
    final profileName = profile?.fullName ?? 'المريض';
    final contacts = _contactsManager.contacts;

    return Scaffold(
      appBar: AppBar(
        title: Text('شبكة المرافقين ($profileName)'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _addContactDialog,
        icon: const Icon(Icons.person_add_alt_1),
        label: const Text('إضافة مرافق'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              color: Colors.indigo.shade50,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: Colors.indigo.shade200),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.shield_outlined, color: Colors.indigo, size: 32),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'المراقبة الآمنة وحماية الاستمرارية',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'يتم إرسال تنبيهات الطوارئ والمؤشرات الحيوية بشكل فوري لجهات الثقة المحددة هنا، لحماية المريض في حال عجزه عن طلب المساعدة.',
                      style: TextStyle(fontSize: 13),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.tonalIcon(
                        onPressed: _sendBroadcastUpdate,
                        icon: const Icon(Icons.send_outlined),
                        label: const Text('إرسال تحديث فوري للمرافقين الآن'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'المرافقون وجهات الثقة المعتمدة',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            if (contacts.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: Text('لا توجد جهات ثقة مسجلة حالياً.'),
                ),
              )
            else
              ...contacts.map((c) {
                final pColor = _permissionColor(c.permission);

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 1,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              backgroundColor: pColor.withOpacity(0.15),
                              child: Icon(Icons.person, color: pColor),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    c.displayName,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                  ),
                                  Text(
                                    'المعرف: ${c.contactLifexId}',
                                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                              onPressed: () {
                                setState(() {
                                  _contactsManager.removeContact(c.contactLifexId);
                                });
                                HapticFeedback.selectionClick();
                              },
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: pColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            _permissionLabel(c.permission),
                            style: TextStyle(color: pColor, fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}
