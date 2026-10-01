/**
 * The single data-access boundary for the web app.
 *
 * Every screen calls these functions and nothing else. Today they read the
 * in-memory development dataset; when `apps/api` exists, each body becomes a
 * `fetch` against it and no screen changes. That is the entire reason this
 * module exists — the functions are already async and already paginate, so the
 * swap does not ripple.
 */

import 'server-only';

import * as db from './mock/data';
import type {
  AuditLog,
  DashboardSummary,
  Invoice,
  InvoiceStatus,
  Lga,
  Mda,
  Paginated,
  Payment,
  PaymentStatus,
  Permission,
  PresumptiveSchedule,
  RevenueHead,
  Taxpayer,
  TaxpayerCategory,
  TccApplication,
  TccStage,
  Filing,
  TaxOffice,
  EnumerationAgent,
  NotificationTemplate,
  ContentPage,
  Employer,
  Remittance,
  Tenant,
  TinStatus,
  User,
} from './types';
import { PERMISSIONS } from './permissions';
import { money, taxpayerName } from './format';
import { computePaye } from '@igr/tax-rules';

/** The dataset's fixed "now", so overdue calculations do not drift. */
const NOW_DATE = db.NOW;

export type PermissionCatalogue = typeof PERMISSIONS;

const DEFAULT_PAGE_SIZE = 25;

function paginate<T>(rows: T[], page = 1, pageSize = DEFAULT_PAGE_SIZE): Paginated<T> {
  const start = (page - 1) * pageSize;
  return {
    rows: rows.slice(start, start + pageSize),
    total: rows.length,
    page,
    pageSize,
  };
}

function matches(haystack: Array<string | undefined>, needle: string): boolean {
  const q = needle.trim().toLowerCase();
  if (!q) return true;
  return haystack.some((h) => h?.toLowerCase().includes(q));
}

// ------------------------------------------------------------------ tenant

export async function getTenant(): Promise<Tenant> {
  return db.tenant;
}

// --------------------------------------------------------------- taxpayers

export interface TaxpayerQuery {
  q?: string;
  category?: TaxpayerCategory;
  tinStatus?: TinStatus;
  lgaId?: string;
  page?: number;
  pageSize?: number;
}

/** Outstanding balance per taxpayer, computed once and reused. */
const outstandingByTaxpayer = (() => {
  const map = new Map<string, { outstanding: number; invoices: number }>();
  for (const inv of db.invoices) {
    const entry = map.get(inv.taxpayerId) ?? { outstanding: 0, invoices: 0 };
    entry.invoices += 1;
    if (inv.status === 'UNPAID' || inv.status === 'PART_PAID') {
      entry.outstanding += inv.totalAmount - inv.amountPaid;
    }
    map.set(inv.taxpayerId, entry);
  }
  return map;
})();

function decorate(t: Taxpayer): Taxpayer {
  const agg = outstandingByTaxpayer.get(t.id);
  return { ...t, outstandingAmount: agg?.outstanding ?? 0, invoiceCount: agg?.invoices ?? 0 };
}

export async function listTaxpayers(query: TaxpayerQuery = {}): Promise<Paginated<Taxpayer>> {
  const rows = db.taxpayers
    .filter((t) => (query.category ? t.category === query.category : true))
    .filter((t) => (query.tinStatus ? t.tinStatus === query.tinStatus : true))
    .filter((t) => (query.lgaId ? t.lgaId === query.lgaId : true))
    .filter((t) =>
      matches([t.tin, t.email, t.phone, t.businessName, t.firstName, t.surname, t.lgaName], query.q ?? ''),
    )
    .map(decorate)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return paginate(rows, query.page, query.pageSize);
}

export async function getTaxpayer(id: string): Promise<Taxpayer | null> {
  const found = db.taxpayers.find((t) => t.id === id);
  return found ? decorate(found) : null;
}

export async function getTaxpayerByTin(tin: string): Promise<Taxpayer | null> {
  const found = db.taxpayers.find((t) => t.tin === tin.trim());
  return found ? decorate(found) : null;
}

// ---------------------------------------------------------------- invoices

export interface InvoiceQuery {
  q?: string;
  status?: InvoiceStatus;
  type?: Invoice['type'];
  taxpayerId?: string;
  page?: number;
  pageSize?: number;
}

export async function listInvoices(query: InvoiceQuery = {}): Promise<Paginated<Invoice>> {
  const rows = db.invoices
    .filter((i) => (query.status ? i.status === query.status : true))
    .filter((i) => (query.type ? i.type === query.type : true))
    .filter((i) => (query.taxpayerId ? i.taxpayerId === query.taxpayerId : true))
    .filter((i) => matches([i.invoiceNumber, i.taxpayerName, i.taxpayerTin, i.description], query.q ?? ''))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return paginate(rows, query.page, query.pageSize);
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  return db.invoices.find((i) => i.id === id) ?? null;
}

/** Public lookup: the taxpayer types a bill number and gets what is owed. */
export async function getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
  const n = invoiceNumber.trim().toUpperCase();
  return db.invoices.find((i) => i.invoiceNumber.toUpperCase() === n) ?? null;
}

export async function listInvoicesForTaxpayer(taxpayerId: string): Promise<Invoice[]> {
  return db.invoices
    .filter((i) => i.taxpayerId === taxpayerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ---------------------------------------------------------------- payments

export interface PaymentQuery {
  q?: string;
  status?: PaymentStatus;
  channel?: Payment['channel'];
  page?: number;
  pageSize?: number;
}

export async function listPayments(query: PaymentQuery = {}): Promise<Paginated<Payment>> {
  const rows = db.payments
    .filter((p) => (query.status ? p.status === query.status : true))
    .filter((p) => (query.channel ? p.channel === query.channel : true))
    .filter((p) => matches([p.reference, p.receiptNumber, p.invoiceNumber, p.taxpayerName], query.q ?? ''));

  return paginate(rows, query.page, query.pageSize);
}

export async function getPayment(id: string): Promise<Payment | null> {
  return db.payments.find((p) => p.id === id) ?? null;
}

export async function listPaymentsForInvoice(invoiceId: string): Promise<Payment[]> {
  return db.payments.filter((p) => p.invoiceId === invoiceId);
}

/** Public receipt verification by receipt number. */
export async function getPaymentByReceipt(receiptNumber: string): Promise<Payment | null> {
  const n = receiptNumber.trim().toUpperCase();
  return db.payments.find((p) => p.receiptNumber?.toUpperCase() === n) ?? null;
}

// ------------------------------------------------------- revenue structure

export async function listMdas(scope?: Scope): Promise<Mda[]> {
  const collected = new Map<string, number>();
  const headToMda = new Map(db.revenueHeads.map((h) => [h.id, h.mdaId]));

  for (const inv of db.invoices) {
    if (inv.amountPaid <= 0) continue;
    const share = inv.amountPaid / Math.max(1, inv.lines.length);
    for (const line of inv.lines) {
      const mdaId = headToMda.get(line.revenueHeadId);
      if (mdaId) collected.set(mdaId, (collected.get(mdaId) ?? 0) + share);
    }
  }

  const only = mdaScope(scope);

  return db.mdas
    .filter((m) => (only ? m.id === only : true))
    .map((m) => ({
      ...m,
      revenueHeadCount: db.revenueHeads.filter((h) => h.mdaId === m.id).length,
      collectedYtd: Math.round(collected.get(m.id) ?? 0),
    }))
    .sort((a, b) => (b.collectedYtd ?? 0) - (a.collectedYtd ?? 0));
}

export async function getMda(id: string): Promise<Mda | null> {
  return (await listMdas()).find((m) => m.id === id) ?? null;
}

export interface RevenueHeadQuery {
  q?: string;
  mdaId?: string;
  approved?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listRevenueHeads(
  query: RevenueHeadQuery = {},
  scope?: Scope,
): Promise<Paginated<RevenueHead>> {
  // The scope wins over the query: an agency user cannot widen their own view
  // by editing the mdaId in the address bar.
  const only = mdaScope(scope) ?? query.mdaId;

  const rows = db.revenueHeads
    .filter((h) => (only ? h.mdaId === only : true))
    .filter((h) => (query.approved === undefined ? true : h.isApproved === query.approved))
    .filter((h) => matches([h.itemName, h.itemCode, h.mdaName], query.q ?? ''));

  return paginate(rows, query.page, query.pageSize ?? 50);
}

export async function listLgas(): Promise<Lga[]> {
  return db.lgas.map((l) => ({
    ...l,
    taxpayerCount: db.taxpayers.filter((t) => t.lgaId === l.id).length,
  }));
}

export async function listPresumptiveSchedules(): Promise<PresumptiveSchedule[]> {
  return db.presumptiveSchedules;
}

// ------------------------------------------------------------------- users

export async function listUsers(q = ''): Promise<User[]> {
  return db.allUsers
    .filter((u) => matches([u.fullName, u.email, u.mdaName], q))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export async function getUser(id: string): Promise<User | null> {
  return db.allUsers.find((u) => u.id === id) ?? null;
}

export async function listPermissionCatalogue(): Promise<Permission[]> {
  return PERMISSIONS.map((p) => ({ id: p.key, ...p }));
}

// --------------------------------------------------------------- audit log

export interface AuditQuery {
  q?: string;
  userId?: string;
  outcome?: 'success' | 'denied' | 'error';
  page?: number;
  pageSize?: number;
}

export async function listAuditLogs(query: AuditQuery = {}): Promise<Paginated<AuditLog>> {
  const rows = db.auditLogs
    .filter((a) => (query.userId ? a.userId === query.userId : true))
    .filter((a) => {
      if (!query.outcome) return true;
      if (query.outcome === 'success') return a.statusCode < 400;
      if (query.outcome === 'denied') return a.statusCode === 401 || a.statusCode === 403;
      return a.statusCode >= 500 || (a.statusCode >= 400 && a.statusCode !== 401 && a.statusCode !== 403);
    })
    .filter((a) => matches([a.path, a.method, a.userName, a.ipAddress], query.q ?? ''));

  return paginate(rows, query.page, query.pageSize ?? 40);
}

// ------------------------------------------------------------ intelligence

export interface RecoveryLead {
  invoiceId: string;
  invoiceNumber: string;
  taxpayerId: string;
  taxpayerName: string;
  amount: number;
  attempts: number;
  lastAttempt: string;
  channel: string;
}

/**
 * Capability 25 — payment recovery.
 *
 * A bill that was viewed, initiated and then failed is money someone was
 * willing to pay. These are ranked by amount because officer time is finite.
 */
export async function listRecoveryLeads(limit = 40): Promise<RecoveryLead[]> {
  const failedByInvoice = new Map<string, Payment[]>();
  for (const p of db.payments) {
    if (p.status !== 'FAILED' && p.status !== 'PENDING') continue;
    const list = failedByInvoice.get(p.invoiceId) ?? [];
    list.push(p);
    failedByInvoice.set(p.invoiceId, list);
  }

  const leads: RecoveryLead[] = [];
  for (const [invoiceId, attempts] of failedByInvoice) {
    const invoice = db.invoices.find((i) => i.id === invoiceId);
    if (!invoice || invoice.status !== 'UNPAID') continue;

    const last = attempts.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
    leads.push({
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      taxpayerId: invoice.taxpayerId,
      taxpayerName: invoice.taxpayerName ?? '—',
      amount: invoice.totalAmount - invoice.amountPaid,
      attempts: attempts.length,
      lastAttempt: last.createdAt,
      channel: last.channel,
    });
  }

  return leads.sort((a, b) => b.amount - a.amount).slice(0, limit);
}

export interface RiskLead {
  taxpayerId: string;
  name: string;
  tin: string;
  lgaName: string;
  outstanding: number;
  overdueBills: number;
  score: number;
  reasons: string[];
}

/**
 * Capability 24 — compliance risk scoring.
 *
 * Every score carries its reasons. A demand notice raised off an unexplained
 * number is a demand notice that loses on appeal, so the reasons are part of
 * the output rather than a debugging aid.
 */
export async function listRiskLeads(limit = 40): Promise<RiskLead[]> {
  const leads: RiskLead[] = [];

  for (const taxpayer of db.taxpayers) {
    const bills = db.invoices.filter((i) => i.taxpayerId === taxpayer.id);
    if (bills.length === 0) continue;

    const unpaid = bills.filter((i) => i.status === 'UNPAID' || i.status === 'PART_PAID');
    const overdue = unpaid.filter((i) => new Date(i.dueDate) < NOW_DATE);
    const outstanding = unpaid.reduce((s, i) => s + (i.totalAmount - i.amountPaid), 0);
    if (outstanding <= 0) continue;

    const settledRatio = bills.filter((i) => i.status === 'PAID').length / bills.length;

    const reasons: string[] = [];
    let score = 0;

    // Amount at stake, capped so one enormous bill cannot dominate the list.
    score += Math.min(40, (outstanding / 2_000_000) * 40);
    reasons.push(`${money(outstanding)} outstanding across ${unpaid.length} bills`);

    if (overdue.length > 0) {
      score += Math.min(25, overdue.length * 6);
      reasons.push(`${overdue.length} bills past their due date`);
    }
    if (settledRatio < 0.4) {
      score += 20;
      reasons.push(`Only ${Math.round(settledRatio * 100)}% of bills ever settled in full`);
    }
    if (taxpayer.tinStatus !== 'APPROVED') {
      score += 10;
      reasons.push(`TIN status is ${taxpayer.tinStatus.toLowerCase().replace('_', ' ')}`);
    }
    if (!taxpayer.isActive) {
      score += 5;
      reasons.push('Record is marked inactive while liability stands');
    }

    leads.push({
      taxpayerId: taxpayer.id,
      name: taxpayerName(taxpayer),
      tin: taxpayer.tin,
      lgaName: taxpayer.lgaName ?? '—',
      outstanding,
      overdueBills: overdue.length,
      score: Math.round(Math.min(100, score)),
      reasons,
    });
  }

  return leads.sort((a, b) => b.score - a.score || b.outstanding - a.outstanding).slice(0, limit);
}

export interface RegisterGap {
  taxpayerId: string;
  name: string;
  tin: string;
  issue: string;
  detail: string;
  outstanding: number;
}

/**
 * Capability 23 — register widening.
 *
 * Contradictions inside the register itself: parties being billed who were
 * never fully admitted to the roll.
 */
export async function listRegisterGaps(limit = 30): Promise<RegisterGap[]> {
  const gaps: RegisterGap[] = [];

  for (const taxpayer of db.taxpayers) {
    const bills = db.invoices.filter((i) => i.taxpayerId === taxpayer.id);
    if (bills.length === 0) continue;
    const outstanding = bills
      .filter((i) => i.status === 'UNPAID' || i.status === 'PART_PAID')
      .reduce((s, i) => s + (i.totalAmount - i.amountPaid), 0);

    if (taxpayer.tinStatus !== 'APPROVED') {
      gaps.push({
        taxpayerId: taxpayer.id,
        name: taxpayerName(taxpayer),
        tin: taxpayer.tin,
        issue: 'Billed without an approved TIN',
        detail: `${bills.length} bills raised while the TIN request sits at ${taxpayer.tinStatus
          .toLowerCase()
          .replace('_', ' ')}.`,
        outstanding,
      });
    } else if (!taxpayer.isActive && outstanding > 0) {
      gaps.push({
        taxpayerId: taxpayer.id,
        name: taxpayerName(taxpayer),
        tin: taxpayer.tin,
        issue: 'Liability against a deactivated record',
        detail: 'The record is inactive, so no further bill will be raised while the balance stands.',
        outstanding,
      });
    }
  }

  return gaps.sort((a, b) => b.outstanding - a.outstanding).slice(0, limit);
}

// --------------------------------------------------------------- analytics

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export async function getDashboardSummary(scope?: Scope): Promise<DashboardSummary> {
  const paid = db.invoices.filter((i) => i.amountPaid > 0);
  const collectedYtd = paid.reduce((s, i) => s + i.amountPaid, 0);
  const outstanding = db.invoices
    .filter((i) => i.status === 'UNPAID' || i.status === 'PART_PAID')
    .reduce((s, i) => s + (i.totalAmount - i.amountPaid), 0);

  // Monthly series, bucketed by settlement date across the trailing year.
  const monthly = MONTHS.map((month, idx) => {
    const collected = db.payments
      .filter((p) => p.status === 'SUCCESSFUL' && new Date(p.createdAt).getMonth() === idx)
      .reduce((s, p) => s + p.amount, 0);
    return { month, expected: Math.round(collectedYtd / 12), collected };
  });

  const mdas = await listMdas(scope);
  const byLga = db.lgas
    .map((l) => {
      const ids = new Set(db.taxpayers.filter((t) => t.lgaId === l.id).map((t) => t.id));
      const collected = db.invoices
        .filter((i) => ids.has(i.taxpayerId))
        .reduce((s, i) => s + i.amountPaid, 0);
      return { name: l.name, collected, taxpayers: ids.size };
    })
    .sort((a, b) => b.collected - a.collected);

  const topDefaulters = db.taxpayers
    .map(decorate)
    .filter((t) => (t.outstandingAmount ?? 0) > 0)
    .sort((a, b) => (b.outstandingAmount ?? 0) - (a.outstandingAmount ?? 0))
    .slice(0, 8)
    .map((t) => ({
      id: t.id,
      name: taxpayerName(t),
      tin: t.tin,
      outstanding: t.outstandingAmount ?? 0,
    }));

  const invoicesPaid = db.invoices.filter((i) => i.status === 'PAID').length;

  return {
    collectedYtd,
    targetYtd: Math.round(collectedYtd * 1.18),
    outstanding,
    taxpayers: db.taxpayers.length,
    activeTaxpayers: db.taxpayers.filter((t) => t.isActive && t.tinStatus === 'APPROVED').length,
    invoicesRaised: db.invoices.length,
    invoicesPaid,
    complianceRate: (invoicesPaid / db.invoices.length) * 100,
    monthly,
    byMda: mdas.slice(0, 8).map((m) => ({ name: m.name, collected: m.collectedYtd ?? 0 })),
    byLga,
    topDefaulters,
  };
}

// ------------------------------------------------------- clearance (11)

export async function listTccApplications(query: { q?: string; stage?: TccStage; page?: number } = {}) {
  const rows = db.tccApplications
    .filter((a) => (query.stage ? a.stage === query.stage : true))
    .filter((a) => matches([a.certificateNumber, a.taxpayerName, a.taxpayerTin], query.q ?? ''))
    .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
  return paginate(rows, query.page, 25);
}

export async function getTccApplication(id: string): Promise<TccApplication | null> {
  return db.tccApplications.find((a) => a.id === id) ?? null;
}

/**
 * The queue for one reviewer role. A stage belongs to exactly one role, which
 * is what stops two officers acting on the same application at once.
 */
export async function listTccQueue(permissions: string[]): Promise<TccApplication[]> {
  const stages: TccStage[] = [];
  if (permissions.includes('tcc.review.first')) stages.push('FIRST_REVIEW', 'FIRST_APPROVAL');
  if (permissions.includes('tcc.review.second')) stages.push('SECOND_REVIEW', 'SECOND_APPROVAL');
  if (permissions.includes('tcc.issue')) stages.push('DIRECTOR_REVIEW');
  if (!stages.length) return [];
  return db.tccApplications
    .filter((a) => stages.includes(a.stage))
    .sort((a, b) => a.appliedAt.localeCompare(b.appliedAt));
}

// --------------------------------------------------- demand notices (09)

export async function listDemandNotices(query: { q?: string; status?: string; page?: number } = {}) {
  const rows = db.demandNotices
    .filter((n) => (query.status ? n.status === query.status : true))
    .filter((n) => matches([n.noticeNumber, n.taxpayerName, n.taxpayerTin], query.q ?? ''))
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  return paginate(rows, query.page, 25);
}

// --------------------------------------------------------- filings (07)

export async function listFilings(query: { q?: string; status?: string; page?: number } = {}) {
  const rows = db.filings
    .filter((f) => (query.status ? f.status === query.status : true))
    .filter((f) => matches([f.filingReference, f.taxpayerName, f.taxpayerTin], query.q ?? ''))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  return paginate(rows, query.page, 25);
}

export async function getFiling(id: string): Promise<Filing | null> {
  return db.filings.find((f) => f.id === id) ?? null;
}

// ---------------------------------------------------- tax offices (15)

export async function listTaxOffices(): Promise<TaxOffice[]> {
  return [...db.taxOffices].sort(
    (a, b) => b.monthCollected / b.monthlyTarget - a.monthCollected / a.monthlyTarget,
  );
}

// ---------------------------------------------------- enumeration (16)

export async function listEnumerationAgents(): Promise<EnumerationAgent[]> {
  return [...db.enumerationAgents].sort((a, b) => b.capturedThisMonth - a.capturedThisMonth);
}

/** An agent's own captures — the field portal shows only these. */
export async function listCapturesByAgent(userId: string): Promise<Taxpayer[]> {
  const agent = db.enumerationAgents.find((a) => a.userId === userId);
  if (!agent) return [];
  return db.taxpayers
    .filter((t) => t.lgaName === agent.lgaName)
    .slice(0, agent.capturedThisMonth)
    .map(decorate);
}

// --------------------------------------------------- notifications (21)

export async function listNotificationTemplates(): Promise<NotificationTemplate[]> {
  return db.notificationTemplates;
}

// -------------------------------------------------------- content (19)

export async function listContentPages(): Promise<ContentPage[]> {
  return [...db.contentPages].sort((a, b) => a.section.localeCompare(b.section) || a.title.localeCompare(b.title));
}

// --------------------------------------------------- agency scoping (12)

/**
 * The scope a request runs under.
 *
 * An agency user sees their own agency and nothing else. This is applied
 * inside the queries rather than handed to each screen, because a helper a
 * screen has to remember to call is a helper a screen will forget to call —
 * an earlier version of this file exported exactly that, and nothing used it.
 */
export interface Scope {
  type: string;
  mdaId?: string;
}

/** The agency a request is confined to, or undefined for state-wide sight. */
function mdaScope(scope?: Scope): string | undefined {
  return scope?.type === 'MDA_USER' ? scope.mdaId : undefined;
}

/** Public lookup for the printed demand notice. */
export async function getDemandNoticeByNumber(noticeNumber: string) {
  const n = noticeNumber.trim().toUpperCase();
  return db.demandNotices.find((d) => d.noticeNumber.toUpperCase() === n) ?? null;
}

/** Public lookup for the printed clearance certificate. */
export async function getTccByCertificateNumber(certificateNumber: string) {
  const n = certificateNumber.trim().toUpperCase();
  return db.tccApplications.find((a) => a.certificateNumber.toUpperCase() === n) ?? null;
}

// ------------------------------------------------------- employers (03)

export async function listEmployers(
  query: { q?: string; sector?: string; page?: number } = {},
): Promise<Paginated<Employer>> {
  const rows = db.employers
    .filter((e) => (query.sector ? e.sector === query.sector : true))
    .filter((e) => matches([e.name, e.tin, e.email, e.lgaName], query.q ?? ''))
    .map(decorateEmployer)
    .sort((a, b) => (b.monthlyPayeDue ?? 0) - (a.monthlyPayeDue ?? 0));

  return paginate(rows, query.page, 25);
}

/**
 * Liability is never stored: it is computed from the roster by the statutory
 * rules every time it is read. A stored figure drifts the moment a salary
 * changes, and a drifted figure is what a taxpayer disputes.
 */
function decorateEmployer(e: Employer): Employer {
  const roster = db.payrollEmployees.filter((p) => p.employerId === e.id);
  const annualGrossPayroll = roster.reduce((s, p) => s + p.annualGross, 0);
  const monthlyPayeDue = roster.reduce(
    (s, p) =>
      s +
      computePaye({
        annualGrossIncome: p.annualGross,
        deductions: { nhf: p.nhf, pension: p.pension, nhis: p.nhis },
      }).monthlyTaxPayable,
    0,
  );
  const monthsOutstanding = db.remittances.filter(
    (r) => r.employerId === e.id && r.status !== 'PAID',
  ).length;

  return {
    ...e,
    annualGrossPayroll,
    monthlyPayeDue: Math.round(monthlyPayeDue),
    monthsOutstanding,
  };
}

export async function getEmployer(id: string): Promise<Employer | null> {
  const found = db.employers.find((e) => e.id === id);
  return found ? decorateEmployer(found) : null;
}

/** The roster with each employee's liability computed by @igr/tax-rules. */
export async function listPayroll(employerId: string) {
  return db.payrollEmployees
    .filter((p) => p.employerId === employerId)
    .map((p) => ({
      ...p,
      paye: computePaye({
        annualGrossIncome: p.annualGross,
        deductions: { nhf: p.nhf, pension: p.pension, nhis: p.nhis },
      }),
    }))
    .sort((a, b) => b.annualGross - a.annualGross);
}

export async function listRemittances(employerId: string): Promise<Remittance[]> {
  return db.remittances
    .filter((r) => r.employerId === employerId)
    .sort((a, b) => b.period.localeCompare(a.period));
}

export async function getPayeSummary() {
  const all = db.employers.map(decorateEmployer);
  const outstanding = db.remittances
    .filter((r) => r.status !== 'PAID')
    .reduce((s, r) => s + (r.amountDue - r.amountPaid), 0);

  return {
    employers: all.length,
    active: all.filter((e) => e.isActive).length,
    publicSector: all.filter((e) => e.sector === 'PUBLIC').length,
    staff: all.reduce((s, e) => s + e.staffCount, 0),
    monthlyDue: all.reduce((s, e) => s + (e.monthlyPayeDue ?? 0), 0),
    outstanding,
    behind: all.filter((e) => (e.monthsOutstanding ?? 0) > 0).length,
  };
}

/**
 * The development sign-in list, filtered to accounts that can actually sign
 * in. Advertising an account the seed deactivated is how this went wrong.
 *
 * Gated, because this list hands out working credentials. On a local machine
 * that is a convenience; on a public URL it is an open door to every screen in
 * the platform. `NEXT_PUBLIC_SHOW_DEMO_LOGINS=false` hides it, and the deployed
 * blueprint sets the value explicitly rather than relying on a default.
 */
export async function listDemoLogins() {
  if (process.env.NEXT_PUBLIC_SHOW_DEMO_LOGINS === 'false') return [];

  return db.DEMO_LOGINS.filter((d) => db.allUsers.some((u) => u.email === d.email && u.isActive)).map(
    ({ email, description }) => ({ email, description }),
  );
}
