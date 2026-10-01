/**
 * The permission catalogue.
 *
 * These keys are reference data shared by every tenant, and they are the same
 * keys the API enforces on the server. The UI hides what a user cannot do as a
 * courtesy; hiding is never the control. Any screen reachable by URL must still
 * be refused by the API for a user without the permission.
 */

import type { UserType } from './types';

export interface PermissionDef {
  key: string;
  label: string;
  category: string;
  description: string;
}

export const PERMISSIONS: PermissionDef[] = [
  // Taxpayers
  { key: 'taxpayer.view', label: 'View taxpayers', category: 'Taxpayers', description: 'Search and read the taxpayer register.' },
  { key: 'taxpayer.create', label: 'Register taxpayers', category: 'Taxpayers', description: 'Create individual, corporate and agency records.' },
  { key: 'taxpayer.update', label: 'Amend taxpayers', category: 'Taxpayers', description: 'Correct taxpayer details after registration.' },
  { key: 'taxpayer.deactivate', label: 'Deactivate taxpayers', category: 'Taxpayers', description: 'Remove a record from active billing.' },
  { key: 'tin.review', label: 'Review TIN requests', category: 'Taxpayers', description: 'Act at a stage of the TIN approval chain.' },
  { key: 'tin.approve', label: 'Approve TIN requests', category: 'Taxpayers', description: 'Issue a Tax Identification Number.' },

  // Assessment
  { key: 'assessment.paye', label: 'Assess PAYE', category: 'Assessment', description: 'Raise and review pay-as-you-earn assessments.' },
  { key: 'assessment.direct', label: 'Direct assessment', category: 'Assessment', description: 'Assess income not taxed through a payroll.' },
  { key: 'assessment.presumptive', label: 'Presumptive assessment', category: 'Assessment', description: 'Assess small businesses on staff strength.' },
  { key: 'assessment.wht', label: 'Withholding tax', category: 'Assessment', description: 'Compute and record deductions at source.' },
  { key: 'filing.review', label: 'Review filings', category: 'Assessment', description: 'Approve or reject self-assessment returns line by line.' },

  // Billing
  { key: 'invoice.view', label: 'View invoices', category: 'Billing', description: 'Read the invoice register and extracts.' },
  { key: 'invoice.create', label: 'Raise invoices', category: 'Billing', description: 'Generate a bill against a taxpayer.' },
  { key: 'invoice.cancel', label: 'Cancel invoices', category: 'Billing', description: 'Void a bill that should not have been raised.' },
  { key: 'demand.issue', label: 'Issue demand notices', category: 'Billing', description: 'Serve notice against outstanding liability.' },

  // Collection
  { key: 'payment.view', label: 'View payments', category: 'Collection', description: 'Read the payment and receipt register.' },
  { key: 'payment.record', label: 'Record payments', category: 'Collection', description: 'Post an in-branch payment against a bill.' },
  { key: 'payment.reconcile', label: 'Reconcile', category: 'Collection', description: 'Match gateway settlement to treasury.' },
  { key: 'payment.reverse', label: 'Reverse payments', category: 'Collection', description: 'Reverse a posting, with reason recorded.' },

  // Clearance
  { key: 'tcc.apply', label: 'Apply for clearance', category: 'Clearance', description: 'Submit a tax clearance certificate application.' },

  { key: 'tcc.review.first', label: 'First review', category: 'Clearance', description: 'Act as first reviewer on a clearance application.' },
  { key: 'tcc.review.second', label: 'Second review', category: 'Clearance', description: 'Act as second reviewer on a clearance application.' },
  { key: 'tcc.issue', label: 'Issue clearance', category: 'Clearance', description: 'Director sign-off issuing the certificate.' },

  // Taxpayer-scoped keys. Deliberately distinct from the staff keys above:
  // `invoice.view` means "every bill in the state", and a taxpayer must never
  // hold it. These resolve against the signed-in taxpayer's own records only.
  { key: 'invoice.view.own', label: 'View own bills', category: 'Self service', description: 'Read bills raised against the signed-in taxpayer.' },
  { key: 'payment.view.own', label: 'View own payments', category: 'Self service', description: 'Read the signed-in taxpayer’s own receipts.' },

  // Revenue administration
  { key: 'mda.view', label: 'View agencies', category: 'Revenue administration', description: 'Read the register of collecting agencies.' },
  { key: 'mda.manage', label: 'Manage agencies', category: 'Revenue administration', description: 'Create and amend agency records.' },
  { key: 'revenuehead.view', label: 'View revenue heads', category: 'Revenue administration', description: 'Read the approved chart of revenue.' },
  { key: 'revenuehead.manage', label: 'Manage revenue heads', category: 'Revenue administration', description: 'Create and amend revenue heads and rates.' },
  { key: 'revenuehead.approve', label: 'Approve revenue heads', category: 'Revenue administration', description: 'Make a revenue head billable.' },
  { key: 'referencedata.manage', label: 'Manage reference data', category: 'Revenue administration', description: 'Local government areas, sectors and business types.' },
  { key: 'office.manage', label: 'Manage tax offices', category: 'Revenue administration', description: 'Area offices, managers and targets.' },
  { key: 'enumeration.manage', label: 'Manage enumeration', category: 'Revenue administration', description: 'Field agents and their targets.' },
  { key: 'enumeration.field', label: 'Field capture', category: 'Revenue administration', description: 'Capture taxpayers on site and raise a bill there.' },

  // Platform
  { key: 'user.view', label: 'View users', category: 'Platform', description: 'Read the back-office user list.' },
  { key: 'user.manage', label: 'Manage users', category: 'Platform', description: 'Create users and grant permissions.' },
  { key: 'analytics.view', label: 'View analytics', category: 'Platform', description: 'Executive dashboard and performance reporting.' },
  { key: 'audit.view', label: 'View audit trail', category: 'Platform', description: 'Read the record of every action taken.' },
  { key: 'content.manage', label: 'Manage content', category: 'Platform', description: 'Public guidance, news and library pages.' },

  // Compliance intelligence
  { key: 'intelligence.view', label: 'View intelligence', category: 'Compliance intelligence', description: 'Discovery leads, risk worklists and recovery queues.' },
  { key: 'intelligence.action', label: 'Action intelligence', category: 'Compliance intelligence', description: 'Accept a lead onto the register or into assessment.' },
];

export const PERMISSION_CATEGORIES = Array.from(new Set(PERMISSIONS.map((p) => p.category)));

/** Sensible starting grants per user type, offered when creating a user. */
export const DEFAULT_PERMISSIONS: Record<UserType, string[]> = {
  ADMIN: PERMISSIONS.map((p) => p.key),
  TAX_OFFICER: [
    'taxpayer.view', 'taxpayer.create', 'taxpayer.update', 'tin.review',
    'assessment.paye', 'assessment.direct', 'assessment.presumptive', 'assessment.wht',
    'filing.review', 'invoice.view', 'invoice.create', 'invoice.cancel', 'demand.issue',
    'payment.view', 'payment.record', 'payment.reconcile',
    'tcc.review.first', 'tcc.review.second',
    'revenuehead.view', 'mda.view', 'analytics.view',
    'intelligence.view', 'intelligence.action',
  ],
  MDA_USER: ['invoice.view', 'payment.view', 'revenuehead.view', 'mda.view', 'analytics.view'],
  // No `taxpayer.view`: that key means the state-wide register, which is not an
  // agent's to read. They capture, they bill what they capture, and they see
  // their own work through `enumeration.field`.
  ENUMERATOR: ['taxpayer.create', 'invoice.create', 'enumeration.field'],
  TAXPAYER: ['invoice.view.own', 'payment.view.own', 'tcc.apply'],
};

export function can(userPermissions: string[], key: string): boolean {
  return userPermissions.includes(key);
}

export function canAny(userPermissions: string[], keys: string[]): boolean {
  return keys.some((k) => userPermissions.includes(k));
}
