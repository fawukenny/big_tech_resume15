"use client";

import { Modal } from "./Modal";
import { FeedbackWidget } from "./FeedbackWidget";

export function FeedbackModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Help us improve">
      <p className="text-sm text-[var(--text-muted)] mb-4">
        Rate your experience and share optional feedback. This takes ~10 seconds.
      </p>
      <FeedbackWidget />
    </Modal>
  );
}

