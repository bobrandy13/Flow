import { LEVELS } from "@flow/shared/levels";
import type { ProgressMap } from "@/lib/storage/progress";

export interface PrimaryCta {
  label: string;
  href: string;
  /** Subtitle line displayed under the CTA button (e.g. level title). */
  subtitle?: string;
}

/**
 * Picks the most useful primary action to surface on the landing page
 * based on the player's persisted progress.
 *
 *   - No progress yet:  start the very first level.
 *   - In progress:      resume on the first incomplete level (in the
 *                       same order as the menu).
 *   - All complete:     send them to the menu so they can replay or
 *                       look for a chapter they missed.
 */
export function pickPrimaryCta(progress: ProgressMap): PrimaryCta {
  const first = LEVELS[0];
  if (!first) {
    return { label: "Browse levels", href: "/levels" };
  }

  const completedCount = LEVELS.filter((l) => progress[l.id]?.completed).length;

  if (completedCount === 0) {
    return {
      label: "Start your first level",
      href: `/levels/${first.id}/lesson`,
    };
  }

  if (completedCount === LEVELS.length) {
    return {
      label: "Replay levels",
      href: "/levels",
      subtitle: "All complete — pick any to revisit",
    };
  }

  const nextIncomplete = LEVELS.find((l) => !progress[l.id]?.completed) ?? first;
  return {
    label: "Resume",
    href: `/levels/${nextIncomplete.id}/play`,
    subtitle: nextIncomplete.title,
  };
}
