import { useEffect, useRef } from "react";
import { CircleAlert, X } from "lucide-react";
import "./ConfirmDialog.css";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  tone = "primary",
  busy = false,
  onCancel,
  onConfirm,
}) {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus({ preventScroll: true });

    function handleKeyDown(event) {
      if (event.key === "Escape" && !busy) {
        onCancel();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = dialogRef.current?.querySelectorAll(
        'button:not([disabled])'
      );
      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [busy, onCancel, open]);

  if (!open) return null;

  return (
    <div
      className="confirm-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <section
        ref={dialogRef}
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <button
          type="button"
          className="confirm-dialog__close"
          onClick={onCancel}
          disabled={busy}
          aria-label="Cerrar confirmación"
        >
          <X size={19} />
        </button>

        <div className={`confirm-dialog__icon confirm-dialog__icon--${tone}`}>
          <CircleAlert size={25} />
        </div>

        <h2 id="confirm-dialog-title">{title}</h2>
        <p id="confirm-dialog-message">{message}</p>

        <div className="confirm-dialog__actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="confirm-dialog__cancel"
            onClick={onCancel}
            disabled={busy}
          >
            Cancelar
          </button>

          <button
            type="button"
            className={`confirm-dialog__confirm confirm-dialog__confirm--${tone}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
