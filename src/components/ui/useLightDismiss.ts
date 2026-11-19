import { useRef } from "react";

function isOutside(e: React.PointerEvent<HTMLDialogElement>, dialog: HTMLDialogElement): boolean {
  const r = dialog.getBoundingClientRect();
  return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
}

/**
 * Light dismiss (click on the backdrop) for browsers without dialog closedby (Safari).
 * Native closedby="any" handles it elsewhere. Press and release must both be outside the
 * dialog, so a text selection that ends on the backdrop does not close it.
 */
export function useLightDismiss() {
  const pressedOutsideRef = useRef(false);

  const onPointerDown = (e: React.PointerEvent<HTMLDialogElement>) => {
    const hasNativeLightDismiss = "closedBy" in HTMLDialogElement.prototype;
    pressedOutsideRef.current = !hasNativeLightDismiss && isOutside(e, e.currentTarget);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDialogElement>) => {
    if (pressedOutsideRef.current && isOutside(e, e.currentTarget)) e.currentTarget.close();
    pressedOutsideRef.current = false;
  };

  return { onPointerDown, onPointerUp };
}
