function AP_Textbox({ id, label, type = "text", error, ...inputProps }) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id}>{label}</label>

      <input
        {...inputProps}
        id={id}
        type={type}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
      />

      {error && (
        <p id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default AP_Textbox;
