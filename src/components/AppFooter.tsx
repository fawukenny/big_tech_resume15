"use client";

import { useState } from "react";
import Link from "next/link";
import { TermsModal } from "./TermsModal";
import { PrivacyModal } from "./PrivacyModal";

type Props = {
  /** If true, show Home link (e.g. on results page). */
  showHomeLink?: boolean;
  /** Max width class for footer content (e.g. max-w-3xl or max-w-5xl). */
  maxWidth?: string;
};

export function AppFooter({ showHomeLink = false, maxWidth = "max-w-3xl" }: Props) {
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-[var(--border)] py-8 px-6 mt-12">
        <div className={`${maxWidth} mx-auto flex flex-col items-center gap-4 text-sm text-[var(--text-muted)]`}>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            {showHomeLink && (
              <Link href="/" className="hover:text-[var(--text)] transition-colors">
                Home
              </Link>
            )}
            <button
              type="button"
              onClick={() => setTermsOpen(true)}
              className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors bg-transparent border-none cursor-pointer p-0 font-inherit"
            >
              Terms
            </button>
            <button
              type="button"
              onClick={() => setPrivacyOpen(true)}
              className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors bg-transparent border-none cursor-pointer p-0 font-inherit"
            >
              Privacy
            </button>
          </div>
          <p className="text-center text-xs">
            © 2026 Liberty Experience Inc. Designed by{" "}
            <a
              href="https://www.linkedin.com/in/kehindefawumi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent-blue)] hover:underline"
            >
              Kehinde Fawumi
            </a>
          </p>
        </div>
      </footer>

      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
      <PrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </>
  );
}
