/**
 * Development dataset.
 *
 * The API does not exist yet, so the whole frontend is built against this. It
 * is generated from a fixed seed: every render, on server and client alike,
 * produces byte-identical data, which is what keeps React from complaining
 * about a hydration mismatch and what makes screenshots comparable.
 *
 * Everything here is shaped exactly like the wire types in `lib/types.ts`, so
 * `lib/api.ts` swaps to real `fetch` calls without a single screen changing.
 */

import type {
  AuditLog,
  Invoice,
  InvoiceLine,
  Lga,
  Mda,
  Payment,
  PresumptiveSchedule,
  RevenueHead,
  Taxpayer,
  Tenant,
  User,
} from '../types';
import { DEFAULT_PERMISSIONS, PERMISSIONS } from '../permissions';

// ---------------------------------------------------------------- generator

/** Deterministic PRNG. Same seed, same dataset, forever. */
function mulberry32(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260903);

const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)]!;
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const chance = (p: number) => rand() < p;

/** All timestamps hang off one fixed "now" so the data never drifts. */
export const NOW = new Date('2026-09-05T09:00:00.000Z');

const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();
const daysAhead = (n: number) => new Date(NOW.getTime() + n * 86_400_000).toISOString();

// ------------------------------------------------------------------ tenant

export const tenant: Tenant = {
  id: 'tnt_nasarawa',
  slug: 'nasarawa',
  name: 'Nasarawa State Internal Revenue Service',
  shortName: 'NSIRS',
  stateName: 'Nasarawa State',
  isActive: true,
  theme: {
    accent: '#e51a4c',
    accentDark: '#b5123b',
    crestInitials: 'NS',
    portalUrl: 'pay.nasarawa.gov.ng',
  },
};

// -------------------------------------------------------------------- lgas

const LGA_NAMES = [
  'Akwanga', 'Awe', 'Doma', 'Karu', 'Keana', 'Keffi', 'Kokona',
  'Lafia', 'Nasarawa', 'Nasarawa Egon', 'Obi', 'Toto', 'Wamba',
] as const;

export const lgas: Lga[] = LGA_NAMES.map((name, i) => ({
  id: `lga_${i + 1}`,
  tenantId: tenant.id,
  name,
  code: String(i + 1).padStart(2, '0'),
}));

// -------------------------------------------------------------------- mdas

const MDA_SEED: Array<[string, string]> = [
  ['Ministry of Lands and Urban Development', 'MLUD'],
  ['Ministry of Health', 'MOH'],
  ['Ministry of Education', 'MOE'],
  ['Ministry of Works and Transport', 'MWT'],
  ['Ministry of Agriculture and Water Resources', 'MAWR'],
  ['Nasarawa State Water Corporation', 'NSWC'],
  ['Nasarawa Urban Development Board', 'NUDB'],
  ['Board of Internal Revenue', 'BIR'],
  ['Ministry of Environment and Natural Resources', 'MENR'],
  ['Nasarawa State Fire Service', 'NSFS'],
  ['Ministry of Commerce and Industry', 'MCI'],
  ['Nasarawa Investment and Property Development Company', 'NIPDC'],
];

export const mdas: Mda[] = MDA_SEED.map(([name, code], i) => ({
  id: `mda_${i + 1}`,
  tenantId: tenant.id,
  name,
  code,
  email: `${code.toLowerCase()}@nasarawa.gov.ng`,
  phone: `080${int(30000000, 39999999)}`,
  allowPayment: true,
  isActive: chance(0.94),
}));

// ----------------------------------------------------------- revenue heads

const HEAD_SEED: Array<[string, number, RevenueHead['frequency'], RevenueHead['category']]> = [
  ['Certificate of Occupancy fee', 250_000, 'ONE_OFF', 'CORPORATE'],
  ['Right of Occupancy — ground rent', 45_000, 'YEARLY', 'INDIVIDUAL'],
  ['Land use charge', 120_000, 'YEARLY', 'CORPORATE'],
  ['Building plan approval', 180_000, 'ONE_OFF', 'CORPORATE'],
  ['Hospital user fees', 5_000, 'ONE_OFF', 'INDIVIDUAL'],
  ['Private health facility licence', 150_000, 'YEARLY', 'CORPORATE'],
  ['Private school registration', 200_000, 'YEARLY', 'CORPORATE'],
  ['School fees — tertiary', 85_000, 'YEARLY', 'INDIVIDUAL'],
  ['Road maintenance levy', 30_000, 'YEARLY', 'CORPORATE'],
  ['Vehicle licence renewal', 12_500, 'YEARLY', 'INDIVIDUAL'],
  ['Haulage permit', 60_000, 'QUARTERLY', 'CORPORATE'],
  ['Produce sales levy', 25_000, 'MONTHLY', 'CORPORATE'],
  ['Irrigation water rate', 18_000, 'QUARTERLY', 'INDIVIDUAL'],
  ['Water consumption charge — commercial', 40_000, 'MONTHLY', 'CORPORATE'],
  ['Water connection fee', 35_000, 'ONE_OFF', 'INDIVIDUAL'],
  ['Development levy', 15_000, 'YEARLY', 'INDIVIDUAL'],
  ['Signage and advertisement permit', 75_000, 'YEARLY', 'CORPORATE'],
  ['Pay As You Earn remittance', 0, 'MONTHLY', 'CORPORATE'],
  ['Direct assessment', 0, 'YEARLY', 'INDIVIDUAL'],
  ['Presumptive tax', 0, 'YEARLY', 'INDIVIDUAL'],
  ['Withholding tax remittance', 0, 'MONTHLY', 'CORPORATE'],
  ['Tax clearance certificate fee', 10_000, 'ONE_OFF', 'INDIVIDUAL'],
  ['Environmental impact assessment', 320_000, 'ONE_OFF', 'CORPORATE'],
  ['Waste management levy', 22_000, 'MONTHLY', 'CORPORATE'],
  ['Fire safety certificate', 55_000, 'YEARLY', 'CORPORATE'],
  ['Business premises registration', 65_000, 'YEARLY', 'CORPORATE'],
  ['Business premises renewal', 32_500, 'YEARLY', 'CORPORATE'],
  ['Market stall allocation', 8_000, 'MONTHLY', 'INDIVIDUAL'],
  ['Property development levy', 400_000, 'ONE_OFF', 'CORPORATE'],
  ['Estate registration fee', 95_000, 'ONE_OFF', 'CORPORATE'],
];

export const revenueHeads: RevenueHead[] = HEAD_SEED.map(([itemName, amount, frequency, category], i) => {
  const mda = mdas[Math.floor(i / 3) % mdas.length]!;
  const isApproved = chance(0.86);
  return {
    id: `rh_${i + 1}`,
    tenantId: tenant.id,
    mdaId: mda.id,
    mdaName: mda.name,
    itemCode: `${mda.code}-${String(i + 1).padStart(3, '0')}`,
    itemName,
    category,
    amount,
    frequency,
    isApproved,
    approvedAt: isApproved ? daysAgo(int(40, 300)) : undefined,
    approvedBy: isApproved ? 'Aisha Mohammed' : undefined,
    isActive: true,
  };
});

// ------------------------------------------------------- presumptive bands

const BUSINESS_TYPES = [
  'Retail shop', 'Restaurant and eatery', 'Hotel and guest house', 'Pharmacy',
  'Building materials', 'Motor spare parts', 'Tailoring and fashion',
  'Barbing and salon', 'Printing press', 'Block industry', 'Cyber café',
  'Provision store', 'Poultry farm', 'Filling station', 'Cold room',
];

export const presumptiveSchedules: PresumptiveSchedule[] = BUSINESS_TYPES.map((businessType, i) => {
  const micro = int(6, 18) * 2_500;
  return {
    id: `ps_${i + 1}`,
    tenantId: tenant.id,
    businessType,
    micro,
    small: micro * 2 + 10_000,
    medium: micro * 4 + 25_000,
    frequency: 'YEARLY',
  };
});

// --------------------------------------------------------------- taxpayers

const FIRST_NAMES = [
  'Aisha', 'Musa', 'Ibrahim', 'Fatima', 'Zainab', 'Yusuf', 'Amina', 'Sani',
  'Hauwa', 'Abdullahi', 'Halima', 'Suleiman', 'Maryam', 'Idris', 'Rukayya',
  'Bala', 'Ladi', 'Danjuma', 'Grace', 'Emmanuel', 'Joseph', 'Blessing',
  'Solomon', 'Rebecca', 'Yakubu', 'Talatu', 'Umar', 'Jummai', 'Ezekiel', 'Asabe',
];

const SURNAMES = [
  'Aliyu', 'Mohammed', 'Abubakar', 'Danladi', 'Usman', 'Adamu', 'Bello',
  'Garba', 'Lawal', 'Sule', 'Audu', 'Maikano', 'Ogbaji', 'Akwe', 'Angbashim',
  'Zakari', 'Dogo', 'Iliya', 'Makama', 'Tanko', 'Baba', 'Yakubu', 'Onazi',
  'Agwai', 'Jibrin', 'Kigbu', 'Ari', 'Odoma', 'Nwankwo', 'Ochekwu',
];

const COMPANY_PREFIX = [
  'Nasara', 'Farin Ruwa', 'Doma', 'Mada Hills', 'Keffi', 'Lafia', 'Akwanga',
  'Toto', 'Uke', 'Karu', 'Panda', 'Gitata', 'Kokona', 'Wamba', 'Assakio',
  'Agyaragu', 'Obi', 'Awe', 'Azara', 'Loko',
];

const COMPANY_SUFFIX = [
  'Ventures Limited', 'Nigeria Limited', 'Global Services', 'Enterprises',
  'Construction Company', 'Trading Company', 'Agro Allied Limited',
  'Investments Limited', 'Hotels Limited', 'Pharmacy Limited',
  'Logistics Limited', 'Integrated Services', 'Motors Limited', 'Stores',
];

const AGENCY_NAMES = [
  'Nasarawa State Universal Basic Education Board',
  'Nasarawa State College of Agriculture',
  'Federal Medical Centre Keffi',
  'Nasarawa State University Keffi',
  'Federal University of Lafia',
  'Nasarawa State Broadcasting Service',
  'National Population Commission — Nasarawa',
  'Federal Road Safety Corps — Nasarawa Command',
];

const TIN_STATUSES: Taxpayer['tinStatus'][] = [
  'APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', 'APPROVED',
  'UNDER_REVIEW', 'SUBMITTED', 'PENDING', 'DECLINED',
];

const STREETS = [
  'Jos Road', 'Shendam Road', 'Makurdi Road', 'Bukan Sidi', 'Angwan Mangoro',
  'Emir Road', 'Bakin Kasuwa', 'GRA', 'Tudun Amba', 'Sabon Pegi',
  'Ombi II', 'Kilema Road', 'New Market Road',
];

function makeTaxpayer(i: number): Taxpayer {
  const lga = pick(lgas);
  const roll = rand();
  const category: Taxpayer['category'] =
    roll < 0.58 ? 'INDIVIDUAL' : roll < 0.9 ? 'CORPORATE' : roll < 0.96 ? 'STATE_AGENCY' : 'FEDERAL_AGENCY';

  const firstName = pick(FIRST_NAMES);
  const surname = pick(SURNAMES);
  const businessName =
    category === 'CORPORATE'
      ? `${pick(COMPANY_PREFIX)} ${pick(COMPANY_SUFFIX)}`
      : category === 'STATE_AGENCY' || category === 'FEDERAL_AGENCY'
        ? pick(AGENCY_NAMES)
        : undefined;

  const tinStatus = pick(TIN_STATUSES);
  const slug = (businessName ?? `${firstName}.${surname}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '');

  return {
    id: `tp_${i + 1}`,
    tenantId: tenant.id,
    // Year + two-digit LGA code + serial, exactly as @igr/tax-rules formats it.
    tin: `26${lga.code}${String(10_000 + i * 7).padStart(5, '0')}`,
    category,
    tinStatus,
    firstName: businessName ? undefined : firstName,
    surname: businessName ? undefined : surname,
    businessName,
    email: `${slug}${i}@example.ng`,
    phone: `0${pick(['70', '80', '81', '90', '91'])}${int(10_000_000, 99_999_999)}`,
    lgaId: lga.id,
    lgaName: lga.name,
    address: `${int(1, 240)} ${pick(STREETS)}, ${lga.name}`,
    isActive: tinStatus === 'APPROVED' ? chance(0.95) : true,
    createdAt: daysAgo(int(1, 900)),
  };
}

export const taxpayers: Taxpayer[] = Array.from({ length: 260 }, (_, i) => makeTaxpayer(i));

// ---------------------------------------------------------------- invoices

const INVOICE_TYPES: Invoice['type'][] = [
  'DIRECT', 'DIRECT_ASSESSMENT', 'DEMAND_NOTICE', 'PRESUMPTIVE', 'TCC', 'PAYE', 'APPLICABLE',
];

const approvedHeads = revenueHeads.filter((h) => h.isApproved && h.amount > 0);

function makeInvoice(i: number): Invoice {
  const taxpayer = pick(taxpayers.filter((t) => t.tinStatus === 'APPROVED'));
  const type = pick(INVOICE_TYPES);
  const createdDaysAgo = int(1, 300);
  const lineCount = chance(0.72) ? 1 : int(2, 4);

  const lines: InvoiceLine[] = Array.from({ length: lineCount }, (_, k) => {
    const head = pick(approvedHeads);
    const quantity = chance(0.85) ? 1 : int(2, 6);
    const unitAmount = head.amount;
    return {
      id: `il_${i + 1}_${k + 1}`,
      invoiceId: `inv_${i + 1}`,
      revenueHeadId: head.id,
      revenueHeadName: head.itemName,
      description: head.itemName,
      quantity,
      unitAmount,
      lineTotal: unitAmount * quantity,
      // A due date always follows the date the bill was raised. Picking it
      // independently produced bills due before they were issued, which is
      // invisible in a list and glaring on a printed invoice.
      dueDate: daysAhead(int(30, 120) - createdDaysAgo),
    };
  });

  const totalAmount = lines.reduce((s, l) => s + l.lineTotal, 0);

  // Settlement outcome: most bills are paid, a meaningful minority are not.
  const outcome = rand();
  let status: Invoice['status'];
  let amountPaid: number;
  if (outcome < 0.56) {
    status = 'PAID';
    amountPaid = totalAmount;
  } else if (outcome < 0.68) {
    status = 'PART_PAID';
    amountPaid = Math.round(totalAmount * (0.2 + rand() * 0.5));
  } else if (outcome < 0.94) {
    status = 'UNPAID';
    amountPaid = 0;
  } else if (outcome < 0.98) {
    status = 'CANCELLED';
    amountPaid = 0;
  } else {
    status = 'EXPIRED';
    amountPaid = 0;
  }

  const earliestDue = lines
    .map((l) => l.dueDate)
    .reduce((a, b) => (a < b ? a : b));

  return {
    id: `inv_${i + 1}`,
    tenantId: tenant.id,
    invoiceNumber: `NAS${String(400_000 + i * 13).padStart(8, '0')}`,
    type,
    status,
    taxpayerId: taxpayer.id,
    taxpayerName: taxpayer.businessName ?? `${taxpayer.firstName} ${taxpayer.surname}`,
    taxpayerTin: taxpayer.tin,
    totalAmount,
    amountPaid,
    dueDate: earliestDue,
    description: lines.length > 1 ? `${lines.length} revenue heads` : lines[0]!.description,
    lines,
    createdAt: daysAgo(createdDaysAgo),
  };
}

export const invoices: Invoice[] = Array.from({ length: 620 }, (_, i) => makeInvoice(i));

// ---------------------------------------------------------------- payments

const CHANNELS: Payment['channel'][] = ['PAYSTACK', 'REMITA', 'PAYDIRECT', 'CREDO', 'BANK_BRANCH'];

export const payments: Payment[] = (() => {
  const rows: Payment[] = [];
  let n = 0;

  for (const inv of invoices) {
    if (inv.amountPaid <= 0) {
      // A failed attempt on an unpaid bill is exactly what capability 25
      // ("payment recovery") is built to find, so the data must contain them.
      if (inv.status === 'UNPAID' && chance(0.22)) {
        n += 1;
        rows.push({
          id: `pay_${n}`,
          tenantId: tenant.id,
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          taxpayerName: inv.taxpayerName,
          reference: `REF${String(900_000 + n * 17)}`,
          channel: pick(CHANNELS),
          status: chance(0.75) ? 'FAILED' : 'PENDING',
          amount: inv.totalAmount,
          createdAt: daysAgo(int(1, 200)),
        });
      }
      continue;
    }

    n += 1;
    const paidAt = daysAgo(int(1, 260));
    rows.push({
      id: `pay_${n}`,
      tenantId: tenant.id,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      taxpayerName: inv.taxpayerName,
      reference: `REF${String(900_000 + n * 17)}`,
      receiptNumber: `RCT${String(500_000 + n * 11)}`,
      channel: pick(CHANNELS),
      status: chance(0.98) ? 'SUCCESSFUL' : 'REVERSED',
      amount: inv.amountPaid,
      paidAt,
      createdAt: paidAt,
    });
  }

  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
})();

// ------------------------------------------------------------------- users

/**
 * The accounts the sign-in page offers in development.
 *
 * Declared here, beside the seed, because the login screen previously kept
 * its own copy of this list: the seed deactivated one of them at random and
 * the screen went on advertising an account that could not sign in.
 */
export const DEMO_LOGINS: Array<{ handle: string; email: string; description: string }> = [
  { handle: 'aisha.mohammed', email: 'aisha.mohammed@nsirs.gov.ng', description: 'Administrator — everything' },
  { handle: 'musa.aliyu', email: 'musa.aliyu@nsirs.gov.ng', description: 'Tax officer — assessment, clearance and collection' },
  { handle: 'emmanuel.ogbaji', email: 'emmanuel.ogbaji@nsirs.gov.ng', description: 'Agency user — own agency only' },
  { handle: 'bala.audu', email: 'bala.audu@nsirs.gov.ng', description: 'Enumeration agent — field capture' },
  { handle: 'taxpayer@example.ng', email: 'taxpayer@example.ng', description: 'Taxpayer — own bills only' },
];

const DEMO_HANDLES = new Set(DEMO_LOGINS.map((d) => d.handle));

const STAFF: Array<[string, User['type'], string]> = [
  ['Aisha Mohammed', 'ADMIN', 'aisha.mohammed'],
  ['Ibrahim Danladi', 'ADMIN', 'ibrahim.danladi'],
  ['Musa Aliyu', 'TAX_OFFICER', 'musa.aliyu'],
  ['Zainab Usman', 'TAX_OFFICER', 'zainab.usman'],
  ['Yusuf Adamu', 'TAX_OFFICER', 'yusuf.adamu'],
  ['Halima Bello', 'TAX_OFFICER', 'halima.bello'],
  ['Suleiman Garba', 'TAX_OFFICER', 'suleiman.garba'],
  ['Grace Akwe', 'TAX_OFFICER', 'grace.akwe'],
  ['Emmanuel Ogbaji', 'MDA_USER', 'emmanuel.ogbaji'],
  ['Rukayya Sule', 'MDA_USER', 'rukayya.sule'],
  ['Danjuma Tanko', 'MDA_USER', 'danjuma.tanko'],
  ['Bala Audu', 'ENUMERATOR', 'bala.audu'],
  ['Ladi Iliya', 'ENUMERATOR', 'ladi.iliya'],
  ['Solomon Onazi', 'ENUMERATOR', 'solomon.onazi'],
  ['Talatu Kigbu', 'ENUMERATOR', 'talatu.kigbu'],
];

export const users: User[] = STAFF.map(([fullName, type, handle], i) => {
  const mda = type === 'MDA_USER' ? mdas[i % mdas.length] : undefined;
  return {
    id: `usr_${i + 1}`,
    tenantId: tenant.id,
    email: `${handle}@nsirs.gov.ng`,
    phone: `080${int(30_000_000, 39_999_999)}`,
    fullName,
    type,
    isActive: DEMO_HANDLES.has(handle) ? true : chance(0.93),
    emailVerifiedAt: daysAgo(int(30, 400)),
    lastLoginAt: daysAgo(int(0, 21)),
    mdaId: mda?.id,
    mdaName: mda?.name,
    permissions: DEFAULT_PERMISSIONS[type],
    createdAt: daysAgo(int(120, 700)),
  };
});

/** The taxpayer-facing login, so the taxpayer portal can be demonstrated. */
export const taxpayerUser: User = {
  id: 'usr_taxpayer',
  tenantId: tenant.id,
  email: 'taxpayer@example.ng',
  fullName: taxpayers[0]!.businessName ?? `${taxpayers[0]!.firstName} ${taxpayers[0]!.surname}`,
  type: 'TAXPAYER',
  isActive: true,
  taxpayerId: taxpayers[0]!.id,
  permissions: DEFAULT_PERMISSIONS.TAXPAYER,
  createdAt: daysAgo(300),
};

export const allUsers: User[] = [...users, taxpayerUser];

// --------------------------------------------------------------- audit log

const AUDIT_ROUTES: Array<[string, string, number]> = [
  ['POST', '/auth/login', 200],
  ['POST', '/auth/login', 401],
  ['GET', '/taxpayers', 200],
  ['POST', '/taxpayers', 201],
  ['PATCH', '/taxpayers/:id', 200],
  ['GET', '/invoices', 200],
  ['POST', '/invoices', 201],
  ['POST', '/invoices/:id/cancel', 200],
  ['GET', '/payments', 200],
  ['POST', '/payments/record', 201],
  ['POST', '/payments/:id/reverse', 403],
  ['GET', '/revenue-heads', 200],
  ['POST', '/revenue-heads/:id/approve', 200],
  ['GET', '/analytics/summary', 200],
  ['GET', '/audit', 200],
  ['POST', '/users', 201],
  ['POST', '/users/:id/permissions', 200],
  ['GET', '/intelligence/leads', 200],
  ['DELETE', '/taxpayers/:id', 403],
];

export const auditLogs: AuditLog[] = Array.from({ length: 400 }, (_, i) => {
  const user = pick(users);
  const [method, path, statusCode] = pick(AUDIT_ROUTES);
  return {
    id: `aud_${i + 1}`,
    tenantId: tenant.id,
    userId: user.id,
    userName: user.fullName,
    userType: user.type,
    method,
    path,
    statusCode,
    durationMs: int(8, 940),
    ipAddress: `41.${int(58, 220)}.${int(1, 254)}.${int(1, 254)}`,
    userAgent: pick([
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/141.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) Safari/18.0',
      'Mozilla/5.0 (Linux; Android 14) Chrome/140.0 Mobile',
    ]),
    createdAt: daysAgo(rand() * 45),
  };
}).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export const permissionCatalogue = PERMISSIONS;

// ---------------------------------------------- clearance certificates (11)

import type {
  ContentPage,
  DemandNotice,
  EnumerationAgent,
  Filing,
  NotificationTemplate,
  TaxOffice,
  TccApplication,
  TccStage,
} from '../types';

/** The chain in order. An application sits at exactly one of these. */
export const TCC_CHAIN: TccStage[] = [
  'FIRST_REVIEW',
  'FIRST_APPROVAL',
  'SECOND_REVIEW',
  'SECOND_APPROVAL',
  'DIRECTOR_REVIEW',
  'ISSUED',
];

const REVIEWERS = ['Musa Aliyu', 'Zainab Usman', 'Halima Bello', 'Ibrahim Danladi'];

export const tccApplications: TccApplication[] = Array.from({ length: 64 }, (_, i) => {
  const taxpayer = pick(taxpayers.filter((t) => t.tinStatus === 'APPROVED'));
  const declined = chance(0.08);
  // Weighted towards the middle of the chain: most applications are in flight.
  const reached = declined ? int(0, 3) : int(0, TCC_CHAIN.length - 1);
  const stage: TccStage = declined ? 'DECLINED' : TCC_CHAIN[reached]!;
  const appliedDaysAgo = int(2, 160);

  const history = TCC_CHAIN.slice(0, reached + (declined ? 1 : 1)).map((s, k) => ({
    stage: s,
    actorName: pick(REVIEWERS),
    actedAt: daysAgo(appliedDaysAgo - k * 2),
    remark: k === 0 ? 'Application received and liabilities checked.' : undefined,
  }));

  if (declined) {
    history.push({
      stage: 'DECLINED',
      actorName: pick(REVIEWERS),
      actedAt: daysAgo(appliedDaysAgo - history.length * 2),
      remark: 'Outstanding liability for the year of assessment.',
    });
  }

  const issued = stage === 'ISSUED';
  return {
    id: `tcc_${i + 1}`,
    tenantId: tenant.id,
    certificateNumber: `TCC/NAS/2026/${String(1000 + i * 7)}`,
    taxpayerId: taxpayer.id,
    taxpayerName: taxpayer.businessName ?? `${taxpayer.firstName} ${taxpayer.surname}`,
    taxpayerTin: taxpayer.tin,
    stage,
    yearOfAssessment: 2025,
    appliedAt: daysAgo(appliedDaysAgo),
    issuedAt: issued ? daysAgo(int(1, appliedDaysAgo)) : undefined,
    expiresAt: issued ? daysAhead(int(60, 330)) : undefined,
    feePaid: chance(0.88),
    feeInvoiceNumber: `NAS${String(400_000 + i * 13).padStart(8, '0')}`,
    history,
  };
});

// -------------------------------------------------- demand notices (09)

const DEMAND_STATUSES: DemandNotice['status'][] = [
  'SERVED', 'SERVED', 'SERVED', 'PART_SETTLED', 'SETTLED', 'ESCALATED', 'WITHDRAWN',
];

export const demandNotices: DemandNotice[] = Array.from({ length: 48 }, (_, i) => {
  const taxpayer = pick(taxpayers);
  const amount = int(4, 220) * 25_000;
  const status = pick(DEMAND_STATUSES);
  const amountSettled =
    status === 'SETTLED' ? amount : status === 'PART_SETTLED' ? Math.round(amount * (0.15 + rand() * 0.6)) : 0;
  const issuedDaysAgo = int(1, 150);

  return {
    id: `dn_${i + 1}`,
    tenantId: tenant.id,
    noticeNumber: `DN/NAS/${String(6000 + i * 11)}`,
    taxpayerId: taxpayer.id,
    taxpayerName: taxpayer.businessName ?? `${taxpayer.firstName} ${taxpayer.surname}`,
    taxpayerTin: taxpayer.tin,
    invoiceCount: int(1, 6),
    amount,
    amountSettled,
    status,
    issuedAt: daysAgo(issuedDaysAgo),
    dueAt: daysAhead(30 - issuedDaysAgo),
    issuedByName: pick(REVIEWERS),
  };
});

// ------------------------------------------ self-assessment filings (07)

const TAX_TYPES = ['Direct assessment', 'Withholding tax', 'Pay as you earn', 'Development levy', 'Business premises'];

export const filings: Filing[] = Array.from({ length: 52 }, (_, i) => {
  const taxpayer = pick(taxpayers.filter((t) => t.tinStatus === 'APPROVED'));
  const status = pick<Filing['status']>([
    'SUBMITTED', 'SUBMITTED', 'UNDER_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'PART_APPROVED', 'REJECTED',
  ]);
  const settled = status === 'APPROVED' || status === 'PART_APPROVED' || status === 'REJECTED';

  const lines = Array.from({ length: int(1, 4) }, (_, k) => {
    const declared = int(8, 400) * 25_000;
    const decision: Filing['lines'][number]['decision'] = !settled
      ? 'PENDING'
      : status === 'REJECTED'
        ? 'REJECTED'
        : status === 'APPROVED'
          ? 'APPROVED'
          : chance(0.6)
            ? 'APPROVED'
            : 'REJECTED';
    return {
      id: `fl_${i + 1}_${k + 1}`,
      taxType: TAX_TYPES[k % TAX_TYPES.length]!,
      declaredAmount: declared,
      assessedAmount: decision === 'APPROVED' ? declared : decision === 'REJECTED' ? Math.round(declared * 1.3) : undefined,
      decision,
      remark: decision === 'REJECTED' ? 'Supporting documents do not evidence the declared figure.' : undefined,
    };
  });

  return {
    id: `fil_${i + 1}`,
    tenantId: tenant.id,
    filingReference: `FIL/NAS/${String(3000 + i * 9)}`,
    taxpayerId: taxpayer.id,
    taxpayerName: taxpayer.businessName ?? `${taxpayer.firstName} ${taxpayer.surname}`,
    taxpayerTin: taxpayer.tin,
    period: `${2025} year of assessment`,
    submittedAt: daysAgo(int(1, 180)),
    status,
    lines,
    documents: [
      { name: 'Audited financial statements.pdf', sizeKb: int(320, 4200) },
      ...(chance(0.6) ? [{ name: 'Bank statement.pdf', sizeKb: int(120, 900) }] : []),
      ...(chance(0.4) ? [{ name: 'Payroll schedule.xlsx', sizeKb: int(40, 380) }] : []),
    ],
  };
});

// ------------------------------------------- tax offices and zones (15)

const ZONES = ['Lafia Zone', 'Keffi Zone', 'Akwanga Zone'];

export const taxOffices: TaxOffice[] = lgas.map((lga, i) => {
  const monthlyTarget = int(6, 34) * 500_000;
  return {
    id: `off_${i + 1}`,
    tenantId: tenant.id,
    name: `${lga.name} Area Tax Office`,
    zone: ZONES[i % ZONES.length]!,
    lgaName: lga.name,
    managerName: pick(REVIEWERS),
    staffCount: int(4, 22),
    monthlyTarget,
    monthCollected: Math.round(monthlyTarget * (0.42 + rand() * 0.85)),
    annualTarget: monthlyTarget * 12,
    ytdCollected: Math.round(monthlyTarget * 12 * (0.4 + rand() * 0.6)),
  };
});

// --------------------------------------------- field enumeration (16)

export const enumerationAgents: EnumerationAgent[] = users
  .filter((u) => u.type === 'ENUMERATOR')
  .map((u, i) => {
    const monthlyTarget = int(30, 90);
    return {
      userId: u.id,
      name: u.fullName,
      lgaName: lgas[(i * 3) % lgas.length]!.name,
      monthlyTarget,
      capturedThisMonth: Math.round(monthlyTarget * (0.3 + rand() * 1.1)),
      capturedTotal: int(180, 1400),
      invoicesRaised: int(40, 520),
      lastSyncAt: daysAgo(rand() * 3),
    };
  });

// ------------------------------------------------- notifications (21)

const NOTICE_SEED: Array<[string, string, NotificationTemplate['channel'], string]> = [
  ['registration.received', 'Registration received', 'EMAIL', 'A registration form is submitted'],
  ['email.verify', 'Email verification code', 'EMAIL', 'A one-time code is requested'],
  ['tin.submitted', 'TIN request submitted', 'EMAIL', 'A TIN request enters the chain'],
  ['tin.approved', 'TIN issued', 'EMAIL', 'A TIN request is approved'],
  ['tin.declined', 'TIN request declined', 'EMAIL', 'A TIN request is refused'],
  ['invoice.raised', 'Invoice raised', 'EMAIL', 'A bill is raised against a taxpayer'],
  ['invoice.due', 'Payment due reminder', 'SMS', 'A bill falls due in seven days'],
  ['invoice.overdue', 'Overdue notice', 'SMS', 'A bill passes its due date'],
  ['payment.received', 'Payment received', 'EMAIL', 'A settlement posts against a bill'],
  ['receipt.issued', 'Receipt issued', 'EMAIL', 'A receipt is generated'],
  ['demand.served', 'Demand notice served', 'EMAIL', 'A demand notice is issued'],
  ['tcc.received', 'Clearance application received', 'EMAIL', 'A clearance application is submitted'],
  ['tcc.advanced', 'Clearance application advanced', 'EMAIL', 'An application passes a review stage'],
  ['tcc.issued', 'Clearance certificate issued', 'EMAIL', 'A certificate is issued'],
  ['password.reset', 'Password reset', 'EMAIL', 'A password reset is requested'],
];

export const notificationTemplates: NotificationTemplate[] = NOTICE_SEED.map(
  ([key, name, channel, trigger], i) => ({
    id: `ntf_${i + 1}`,
    key,
    name,
    channel,
    trigger,
    enabled: chance(0.87),
    sentThisMonth: int(12, 3400),
  }),
);

// --------------------------------------------- public content (19)

const CONTENT_SEED: Array<[string, string, string]> = [
  ['how-to-pay', 'How to pay your tax', 'Guidance'],
  ['tax-calendar', 'Tax calendar and due dates', 'Guidance'],
  ['paye-explained', 'Pay as you earn explained', 'Guidance'],
  ['presumptive-bands', 'Presumptive tax bands', 'Guidance'],
  ['tcc-requirements', 'Clearance certificate requirements', 'Guidance'],
  ['faqs', 'Frequently asked questions', 'Help'],
  ['contact', 'Contact the Service', 'Help'],
  ['area-offices', 'Find your area tax office', 'Help'],
  ['revenue-law', 'Revenue laws and regulations', 'Library'],
  ['forms', 'Downloadable forms', 'Library'],
  ['annual-report', 'Annual revenue report', 'Library'],
  ['news', 'News and announcements', 'News'],
];

export const contentPages: ContentPage[] = CONTENT_SEED.map(([slug, title, section], i) => ({
  id: `cnt_${i + 1}`,
  slug,
  title,
  section,
  published: chance(0.85),
  updatedAt: daysAgo(int(1, 220)),
  updatedByName: pick(REVIEWERS),
}));

// ------------------------------------------------- employers / PAYE (03)

import type { Employer, PayrollEmployee, Remittance } from '../types';

const PUBLIC_EMPLOYERS = [
  'Nasarawa State Universal Basic Education Board',
  'Nasarawa State Ministry of Health',
  'Nasarawa State University Keffi',
  'Nasarawa State Water Corporation',
  'Nasarawa State Judiciary',
];

export const employers: Employer[] = Array.from({ length: 34 }, (_, i) => {
  const isPublic = i < PUBLIC_EMPLOYERS.length;
  const lga = pick(lgas);
  const name = isPublic
    ? PUBLIC_EMPLOYERS[i]!
    : `${pick(COMPANY_PREFIX)} ${pick(COMPANY_SUFFIX)}`;

  return {
    id: `emp_${i + 1}`,
    tenantId: tenant.id,
    name,
    tin: `26${lga.code}${String(70_000 + i * 13).padStart(5, '0')}`,
    sector: isPublic ? 'PUBLIC' : 'PRIVATE',
    lgaName: lga.name,
    email: `payroll${i}@example.ng`,
    phone: `0${pick(['70', '80', '81'])}${int(10_000_000, 99_999_999)}`,
    staffCount: isPublic ? int(120, 900) : int(6, 140),
    registeredAt: daysAgo(int(120, 1200)),
    isActive: chance(0.94),
  };
});

const STAFF_FIRST = FIRST_NAMES;
const STAFF_LAST = SURNAMES;

/**
 * The payroll roster. Only a sample of each employer's staff is generated —
 * a 900-strong ministry does not need 900 rows to demonstrate the screen, and
 * the employer's own `staffCount` remains the authority.
 */
export const payrollEmployees: PayrollEmployee[] = employers.flatMap((e) =>
  Array.from({ length: Math.min(e.staffCount, int(8, 26)) }, (_, k) => {
    // Public sector salaries cluster tighter than private.
    const base = e.sector === 'PUBLIC' ? int(9, 34) * 100_000 : int(5, 96) * 100_000;
    return {
      id: `pe_${e.id}_${k + 1}`,
      employerId: e.id,
      staffNumber: `${e.sector === 'PUBLIC' ? 'PS' : 'ST'}${String(1000 + k * 7)}`,
      name: `${pick(STAFF_FIRST)} ${pick(STAFF_LAST)}`,
      annualGross: base,
      nhf: e.sector === 'PUBLIC' ? true : chance(0.45),
      pension: chance(0.92),
      nhis: e.sector === 'PUBLIC' ? true : chance(0.4),
    };
  }),
);

const PERIODS = [
  '2026-01', '2026-02', '2026-03', '2026-04', '2026-05',
  '2026-06', '2026-07', '2026-08',
];

export const remittances: Remittance[] = employers.flatMap((e) =>
  PERIODS.map((period, k) => {
    // Roughly proportional to headcount; the screen recomputes the true
    // figure from the roster, this is only the historic posting.
    const amountDue = e.staffCount * int(2_400, 9_600);
    const roll = rand();
    const status: Remittance['status'] = roll < 0.68 ? 'PAID' : roll < 0.82 ? 'PART_PAID' : 'UNPAID';
    const amountPaid =
      status === 'PAID' ? amountDue : status === 'PART_PAID' ? Math.round(amountDue * (0.2 + rand() * 0.6)) : 0;

    return {
      id: `rem_${e.id}_${k + 1}`,
      employerId: e.id,
      period,
      // Remittance is due on the tenth of the following month.
      dueDate: new Date(`${period}-10T00:00:00.000Z`).toISOString(),
      amountDue,
      amountPaid,
      status,
      paidAt: amountPaid > 0 ? daysAgo(int(1, 220)) : undefined,
    };
  }),
);
