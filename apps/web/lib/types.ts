/**
 * Wire types for the web app.
 *
 * These mirror `packages/database/prisma/schema.prisma` exactly, but as plain
 * serialisable shapes: Decimal columns arrive as `number`, DateTime columns as
 * ISO-8601 strings. Nothing here imports Prisma — the browser bundle must not
 * carry the database client, and the API is the only thing allowed to.
 */

export type UserType = 'ADMIN' | 'TAX_OFFICER' | 'MDA_USER' | 'ENUMERATOR' | 'TAXPAYER';

export type TaxpayerCategory = 'INDIVIDUAL' | 'CORPORATE' | 'STATE_AGENCY' | 'FEDERAL_AGENCY';

export type TinStatus = 'PENDING' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'DECLINED';

export type BillingFrequency = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_OFF';

export type RevenueHeadCategory = 'INDIVIDUAL' | 'CORPORATE' | 'STATE' | 'FEDERAL';

export type InvoiceType =
  | 'DIRECT'
  | 'DIRECT_ASSESSMENT'
  | 'DEMAND_NOTICE'
  | 'PRESUMPTIVE'
  | 'TCC'
  | 'PAYE'
  | 'APPLICABLE';

export type InvoiceStatus = 'UNPAID' | 'PART_PAID' | 'PAID' | 'CANCELLED' | 'EXPIRED';

export type PaymentChannel = 'PAYSTACK' | 'REMITA' | 'PAYDIRECT' | 'CREDO' | 'BANK_BRANCH';

export type PaymentStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'REVERSED';

/** Tenant branding, resolved per request. No state identity is hard-coded. */
export interface TenantTheme {
  accent: string;
  accentDark: string;
  crestInitials: string;
  portalUrl: string;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  stateName: string;
  isActive: boolean;
  theme: TenantTheme;
}

export interface Lga {
  id: string;
  tenantId: string;
  name: string;
  /** Two-digit code embedded in every TIN issued in this area. */
  code: string;
  taxpayerCount?: number;
}

export interface Permission {
  id: string;
  key: string;
  label: string;
  category: string;
  description?: string;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  phone?: string;
  fullName: string;
  type: UserType;
  isActive: boolean;
  emailVerifiedAt?: string;
  lastLoginAt?: string;
  mdaId?: string;
  mdaName?: string;
  taxpayerId?: string;
  permissions: string[];
  createdAt: string;
}

export interface Taxpayer {
  id: string;
  tenantId: string;
  tin: string;
  category: TaxpayerCategory;
  tinStatus: TinStatus;
  firstName?: string;
  surname?: string;
  businessName?: string;
  email: string;
  phone: string;
  lgaId?: string;
  lgaName?: string;
  address?: string;
  registeredById?: string;
  registeredByName?: string;
  isActive: boolean;
  createdAt: string;
  /** Denormalised for list views; the API computes these. */
  outstandingAmount?: number;
  invoiceCount?: number;
}

export interface Mda {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  allowPayment: boolean;
  isActive: boolean;
  revenueHeadCount?: number;
  collectedYtd?: number;
}

export interface RevenueHead {
  id: string;
  tenantId: string;
  mdaId: string;
  mdaName?: string;
  itemCode: string;
  itemName: string;
  category: RevenueHeadCategory;
  amount: number;
  frequency: BillingFrequency;
  isApproved: boolean;
  approvedAt?: string;
  approvedBy?: string;
  isActive: boolean;
}

export interface PresumptiveSchedule {
  id: string;
  tenantId: string;
  businessType: string;
  micro: number;
  small: number;
  medium: number;
  frequency: BillingFrequency;
}

export interface InvoiceLine {
  id: string;
  invoiceId: string;
  revenueHeadId: string;
  revenueHeadName?: string;
  description: string;
  quantity: number;
  unitAmount: number;
  lineTotal: number;
  dueDate: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  type: InvoiceType;
  status: InvoiceStatus;
  taxpayerId: string;
  taxpayerName?: string;
  taxpayerTin?: string;
  totalAmount: number;
  amountPaid: number;
  dueDate: string;
  description?: string;
  raisedById?: string;
  raisedByName?: string;
  lines: InvoiceLine[];
  createdAt: string;
}

export interface Payment {
  id: string;
  tenantId: string;
  invoiceId: string;
  invoiceNumber?: string;
  taxpayerName?: string;
  reference: string;
  receiptNumber?: string;
  channel: PaymentChannel;
  status: PaymentStatus;
  amount: number;
  paidAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string;
  userName?: string;
  userType?: UserType;
  method: string;
  path: string;
  statusCode: number;
  durationMs?: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

/** Envelope for every list endpoint. */
export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardSummary {
  collectedYtd: number;
  targetYtd: number;
  outstanding: number;
  taxpayers: number;
  activeTaxpayers: number;
  invoicesRaised: number;
  invoicesPaid: number;
  complianceRate: number;
  monthly: Array<{ month: string; expected: number; collected: number }>;
  byMda: Array<{ name: string; collected: number }>;
  byLga: Array<{ name: string; collected: number; taxpayers: number }>;
  topDefaulters: Array<{ id: string; name: string; tin: string; outstanding: number }>;
}

// ------------------------------------------------- clearance certificates

/** The six-stage chain, in order. `DECLINED` leaves the chain at any point. */
export type TccStage =
  | 'FIRST_REVIEW'
  | 'FIRST_APPROVAL'
  | 'SECOND_REVIEW'
  | 'SECOND_APPROVAL'
  | 'DIRECTOR_REVIEW'
  | 'ISSUED'
  | 'DECLINED';

export interface TccEvent {
  stage: TccStage;
  actorName: string;
  actedAt: string;
  remark?: string;
}

export interface TccApplication {
  id: string;
  tenantId: string;
  certificateNumber: string;
  taxpayerId: string;
  taxpayerName: string;
  taxpayerTin: string;
  stage: TccStage;
  yearOfAssessment: number;
  appliedAt: string;
  issuedAt?: string;
  expiresAt?: string;
  feePaid: boolean;
  feeInvoiceNumber?: string;
  history: TccEvent[];
}

// ------------------------------------------------------- demand notices

export type DemandNoticeStatus = 'SERVED' | 'SETTLED' | 'PART_SETTLED' | 'ESCALATED' | 'WITHDRAWN';

export interface DemandNotice {
  id: string;
  tenantId: string;
  noticeNumber: string;
  taxpayerId: string;
  taxpayerName: string;
  taxpayerTin: string;
  invoiceCount: number;
  amount: number;
  amountSettled: number;
  status: DemandNoticeStatus;
  issuedAt: string;
  dueAt: string;
  issuedByName: string;
}

// --------------------------------------------------- self-assessment filing

export type FilingStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'PART_APPROVED' | 'REJECTED';

export interface FilingLine {
  id: string;
  taxType: string;
  declaredAmount: number;
  assessedAmount?: number;
  decision: 'PENDING' | 'APPROVED' | 'REJECTED';
  remark?: string;
}

export interface Filing {
  id: string;
  tenantId: string;
  filingReference: string;
  taxpayerId: string;
  taxpayerName: string;
  taxpayerTin: string;
  period: string;
  submittedAt: string;
  status: FilingStatus;
  lines: FilingLine[];
  documents: Array<{ name: string; sizeKb: number }>;
}

// ------------------------------------------------------------- tax offices

export interface TaxOffice {
  id: string;
  tenantId: string;
  name: string;
  zone: string;
  lgaName: string;
  managerName: string;
  staffCount: number;
  monthlyTarget: number;
  monthCollected: number;
  annualTarget: number;
  ytdCollected: number;
}

// ------------------------------------------------------------ enumeration

export interface EnumerationAgent {
  userId: string;
  name: string;
  lgaName: string;
  monthlyTarget: number;
  capturedThisMonth: number;
  capturedTotal: number;
  invoicesRaised: number;
  lastSyncAt: string;
}

// ---------------------------------------------------------- notifications

export interface NotificationTemplate {
  id: string;
  key: string;
  name: string;
  channel: 'EMAIL' | 'SMS';
  trigger: string;
  enabled: boolean;
  sentThisMonth: number;
}

// --------------------------------------------------------------- content

export interface ContentPage {
  id: string;
  slug: string;
  title: string;
  section: string;
  published: boolean;
  updatedAt: string;
  updatedByName: string;
}

// ------------------------------------------------------ employers / PAYE

export type EmployerSector = 'PRIVATE' | 'PUBLIC';

export interface Employer {
  id: string;
  tenantId: string;
  name: string;
  tin: string;
  sector: EmployerSector;
  lgaName: string;
  email: string;
  phone: string;
  staffCount: number;
  registeredAt: string;
  isActive: boolean;
  /** Denormalised for list views; the API computes these. */
  annualGrossPayroll?: number;
  monthlyPayeDue?: number;
  monthsOutstanding?: number;
}

export interface PayrollEmployee {
  id: string;
  employerId: string;
  staffNumber: string;
  name: string;
  annualGross: number;
  nhf: boolean;
  pension: boolean;
  nhis: boolean;
}

export type RemittanceStatus = 'PAID' | 'PART_PAID' | 'UNPAID';

export interface Remittance {
  id: string;
  employerId: string;
  /** YYYY-MM */
  period: string;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  status: RemittanceStatus;
  paidAt?: string;
}
