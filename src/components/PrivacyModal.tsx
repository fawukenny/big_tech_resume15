"use client";

import { Modal } from "./Modal";

type Props = { open: boolean; onClose: () => void };

export function PrivacyModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Privacy Policy">
      <div className="space-y-5 prose prose-invert prose-sm max-w-none">
        <p className="text-[var(--text-muted)]">
          Last updated: March 2026. Liberty Experience Inc. (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;) operates the Big Tech Resume
          Review service. This Privacy Policy explains how we handle information in connection with that service.
        </p>

        <section>
          <h3 className="text-[var(--text)] font-semibold mb-2">1. We Do Not Store Your Personal Data or Files</h3>
          <p className="text-[var(--text-muted)] leading-relaxed">
            We do not store any personal data or uploaded files. When you upload a resume (PDF or DOCX), it is used only
            to run the analysis. The file is deleted immediately after processing. We do not retain copies of your resume
            or any other documents you upload.
          </p>
        </section>

        <section>
          <h3 className="text-[var(--text)] font-semibold mb-2">2. Reports Are Session-Only</h3>
          <p className="text-[var(--text-muted)] leading-relaxed">
            The feedback and report generated from your resume are not stored on our servers. They are available only in
            the session in which they are created (for example, in your browser until you leave or refresh). If you
            download a PDF report, that file exists only on your device. We do not keep a copy of your report.
          </p>
        </section>

        <section>
          <h3 className="text-[var(--text)] font-semibold mb-2">3. Optional Information</h3>
          <p className="text-[var(--text-muted)] leading-relaxed">
            You may optionally provide context (such as a job description or feedback focus) when submitting your resume.
            That content is used only to tailor the analysis for that request and is not stored after processing. If you
            provide an email address to receive or send a report, we use it only for that purpose and do not add it to
            marketing lists unless you have explicitly consented.
          </p>
        </section>

        <section>
          <h3 className="text-[var(--text)] font-semibold mb-2">4. No Account Required</h3>
          <p className="text-[var(--text-muted)] leading-relaxed">
            The service can be used without creating an account. We do not track or associate your usage with a persistent
            identity beyond what is strictly necessary to perform the analysis in a single session.
          </p>
        </section>

        <section>
          <h3 className="text-[var(--text)] font-semibold mb-2">5. Technical and Analytics Information</h3>
          <p className="text-[var(--text-muted)] leading-relaxed">
            Our hosting and infrastructure may collect minimal technical data (e.g., IP address, browser type) as is common
            for web services. We do not use this information to identify you personally or to build profiles. We do not
            sell your data to third parties.
          </p>
        </section>

        <section>
          <h3 className="text-[var(--text)] font-semibold mb-2">6. Third-Party Services</h3>
          <p className="text-[var(--text-muted)] leading-relaxed">
            Analysis may be powered by third-party AI services. Content sent for analysis is processed according to their
            policies; we do not retain that content after the request is complete. Links to external sites (e.g., our
            YouTube course) are governed by those sites&apos; privacy policies.
          </p>
        </section>

        <section>
          <h3 className="text-[var(--text)] font-semibold mb-2">7. Your Rights and Contact</h3>
          <p className="text-[var(--text-muted)] leading-relaxed">
            Because we do not store your personal data or files, there is no ongoing profile or stored data to access,
            correct, or delete. If you have questions about this Privacy Policy or our practices, please contact Liberty
            Experience Inc. via the contact information on this website.
          </p>
        </section>

        <p className="text-xs text-[var(--text-muted)] pt-2">
          © 2026 Liberty Experience Inc. Designed by Kehinde Fawumi.
        </p>
      </div>
    </Modal>
  );
}
