import { useRef, type RefObject } from "react";

/**
 * Puts keyboard focus back where it was when a dialog closes.
 *
 * A dialog normally hands focus back to the button that opened it. The
 * dialogs in this app are opened from code (`open={...}`), so the dialog
 * library does not know which button that was, and focus would drop to the
 * top of the page. Keyboard and screen reader users would lose their place.
 *
 * Usage: call `rememberFocus()` just before opening the dialog, and pass
 * `returnFocus` to the dialog content's `onCloseAutoFocus`.
 *
 * @param fallbackRef Focused instead when the remembered element no longer
 *   exists, e.g. the buttons in the row of a task that was just deleted.
 */
export function useReturnFocus(fallbackRef?: RefObject<HTMLElement | null>) {
  const rememberedElement = useRef<HTMLElement | null>(null);

  function rememberFocus() {
    rememberedElement.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }

  function returnFocus(event: Event) {
    // Stop the dialog's own handling; we decide where focus goes.
    event.preventDefault();

    const element = rememberedElement.current;
    // isConnected is false once an element has been removed from the page.
    const target = element?.isConnected ? element : fallbackRef?.current;
    target?.focus();
  }

  return { rememberFocus, returnFocus };
}
