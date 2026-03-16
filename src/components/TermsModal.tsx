"use client";

import { Modal } from "./Modal";

type Props = { open: boolean; onClose: () => void };

export function TermsModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Terms of Service">
      <div className="space-y-5 prose prose-invert prose-sm max-w-none">
        <p className="text-[var(--text-muted)]">
          Last updated: March 2026. These Terms of Service (&quot;Terms&quot;) govern your use of the Big Tech Resume Review
          service operated by Liberty Experience Inc. (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;). By using the service, you agree to these Terms.
        </p>

        <section>
          <h3 className="text-[var(--text)] font-semibold mb-2">1. Description of Service</h3>
          <p className="text-[var(--text-muted)] leading-relaxed">
            Big Tech Resume Review is an online tool that analyzes your resume and provides feedback aimed at making it
            more competitive for Big Tech / MAANG and similar roles. The service may use AI to generate suggestions.
            Results are for informational and educational purposes only and do not guarantee employment or interview outcomes.
          </p>
        </section>

        <section>
          <h3 className="text-[var(--text)] font-semibold mb-2">2. Your Data and Our Handling of It</h3>
          <p className="text-[var(--text-muted)] leading-relaxed">
            We do not store your personal data or uploaded files. Uploaded files are processed for analysis and deleted
            immediately after analysis. We do not store generated reports; they are available only in the session in which
            they are created (e.g., in your browser). If you download a report, it exists only on your device.
          </p>
        </section>

        <section>
          <h3 className="text-[var(--text)] font-semibold mb-2">3. Acceptable Use</h3>
          <p className="text-[var(--text-muted)] leading-relaxed">
            You may use the service only for lawful purposes. You must own or have the right to use any resume or content
            you upload. You may not use the service to upload malicious content, infringe others&apos; rights, or violate any
            applicable laws. We may suspend or terminate access if we believe you have breached these Terms.
          </p>
        </section>

        <section>
          <h3 className="text-[var(--text)] font-semibold mb-2">4. No Warranty</h3>
          <p className="text-[var(--text-muted)] leading-relaxed">
            The service is provided &quot;as is&quot; and &quot;as available.&quot; We do not warrant that the service will be error-free,
            secure, or suitable for any particular purpose. Feedback and suggestions are general in nature and may not fit
            every situation. You use the service at your own risk.
          </p>
        </section>

        <section>
          <h3 className="text-[var(--text)] font-semibold mb-2">5. Limitation of Liability</h3>
          <p className="text-[var(--text-muted)] leading-relaxed">
            To the fullest extent permitted by law, Liberty Experience Inc. and its affiliates shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages, or any loss of data, revenue, or profits,
            arising from your use of the service.
          </p>
        </section>

        <section>
          <h3 className="text-[var(--text)] font-semibold mb-2">6. Changes</h3>
          <p className="text-[var(--text-muted)] leading-relaxed">
            We may update these Terms from time to time. The &quot;Last updated&quot; date at the top will change when we do.
            Continued use of the service after changes constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h3 className="text-[var(--text)] font-semibold mb-2">7. Contact</h3>
          <p className="text-[var(--text-muted)] leading-relaxed">
            For questions about these Terms, please contact Liberty Experience Inc. via the contact information provided
            on this website.
          </p>
        </section>

        <p className="text-xs text-[var(--text-muted)] pt-2">
          © 2026 Liberty Experience Inc. Designed by Kehinde Fawumi.
        </p>
      </div>
    </Modal>
  );
}
