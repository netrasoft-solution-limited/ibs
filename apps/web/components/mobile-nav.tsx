'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { sectionEntry, sectionForPath, type NavSection } from './nav';

/**
 * Navigation below the desktop breakpoint.
 *
 * The rail and tree are hidden under `lg`, which left phones with no way to
 * move between screens at all — and enumeration agents work on phones. This is
 * the same two-level structure in a drawer: sections across the top, the
 * active section's items beneath.
 */
export function MobileNav({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Any navigation closes the drawer; leaving it open over the new screen is
  // the classic mobile-menu bug.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // A drawer that scrolls the page behind it feels broken.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const active = sectionForPath(sections, pathname) ?? sections[0];

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        className="flex items-center gap-2 rounded-full bg-raised px-4 py-2.5 text-[13px] font-medium text-ink-2 shadow-soft"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        {active?.label ?? 'Menu'}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-page/70 backdrop-blur-sm" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close navigation"
            className="flex-1"
            onClick={() => setOpen(false)}
          />

          <div
            id="mobile-nav"
            className="max-h-[82vh] overflow-y-auto rounded-t-[var(--radius-shell)] bg-paper p-5 shadow-lift"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[16px] font-semibold">Menu</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-raised px-4 py-2 text-[13px] font-medium text-ink-2 shadow-soft"
              >
                Close
              </button>
            </div>

            {/* Sections as a scrolling row of pills — the rail, laid flat. */}
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {sections.map((s) => {
                const isActive = active?.key === s.key;
                return (
                  <Link
                    key={s.key}
                    href={sectionEntry(s)}
                    className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-[var(--tenant-accent)] text-white'
                        : 'bg-raised text-ink-2 shadow-soft'
                    }`}
                  >
                    {s.label}
                  </Link>
                );
              })}
            </div>

            {active ? (
              <nav aria-label={active.label} className="mt-5">
                {active.groups.map((group) => (
                  <div key={group.group} className="mb-4">
                    <p className="eyebrow px-1 pb-1.5">{group.group}</p>
                    <ul className="space-y-0.5">
                      {group.items.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              aria-current={isActive ? 'page' : undefined}
                              className={`block rounded-full px-4 py-2.5 text-[14px] transition-colors ${
                                isActive
                                  ? 'bg-raised font-medium text-[var(--tenant-accent)] shadow-soft'
                                  : 'text-ink-2'
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
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
