function AP_Select({
  id,
  label,
  options,
  placeholder = "Choose an option",
  ...props
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} {...props}>
        {placeholder !== null && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
export default AP_Select;
