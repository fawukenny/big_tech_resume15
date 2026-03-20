"use client";

import { FloatingCourseLink } from "./FloatingCourseLink";
import { FloatingFeedbackFab } from "./FloatingFeedbackFab";

/** Client-only shell: floating course + feedback (stacked, bottom-right). */
export function ClientChrome() {
  return (
    <div className="fixed z-[100] right-4 bottom-6 sm:bottom-8 flex flex-col items-stretch gap-3 w-[min(calc(100vw-2rem),220px)]">
      <FloatingCourseLink />
      <FloatingFeedbackFab />
    </div>
  );
}
