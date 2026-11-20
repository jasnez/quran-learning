"use client";

import { useEffect, useRef } from "react";
import { useLightDismiss } from "./useLightDismiss";

type ModalDialogProps = {
  open: boolean;
  /** Called on the native "close" event (Esc, backdrop, close()). */
  onClose: () => void;
  /** Id of the dialog's heading. */
  labelledBy: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * A native modal <dialog>: showModal() makes the rest of the page inert, keeps Tab inside, closes
 * on Esc and returns focus to the control that opened it. The browser focuses the first focusable
 * control when it opens, so put the safe action first in DOM order.
 */
export function ModalDialog({ open, onClose, labelledBy, className, children }: ModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lightDismiss = useLightDismiss();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      closedby="any"
      className={`m-auto w-[calc(100%-2rem)] rounded-2xl bg-surface p-6 text-ink shadow-xl backdrop:bg-overlay ${className ?? ""}`}
      onClose={onClose}
      {...lightDismiss}
    >
      {children}
    </dialog>
  );
}
