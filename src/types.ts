export type StaffRole = 
  | 'patient' 
  | 'reception' 
  | 'doctor' 
  | 'lab' 
  | 'radiology' 
  | 'cashier' 
  | 'pharmacy' 
  | 'admin';

export type PaymentStatus = 
  | 'unpaid' 
  | 'cash_paid' 
  | 'bima_verified' 
  | 'exempt_poor_fund' 
  | 'urgent_waiver';

export type SpecimenStatus = 
  | 'pending' 
  | 'collected' 
  | 'processing' 
  | 'ready';

export interface ClinicalOrder {
  id: string;
  category: 'lab' | 'radiology' | 'pharmacy' | 'review';
  testCode: string;
  testNameEn: string;
  testNameNe: string;
  isPaid: boolean;
  paymentStatus: PaymentStatus;
  receiptNumber?: string;
  specimenStatus?: SpecimenStatus;
  isReportReady: boolean;
  requiresPrepCheck?: boolean;
  prepNoteEn?: string;
  prepNoteNe?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Department {
  id: number;
  name: string;
  nameNe: string;
  slug: string;
  prefix: string;
  location: string;
  locationNe: string;
  colorZone: string;
  description?: string;
  descriptionNe?: string;
  category?: 'general' | 'surgical' | 'maternal_child' | 'specialty' | 'diagnostics' | 'support';
  isOpen: boolean;
  type: 'opd' | 'lab' | 'radiology' | 'billing' | 'pharmacy';
}

export interface Counter {
  id: number;
  departmentId: number;
  name: string;
  nameNe: string;
  isOpen: boolean;
}

export interface StaffUser {
  username: string;
  fullName: string;
  role: StaffRole;
  departmentId?: number | null;
}

export interface Patient {
  id: string; // UUID
  name: string;
  hospitalId?: string | null;
  bimaNumber?: string | null; // Health Insurance ID
  age?: number | null;
  gender?: string;
  phone?: string;
  isSenior?: boolean;
  hasDisability?: boolean;
  isPregnant?: boolean;
  createdAt: string;
}

export type VisitStatus = 
  | 'waiting' 
  | 'called' 
  | 'in_service' 
  | 'absent' 
  | 'completed' 
  | 'cancelled'
  | 'awaiting_prereq';

export interface Visit {
  id: string; // UUID
  requestKey: string;
  patientId: string;
  patient: Patient;
  departmentId: number;
  department: Department;
  counterId?: number | null;
  counter?: Counter | null;
  date: string; // YYYY-MM-DD
  token: string;
  pinCode: string;
  status: VisitStatus;
  subQueue: 'walkin' | 'review' | 'urgent';
  isClinicalEmergency?: boolean;
  activeLocationDeptId?: number | null;
  lockExpiresAt?: string | null;
  lastServiceCompletedAt?: string | null;
  orders: ClinicalOrder[];
  prescriptionNotes?: string;
  createdAt: string;
  queuedAt: string;
  calledAt?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  version: number;
}

export interface AuditEvent {
  id: string;
  actor: string;
  visitId: string;
  visitToken: string;
  action: string;
  reason?: string;
  createdAt: string;
}
