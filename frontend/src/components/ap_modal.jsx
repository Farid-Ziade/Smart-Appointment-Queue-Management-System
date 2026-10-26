import { useEffect, useId, useRef } from "react";
import AP_Button from "./ap_button.jsx";
function AP_Modal({ open, onClose, title, children }) {
  const dialog = useRef(null),
    titleId = useId();
  useEffect(() => {
    if (open && !dialog.current.open) dialog.current.showModal();
    else if (!open && dialog.current.open) dialog.current.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <AP_Button aria-label="Close dialog" onClick={onClose}>
          ×
        </AP_Button>
      </div>
      {children}
    </dialog>
  );
}
export default AP_Modal;
