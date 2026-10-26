import AP_Button from "./ap_button.jsx";
function AP_Feedback({ loading, error, success, onRetry }) {
  return (
    <>
      {loading && <p role="status">Loading…</p>}
      {error && (
        <div className="error" role="alert">
          {error}{" "}
          {onRetry && <AP_Button onClick={onRetry}>Try again</AP_Button>}
        </div>
      )}
      {success && (
        <p className="success" role="status">
          {success}
        </p>
      )}
    </>
  );
}
export default AP_Feedback;
