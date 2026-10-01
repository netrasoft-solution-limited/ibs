'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  BoardIcon,
  CommandIcon,
  DocIcon,
  PinIcon,
  PulseIcon,
  SettingsIcon,
  TagIcon,
} from './icons';
import { sectionEntry, sectionForPath, type IconKey, type NavSection } from './nav';

/**
 * The rail and the tree, as one two-level control.
 *
 * The rail selects a section; the tree lists that section only. Both are
 * client components because both need to know the current route — an earlier
 * version linked every rail icon to the same landing route and rendered every
 * group in the tree, which made the icons decorative.
 */

const ICONS: Record<IconKey, (p: { className?: string }) => React.ReactElement> = {
  pulse: PulseIcon,
  board: BoardIcon,
  doc: DocIcon,
  cmd: CommandIcon,
  tag: TagIcon,
  field: PinIcon,
  settings: SettingsIcon,
};

export function IconRail({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();
  const active = sectionForPath(sections, pathname);

  const main = sections.filter((s) => !s.footer);
  const footer = sections.filter((s) => s.footer);

  const button = (section: NavSection) => {
    const Icon = ICONS[section.icon];
    const isActive = active?.key === section.key;
    return (
      <Link
        key={section.key}
        href={sectionEntry(section)}
        aria-label={section.label}
        aria-current={isActive ? 'true' : undefined}
        className="group flex w-full flex-col items-center gap-1.5 rounded-[var(--radius-inner)] py-1.5 transition-colors"
      >
        <span
          className={`grid h-11 w-11 place-items-center rounded-full transition-colors ${
            isActive
              ? 'bg-[var(--tenant-accent)] text-white shadow-soft'
              : 'bg-raised text-ink-2 shadow-soft group-hover:text-ink'
          }`}
        >
          <Icon />
        </span>

        {/* The caption is the label, not a tooltip — an icon nobody can name
            is a button nobody presses. Long section names carry a `short`. */}
        <span
          className={`w-full px-0.5 text-center text-[10px] leading-tight tracking-[-0.01em] transition-colors ${
            isActive ? 'font-medium text-[var(--tenant-accent)]' : 'text-ink-3 group-hover:text-ink-2'
          }`}
        >
          {section.short ?? section.label}
        </span>
      </Link>
    );
  };

  return (
    <div className="flex w-[86px] shrink-0 flex-col items-center gap-1 py-4">
      {main.map(button)}
      <div className="flex-1" />
      {footer.map(button)}
    </div>
  );
}

export function Sidebar({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();
  // Fall back to the first section so the tree is never empty on a route that
  // no section owns (a detail page reached directly, for instance).
  const active = sectionForPath(sections, pathname) ?? sections[0];
  if (!active) return null;

  return (
    <nav aria-label={active.label} className="py-4 pr-4">
      <p className="px-3 pb-3 text-[15px] font-semibold">{active.label}</p>

      {active.groups.map((group) => (
        <div key={group.group} className="mb-5">
          <p className="eyebrow px-3 pb-1.5">{group.group}</p>

          {/* The hairline is the tree; nesting is read from the indent. */}
          <ul className="ml-3 border-l border-rule-2 pl-1">
            {group.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`block rounded-full px-3 py-1.5 text-[13px] transition-colors ${
                      isActive
                        ? 'font-medium text-[var(--tenant-accent)]'
                        : 'text-ink-2 hover:bg-raised hover:text-ink'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
