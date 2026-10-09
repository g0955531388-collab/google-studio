export * from './types/index';

export interface Profile {
  id: string;
  name: string;
  relation: string;
  bloodType: string;
  allergies: string[];
  chronicConditions: string[];
  canAccessRecords: boolean;
  canReceiveAlerts: boolean;
  isDependent: boolean;
}

export type OrganizationCategory =
  | 'medical_aid' // كفالة علاج وجراحة
  | 'medication_supply' // تأمين أدوية ومستلزمات
  | 'orphan_family_care' // رعاية أيتام وأسر محتاجة
  | 'disability_rehab' // كراسي وأطراف صناعية ورعاية ذوي الإعاقة
  | 'emergency_relief' // إغاثة طوارئ وكوارث
  | 'dialysis_chronic' // غسيل كلى ورعاية مزمنة
  | 'health_education'; // توعية وتدريب صحي

export interface Organization {
  id: string;
  name: string;
  type: 'charity' | 'union' | 'foundation' | 'institution';
  typeAr: string;
  category: OrganizationCategory;
  categoryAr: string;
  licenseNumber: string;
  country: string;
  city: string;
  phone: string;
  email: string;
  website?: string;
  descriptionAr: string;
  beneficiariesCount: number;
  activeProjectsCount: number;
  acceptsVolunteers: boolean;
  acceptsAssistanceRequests: boolean;
  verified: boolean;
  logoColor: string;
}

export interface JoinApplication {
  id: string;
  orgId: string;
  orgName: string;
  applicantName: string;
  email: string;
  phone: string;
  profession: string;
  specialty: string;
  yearsOfExperience: number;
  hasCvAttached: boolean;
  cvFileName?: string;
  motivationNotes: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'in_review';
}

export interface AssistanceRequest {
  id: string;
  orgId: string;
  orgName: string;
  beneficiaryName: string;
  nationalId: string;
  phone: string;
  conditionDescription: string;
  assistanceType: 'surgery' | 'medications' | 'medical_equipment' | 'financial_aid';
  assistanceTypeAr: string;
  estimatedCost: string;
  hasMedicalReports: boolean;
  reportFileName?: string;
  submittedAt: string;
  status: 'under_review' | 'verified' | 'accepted';
}
