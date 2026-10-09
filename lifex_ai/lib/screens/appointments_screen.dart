/// =============================================================
/// Lifex-AI — إدارة المواعيد والاستشارات الطبية
/// الملف: appointments_screen.dart
/// المسار: lib/screens/appointments_screen.dart
/// الوصف: شاشة لعرض وحجز المواعيد الطبية للملف الصحي النشط،
/// مع تتبع حالة الموعد (مطلوب، مؤكد، مكتمل) وجدولته زمنياً.
/// =============================================================

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/health_event_manager.dart';
import '../features/medical_services/doctors/appointment_manager.dart';
import '../features/profile/active_profile_controller.dart';

class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({super.key, required this.profileId});

  final String profileId;

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> {
  late final AppointmentManager _appointmentManager;
  final List<Appointment> _appointments = [];

  final _providerController = TextEditingController();
  final _reasonController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _appointmentManager = AppointmentManager();
    // إدراج موعد تمهيدي للملف النشط
    _appointments.add(
      _appointmentManager.requestAppointment(
        patientProfileId: widget.profileId,
        providerId: 'عيادة الطب الباطني - د. خالد الأحمد',
        scheduledAt: DateTime.now().add(const Duration(days: 3, hours: 2)),
        reasonAr: 'متابعة روتينية وفحص ضغط الدم والتحاليل الدورية',
      ),
    );
  }

  @override
  void dispose() {
    _providerController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  void _bookAppointmentDialog() {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('طلب موعد طبي جديد'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: _providerController,
                decoration: const InputDecoration(
                  labelText: 'الطبيب أو المركز الطبي',
                  hintText: 'مثال: د. سارة - طب الأطفال',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _reasonController,
                decoration: const InputDecoration(
                  labelText: 'سبب الزيارة أو الأعراض',
                  hintText: 'مثال: فحص دوري، ألم في الظهر',
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
              if (_providerController.text.trim().isEmpty) return;
              final apt = _appointmentManager.requestAppointment(
                patientProfileId: widget.profileId,
                providerId: _providerController.text.trim(),
                scheduledAt: DateTime.now().add(const Duration(days: 7)),
                reasonAr: _reasonController.text.trim().isEmpty
                    ? 'استشارة عامة'
                    : _reasonController.text.trim(),
              );

              setState(() {
                _appointments.add(apt);
              });

              _providerController.clear();
              _reasonController.clear();
              Navigator.of(dialogContext).pop();
            },
            child: const Text('حجز الموعد'),
          ),
        ],
      ),
    );
  }

  Color _statusColor(AppointmentStatus status) {
    switch (status) {
      case AppointmentStatus.confirmed:
        return Colors.green;
      case AppointmentStatus.requested:
        return Colors.orange;
      case AppointmentStatus.completed:
        return Colors.teal;
      case AppointmentStatus.cancelled:
      case AppointmentStatus.noShow:
        return Colors.red;
    }
  }

  String _statusLabel(AppointmentStatus status) {
    switch (status) {
      case AppointmentStatus.confirmed:
        return 'مؤكد';
      case AppointmentStatus.requested:
        return 'قيد الانتظار';
      case AppointmentStatus.completed:
        return 'مكتمل';
      case AppointmentStatus.cancelled:
        return 'ملغى';
      case AppointmentStatus.noShow:
        return 'لم يحضر';
    }
  }

  @override
  Widget build(BuildContext context) {
    final profileController = Provider.of<ActiveProfileController>(context);
    final profile = profileController.getProfileById(widget.profileId);
    final profileName = profile?.fullName ?? 'الملف الصحي';

    return Scaffold(
      appBar: AppBar(
        title: Text('مواعيد $profileName'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _bookAppointmentDialog,
        icon: const Icon(Icons.add),
        label: const Text('حجز موعد'),
      ),
      body: SafeArea(
        child: _appointments.isEmpty
            ? const Center(
                child: Text('لا توجد مواعيد طبية مسجلة حالياً.'),
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: _appointments.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final apt = _appointments[index];
                  return Card(
                    elevation: 1,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  apt.providerId,
                                  style: Theme.of(context).textTheme.titleMedium,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: _statusColor(apt.status).withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  _statusLabel(apt.status),
                                  style: TextStyle(
                                    color: _statusColor(apt.status),
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          if (apt.reasonAr != null)
                            Text(
                              apt.reasonAr!,
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.access_time, size: 16, color: Colors.grey),
                              const SizedBox(width: 4),
                              Text(
                                '${apt.scheduledAt.year}-${apt.scheduledAt.month.toString().padLeft(2, '0')}-${apt.scheduledAt.day.toString().padLeft(2, '0')} (${apt.scheduledAt.hour.toString().padLeft(2, '0')}:${apt.scheduledAt.minute.toString().padLeft(2, '0')})',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                              const Spacer(),
                              if (apt.status == AppointmentStatus.requested)
                                TextButton(
                                  onPressed: () {
                                    setState(() {
                                      apt.status = AppointmentStatus.cancelled;
                                    });
                                  },
                                  child: const Text('إلغاء الموعد', style: TextStyle(color: Colors.red)),
                                ),
                            ],
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
