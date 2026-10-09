/// =============================================================
/// Lifex-AI — وحدة المنظمات والاتحادات والمؤسسات والجمعيات الخيرية
/// الملف: organizations_screen.dart
/// المسار: lib/screens/organizations_screen.dart
/// الوصف: واجهة استعراض وبحث الجمعيات والاتحادات المعتمدة، تقديم طلبات
/// الانتساب الطبي والتطوعي مع إرفاق السيرة الذاتية (CV)، وتقديم طلبات
/// المساعدات الإنسانية والعمليات الجراحية، وتسجيل الحسابات الجديدة.
/// =============================================================

import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';

class OrganizationsScreen extends StatefulWidget {
  final String? profileId;

  const OrganizationsScreen({super.key, this.profileId});

  @override
  State<OrganizationsScreen> createState() => _OrganizationsScreenState();
}

class _OrganizationsScreenState extends State<OrganizationsScreen> {
  String _searchQuery = '';
  String _selectedCategory = 'all';

  final List<Map<String, dynamic>> _organizations = [
    {
      'id': 'org-1',
      'name': 'اتحاد الأطباء للإغاثة الإنسانية والعمليات الجراحية',
      'type': 'اتحاد طبي إنساني',
      'category': 'medical_aid',
      'categoryAr': 'كفالة علاج وجراحة',
      'license': 'UN-MED-8834',
      'city': 'دمشق واللاذقية',
      'phone': '+963 11 2233445',
      'beneficiaries': 14200,
      'description':
          'اتحاد طبي تخصصي يضم نخبة من الجراحين والاستشاريين لتغطية العمليات القلبية والجراحية الدقيقة للأسر غير القادرة.',
    },
    {
      'id': 'org-2',
      'name': 'جمعية الحياة لتأمين أدوية الأمراض المزمنة والسرطان',
      'type': 'جمعية خيرية معتمدة',
      'category': 'medication_supply',
      'categoryAr': 'تأمين أدوية ومستلزمات',
      'license': 'CH-PHARM-4412',
      'city': 'حلب واللاذقية وحمص',
      'phone': '+963 21 8899001',
      'beneficiaries': 8900,
      'description':
          'مؤسسة صيدلانية إنسانية تتولى صرف الأدوية الشهرية التخصصية وأدوية الأورام والإنسولين بالمجان.',
    },
    {
      'id': 'org-3',
      'name': 'مؤسسة الأمل للكراسي والأطراف الصناعية وإعادة التأهيل',
      'type': 'مؤسسة وقفية وتأهيلية',
      'category': 'disability_rehab',
      'categoryAr': 'أطراف صناعية ورعاية ذوي الإعاقة',
      'license': 'FD-DISAB-1109',
      'city': 'اللاذقية وطرطوس',
      'phone': '+963 41 5566778',
      'beneficiaries': 6150,
      'description':
          'توفير الأطراف الصناعية الذكية والكراسي المتحركة والمعينات السمعية والبصرية وبرامج العلاج الفيزيائي.',
    },
    {
      'id': 'org-4',
      'name': 'جمعية البلسم لرعاية مرضى الفشل الكلوي',
      'type': 'جمعية صحية تخصصية',
      'category': 'dialysis_chronic',
      'categoryAr': 'غسيل كلى ورعاية مزمنة',
      'license': 'CH-RENAL-9921',
      'city': 'دمشق وريفها',
      'phone': '+963 11 9911223',
      'beneficiaries': 3400,
      'description':
          'كفالة جلسات الديلزة وغسيل الكلى وتأمين الفلاتر والمستهلكات ومتابعة برامج زراعة الكلى.',
    },
  ];

  @override
  Widget build(BuildContext context) {
    final filtered = _organizations.where((org) {
      final nameMatches = org['name'].toString().contains(_searchQuery) ||
          org['description'].toString().contains(_searchQuery) ||
          org['city'].toString().contains(_searchQuery);
      final catMatches =
          _selectedCategory == 'all' || org['category'] == _selectedCategory;
      return nameMatches && catMatches;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text(
          'وحدة المنظمات والاتحادات والجمعيات الخيرية',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_business_outlined, color: Colors.indigoAccent),
            tooltip: 'إنشاء حساب مؤسسة جديدة',
            onPressed: () => _showRegisterOrgDialog(context),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header Info Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1E1B4B), Color(0xFF0F172A)],
                  begin: Alignment.topRight,
                  end: Alignment.bottomLeft,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.indigo.withOpacity(0.4)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.indigo.withOpacity(0.3),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.apartment,
                          color: Colors.indigoAccent,
                          size: 28,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'شبكة التكافل الإنساني والطبي',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            Text(
                              'منظومة Lifex-AI لربط المرضى بالجمعيات المعتمدة',
                              style: TextStyle(
                                color: Colors.indigoAccent,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'تتيح لك هذه الوحدة البحث عن المؤسسات المعتمدة، تقديم طلبات الانتساب والتطوع الطبي مع إرفاق السيرة الذاتية (CV)، أو طلب كفالة العمليات والأدوية.',
                    style: TextStyle(color: Colors.white70, fontSize: 12, height: 1.4),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Search Bar
            TextField(
              onChanged: (val) => setState(() => _searchQuery = val),
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: InputDecoration(
                filled: true,
                fillColor: const Color(0xFF1E293B),
                hintText: 'ابحث باسم المؤسسة، التخصص، أو المدينة...',
                hintStyle: const TextStyle(color: Colors.white38, fontSize: 13),
                prefixIcon: const Icon(Icons.search, color: Colors.indigoAccent),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Category Filter Pills
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('الكل', 'all'),
                  _buildFilterChip('كفالة علاج وجراحة', 'medical_aid'),
                  _buildFilterChip('تأمين أدوية', 'medication_supply'),
                  _buildFilterChip('أطراف وإعاقة', 'disability_rehab'),
                  _buildFilterChip('غسيل كلى', 'dialysis_chronic'),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Organizations List
            ...filtered.map((org) => _buildOrgCard(context, org)),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, String categoryKey) {
    final isSelected = _selectedCategory == categoryKey;
    return Padding(
      padding: const EdgeInsets.only(left: 8.0),
      child: FilterChip(
        label: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.white70,
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        selected: isSelected,
        backgroundColor: const Color(0xFF1E293B),
        selectedColor: Colors.indigo,
        checkmarkColor: Colors.white,
        onSelected: (_) => setState(() => _selectedCategory = categoryKey),
      ),
    );
  }

  Widget _buildOrgCard(BuildContext context, Map<String, dynamic> org) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                backgroundColor: Colors.indigo.withOpacity(0.3),
                child: Text(
                  org['name'].toString().substring(0, 1),
                  style: const TextStyle(
                    color: Colors.indigoAccent,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      org['name'],
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      '${org['type']} • ترخيص: ${org['license']}',
                      style: const TextStyle(color: Colors.indigoAccent, fontSize: 11),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            org['description'],
            style: const TextStyle(color: Colors.white70, fontSize: 12, height: 1.4),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.location_on_outlined, size: 14, color: Colors.white38),
              const SizedBox(width: 4),
              Text(
                org['city'],
                style: const TextStyle(color: Colors.white54, fontSize: 11),
              ),
              const Spacer(),
              const Icon(Icons.people_alt_outlined, size: 14, color: Colors.greenAccent),
              const SizedBox(width: 4),
              Text(
                '+${org['beneficiaries']} مستفيد',
                style: const TextStyle(color: Colors.greenAccent, fontSize: 11),
              ),
            ],
          ),
          const Divider(color: Colors.white12, height: 24),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.file_upload_outlined, size: 16),
                  label: const Text('طلب انتساب (CV)'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.indigoAccent,
                    side: const BorderSide(color: Colors.indigoAccent),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    textStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                  onPressed: () => _showJoinDialog(context, org['name']),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.volunteer_activism_outlined, size: 16),
                  label: const Text('طلب مساعدة'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.teal,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    textStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                  onPressed: () => _showAssistanceDialog(context, org['name']),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showRegisterOrgDialog(BuildContext context) {
    final nameCtrl = TextEditingController();
    final licenseCtrl = TextEditingController();
    final cityCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text(
          'إنشاء حساب مؤسسة / جمعية جديدة',
          style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'توثيق المؤسسة شبيه بحسابات الأطباء والصيادلة لضمان مصداقية الرعاية.',
                style: TextStyle(color: Colors.white70, fontSize: 12),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: nameCtrl,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: const InputDecoration(
                  labelText: 'اسم المؤسسة / الجمعية',
                  labelStyle: TextStyle(color: Colors.white60),
                ),
              ),
              TextField(
                controller: licenseCtrl,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: const InputDecoration(
                  labelText: 'رقم الترخيص الرسمي',
                  labelStyle: TextStyle(color: Colors.white60),
                ),
              ),
              TextField(
                controller: cityCtrl,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: const InputDecoration(
                  labelText: 'المدينة والمقر',
                  labelStyle: TextStyle(color: Colors.white60),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            child: const Text('إلغاء', style: TextStyle(color: Colors.white54)),
            onPressed: () => Navigator.pop(ctx),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.indigo),
            child: const Text('إنشاء الحساب', style: TextStyle(color: Colors.white)),
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('تم تسجيل حساب المؤسسة بنجاح وهو قيد التدقيق السريع.'),
                  backgroundColor: Colors.green,
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  void _showJoinDialog(BuildContext context, String orgName) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: Text(
          'طلب انتساب إلى: $orgName',
          style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'استمارة التطوع والانتساب الطبي تتطلب إرفاق السيرة الذاتية (CV). سيتم تحويل طلبك للجنة الكوادر الطبية.',
              style: TextStyle(color: Colors.white70, fontSize: 12),
            ),
            SizedBox(height: 12),
            Text('• السيرة الذاتية: [اختر ملف السيرة الذاتية بصيغة PDF]',
                style: TextStyle(color: Colors.indigoAccent, fontSize: 11)),
          ],
        ),
        actions: [
          TextButton(
            child: const Text('إلغاء', style: TextStyle(color: Colors.white54)),
            onPressed: () => Navigator.pop(ctx),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.indigo),
            child: const Text('إرسال الاستمارة وCV', style: TextStyle(color: Colors.white)),
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('تم استلام طلب انتسابك وسيرتك الذاتية بنجاح!'),
                  backgroundColor: Colors.green,
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  void _showAssistanceDialog(BuildContext context, String orgName) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: Text(
          'طلب مساعدة علاجية: $orgName',
          style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'يرجى التأكد من إرفاق التقارير الطبية والوصفة. يتم التعامل بسرية تامة وتوليد كود تتبع إلكتروني.',
              style: TextStyle(color: Colors.white70, fontSize: 12),
            ),
            SizedBox(height: 12),
            Text('• التقارير السريرية: [مرفقة تلقائياً من ملفك الصحي]',
                style: TextStyle(color: Colors.tealAccent, fontSize: 11)),
          ],
        ),
        actions: [
          TextButton(
            child: const Text('إلغاء', style: TextStyle(color: Colors.white54)),
            onPressed: () => Navigator.pop(ctx),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.teal),
            child: const Text('تأكيد الطلب', style: TextStyle(color: Colors.white)),
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('تم تسجيل طلب المساعدة بنجاح وتوليد كود التتبع.'),
                  backgroundColor: Colors.green,
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
