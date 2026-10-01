import type { TccStage } from '@/lib/types';
import { humanise } from '@/lib/format';

/**
 * The six-stage review chain, rendered as a progress rail.
 *
 * Stage order is policy, and it is declared once here so the list, the detail
 * screen and the queue cannot disagree about where an application has reached.
 */
export const TCC_CHAIN: TccStage[] = [
  'FIRST_REVIEW',
  'FIRST_APPROVAL',
  'SECOND_REVIEW',
  'SECOND_APPROVAL',
  'DIRECTOR_REVIEW',
  'ISSUED',
];

/** Which role acts at each stage. A stage belongs to exactly one role. */
export const STAGE_ROLE: Record<string, string> = {
  FIRST_REVIEW: 'tcc.review.first',
  FIRST_APPROVAL: 'tcc.review.first',
  SECOND_REVIEW: 'tcc.review.second',
  SECOND_APPROVAL: 'tcc.review.second',
  DIRECTOR_REVIEW: 'tcc.issue',
};

export function stageIndex(stage: TccStage): number {
  return TCC_CHAIN.indexOf(stage);
}

export function TccChain({ stage, compact = false }: { stage: TccStage; compact?: boolean }) {
  const declined = stage === 'DECLINED';
  const reached = stageIndex(stage);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {TCC_CHAIN.map((s, i) => {
        const done = !declined && i < reached;
        const current = !declined && i === reached;
        const issued = s === 'ISSUED' && current;

        return (
          <div key={s} className="flex items-center gap-1.5">
            <span
              className={`rounded-full px-3 py-1.5 text-[11.5px] font-medium whitespace-nowrap ${
                issued
                  ? 'bg-ok-bg text-ok'
                  : current
                    ? 'bg-[var(--tenant-accent)] text-white'
                    : done
                      ? 'bg-sunk text-ink-2'
                      : 'bg-sunk text-ink-3'
              }`}
            >
              {humanise(s)}
            </span>
            {i < TCC_CHAIN.length - 1 && !compact ? <span className="text-ink-3">→</span> : null}
          </div>
        );
      })}

      {declined ? (
        <span className="rounded-full bg-danger-bg px-3 py-1.5 text-[11.5px] font-medium text-danger">
          Declined
        </span>
      ) : null}
    </div>
  );
}
