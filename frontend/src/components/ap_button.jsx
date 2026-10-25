function AP_Button({ children, type = "button", ...buttonProps }) {
  return (
    <button type={type} {...buttonProps}>
      {children}
    </button>
  );
}

export default AP_Button;
