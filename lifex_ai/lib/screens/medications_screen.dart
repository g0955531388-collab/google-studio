/// =============================================================
/// Lifex-AI — إدارة الأدوية والوصفات الطبية
/// الملف: medications_screen.dart
/// المسار: lib/screens/medications_screen.dart
/// الوصف: شاشة متكاملة لعرض وإدارة الأدوية الحالية للملف الصحي النشط،
/// مع إمكانية إضافة جرعة جديدة وتوثيق أوقات التناول والتنبيهات.
/// =============================================================

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/health_event_manager.dart';
import '../features/profile/active_profile_controller.dart';
import '../features/profile/health_profile.dart';
import '../widgets/accessible_widgets.dart';

class MedicationItem {
  final String id;
  final String name;
  final String dosage;
  final String frequency;
  final String timing;
  bool isTaken;

  MedicationItem({
    required this.id,
    required this.name,
    required this.dosage,
    required this.frequency,
    required this.timing,
    this.isTaken = false,
  });
}

class MedicationsScreen extends StatefulWidget {
  const MedicationsScreen({super.key, required this.profileId});

  final String profileId;

  @override
  State<MedicationsScreen> createState() => _MedicationsScreenState();
}

class _MedicationsScreenState extends State<MedicationsScreen> {
  final List<MedicationItem> _medications = [
    MedicationItem(
      id: 'med-1',
      name: 'فيتامين د3 (Vitamin D3)',
      dosage: '1000 IU',
      frequency: 'مرة يومياً',
      timing: 'صباحاً بعد الإفطار',
    ),
    MedicationItem(
      id: 'med-2',
      name: 'أوميغا 3 (Omega 3)',
      dosage: '1000 mg',
      frequency: 'مرة يومياً',
      timing: 'مساءً مع العشاء',
    ),
  ];

  final _nameController = TextEditingController();
  final _dosageController = TextEditingController();
  final _frequencyController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _dosageController.dispose();
    _frequencyController.dispose();
    super.dispose();
  }

  void _addMedicationDialog() {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('إضافة دواء جديد'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'اسم الدواء أو المكمل',
                  hintText: 'مثال: باراسيتامول',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _dosageController,
                decoration: const InputDecoration(
                  labelText: 'الجرعة',
                  hintText: 'مثال: 500 ملغ',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _frequencyController,
                decoration: const InputDecoration(
                  labelText: 'التكرار',
                  hintText: 'مثال: مرتين يومياً',
                ),
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
              setState(() {
                _medications.add(
                  MedicationItem(
                    id: 'med-${DateTime.now().millisecondsSinceEpoch}',
                    name: _nameController.text.trim(),
                    dosage: _dosageController.text.trim().isEmpty
                        ? 'حسب الوصفة'
                        : _dosageController.text.trim(),
                    frequency: _frequencyController.text.trim().isEmpty
                        ? 'يومياً'
                        : _frequencyController.text.trim(),
                    timing: 'حسب إرشادات الطبيب',
                  ),
                );
              });

              HealthEventManager.instance.emitQuick(
                HealthEventType.profileUpdated,
                sourceModule: 'medications_screen',
                profileId: widget.profileId,
                data: {'action': 'medication_added', 'name': _nameController.text.trim()},
              );

              _nameController.clear();
              _dosageController.clear();
              _frequencyController.clear();
              Navigator.of(dialogContext).pop();
            },
            child: const Text('إضافة'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final profileController = Provider.of<ActiveProfileController>(context);
    final profile = profileController.getProfileById(widget.profileId);
    final profileName = profile?.fullName ?? 'الملف الصحي';

    return Scaffold(
      appBar: AppBar(
        title: Text('أدوية $profileName'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _addMedicationDialog,
        icon: const Icon(Icons.add),
        label: const Text('إضافة دواء'),
      ),
      body: SafeArea(
        child: _medications.isEmpty
            ? const Center(
                child: Text('لا توجد أدوية مسجلة حالياً لهذا الملف.'),
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: _medications.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final item = _medications[index];
                  return Card(
                    elevation: 1,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Checkbox(
                            value: item.isTaken,
                            onChanged: (val) {
                              setState(() {
                                item.isTaken = val ?? false;
                              });
                            },
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.name,
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                        decoration: item.isTaken
                                            ? TextDecoration.lineThrough
                                            : null,
                                      ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'الجرعة: ${item.dosage} | ${item.frequency}',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                                Text(
                                  'الموعد: ${item.timing}',
                                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                        color: Colors.teal,
                                      ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                            onPressed: () {
                              setState(() {
                                _medications.removeAt(index);
                              });
                            },
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }
}
