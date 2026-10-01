/**
 * Navigation, expressed as data.
 *
 * Two levels. The rail selects a SECTION; the sidebar lists the groups inside
 * that section and nothing else. Each entry names the permission that reveals
 * it, so an enumerator and a director see different products without either
 * screen knowing about roles.
 *
 * The tree mirrors the capability areas the platform is sold on, one entry per
 * area. If a capability has no entry here it does not exist to a user, however
 * much code sits behind it.
 */

export type IconKey = 'pulse' | 'board' | 'doc' | 'cmd' | 'tag' | 'field' | 'settings';

export interface NavItem {
  label: string;
  href: string;
  /** Any one of these reveals the item. Omitted means always visible. */
  permissions?: string[];
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export interface NavSection {
  key: string;
  label: string;
  /** Compact label for the rail caption, where the full name will not fit. */
  short?: string;
  icon: IconKey;
  /** Pinned to the bottom of the rail, away from the operational sections. */
  footer?: boolean;
  groups: NavGroup[];
}

export const SECTIONS: NavSection[] = [
  {
    key: 'overview',
    label: 'Overview',
    icon: 'pulse',
    groups: [
      {
        group: 'Overview',
        items: [{ label: 'Dashboard', href: '/dashboard', permissions: ['analytics.view'] }],
      },
    ],
  },
  {
    key: 'taxpayers',
    label: 'Taxpayers',
    icon: 'board',
    groups: [
      {
        group: 'Register',
        items: [
          { label: 'Taxpayer register', href: '/taxpayers', permissions: ['taxpayer.view'] },
          { label: 'TIN requests', href: '/tin-requests', permissions: ['tin.review', 'tin.approve'] },
        ],
      },
    ],
  },
  {
    key: 'revenue',
    label: 'Revenue',
    icon: 'doc',
    groups: [
      {
        group: 'Assessment',
        items: [
          { label: 'PAYE employers', href: '/assessment/paye', permissions: ['assessment.paye'] },
          { label: 'PAYE calculator', href: '/assessment/paye/calculator', permissions: ['assessment.paye'] },
          { label: 'Direct', href: '/assessment/direct', permissions: ['assessment.direct'] },
          { label: 'Presumptive', href: '/assessment/presumptive', permissions: ['assessment.presumptive'] },
          { label: 'Withholding', href: '/assessment/wht', permissions: ['assessment.wht'] },
          { label: 'Filings', href: '/filings', permissions: ['filing.review'] },
        ],
      },
      {
        group: 'Billing & collection',
        items: [
          { label: 'Invoices', href: '/invoices', permissions: ['invoice.view'] },
          { label: 'Demand notices', href: '/demand-notices', permissions: ['demand.issue'] },
          { label: 'Payments', href: '/payments', permissions: ['payment.view'] },
        ],
      },
      {
        group: 'Clearance',
        items: [
          {
            label: 'Applications',
            href: '/clearance',
            permissions: ['tcc.review.first', 'tcc.review.second', 'tcc.issue'],
          },
          {
            label: 'My review queue',
            href: '/clearance/queue',
            permissions: ['tcc.review.first', 'tcc.review.second', 'tcc.issue'],
          },
        ],
      },
    ],
  },
  {
    key: 'administration',
    label: 'Revenue administration',
    short: 'Admin',
    icon: 'cmd',
    groups: [
      {
        group: 'Structure',
        items: [
          { label: 'Agencies', href: '/mdas', permissions: ['mda.view'] },
          { label: 'Revenue heads', href: '/revenue-heads', permissions: ['revenuehead.view'] },
          { label: 'Reference data', href: '/reference-data', permissions: ['referencedata.manage'] },
        ],
      },
      {
        group: 'Operations',
        items: [
          { label: 'Tax offices', href: '/tax-offices', permissions: ['office.manage'] },
          { label: 'Enumeration', href: '/enumeration', permissions: ['enumeration.manage'] },
        ],
      },
    ],
  },
  {
    key: 'intelligence',
    label: 'Intelligence',
    short: 'Insight',
    icon: 'tag',
    groups: [
      {
        group: 'Compliance',
        items: [{ label: 'Compliance leads', href: '/intelligence', permissions: ['intelligence.view'] }],
      },
    ],
  },
  {
    key: 'field',
    label: 'Field',
    icon: 'field',
    groups: [
      {
        group: 'Field',
        items: [{ label: 'Capture', href: '/field', permissions: ['enumeration.field'] }],
      },
    ],
  },
  {
    key: 'platform',
    label: 'Platform',
    icon: 'settings',
    footer: true,
    groups: [
      {
        group: 'Access',
        items: [{ label: 'Users & permissions', href: '/users', permissions: ['user.view', 'user.manage'] }],
      },
      {
        group: 'Public information',
        items: [
          { label: 'Content', href: '/content', permissions: ['content.manage'] },
          { label: 'Notifications', href: '/notifications', permissions: ['content.manage'] },
        ],
      },
      {
        group: 'Assurance',
        items: [{ label: 'Audit trail', href: '/audit', permissions: ['audit.view'] }],
      },
    ],
  },
];

/** Sections the user can reach, each pruned to the items they hold. */
export function visibleSections(permissions: string[]): NavSection[] {
  return SECTIONS.map((s) => ({
    ...s,
    groups: s.groups
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => !i.permissions || i.permissions.some((p) => permissions.includes(p))),
      }))
      .filter((g) => g.items.length > 0),
  })).filter((s) => s.groups.length > 0);
}

/** Every href in a section, for matching the current route back to its icon. */
function hrefsOf(section: NavSection): string[] {
  return section.groups.flatMap((g) => g.items.map((i) => i.href));
}

/**
 * Which section owns the current path.
 *
 * Longest match wins, so `/clearance/queue` resolves to the clearance entry
 * rather than to whichever section happens to be listed first.
 */
export function sectionForPath(sections: NavSection[], pathname: string): NavSection | undefined {
  let best: { section: NavSection; length: number } | undefined;

  for (const section of sections) {
    for (const href of hrefsOf(section)) {
      if (pathname === href || pathname.startsWith(`${href}/`)) {
        if (!best || href.length > best.length) best = { section, length: href.length };
      }
    }
  }

  return best?.section;
}

/** The first thing a section can show. Clicking its icon lands here. */
export function sectionEntry(section: NavSection): string {
  return section.groups[0]?.items[0]?.href ?? '/portal';
}

/**
 * Where a user lands after signing in.
 *
 * Not everyone can see the dashboard — an enumeration agent holds no
 * `analytics.view` — so this is the first thing they are actually permitted.
 * Taxpayers hold no staff permission at all and belong in `/portal`.
 */
export function landingRoute(permissions: string[]): string {
  const sections = visibleSections(permissions);
  return sections[0] ? sectionEntry(sections[0]) : '/portal';
}
