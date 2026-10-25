function AP_Textbox({ id, label, type = "text", ...inputProps }) {
  return (
    <div>
      <label htmlFor={id}>{label}</label>

      <input id={id} type={type} {...inputProps} />
    </div>
  );
}

export default AP_Textbox;
